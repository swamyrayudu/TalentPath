// Post-import sanity check: does the library look the way the contest UI expects?
//
//   node scripts/problem-bank/verify.js
import { connect } from './lib/db.js';

const sql = connect();
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok, detail });

const [{ c: questions }] = await sql`SELECT count(*)::int c FROM admin_questions WHERE is_active = true`;
const [{ c: cases }] = await sql`SELECT count(*)::int c FROM admin_test_cases`;

const noCases = await sql`
  SELECT q.title FROM admin_questions q
  LEFT JOIN admin_test_cases tc ON tc.question_title = q.title
  WHERE tc.id IS NULL LIMIT 5`;
check('every question has test cases', noCases.length === 0, noCases.map((r) => r.title).join(', '));

const noSample = await sql`
  SELECT q.title FROM admin_questions q
  WHERE NOT EXISTS (SELECT 1 FROM admin_test_cases tc WHERE tc.question_title = q.title AND tc.is_sample) LIMIT 5`;
check('every question has a sample case', noSample.length === 0, noSample.map((r) => r.title).join(', '));

const blank = await sql`SELECT question_title FROM admin_test_cases WHERE btrim(expected_output) = '' LIMIT 5`;
check('no blank expected output', blank.length === 0, blank.map((r) => r.question_title).join(', '));

const dupes = await sql`SELECT title FROM admin_questions GROUP BY title HAVING count(*) > 1 LIMIT 5`;
check('titles are unique', dupes.length === 0, dupes.map((r) => r.title).join(', '));

const [{ data_type }] = await sql`
  SELECT data_type FROM information_schema.columns
  WHERE table_schema='public' AND table_name='admin_questions' AND column_name='topics'`;
check('topics is a text[] column', data_type === 'ARRAY', `is ${data_type}`);

let filterOk = true, filterErr = '';
try { await sql`SELECT 1 FROM admin_questions WHERE topics @> ARRAY['Array']::text[] LIMIT 1`; }
catch (e) { filterOk = false; filterErr = e.message; }
check('topic filter query runs', filterOk, filterErr);

const orphans = await sql`
  SELECT tc.question_title FROM admin_test_cases tc
  LEFT JOIN admin_questions q ON q.title = tc.question_title
  WHERE q.id IS NULL LIMIT 5`;
check('no orphaned test cases', orphans.length === 0, orphans.map((r) => r.question_title).join(', '));

console.log(`\nLibrary: ${questions} active questions, ${cases} test cases\n`);
for (const c of checks) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.ok ? '' : `  -> ${c.detail}`}`);

const topics = await sql`SELECT DISTINCT unnest(topics) t FROM admin_questions ORDER BY t`;
console.log(`\n  ${topics.length} topics: ${topics.map((r) => r.t).join(', ')}`);

const failed = checks.filter((c) => !c.ok).length;
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed.');
process.exitCode = failed ? 1 : 0;
await sql.end();
