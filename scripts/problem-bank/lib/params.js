// Parameter descriptors. Each knows how to serialise a value to stdin lines and
// how to describe itself in the problem's "Input Format" section.
//
// Every problem's stdin is the concatenation of its params' lines, in order.
// The format is plain HackerRank/GFG style: bare tokens, whitespace separated,
// sizes always given before variable-length data so C++/Java can read with
// cin/Scanner without any parsing tricks.

const d = (name, text) => text.replace(/%s/g, name);

export const P = {
  /** A single integer on its own line. */
  int: (name, about = 'an integer') => ({
    kind: 'int',
    name,
    lines: (v) => [String(v)],
    describe: () => `A single integer **${name}** — ${about}.`,
  }),

  /** Several integers on one shared line. */
  ints: (names, about) => ({
    kind: 'ints',
    name: names.join(' '),
    lines: (v) => [v.join(' ')],
    describe: () => `${names.length} space-separated integers **${names.join('**, **')}** — ${about}.`,
  }),

  /** A float on its own line. */
  float: (name, about = 'a real number') => ({
    kind: 'float',
    name,
    lines: (v) => [String(v)],
    describe: () => `A single real number **${name}** — ${about}.`,
  }),

  /** length line, then the values space-separated on one line. */
  intArray: (name, about = 'the array elements', lenName) => ({
    kind: 'intArray',
    name,
    lines: (v) => [String(v.length), v.length ? v.join(' ') : ''],
    describe: () => {
      const n = lenName || `${name}_size`;
      return `A single integer **${n}** — the number of elements in ${name}, followed by a line with **${n}** space-separated integers — ${about}.`;
    },
  }),

  /** Values space-separated on one line, with no length prefix. */
  intLine: (name, about = 'the values') => ({
    kind: 'intLine',
    name,
    lines: (v) => [v.join(' ')],
    describe: () => `A line of space-separated integers **${name}** — ${about}.`,
  }),

  /** A single token/word on its own line. */
  str: (name, about = 'the string') => ({
    kind: 'str',
    name,
    lines: (v) => [v],
    describe: () => `A single line containing the string **${name}** — ${about}.`,
  }),

  /** count line, then one string per line. */
  strArray: (name, about = 'the strings', lenName) => ({
    kind: 'strArray',
    name,
    lines: (v) => [String(v.length), ...v],
    describe: () => {
      const n = lenName || `${name}_size`;
      return `A single integer **${n}** — the number of strings in ${name}, followed by **${n}** lines each containing one string — ${about}.`;
    },
  }),

  /** "rows cols" line, then `rows` lines of `cols` integers. */
  grid: (name, about = 'the grid') => ({
    kind: 'grid',
    name,
    lines: (v) => [`${v.length} ${v.length ? v[0].length : 0}`, ...v.map((row) => row.join(' '))],
    describe: () =>
      `Two space-separated integers **rows** and **cols** — the dimensions of ${name}, followed by **rows** lines of **cols** space-separated integers — ${about}.`,
  }),

  /** "rows cols" line, then `rows` lines of character strings (no spaces). */
  charGrid: (name, about = 'the grid') => ({
    kind: 'charGrid',
    name,
    lines: (v) => [`${v.length} ${v.length ? v[0].length : 0}`, ...v.map((row) => row.join(''))],
    describe: () =>
      `Two space-separated integers **rows** and **cols** — the dimensions of ${name}, followed by **rows** lines each containing **cols** characters — ${about}.`,
  }),

  /** count line, then one "a b" pair per line. */
  pairs: (name, about = 'the pairs', lenName) => ({
    kind: 'pairs',
    name,
    lines: (v) => [String(v.length), ...v.map((p) => p.join(' '))],
    describe: () => {
      const n = lenName || `${name}_size`;
      return `A single integer **${n}** — the number of pairs in ${name}, followed by **${n}** lines each containing two space-separated integers — ${about}.`;
    },
  }),

  /** count line, then one "a b c" triple per line. */
  triples: (name, about = 'the triples', lenName) => ({
    kind: 'triples',
    name,
    lines: (v) => [String(v.length), ...v.map((p) => p.join(' '))],
    describe: () => {
      const n = lenName || `${name}_size`;
      return `A single integer **${n}** — the number of entries in ${name}, followed by **${n}** lines each containing three space-separated integers — ${about}.`;
    },
  }),

  /**
   * A binary tree in level order. Line 1 is the node count, line 2 is the
   * level-order listing where `null` marks an absent child (LeetCode encoding).
   */
  tree: (name = 'tree', about = 'the level-order traversal of the tree, where `null` marks a missing child') => ({
    kind: 'tree',
    name,
    lines: (v) => [String(v.length), v.length ? v.map((x) => (x === null ? 'null' : String(x))).join(' ') : ''],
    describe: () =>
      `A single integer **k** — the number of tokens in the level-order listing, followed by a line of **k** space-separated tokens — ${about}.`,
  }),
};

/** Serialise one problem's argument list into a stdin string. */
export function encodeInput(params, args) {
  const out = [];
  params.forEach((p, i) => out.push(...p.lines(args[i])));
  return out.join('\n');
}

/** Build the human-readable "Input Format" bullet list. */
export function describeInput(params) {
  return params.map((p) => `- ${p.describe()}`).join('\n');
}
