# Contest problem bank

Generates coding questions with **computed** test cases and loads them into
`admin_questions` / `admin_test_cases` — the tables the contest
**Add from Question Library** dialog reads from.

Expected outputs are never written by hand. Each problem ships a reference
solution; the generator runs it over the inputs and records what it returns. A
test case therefore cannot disagree with the reference solution.

## Commands

```bash
node scripts/problem-bank/migrate.js            # one-time schema fixes (see below)
node scripts/problem-bank/generate.js           # problems/*.js -> seed-data/contest-problems.json
node scripts/problem-bank/import.js --dry-run   # preview what would change
node scripts/problem-bank/import.js             # upsert into the database
node scripts/problem-bank/verify.js             # post-import integrity checks
```

`generate.js --only <topic-or-title>` limits generation while iterating on one
problem. `import.js --author <email>` sets `created_by`.

Import upserts on `title`, so re-running never duplicates: an existing question
is updated in place and its test cases are replaced wholesale.

## I/O format

Plain HackerRank/GFG style stdin — bare whitespace-separated tokens, with sizes
always printed before variable-length data, so `cin` / `Scanner` /
`input().split()` all work with no parsing tricks:

```
4
2 7 11 15
9
```

Output is compared after trimming and whitespace normalisation.
**Never let a solver return an empty string** — the judge trims blank output, so
an empty expected value matches any program that prints nothing. Use a sentinel
(`NONE`, `-1`) or `F.counted()`, which prints a count line first.

## Adding a problem

Drop it into any file under `problems/` (they are auto-discovered in filename
order):

```js
problem({
  title: 'Unique Title',                 // upsert key — must be unique
  difficulty: 'EASY',                    // EASY | MEDIUM | HARD -> default points and limits
  topics: ['Array', 'Hash Table'],       // drives the library's topic filter
  statement: 'Markdown prose...',        // Input/Output/Constraints/Examples are appended
  params: [P.intArray('nums', '...', 'n'), P.int('target', '...')],
  outputFormat: 'A single integer — ...',
  constraints: ['1 <= n <= 10^5'],
  samples: [[[2, 7, 11, 15], 9], [[3, 2, 4], 6]],   // >= 2, shown to solvers
  explain: ([nums, target], out) => '...',          // optional per-example note
  solve: ([nums, target]) => F.num(answer),         // reference solution, must be deterministic
  gen: (r, i) => [nums, target],                    // hidden cases; return null to skip one
});
```

`r` is a seeded PRNG (`r.int`, `r.pick`, `r.ints`, `r.shuffle`, `r.word`, ...),
so regenerating produces byte-identical data. `P` holds the input codecs and `F`
the output formatters — see `lib/params.js` and `lib/define.js`.

The generator rejects a problem whose solver throws, returns a non-string,
returns blank, is non-deterministic, or whose `gen` cannot produce enough
distinct hidden cases. Failures are reported and that problem is excluded rather
than silently shipped.

## Schema fixes applied

`migrate.js` runs `migrations/fix_admin_questions_library.sql`, which brings the
live tables in line with `src/lib/db/schema.ts`:

* `topics` was a `text` column but is declared `text[]`, so the library's topic
  filter failed with `operator does not exist: text @> text[]` on every use.
  It is now a real `text[]` with a GIN index.
* `admin_questions.title` had no unique index even though `admin_test_cases`
  joins on it. It is now unique, with a cascading foreign key from the test cases.
* `is_active` is now `NOT NULL DEFAULT true` — the library filters on it.

`fix-blank-outputs.js` is a one-off repair for test cases whose expected output
was stored blank (which let an empty submission pass). Keep `verify.js` green.
