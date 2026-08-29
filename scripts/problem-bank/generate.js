// Runs every problem's reference solution over its sample + generated inputs and
// writes a fully-materialised dataset. Expected outputs are always COMPUTED here,
// never hand-written, so a test case cannot disagree with the reference solution.
//
//   node scripts/problem-bank/generate.js [--out <file>] [--only <substring>]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rng } from './lib/rng.js';
import { buildDescription } from './lib/define.js';
import { ALL_PROBLEMS } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i === -1 ? dflt : argv[i + 1];
};
const OUT = path.resolve(__dirname, '..', argOf('--out', 'seed-data/contest-problems.json'));
const ONLY = argOf('--only', null);

const MAX_IO_BYTES = 180_000; // keep a single test case comfortably under Judge0 limits

/** Split a question's points across its test cases, remainder onto the last one. */
function allocatePoints(total, count) {
  const base = Math.max(1, Math.floor(total / count));
  const out = Array(count).fill(base);
  out[count - 1] += total - base * count;
  if (out[count - 1] < 1) out[count - 1] = 1;
  return out;
}

function run(p, args, label) {
  let out;
  try {
    out = p.solve(structuredClone(args));
  } catch (e) {
    throw new Error(`[${p.title}] solve() threw on ${label}: ${e.message}`);
  }
  if (typeof out !== 'string') throw new Error(`[${p.title}] solve() returned ${typeof out} on ${label}, expected string`);
  const trimmed = out.replace(/\r\n/g, '\n').trim();
  if (trimmed === '') throw new Error(`[${p.title}] produced empty output on ${label} — the judge trims blank output, so it would match anything`);
  // Determinism guard: a solver that reads Math.random or mutates shared state is a latent flake.
  const again = p.solve(structuredClone(args)).replace(/\r\n/g, '\n').trim();
  if (again !== trimmed) throw new Error(`[${p.title}] solve() is not deterministic on ${label}`);
  return trimmed;
}

const problems = ONLY
  ? ALL_PROBLEMS.filter((p) => p.title.toLowerCase().includes(ONLY.toLowerCase()) || p.topics.some((t) => t.toLowerCase() === ONLY.toLowerCase()))
  : ALL_PROBLEMS;

const dataset = [];
const errors = [];
let totalCases = 0;

for (const p of problems) {
  try {
    const cases = [];

    p.samples.forEach((args, i) => {
      const input = p.encode(structuredClone(args));
      const expectedOutput = run(p, args, `sample ${i + 1}`);
      cases.push({
        input,
        expectedOutput,
        isSample: true,
        isHidden: false,
        explanation: p.explain ? p.explain(structuredClone(args), expectedOutput) : null,
      });
    });

    const r = rng(hashSeed(p.title));
    const seenInputs = new Set(cases.map((c) => c.input));
    let attempts = 0;
    while (cases.filter((c) => c.isHidden).length < p.hiddenCount && attempts < p.hiddenCount * 40) {
      attempts++;
      const i = attempts - 1;
      const args = p.gen(r, i);
      if (args == null) continue;
      const input = p.encode(structuredClone(args));
      if (seenInputs.has(input)) continue; // no duplicate test cases
      if (Buffer.byteLength(input) > MAX_IO_BYTES) continue;
      const expectedOutput = run(p, args, `generated case ${i}`);
      if (Buffer.byteLength(expectedOutput) > MAX_IO_BYTES) continue;
      seenInputs.add(input);
      cases.push({ input, expectedOutput, isSample: false, isHidden: true, explanation: null });
    }

    const got = cases.filter((c) => c.isHidden).length;
    if (got < p.hiddenCount) {
      throw new Error(`only generated ${got}/${p.hiddenCount} distinct hidden cases — widen gen()`);
    }

    const pts = allocatePoints(p.points, cases.length);
    cases.forEach((c, i) => { c.points = pts[i]; });

    dataset.push({
      title: p.title,
      difficulty: p.difficulty,
      topics: p.topics,
      points: p.points,
      timeLimitSeconds: p.timeLimitSeconds,
      memoryLimitMb: p.memoryLimitMb,
      description: buildDescription(p, cases.filter((c) => c.isSample)),
      testCases: cases.map(({ explanation, ...rest }) => rest),
    });
    totalCases += cases.length;
  } catch (e) {
    errors.push(e.message.startsWith('[') ? e.message : `[${p.title}] ${e.message}`);
  }
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s) failed generation:\n`);
  errors.forEach((e) => console.error('  ' + e));
  console.error('');
  process.exitCode = 1;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(dataset, null, 1));

const byDiff = dataset.reduce((acc, p) => ((acc[p.difficulty] = (acc[p.difficulty] || 0) + 1), acc), {});
console.log(`\nGenerated ${dataset.length} problems / ${totalCases} test cases -> ${path.relative(process.cwd(), OUT)}`);
console.log(`  difficulty: ${Object.entries(byDiff).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`  topics: ${new Set(dataset.flatMap((p) => p.topics)).size} distinct`);
console.log(`  file size: ${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB`);
if (errors.length) console.log(`  ${errors.length} problem(s) EXCLUDED due to errors above`);
