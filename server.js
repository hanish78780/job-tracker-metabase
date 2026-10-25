const http = require('node:http');
const fs = require('node:fs/promises');
const { Pool } = require('pg');
const { validate, fields } = require('./validate');
const pool = new Pool({connectionString:process.env.DATABASE_URL || process.env.PG_URL,max:3,connectionTimeoutMillis:10000});
async function importSnapshot() {
  const rows=validate(JSON.parse(await fs.readFile(`${__dirname}/data/opportunities.json`,'utf8')));
  const db=await pool.connect();
  try {
    await db.query('BEGIN');
    await db.query(await fs.readFile(`${__dirname}/schema.sql`,'utf8'));
    for(const row of rows) await db.query(`INSERT INTO analytics.opportunities (${fields.join(',')}) VALUES (${fields.map((_,i)=>`$${i+1}`).join(',')}) ON CONFLICT(record_id) DO UPDATE SET ${fields.slice(1).map(k=>`${k}=EXCLUDED.${k}`).join(',')}`,fields.map(k=>row[k]));
    await db.query('DELETE FROM analytics.opportunities WHERE NOT(record_id=ANY($1::text[]))',[rows.map(r=>r.record_id)]);
    await db.query('COMMIT');
    console.log(`Imported ${rows.length} real anonymized opportunity records atomically.`);
  } catch(error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
}
async function start(){
  if(!process.env.DATABASE_URL && !process.env.PG_URL) throw new Error('Set DATABASE_URL or PG_URL.');
  await importSnapshot();
  const server=http.createServer(async(req,res)=>{
    try {
      if(req.method!=='GET'){res.writeHead(405);return res.end('Read-only demo.');}
      if(req.url==='/healthz'){await pool.query('SELECT 1');res.writeHead(200,{'content-type':'text/plain'});return res.end('ok');}
      if(req.url==='/api/summary'){const {rows}=await pool.query('SELECT status,opportunities FROM analytics.status_counts ORDER BY opportunities DESC,status');res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({source:'Real anonymized job-search tracker snapshot',counts:rows}));}
      if(req.url!=='/'){res.writeHead(404);return res.end('Not found');}
      res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
      res.end('<!doctype html><meta name="viewport" content="width=device-width"><title>Job search analytics</title><style>body{font:18px/1.6 system-ui;max-width:760px;margin:4rem auto;padding:0 1rem;color:#173048}h1{line-height:1.2}a{color:#065fb8}</style><h1>Job search analytics</h1><p>Built for Hanish to see opportunity stages and follow-up dates across a real job-search tracker. Employer identities, recruiter contacts and message contents are excluded from this demo.</p><p>These are tracked opportunities, including leads, rather than a claim that every row is a completed application.</p><p><a href="/api/summary">View live database summary</a></p><p>The companion Metabase dashboard shows status counts and follow-up queues. The dataset is a dated snapshot; it does not automatically read Gmail or send applications.</p>');
    } catch(error){console.error(error.message);res.writeHead(503,{'content-type':'text/plain'});res.end('Database temporarily unavailable.');}
  });
  server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('Job tracker analytics ready.'));
  process.on('SIGTERM',()=>server.close(()=>pool.end().then(()=>process.exit(0))));
}
start().catch(error=>{console.error(error.message);process.exitCode=1;});
