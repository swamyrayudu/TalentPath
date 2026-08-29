// Loads the generated dataset into admin_questions / admin_test_cases, which is
// what the contest "Question Library" dialog reads from.
//
//   node scripts/problem-bank/import.js --dry-run
//   node scripts/problem-bank/import.js
//   node scripts/problem-bank/import.js --author someone@example.com
//
// Upserts by title: an existing question is updated in place and its test cases
// are replaced, so re-running is safe and never duplicates.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { connect } from './lib/db.js';

const argv = process.argv.slice(2);
const argOf = (flag, dflt) => { const i = argv.indexOf(flag); return i === -1 ? dflt : argv[i + 1]; };
const DRY = argv.includes('--dry-run');
const FILE = path.resolve(process.cwd(), argOf('--file', 'scripts/seed-data/contest-problems.json'));
const AUTHOR = argOf('--author', null);
const CHUNK = 500;

const dataset = JSON.parse(fs.readFileSync(FILE, 'utf8'));
console.log(`Loaded ${dataset.length} problems from ${path.relative(process.cwd(), FILE)}`);

// Fail before touching the database rather than half-way through.
const titles = new Set();
for (const p of dataset) {
  if (!p.title || titles.has(p.title)) throw new Error(`duplicate or missing title: ${p.title}`);
  titles.add(p.title);
  if (!['EASY', 'MEDIUM', 'HARD'].includes(p.difficulty)) throw new Error(`${p.title}: bad difficulty`);
  if (!p.testCases?.length) throw new Error(`${p.title}: no test cases`);
  if (!p.testCases.some((t) => t.isSample)) throw new Error(`${p.title}: no sample test case`);
  for (const t of p.testCases) {
    if (!t.expectedOutput.trim()) throw new Error(`${p.title}: a test case has empty expected output`);
  }
}

const sql = connect();
try {
  // ---- author ------------------------------------------------------------
  let authorId = '';
  const authorRows = AUTHOR
    ? await sql`SELECT id, email FROM "user" WHERE id = ${AUTHOR} OR email = ${AUTHOR} LIMIT 1`
    : await sql`SELECT id, email FROM "user" WHERE role = 'admin' ORDER BY created_at NULLS LAST LIMIT 1`;
  if (authorRows.length) {
    authorId = authorRows[0].id;
    console.log(`Author: ${authorRows[0].email} (${authorId})`);
  } else if (AUTHOR) {
    throw new Error(`no user matched --author ${AUTHOR}`);
  } else {
    console.log('Author: none found, leaving created_by empty');
  }

  // ---- guard: the migration must have run --------------------------------
  const [{ data_type: topicsType }] = await sql`
    SELECT data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='admin_questions' AND column_name='topics'`;
  if (topicsType !== 'ARRAY') {
    throw new Error('admin_questions.topics is still `text` — run `node scripts/problem-bank/migrate.js` first');
  }

  const existing = new Set((await sql`SELECT title FROM admin_questions`).map((r) => r.title));
  const toInsert = dataset.filter((p) => !existing.has(p.title));
  const toUpdate = dataset.filter((p) => existing.has(p.title));
  const cases = dataset.reduce((n, p) => n + p.testCases.length, 0);
  console.log(`  ${toInsert.length} new, ${toUpdate.length} updated, ${cases} test cases total`);

  if (DRY) {
    console.log('\n--dry-run: nothing was written.');
    await sql.end();
    process.exit(0);
  }

  // Distinct timestamps: the library orders by created_at DESC and paginates with
  // LIMIT/OFFSET, which silently skips rows when timestamps tie.
  const base = Date.now();
  const stampOf = (i) => new Date(base - (dataset.length - i) * 1000);

  await sql.begin(async (tx) => {
    const questionRows = dataset.map((p, i) => ({
      id: crypto.randomUUID(),
      title: p.title,
      description: p.description,
      difficulty: p.difficulty,
      points: p.points,
      time_limit_seconds: p.timeLimitSeconds,
      memory_limit_mb: p.memoryLimitMb,
      topics: p.topics,
      created_by: authorId,
      is_active: true,
      created_at: stampOf(i),
      updated_at: stampOf(i),
    }));

    for (let i = 0; i < questionRows.length; i += CHUNK) {
      const chunk = questionRows.slice(i, i + CHUNK);
      await tx`
        INSERT INTO admin_questions ${tx(chunk, 'id', 'title', 'description', 'difficulty', 'points', 'time_limit_seconds', 'memory_limit_mb', 'topics', 'created_by', 'is_active', 'created_at', 'updated_at')}
        ON CONFLICT (title) DO UPDATE SET
          description        = EXCLUDED.description,
          difficulty         = EXCLUDED.difficulty,
          points             = EXCLUDED.points,
          time_limit_seconds = EXCLUDED.time_limit_seconds,
          memory_limit_mb    = EXCLUDED.memory_limit_mb,
          topics             = EXCLUDED.topics,
          is_active          = true,
          updated_at         = EXCLUDED.updated_at`;
      process.stdout.write(`\r  questions: ${Math.min(i + CHUNK, questionRows.length)}/${questionRows.length}`);
    }
    process.stdout.write('\n');

    // Replace test cases wholesale so a regenerated problem never keeps stale cases.
    const allTitles = dataset.map((p) => p.title);
    for (let i = 0; i < allTitles.length; i += CHUNK) {
      await tx`DELETE FROM admin_test_cases WHERE question_title IN ${tx(allTitles.slice(i, i + CHUNK))}`;
    }

    const caseRows = dataset.flatMap((p) =>
      p.testCases.map((t) => ({
        id: crypto.randomUUID(),
        question_title: p.title,
        input: t.input,
        expected_output: t.expectedOutput,
        is_sample: t.isSample,
        is_hidden: t.isHidden,
        points: t.points,
      })),
    );
    for (let i = 0; i < caseRows.length; i += CHUNK) {
      await tx`INSERT INTO admin_test_cases ${tx(caseRows.slice(i, i + CHUNK), 'id', 'question_title', 'input', 'expected_output', 'is_sample', 'is_hidden', 'points')}`;
      process.stdout.write(`\r  test cases: ${Math.min(i + CHUNK, caseRows.length)}/${caseRows.length}`);
    }
    process.stdout.write('\n');
  });

  const [q] = await sql`SELECT count(*)::int c FROM admin_questions`;
  const [t] = await sql`SELECT count(*)::int c FROM admin_test_cases`;
  const diff = await sql`SELECT difficulty, count(*)::int c FROM admin_questions GROUP BY 1 ORDER BY 1`;
  console.log(`\nLibrary now holds ${q.c} questions and ${t.c} test cases.`);
  console.log(`  ${diff.map((d) => `${d.difficulty}: ${d.c}`).join('  ')}`);
} catch (e) {
  console.error('\nImport FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
