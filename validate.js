const fields = ['record_id', 'employer_key', 'role_family', 'mode', 'status', 'applied_on', 'followup_on', 'checked_on'];
function validate(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Provide real, nonempty opportunity records.');
  const ids = new Set();
  return rows.map((row) => {
    if (Object.keys(row).some((key) => !fields.includes(key))) throw new Error('Unexpected field: private source columns must not be imported.');
    for (const key of fields.slice(0, 5)) if (typeof row[key] !== 'string' || !row[key]) throw new Error(`Missing ${key}`);
    if (ids.has(row.record_id)) throw new Error('Duplicate record_id');
    ids.add(row.record_id);
    for (const key of fields.slice(5)) {
      const value = row[key];
      if (value !== null && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) throw new Error(`Invalid ${key}`);
    }
    return Object.fromEntries(fields.map((key) => [key, row[key]]));
  });
}
module.exports = { validate, fields };
