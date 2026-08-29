// Repairs test cases whose expected output is blank.
//
//   node scripts/problem-bank/fix-blank-outputs.js [--dry-run]
//
// The judge normalises output by trimming and dropping empty lines, so a test
// case with an empty expected output matches ANY program that prints nothing.
// That lets an empty submission score points. Two questions in the original
// library had legitimately-empty answers stored this way ("no common prefix",
// "no valid window"), so the fix is to give those problems an explicit sentinel
// and say so in the statement.

import { connect } from './lib/db.js';

const DRY = process.argv.includes('--dry-run');
const SENTINEL = 'NONE';

// Statement text appended so the sentinel is part of the stated contract.
const NOTE = {
  'Longest Common Prefix':
    '\n\nIf there is no common prefix, print the word `NONE`.',
  'Minimum Window Substring':
    '\n\nIf no valid window exists, print the word `NONE`.',
};

const sql = connect();
try {
  const blanks = await sql`
    SELECT id, question_title, input FROM admin_test_cases
    WHERE btrim(expected_output) = ''`;

  if (blanks.length === 0) {
    console.log('No blank expected outputs found.');
  } else {
    console.log(`Found ${blanks.length} test case(s) with blank expected output:`);
    for (const b of blanks) console.log(`  ${b.question_title}  input=${JSON.stringify(b.input)}`);

    const titles = [...new Set(blanks.map((b) => b.question_title))];
    const unknown = titles.filter((t) => !NOTE[t]);
    if (unknown.length) {
      throw new Error(`no sentinel convention defined for: ${unknown.join(', ')}. Add one to NOTE before running.`);
    }

    if (DRY) {
      console.log(`\n--dry-run: would set expected_output to "${SENTINEL}" and append the convention to ${titles.length} statement(s).`);
    } else {
      await sql.begin(async (tx) => {
        await tx`UPDATE admin_test_cases SET expected_output = ${SENTINEL} WHERE btrim(expected_output) = ''`;
        for (const title of titles) {
          await tx`
            UPDATE admin_questions
            SET description = description || ${NOTE[title]}, updated_at = now()
            WHERE title = ${title} AND position(${'print the word `NONE`'} in description) = 0`;
        }
      });
      console.log(`\nUpdated ${blanks.length} test case(s) and ${titles.length} statement(s).`);
    }
  }

  const left = await sql`SELECT count(*)::int c FROM admin_test_cases WHERE btrim(expected_output) = ''`;
  console.log(`Blank expected outputs remaining: ${left[0].c}`);
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
