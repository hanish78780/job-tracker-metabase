const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('./validate');
const record = () => ({record_id:'r1',employer_key:'e1',role_family:'Software engineering',mode:'Remote',status:'Email sent',applied_on:'2026-10-23',followup_on:null,checked_on:'2026-10-25'});
test('accepts null follow-up without inventing a deadline',()=>assert.equal(validate([record()])[0].followup_on,null));
test('rejects private contact columns rather than importing them',()=>assert.throws(()=>validate([{...record(),email:'recruiter@example.invalid'}]),/private source/));
test('rejects duplicate source rows before a partial import',()=>assert.throws(()=>validate([record(),record()]),/Duplicate/));
test('rejects impossible dates',()=>assert.throws(()=>validate([{...record(),applied_on:'2026-02-30'}]),/Invalid/));
test('rejects an empty invented demo dataset',()=>assert.throws(()=>validate([]),/real, nonempty/));
