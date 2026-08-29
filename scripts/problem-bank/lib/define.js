import { encodeInput, describeInput } from './params.js';

export const DEFAULTS = {
  EASY:   { points: 100, timeLimitSeconds: 2, memoryLimitMb: 256, hidden: 8 },
  MEDIUM: { points: 200, timeLimitSeconds: 2, memoryLimitMb: 256, hidden: 9 },
  HARD:   { points: 350, timeLimitSeconds: 3, memoryLimitMb: 256, hidden: 10 },
};

/** Output formatters — every solver returns a string built with these. */
export const F = {
  /** Space-separated values on one line. */
  arr: (a) => a.join(' '),
  /** One value per line. */
  lines: (a) => a.join('\n'),
  /** A 2-D array, one row per line. */
  matrix: (m) => m.map((row) => row.join(' ')).join('\n'),
  bool: (b) => (b ? 'true' : 'false'),
  yn: (b) => (b ? 'YES' : 'NO'),
  num: (n) => String(n),
  /** Never emits an empty line: the judge trims blank output away. */
  arrOr: (a, empty = '-1') => (a.length ? a.join(' ') : empty),
  linesOr: (a, empty = '-1') => (a.length ? a.join('\n') : empty),
  /** Count on the first line, then the values — safe for possibly-empty results. */
  counted: (a) => (a.length ? `${a.length}\n${a.join(' ')}` : '0'),
  countedRows: (rows) => (rows.length ? `${rows.length}\n${rows.map((r) => r.join(' ')).join('\n')}` : '0'),
  fixed: (x, places = 5) => x.toFixed(places),
};

const seen = new Set();

export function problem(def) {
  const {
    title, difficulty, topics, statement, outputFormat, constraints,
    params, samples, solve, gen, explain, notes,
  } = def;

  const fail = (msg) => { throw new Error(`[${title || '<untitled>'}] ${msg}`); };

  if (!title) fail('missing title');
  if (seen.has(title)) fail('duplicate title');
  seen.add(title);
  if (!DEFAULTS[difficulty]) fail(`bad difficulty "${difficulty}"`);
  if (!Array.isArray(topics) || topics.length === 0) fail('needs at least one topic');
  if (!statement) fail('missing statement');
  if (!outputFormat) fail('missing outputFormat');
  if (!Array.isArray(constraints) || constraints.length === 0) fail('missing constraints');
  if (!Array.isArray(params) || params.length === 0) fail('missing params');
  if (!Array.isArray(samples) || samples.length < 2) fail('needs at least 2 samples');
  if (typeof solve !== 'function') fail('missing solve()');
  if (typeof gen !== 'function') fail('missing gen()');

  const dft = DEFAULTS[difficulty];
  return {
    title,
    difficulty,
    topics,
    statement,
    outputFormat,
    constraints,
    params,
    samples,
    solve,
    gen,
    explain: explain || null,
    notes: notes || null,
    points: def.points ?? dft.points,
    timeLimitSeconds: def.timeLimitSeconds ?? dft.timeLimitSeconds,
    memoryLimitMb: def.memoryLimitMb ?? dft.memoryLimitMb,
    hiddenCount: def.hiddenCount ?? dft.hidden,
    encode: (args) => encodeInput(params, args),
  };
}

/** Assemble the full markdown problem statement, examples included. */
export function buildDescription(p, sampleCases) {
  const parts = [p.statement.trim(), '', '### Input Format', '', describeInput(p.params), '', '### Output Format', '', p.outputFormat.trim(), '', '### Constraints', ''];
  parts.push(p.constraints.map((c) => `- ${c}`).join('\n'));
  sampleCases.forEach((sc, i) => {
    parts.push('', `### Example ${i + 1}`, '', '**Input**', '```', sc.input, '```', '**Output**', '```', sc.expectedOutput, '```');
    if (sc.explanation) parts.push('', `**Explanation:** ${sc.explanation}`);
  });
  if (p.notes) parts.push('', '### Notes', '', p.notes.trim());
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Reset the duplicate-title guard (used by unit tests). */
export function _resetTitleGuard() { seen.clear(); }
