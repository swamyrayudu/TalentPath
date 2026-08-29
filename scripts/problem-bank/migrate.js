// Applies migrations/fix_admin_questions_library.sql, then reports the result.
//
//   node scripts/problem-bank/migrate.js

import fs from 'node:fs';
import path from 'node:path';
import { connect } from './lib/db.js';

const sqlFile = path.resolve(process.cwd(), 'migrations/fix_admin_questions_library.sql');
const ddl = fs.readFileSync(sqlFile, 'utf8');

const sql = connect({ max: 1 }); // max:1 so the file may drive its own BEGIN/COMMIT
try {
  console.log(`Applying ${path.relative(process.cwd(), sqlFile)} ...`);
  await sql.unsafe(ddl);

  const [{ data_type }] = await sql`
    SELECT data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_questions' AND column_name='topics'`;
  console.log(`  admin_questions.topics -> ${data_type}`);

  const filter = await sql`SELECT count(*)::int c FROM admin_questions WHERE topics @> ARRAY['Array']::text[]`;
  console.log(`  topic filter now runs (matched ${filter[0].c} rows)`);

  const idx = await sql`SELECT indexname FROM pg_indexes WHERE tablename IN ('admin_questions','admin_test_cases') ORDER BY indexname`;
  console.log(`  indexes: ${idx.map((i) => i.indexname).join(', ')}`);
  console.log('Migration complete.');
} catch (e) {
  console.error('Migration FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
