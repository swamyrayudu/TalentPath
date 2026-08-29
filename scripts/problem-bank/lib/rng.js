// Deterministic PRNG so every regeneration produces byte-identical test data.
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[r.int(0, arr.length - 1)],
    bool: (p = 0.5) => next() < p,
    ints: (n, lo, hi) => Array.from({ length: n }, () => r.int(lo, hi)),
    shuffle: (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = r.int(0, i);
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    },
    perm: (n, from = 0) => r.shuffle(Array.from({ length: n }, (_, i) => i + from)),
    word: (len, alphabet = 'abcdefghijklmnopqrstuvwxyz') =>
      Array.from({ length: len }, () => alphabet[r.int(0, alphabet.length - 1)]).join(''),
    subset: (arr, k) => r.shuffle(arr).slice(0, k),
  };
  return r;
}
