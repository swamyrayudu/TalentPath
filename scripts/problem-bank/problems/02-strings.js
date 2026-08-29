import { P } from '../lib/params.js';
import { problem, F } from '../lib/define.js';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const SMALL = 'abcde';
const TINY = 'abc';

export default [
  problem({
    title: 'Reverse a String',
    difficulty: 'EASY',
    topics: ['String', 'Two Pointers'],
    statement: 'Given a string `s`, print it with the characters in reverse order.',
    params: [P.str('s', 'the string to reverse')],
    outputFormat: 'A single line containing the reversed string.',
    constraints: ['1 <= |s| <= 10^5', 's consists of printable characters without spaces.'],
    samples: [['hello'], ['a'], ['racecar']],
    solve: ([s]) => [...s].reverse().join(''),
    gen: (r) => [r.word(r.int(1, 30))],
  }),

  problem({
    title: 'Check Palindrome String',
    difficulty: 'EASY',
    topics: ['String', 'Two Pointers'],
    statement:
      'Given a string `s`, determine whether it is a palindrome — that is, whether it reads the same forwards and backwards.',
    params: [P.str('s', 'the string to test')],
    outputFormat: 'Print `true` if s is a palindrome, otherwise print `false`.',
    constraints: ['1 <= |s| <= 10^5', 's consists of lowercase English letters.'],
    samples: [['racecar'], ['hello'], ['aa']],
    solve: ([s]) => F.bool(s === [...s].reverse().join('')),
    gen: (r, i) => {
      if (i % 3 === 0) { const h = r.word(r.int(1, 6), SMALL); return [h + [...h].reverse().join('')]; }
      return [r.word(r.int(1, 12), SMALL)];
    },
  }),

  problem({
    title: 'Count Vowels and Consonants',
    difficulty: 'EASY',
    topics: ['String', 'Counting'],
    statement:
      'Given a lowercase string `s`, count how many of its characters are vowels (`a`, `e`, `i`, `o`, `u`) and how many are consonants.',
    params: [P.str('s', 'the string')],
    outputFormat: 'Two space-separated integers — the vowel count followed by the consonant count.',
    constraints: ['1 <= |s| <= 10^5', 's consists of lowercase English letters.'],
    samples: [['programming'], ['aeiou'], ['xyz']],
    solve: ([s]) => {
      const v = [...s].filter((c) => 'aeiou'.includes(c)).length;
      return F.arr([v, s.length - v]);
    },
    gen: (r) => [r.word(r.int(1, 30))],
  }),

  problem({
    title: 'Valid Anagram Check',
    difficulty: 'EASY',
    topics: ['String', 'Hash Table', 'Sorting'],
    statement:
      'Given two strings `s` and `t`, determine whether `t` is an anagram of `s` — that is, whether it uses exactly the same letters with the same multiplicities.',
    params: [P.str('s', 'the first string'), P.str('t', 'the second string')],
    outputFormat: 'Print `true` if t is an anagram of s, otherwise print `false`.',
    constraints: ['1 <= |s|, |t| <= 5 * 10^4', 'Both strings consist of lowercase English letters.'],
    samples: [['anagram', 'nagaram'], ['rat', 'car'], ['ab', 'a']],
    solve: ([s, t]) => F.bool([...s].sort().join('') === [...t].sort().join('')),
    gen: (r, i) => {
      const s = r.word(r.int(1, 10), SMALL);
      if (i % 2 === 0) return [s, r.shuffle([...s]).join('')];
      return [s, r.word(r.int(1, 10), SMALL)];
    },
  }),

  problem({
    title: 'First Non-Repeating Character',
    difficulty: 'EASY',
    topics: ['String', 'Hash Table', 'Queue'],
    statement:
      'Given a string `s`, find the first character that does not repeat anywhere in the string and return its index.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single integer — the index of the first non-repeating character, or -1 if every character repeats.',
    constraints: ['1 <= |s| <= 10^5', 's consists of lowercase English letters.'],
    samples: [['leetcode'], ['aabb'], ['loveleetcode']],
    solve: ([s]) => {
      const cnt = new Map();
      for (const c of s) cnt.set(c, (cnt.get(c) || 0) + 1);
      for (let i = 0; i < s.length; i++) if (cnt.get(s[i]) === 1) return F.num(i);
      return '-1';
    },
    gen: (r) => [r.word(r.int(1, 20), SMALL)],
  }),

  problem({
    title: 'Longest Substring Without Repeats',
    difficulty: 'MEDIUM',
    topics: ['String', 'Sliding Window', 'Hash Table'],
    statement:
      'Given a string `s`, find the length of the longest substring that contains no repeated characters.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single integer — the length of the longest substring with all distinct characters.',
    constraints: ['1 <= |s| <= 5 * 10^4', 's consists of lowercase English letters and digits.'],
    samples: [['abcabcbb'], ['bbbbb'], ['pwwkew']],
    explain: (_a, out) => `The longest window with no repeated character has length ${out}.`,
    solve: ([s]) => {
      const last = new Map();
      let best = 0, lo = 0;
      for (let i = 0; i < s.length; i++) {
        if (last.has(s[i]) && last.get(s[i]) >= lo) lo = last.get(s[i]) + 1;
        last.set(s[i], i);
        best = Math.max(best, i - lo + 1);
      }
      return F.num(best);
    },
    gen: (r) => [r.word(r.int(1, 40), r.bool() ? SMALL : LOWER)],
  }),

  problem({
    title: 'Longest Palindromic Substring Length',
    difficulty: 'MEDIUM',
    topics: ['String', 'Dynamic Programming'],
    statement:
      'Given a string `s`, return the length of the longest contiguous substring of `s` that is a palindrome.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single integer — the length of the longest palindromic substring.',
    constraints: ['1 <= |s| <= 1000', 's consists of lowercase English letters.'],
    samples: [['babad'], ['cbbd'], ['a']],
    solve: ([s]) => {
      let best = 1;
      const grow = (l, r2) => {
        while (l >= 0 && r2 < s.length && s[l] === s[r2]) { best = Math.max(best, r2 - l + 1); l--; r2++; }
      };
      for (let i = 0; i < s.length; i++) { grow(i, i); grow(i, i + 1); }
      return F.num(best);
    },
    gen: (r) => [r.word(r.int(1, 30), r.bool() ? TINY : SMALL)],
  }),

  problem({
    title: 'Group Anagrams Count',
    difficulty: 'MEDIUM',
    topics: ['String', 'Hash Table', 'Sorting'],
    statement:
      'Given a list of strings, group together the ones that are anagrams of each other and report how many distinct groups there are.',
    params: [P.strArray('words', 'the words to group', 'n')],
    outputFormat: 'A single integer — the number of anagram groups.',
    constraints: ['1 <= n <= 10^4', '1 <= |words[i]| <= 100', 'All words consist of lowercase English letters.'],
    samples: [[['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], [['a']], [['abc', 'cba', 'bac', 'xyz']]],
    explain: (_a, out) => `Words that are permutations of one another fall into the same group, giving ${out} group(s).`,
    solve: ([words]) => F.num(new Set(words.map((w) => [...w].sort().join(''))).size),
    gen: (r) => {
      const base = Array.from({ length: r.int(1, 5) }, () => r.word(r.int(1, 5), SMALL));
      const out = [];
      for (let i = 0; i < r.int(1, 12); i++) out.push(r.shuffle([...r.pick(base)]).join(''));
      return [out];
    },
  }),

  problem({
    title: 'String Compression Run Length',
    difficulty: 'EASY',
    topics: ['String', 'Two Pointers'],
    statement:
      'Compress a string using run-length encoding: replace each maximal run of a repeated character with the character followed by the run length.\n\nFor example `aaabbc` becomes `a3b2c1`.',
    params: [P.str('s', 'the string to compress')],
    outputFormat: 'A single line containing the run-length encoded string.',
    constraints: ['1 <= |s| <= 10^5', 's consists of lowercase English letters.'],
    samples: [['aaabbc'], ['abcd'], ['zzzzzzzzzzzz']],
    solve: ([s]) => {
      let out = '', i = 0;
      while (i < s.length) {
        let j = i;
        while (j < s.length && s[j] === s[i]) j++;
        out += s[i] + (j - i);
        i = j;
      }
      return out;
    },
    gen: (r) => {
      let s = '';
      for (let i = 0; i < r.int(1, 10); i++) s += r.pick([...SMALL]).repeat(r.int(1, 5));
      return [s];
    },
  }),

  problem({
    title: 'Longest Common Prefix of Words',
    difficulty: 'EASY',
    topics: ['String', 'Trie'],
    statement:
      'Find the longest common prefix shared by every string in the given list.',
    params: [P.strArray('words', 'the words', 'n')],
    outputFormat: 'The longest common prefix, or the word `NONE` if there is no common prefix.',
    constraints: ['1 <= n <= 200', '1 <= |words[i]| <= 200', 'All words consist of lowercase English letters.'],
    samples: [[['flower', 'flow', 'flight']], [['dog', 'racecar', 'car']], [['interspecies', 'interstellar', 'interstate']]],
    solve: ([words]) => {
      let pre = words[0];
      for (const w of words) {
        let k = 0;
        while (k < pre.length && k < w.length && pre[k] === w[k]) k++;
        pre = pre.slice(0, k);
        if (!pre) break;
      }
      return pre || 'NONE';
    },
    gen: (r, i) => {
      if (i % 3 === 0) return [Array.from({ length: r.int(2, 6) }, () => r.word(r.int(1, 6), SMALL))];
      const pre = r.word(r.int(1, 5), SMALL);
      return [Array.from({ length: r.int(1, 6) }, () => pre + r.word(r.int(0, 5), SMALL))];
    },
  }),

  problem({
    title: 'Valid Parentheses Sequence',
    difficulty: 'EASY',
    topics: ['String', 'Stack'],
    statement:
      'Given a string containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, determine whether the brackets are balanced and correctly nested.',
    params: [P.str('s', 'the bracket string')],
    outputFormat: 'Print `true` if the string is valid, otherwise print `false`.',
    constraints: ['1 <= |s| <= 10^4', 's consists only of bracket characters.'],
    samples: [['()[]{}'], ['(]'], ['{[()]}']],
    solve: ([s]) => {
      const pair = { ')': '(', ']': '[', '}': '{' };
      const st = [];
      for (const c of s) {
        if (pair[c]) { if (st.pop() !== pair[c]) return F.bool(false); } else st.push(c);
      }
      return F.bool(st.length === 0);
    },
    gen: (r, i) => {
      const open = ['(', '[', '{'], close = { '(': ')', '[': ']', '{': '}' };
      if (i % 3 === 0) return [Array.from({ length: r.int(2, 12) }, () => r.pick(['(', ')', '[', ']', '{', '}'])).join('')];
      const build = (depth) => {
        if (depth === 0) return '';
        let s = '';
        for (let k = 0; k < r.int(1, 2); k++) { const o = r.pick(open); s += o + build(depth - 1) + close[o]; }
        return s;
      };
      return [build(r.int(1, 4)) || '()'];
    },
  }),

  problem({
    title: 'Implement Substring Search',
    difficulty: 'EASY',
    topics: ['String', 'Two Pointers', 'String Matching'],
    statement:
      'Given a text `haystack` and a pattern `needle`, return the index of the first occurrence of `needle` in `haystack`.',
    params: [P.str('haystack', 'the text to search in'), P.str('needle', 'the pattern to find')],
    outputFormat: 'A single integer — the 0-based index of the first occurrence, or -1 if the pattern is absent.',
    constraints: ['1 <= |haystack|, |needle| <= 10^4', 'Both strings consist of lowercase English letters.'],
    samples: [['sadbutsad', 'sad'], ['leetcode', 'leeto'], ['hello', 'll']],
    solve: ([h, n]) => F.num(h.indexOf(n)),
    gen: (r, i) => {
      const h = r.word(r.int(4, 25), SMALL);
      if (i % 2 === 0) { const a = r.int(0, h.length - 2); return [h, h.slice(a, a + r.int(1, 4))]; }
      return [h, r.word(r.int(1, 4), SMALL)];
    },
  }),

  problem({
    title: 'Count Distinct Characters',
    difficulty: 'EASY',
    topics: ['String', 'Hash Table', 'Counting'],
    statement: 'Given a string `s`, count how many distinct characters it contains.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single integer — the number of distinct characters.',
    constraints: ['1 <= |s| <= 10^5', 's consists of lowercase English letters.'],
    samples: [['abcabc'], ['aaaa'], ['abcdefg']],
    solve: ([s]) => F.num(new Set(s).size),
    gen: (r) => [r.word(r.int(1, 30), r.bool() ? SMALL : LOWER)],
  }),

  problem({
    title: 'Capitalize Alternate Characters',
    difficulty: 'EASY',
    topics: ['String', 'Simulation'],
    statement:
      'Given a lowercase string `s`, produce a new string in which every character at an even index is uppercased and every character at an odd index is left unchanged.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single line containing the transformed string.',
    constraints: ['1 <= |s| <= 10^5', 's consists of lowercase English letters.'],
    samples: [['abcdef'], ['a'], ['hello']],
    solve: ([s]) => [...s].map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c)).join(''),
    gen: (r) => [r.word(r.int(1, 25))],
  }),

  problem({
    title: 'Remove All Occurrences of a Character',
    difficulty: 'EASY',
    topics: ['String', 'Simulation'],
    statement:
      'Given a string `s` and a character `c`, remove every occurrence of `c` from `s`.',
    params: [P.str('s', 'the string'), P.str('c', 'the character to remove')],
    outputFormat: 'The resulting string, or the word `EMPTY` if nothing remains.',
    constraints: ['1 <= |s| <= 10^5', 'c is a single lowercase English letter.'],
    samples: [['banana', 'a'], ['hello', 'z'], ['aaa', 'a']],
    solve: ([s, c]) => s.split(c).join('') || 'EMPTY',
    gen: (r) => [r.word(r.int(1, 25), SMALL), r.pick([...SMALL])],
  }),

  problem({
    title: 'Check Rotation of String',
    difficulty: 'EASY',
    topics: ['String', 'String Matching'],
    statement:
      'Given two strings `a` and `b`, determine whether `b` can be obtained by rotating `a` some number of positions.\n\nFor example `erbottlewat` is a rotation of `waterbottle`.',
    params: [P.str('a', 'the original string'), P.str('b', 'the candidate rotation')],
    outputFormat: 'Print `true` if b is a rotation of a, otherwise print `false`.',
    constraints: ['1 <= |a|, |b| <= 10^5', 'Both strings consist of lowercase English letters.'],
    samples: [['waterbottle', 'erbottlewat'], ['abcde', 'abced'], ['aa', 'aa']],
    solve: ([a, b]) => F.bool(a.length === b.length && (a + a).includes(b)),
    gen: (r, i) => {
      const a = r.word(r.int(2, 12), SMALL);
      if (i % 2 === 0) { const k = r.int(0, a.length - 1); return [a, a.slice(k) + a.slice(0, k)]; }
      return [a, r.word(a.length, SMALL)];
    },
  }),

  problem({
    title: 'Count Words in a Sentence',
    difficulty: 'EASY',
    topics: ['String', 'Simulation'],
    statement:
      'You are given a number of words. Report how many of them have length strictly greater than `k`.',
    params: [P.strArray('words', 'the words', 'n'), P.int('k', 'the length threshold')],
    outputFormat: 'A single integer — the number of words longer than k characters.',
    constraints: ['1 <= n <= 10^4', '1 <= |words[i]| <= 100', '0 <= k <= 100'],
    samples: [[['hi', 'hello', 'hey'], 2], [['a', 'bb', 'ccc'], 0], [['same', 'size', 'here'], 4]],
    solve: ([words, k]) => F.num(words.filter((w) => w.length > k).length),
    gen: (r) => [Array.from({ length: r.int(1, 12) }, () => r.word(r.int(1, 8), SMALL)), r.int(0, 8)],
  }),

  problem({
    title: 'Reverse Words Order',
    difficulty: 'MEDIUM',
    topics: ['String', 'Two Pointers'],
    statement:
      'You are given a list of words that form a sentence. Print the words in reverse order, separated by single spaces.',
    params: [P.strArray('words', 'the words of the sentence in order', 'n')],
    outputFormat: 'A single line containing the words in reverse order, separated by single spaces.',
    constraints: ['1 <= n <= 10^4', '1 <= |words[i]| <= 100', 'Words consist of lowercase English letters.'],
    samples: [[['the', 'sky', 'is', 'blue']], [['hello']], [['a', 'good', 'example']]],
    solve: ([words]) => words.slice().reverse().join(' '),
    gen: (r) => [Array.from({ length: r.int(1, 10) }, () => r.word(r.int(1, 7), SMALL))],
  }),

  problem({
    title: 'Isomorphic Strings',
    difficulty: 'MEDIUM',
    topics: ['String', 'Hash Table'],
    statement:
      'Two strings are isomorphic if the characters of the first can be replaced to get the second, preserving the order, with no two characters mapping to the same character.\n\nGiven `s` and `t`, decide whether they are isomorphic.',
    params: [P.str('s', 'the first string'), P.str('t', 'the second string')],
    outputFormat: 'Print `true` if the strings are isomorphic, otherwise print `false`.',
    constraints: ['1 <= |s|, |t| <= 5 * 10^4', 'Both strings consist of lowercase English letters.'],
    samples: [['egg', 'add'], ['foo', 'bar'], ['paper', 'title']],
    solve: ([s, t]) => {
      if (s.length !== t.length) return F.bool(false);
      const f = new Map(), g = new Map();
      for (let i = 0; i < s.length; i++) {
        if (f.has(s[i]) && f.get(s[i]) !== t[i]) return F.bool(false);
        if (g.has(t[i]) && g.get(t[i]) !== s[i]) return F.bool(false);
        f.set(s[i], t[i]); g.set(t[i], s[i]);
      }
      return F.bool(true);
    },
    gen: (r, i) => {
      const s = r.word(r.int(1, 10), TINY);
      if (i % 2 === 0) {
        const map = {}; const pool = r.shuffle([...SMALL]);
        let k = 0;
        return [s, [...s].map((c) => (map[c] ??= pool[k++])).join('')];
      }
      return [s, r.word(s.length, TINY)];
    },
  }),

  problem({
    title: 'Word Pattern Match',
    difficulty: 'EASY',
    topics: ['String', 'Hash Table'],
    statement:
      'Given a pattern of lowercase letters and a list of words, decide whether the words follow the same pattern — a bijection must exist between the pattern letters and the words.',
    params: [P.str('pattern', 'the pattern letters'), P.strArray('words', 'the words', 'n')],
    outputFormat: 'Print `true` if the words follow the pattern, otherwise print `false`.',
    constraints: ['1 <= |pattern| <= 300', '1 <= n <= 300', 'The pattern and words consist of lowercase English letters.'],
    samples: [['abba', ['dog', 'cat', 'cat', 'dog']], ['abba', ['dog', 'cat', 'cat', 'fish']], ['aaaa', ['dog', 'dog', 'dog', 'dog']]],
    solve: ([pattern, words]) => {
      if (pattern.length !== words.length) return F.bool(false);
      const f = new Map(), g = new Map();
      for (let i = 0; i < pattern.length; i++) {
        const a = pattern[i], b = words[i];
        if (f.has(a) && f.get(a) !== b) return F.bool(false);
        if (g.has(b) && g.get(b) !== a) return F.bool(false);
        f.set(a, b); g.set(b, a);
      }
      return F.bool(true);
    },
    gen: (r) => {
      const n = r.int(1, 8);
      return [r.word(n, TINY), Array.from({ length: n }, () => r.word(r.int(2, 4), TINY))];
    },
  }),

  problem({
    title: 'Ransom Note Buildable',
    difficulty: 'EASY',
    topics: ['String', 'Hash Table', 'Counting'],
    statement:
      'Given two strings `note` and `magazine`, determine whether `note` can be constructed using the letters of `magazine`. Each letter of `magazine` may be used at most once.',
    params: [P.str('note', 'the note to build'), P.str('magazine', 'the available letters')],
    outputFormat: 'Print `true` if the note can be built, otherwise print `false`.',
    constraints: ['1 <= |note|, |magazine| <= 10^5', 'Both strings consist of lowercase English letters.'],
    samples: [['a', 'b'], ['aa', 'aab'], ['abc', 'cba']],
    solve: ([note, mag]) => {
      const cnt = new Map();
      for (const c of mag) cnt.set(c, (cnt.get(c) || 0) + 1);
      for (const c of note) {
        const left = (cnt.get(c) || 0) - 1;
        if (left < 0) return F.bool(false);
        cnt.set(c, left);
      }
      return F.bool(true);
    },
    gen: (r) => [r.word(r.int(1, 8), SMALL), r.word(r.int(1, 14), SMALL)],
  }),

  problem({
    title: 'Longest Repeating Character Replacement',
    difficulty: 'MEDIUM',
    topics: ['String', 'Sliding Window'],
    statement:
      'You are given a string `s` and an integer `k`. You may change at most `k` characters of `s` to any other uppercase English letter.\n\nReturn the length of the longest substring containing a single repeated letter that you can obtain.',
    params: [P.str('s', 'the string of uppercase letters'), P.int('k', 'the number of allowed replacements')],
    outputFormat: 'A single integer — the length of the longest achievable run of one repeated letter.',
    constraints: ['1 <= |s| <= 10^5', 's consists of uppercase English letters.', '0 <= k <= |s|'],
    samples: [['ABAB', 2], ['AABABBA', 1], ['AAAA', 0]],
    solve: ([s, k]) => {
      const cnt = new Map();
      let lo = 0, maxFreq = 0, best = 0;
      for (let hi = 0; hi < s.length; hi++) {
        cnt.set(s[hi], (cnt.get(s[hi]) || 0) + 1);
        maxFreq = Math.max(maxFreq, cnt.get(s[hi]));
        while (hi - lo + 1 - maxFreq > k) { cnt.set(s[lo], cnt.get(s[lo]) - 1); lo++; }
        best = Math.max(best, hi - lo + 1);
      }
      return F.num(best);
    },
    gen: (r) => { const s = r.word(r.int(1, 25), 'ABCD'); return [s, r.int(0, Math.min(4, s.length))]; },
  }),

  problem({
    title: 'Minimum Window Substring Length',
    difficulty: 'HARD',
    topics: ['String', 'Sliding Window', 'Hash Table'],
    statement:
      'Given strings `s` and `t`, find the length of the shortest contiguous substring of `s` that contains every character of `t`, including duplicates.',
    params: [P.str('s', 'the source string'), P.str('t', 'the required characters')],
    outputFormat: 'A single integer — the length of the smallest valid window, or 0 if no such window exists.',
    constraints: ['1 <= |s|, |t| <= 10^5', 'Both strings consist of lowercase English letters.'],
    samples: [['adobecodebanc', 'abc'], ['a', 'a'], ['a', 'aa']],
    explain: (_a, out) => (out === '0' ? 's has no window containing every required character.' : `The smallest window covering t has length ${out}.`),
    solve: ([s, t]) => {
      const need = new Map();
      for (const c of t) need.set(c, (need.get(c) || 0) + 1);
      let missing = t.length, lo = 0, best = Infinity;
      for (let hi = 0; hi < s.length; hi++) {
        if ((need.get(s[hi]) || 0) > 0) missing--;
        need.set(s[hi], (need.get(s[hi]) || 0) - 1);
        while (missing === 0) {
          best = Math.min(best, hi - lo + 1);
          need.set(s[lo], (need.get(s[lo]) || 0) + 1);
          if (need.get(s[lo]) > 0) missing++;
          lo++;
        }
      }
      return F.num(best === Infinity ? 0 : best);
    },
    gen: (r) => [r.word(r.int(1, 30), SMALL), r.word(r.int(1, 4), SMALL)],
  }),

  problem({
    title: 'Find All Anagram Start Indices',
    difficulty: 'MEDIUM',
    topics: ['String', 'Sliding Window', 'Hash Table'],
    statement:
      'Given strings `s` and `p`, find every starting index in `s` where an anagram of `p` begins.',
    params: [P.str('s', 'the source string'), P.str('p', 'the pattern')],
    outputFormat: 'The count of matches on the first line, then the starting indices in increasing order on the second line. Print only `0` when there are no matches.',
    constraints: ['1 <= |s|, |p| <= 3 * 10^4', 'Both strings consist of lowercase English letters.'],
    samples: [['cbaebabacd', 'abc'], ['abab', 'ab'], ['aa', 'bb']],
    solve: ([s, p]) => {
      const out = [];
      if (p.length <= s.length) {
        const need = Array(26).fill(0), win = Array(26).fill(0);
        const idx = (c) => c.charCodeAt(0) - 97;
        for (const c of p) need[idx(c)]++;
        for (let i = 0; i < s.length; i++) {
          win[idx(s[i])]++;
          if (i >= p.length) win[idx(s[i - p.length])]--;
          if (i >= p.length - 1 && need.every((v, k) => v === win[k])) out.push(i - p.length + 1);
        }
      }
      return F.counted(out);
    },
    gen: (r) => [r.word(r.int(1, 30), TINY), r.word(r.int(1, 4), TINY)],
  }),

  problem({
    title: 'Palindrome Partitioning Minimum Cuts',
    difficulty: 'HARD',
    topics: ['String', 'Dynamic Programming'],
    statement:
      'Given a string `s`, partition it so that every part is a palindrome. Return the minimum number of cuts needed.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single integer — the minimum number of cuts.',
    constraints: ['1 <= |s| <= 2000', 's consists of lowercase English letters.'],
    samples: [['aab'], ['a'], ['abccba']],
    explain: (_a, out) => `${out} cut(s) split the string into palindromic pieces.`,
    solve: ([s]) => {
      const n = s.length;
      const pal = Array.from({ length: n }, () => Array(n).fill(false));
      for (let i = n - 1; i >= 0; i--)
        for (let j = i; j < n; j++)
          if (s[i] === s[j] && (j - i < 2 || pal[i + 1][j - 1])) pal[i][j] = true;
      const dp = Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        if (pal[0][i]) { dp[i] = 0; continue; }
        dp[i] = Infinity;
        for (let j = 1; j <= i; j++) if (pal[j][i]) dp[i] = Math.min(dp[i], dp[j - 1] + 1);
      }
      return F.num(dp[n - 1]);
    },
    gen: (r) => [r.word(r.int(1, 22), r.bool() ? TINY : SMALL)],
  }),

  problem({
    title: 'Count Palindromic Substrings',
    difficulty: 'MEDIUM',
    topics: ['String', 'Dynamic Programming'],
    statement:
      'Given a string `s`, count how many of its substrings are palindromes. Substrings at different positions count separately even if they are equal as strings.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single integer — the number of palindromic substrings.',
    constraints: ['1 <= |s| <= 1000', 's consists of lowercase English letters.'],
    samples: [['abc'], ['aaa'], ['abba']],
    solve: ([s]) => {
      let total = 0;
      const grow = (l, r2) => { while (l >= 0 && r2 < s.length && s[l] === s[r2]) { total++; l--; r2++; } };
      for (let i = 0; i < s.length; i++) { grow(i, i); grow(i, i + 1); }
      return F.num(total);
    },
    gen: (r) => [r.word(r.int(1, 25), r.bool() ? TINY : SMALL)],
  }),

  problem({
    title: 'Edit Distance Between Strings',
    difficulty: 'HARD',
    topics: ['String', 'Dynamic Programming'],
    statement:
      'Given two strings `a` and `b`, return the minimum number of single-character insertions, deletions or substitutions needed to turn `a` into `b`.',
    params: [P.str('a', 'the source string'), P.str('b', 'the target string')],
    outputFormat: 'A single integer — the edit distance.',
    constraints: ['1 <= |a|, |b| <= 500', 'Both strings consist of lowercase English letters.'],
    samples: [['horse', 'ros'], ['intention', 'execution'], ['abc', 'abc']],
    solve: ([a, b]) => {
      const m = a.length, n = b.length;
      let prev = Array.from({ length: n + 1 }, (_, j) => j);
      for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++)
          cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
        prev = cur;
      }
      return F.num(prev[n]);
    },
    gen: (r) => [r.word(r.int(1, 12), SMALL), r.word(r.int(1, 12), SMALL)],
  }),

  problem({
    title: 'Longest Common Subsequence Length',
    difficulty: 'MEDIUM',
    topics: ['String', 'Dynamic Programming'],
    statement:
      'Given two strings `a` and `b`, return the length of their longest common subsequence — the longest sequence of characters appearing in both, in the same relative order but not necessarily contiguously.',
    params: [P.str('a', 'the first string'), P.str('b', 'the second string')],
    outputFormat: 'A single integer — the length of the longest common subsequence.',
    constraints: ['1 <= |a|, |b| <= 1000', 'Both strings consist of lowercase English letters.'],
    samples: [['abcde', 'ace'], ['abc', 'def'], ['abc', 'abc']],
    solve: ([a, b]) => {
      let prev = Array(b.length + 1).fill(0);
      for (let i = 1; i <= a.length; i++) {
        const cur = [0];
        for (let j = 1; j <= b.length; j++)
          cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
        prev = cur;
      }
      return F.num(prev[b.length]);
    },
    gen: (r) => [r.word(r.int(1, 14), SMALL), r.word(r.int(1, 14), SMALL)],
  }),

  problem({
    title: 'Longest Common Substring Length',
    difficulty: 'MEDIUM',
    topics: ['String', 'Dynamic Programming'],
    statement:
      'Given two strings `a` and `b`, return the length of the longest string that appears as a contiguous substring of both.',
    params: [P.str('a', 'the first string'), P.str('b', 'the second string')],
    outputFormat: 'A single integer — the length of the longest common substring, or 0 if they share none.',
    constraints: ['1 <= |a|, |b| <= 1000', 'Both strings consist of lowercase English letters.'],
    samples: [['abcde', 'abfce'], ['abc', 'xyz'], ['aaaa', 'aa']],
    solve: ([a, b]) => {
      let prev = Array(b.length + 1).fill(0), best = 0;
      for (let i = 1; i <= a.length; i++) {
        const cur = [0];
        for (let j = 1; j <= b.length; j++) {
          cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : 0;
          best = Math.max(best, cur[j]);
        }
        prev = cur;
      }
      return F.num(best);
    },
    gen: (r) => [r.word(r.int(1, 14), SMALL), r.word(r.int(1, 14), SMALL)],
  }),

  problem({
    title: 'Roman Numeral to Integer',
    difficulty: 'EASY',
    topics: ['String', 'Math', 'Hash Table'],
    statement:
      'Convert a Roman numeral to its integer value. The symbols are `I`=1, `V`=5, `X`=10, `L`=50, `C`=100, `D`=500 and `M`=1000, with the usual subtractive pairs such as `IV`=4 and `CM`=900.',
    params: [P.str('s', 'the Roman numeral')],
    outputFormat: 'A single integer — the value of the numeral.',
    constraints: ['1 <= |s| <= 15', 's is a valid Roman numeral in the range [1, 3999].'],
    samples: [['III'], ['LVIII'], ['MCMXCIV']],
    solve: ([s]) => {
      const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let total = 0;
      for (let i = 0; i < s.length; i++) total += v[s[i]] < v[s[i + 1]] ? -v[s[i]] : v[s[i]];
      return F.num(total);
    },
    gen: (r) => {
      const n = r.int(1, 3999);
      const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let rest = n, s = '';
      for (const [val, sym] of table) while (rest >= val) { s += sym; rest -= val; }
      return [s];
    },
  }),

  problem({
    title: 'Integer to Roman Numeral',
    difficulty: 'MEDIUM',
    topics: ['String', 'Math', 'Greedy'],
    statement:
      'Convert an integer in the range `[1, 3999]` to its Roman numeral representation using the standard subtractive notation.',
    params: [P.int('n', 'the integer to convert')],
    outputFormat: 'A single line containing the Roman numeral.',
    constraints: ['1 <= n <= 3999'],
    samples: [[3], [58], [1994]],
    solve: ([n]) => {
      const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let rest = n, s = '';
      for (const [val, sym] of table) while (rest >= val) { s += sym; rest -= val; }
      return s;
    },
    gen: (r) => [r.int(1, 3999)],
  }),

  problem({
    title: 'Add Binary Strings',
    difficulty: 'EASY',
    topics: ['String', 'Math', 'Bit Manipulation'],
    statement: 'Given two binary strings `a` and `b`, return their sum as a binary string.',
    params: [P.str('a', 'the first binary string'), P.str('b', 'the second binary string')],
    outputFormat: 'A single line containing the binary sum, with no leading zeroes unless the result is `0`.',
    constraints: ['1 <= |a|, |b| <= 10^4', 'Each string consists only of the characters 0 and 1 and has no leading zeroes unless it is "0".'],
    samples: [['11', '1'], ['1010', '1011'], ['0', '0']],
    solve: ([a, b]) => {
      let i = a.length - 1, j = b.length - 1, carry = 0, out = '';
      while (i >= 0 || j >= 0 || carry) {
        const sum = (i >= 0 ? +a[i--] : 0) + (j >= 0 ? +b[j--] : 0) + carry;
        out = (sum % 2) + out;
        carry = sum >= 2 ? 1 : 0;
      }
      return out;
    },
    gen: (r) => {
      const bin = () => { const n = r.int(1, 20); let s = '1'; for (let i = 1; i < n; i++) s += r.pick(['0', '1']); return r.bool(0.1) ? '0' : s; };
      return [bin(), bin()];
    },
  }),

  problem({
    title: 'Multiply Strings as Numbers',
    difficulty: 'MEDIUM',
    topics: ['String', 'Math', 'Simulation'],
    statement:
      'Given two non-negative integers represented as strings, return their product as a string. You must not convert the inputs to a built-in big-integer type directly.',
    params: [P.str('a', 'the first number'), P.str('b', 'the second number')],
    outputFormat: 'A single line containing the product, with no leading zeroes.',
    constraints: ['1 <= |a|, |b| <= 200', 'Both strings contain only digits and have no leading zeroes unless the value is "0".'],
    samples: [['2', '3'], ['123', '456'], ['0', '9999']],
    solve: ([a, b]) => {
      const m = a.length, n = b.length;
      const res = Array(m + n).fill(0);
      for (let i = m - 1; i >= 0; i--)
        for (let j = n - 1; j >= 0; j--) {
          const mul = (a.charCodeAt(i) - 48) * (b.charCodeAt(j) - 48) + res[i + j + 1];
          res[i + j + 1] = mul % 10;
          res[i + j] += Math.floor(mul / 10);
        }
      const s = res.join('').replace(/^0+(?=\d)/, '');
      return s;
    },
    gen: (r) => {
      const num = () => (r.bool(0.1) ? '0' : String(r.int(1, 9)) + Array.from({ length: r.int(0, 8) }, () => r.int(0, 9)).join(''));
      return [num(), num()];
    },
  }),

  problem({
    title: 'Compare Version Numbers',
    difficulty: 'MEDIUM',
    topics: ['String', 'Two Pointers'],
    statement:
      'Two version strings are given as sequences of revision numbers. Compare them: return `1` if the first is greater, `-1` if the second is greater, and `0` if they are equal. Missing trailing revisions are treated as `0`.',
    params: [P.intArray('v1', 'the revisions of the first version', 'n'), P.intArray('v2', 'the revisions of the second version', 'm')],
    outputFormat: 'A single integer — 1, -1 or 0.',
    constraints: ['1 <= n, m <= 500', '0 <= v1[i], v2[i] <= 500'],
    samples: [[[1, 2], [1, 10]], [[1, 0, 0], [1]], [[7, 5, 2, 4], [7, 5, 3]]],
    solve: ([v1, v2]) => {
      const len = Math.max(v1.length, v2.length);
      for (let i = 0; i < len; i++) {
        const a = v1[i] ?? 0, b = v2[i] ?? 0;
        if (a !== b) return F.num(a > b ? 1 : -1);
      }
      return '0';
    },
    gen: (r) => [r.ints(r.int(1, 5), 0, 6), r.ints(r.int(1, 5), 0, 6)],
  }),

  problem({
    title: 'Valid Palindrome Ignoring Case',
    difficulty: 'EASY',
    topics: ['String', 'Two Pointers'],
    statement:
      'Given a string `s`, determine whether it is a palindrome when non-alphanumeric characters are ignored and letters are compared case-insensitively.',
    params: [P.str('s', 'the string, containing no spaces')],
    outputFormat: 'Print `true` if the cleaned string is a palindrome, otherwise print `false`.',
    constraints: ['1 <= |s| <= 2 * 10^5', 's consists of printable ASCII characters with no spaces.'],
    samples: [['AmanaplanacanalPanama'], ['race,a.car'], ['.,']],
    notes: 'A cleaned string with no alphanumeric characters left counts as a palindrome.',
    solve: ([s]) => {
      const c = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      return F.bool(c === [...c].reverse().join(''));
    },
    gen: (r, i) => {
      const junk = ['.', ',', '!', '-', ':'];
      const sprinkle = (str) => [...str].map((c) => (r.bool(0.25) ? c + r.pick(junk) : c)).join('');
      if (i % 2 === 0) { const h = r.word(r.int(1, 6), SMALL); return [sprinkle(h + [...h].reverse().join('')).toUpperCase()]; }
      return [sprinkle(r.word(r.int(1, 12), SMALL))];
    },
  }),

  problem({
    title: 'Count Substrings With K Distinct',
    difficulty: 'HARD',
    topics: ['String', 'Sliding Window', 'Hash Table'],
    statement:
      'Given a string `s` and an integer `k`, count the substrings of `s` that contain exactly `k` distinct characters.',
    params: [P.str('s', 'the string'), P.int('k', 'the required number of distinct characters')],
    outputFormat: 'A single integer — the number of substrings with exactly k distinct characters.',
    constraints: ['1 <= |s| <= 10^4', '1 <= k <= 26', 's consists of lowercase English letters.'],
    samples: [['pqpqs', 2], ['aabab', 3], ['aaa', 1]],
    solve: ([s, k]) => {
      const atMost = (limit) => {
        const cnt = new Map();
        let lo = 0, total = 0;
        for (let hi = 0; hi < s.length; hi++) {
          cnt.set(s[hi], (cnt.get(s[hi]) || 0) + 1);
          while (cnt.size > limit) {
            cnt.set(s[lo], cnt.get(s[lo]) - 1);
            if (cnt.get(s[lo]) === 0) cnt.delete(s[lo]);
            lo++;
          }
          total += hi - lo + 1;
        }
        return total;
      };
      return F.num(atMost(k) - atMost(k - 1));
    },
    gen: (r) => [r.word(r.int(1, 30), r.bool() ? TINY : SMALL), r.int(1, 4)],
  }),

  problem({
    title: 'Zigzag Conversion',
    difficulty: 'MEDIUM',
    topics: ['String', 'Simulation'],
    statement:
      'Write the characters of `s` in a zigzag pattern on `numRows` rows, then read them off row by row.\n\nFor `PAYPALISHIRING` with 3 rows the zigzag is:\n\n```\nP   A   H   N\nA P L S I I G\nY   I   R\n```\n\nwhich reads as `PAHNAPLSIIGYIR`.',
    params: [P.str('s', 'the string'), P.int('numRows', 'the number of rows')],
    outputFormat: 'A single line containing the zigzag-converted string.',
    constraints: ['1 <= |s| <= 1000', '1 <= numRows <= 1000', 's consists of uppercase English letters.'],
    samples: [['PAYPALISHIRING', 3], ['PAYPALISHIRING', 4], ['AB', 1]],
    solve: ([s, numRows]) => {
      if (numRows === 1) return s;
      const rows = Array.from({ length: numRows }, () => '');
      let row = 0, step = 1;
      for (const c of s) {
        rows[row] += c;
        if (row === 0) step = 1;
        else if (row === numRows - 1) step = -1;
        row += step;
      }
      return rows.join('');
    },
    gen: (r) => [r.word(r.int(1, 30), 'ABCDEFGHIJ'), r.int(1, 6)],
  }),

  problem({
    title: 'Repeated Substring Pattern',
    difficulty: 'EASY',
    topics: ['String', 'String Matching'],
    statement:
      'Given a string `s`, determine whether it can be built by taking one of its proper substrings and repeating it two or more times.',
    params: [P.str('s', 'the string')],
    outputFormat: 'Print `true` if s is built from a repeated substring, otherwise print `false`.',
    constraints: ['1 <= |s| <= 10^4', 's consists of lowercase English letters.'],
    samples: [['abab'], ['aba'], ['abcabcabcabc']],
    solve: ([s]) => F.bool((s + s).slice(1, -1).includes(s)),
    gen: (r, i) => {
      if (i % 2 === 0) { const u = r.word(r.int(1, 5), TINY); return [u.repeat(r.int(2, 4))]; }
      return [r.word(r.int(1, 14), TINY)];
    },
  }),

  problem({
    title: 'Decode Run Length String',
    difficulty: 'EASY',
    topics: ['String', 'Simulation'],
    statement:
      'You are given pairs of a character and a count. Rebuild the original string by repeating each character the given number of times, in order.',
    params: [P.strArray('chars', 'the characters, one per line', 'n'), P.intLine('counts', 'the repeat count for each character, in the same order')],
    outputFormat: 'A single line containing the decoded string.',
    constraints: ['1 <= n <= 100', '1 <= counts[i] <= 100', 'Each entry of chars is a single lowercase letter.'],
    samples: [[['a', 'b', 'c'], [3, 2, 1]], [['z'], [1]], [['x', 'y'], [4, 4]]],
    solve: ([chars, counts]) => chars.map((c, i) => c.repeat(counts[i])).join(''),
    gen: (r) => {
      const n = r.int(1, 8);
      return [Array.from({ length: n }, () => r.pick([...SMALL])), r.ints(n, 1, 6)];
    },
  }),

  problem({
    title: 'Shortest Palindrome by Prefix',
    difficulty: 'HARD',
    topics: ['String', 'String Matching', 'Rolling Hash'],
    statement:
      'Given a string `s`, you may add characters only in front of it. Return the shortest palindrome you can obtain this way.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single line containing the shortest palindrome.',
    constraints: ['1 <= |s| <= 5 * 10^4', 's consists of lowercase English letters.'],
    samples: [['aacecaaa'], ['abcd'], ['aba']],
    solve: ([s]) => {
      const rev = [...s].reverse().join('');
      const combined = s + '#' + rev;
      const fail = Array(combined.length).fill(0);
      for (let i = 1; i < combined.length; i++) {
        let j = fail[i - 1];
        while (j > 0 && combined[i] !== combined[j]) j = fail[j - 1];
        if (combined[i] === combined[j]) j++;
        fail[i] = j;
      }
      return rev.slice(0, s.length - fail[combined.length - 1]) + s;
    },
    gen: (r) => [r.word(r.int(1, 18), TINY)],
  }),

  problem({
    title: 'Longest Happy Prefix',
    difficulty: 'HARD',
    topics: ['String', 'String Matching'],
    statement:
      'A happy prefix of a string is a non-empty prefix that is also a suffix, but not the whole string. Return the length of the longest happy prefix of `s`.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single integer — the length of the longest happy prefix, or 0 if none exists.',
    constraints: ['1 <= |s| <= 10^5', 's consists of lowercase English letters.'],
    samples: [['level'], ['ababab'], ['abcd']],
    solve: ([s]) => {
      const fail = Array(s.length).fill(0);
      for (let i = 1; i < s.length; i++) {
        let j = fail[i - 1];
        while (j > 0 && s[i] !== s[j]) j = fail[j - 1];
        if (s[i] === s[j]) j++;
        fail[i] = j;
      }
      return F.num(fail[s.length - 1]);
    },
    gen: (r) => [r.word(r.int(1, 20), TINY)],
  }),

  problem({
    title: 'Reorganize String Possible',
    difficulty: 'MEDIUM',
    topics: ['String', 'Greedy', 'Heap', 'Counting'],
    statement:
      'Given a string `s`, decide whether its characters can be rearranged so that no two adjacent characters are the same.',
    params: [P.str('s', 'the string')],
    outputFormat: 'Print `true` if such an arrangement exists, otherwise print `false`.',
    constraints: ['1 <= |s| <= 500', 's consists of lowercase English letters.'],
    samples: [['aab'], ['aaab'], ['vvvlo']],
    explain: (_a, out) => (out === 'true' ? 'No character occurs more than ceil(n / 2) times, so an alternating arrangement exists.' : 'One character occurs too often to be separated.'),
    solve: ([s]) => {
      const cnt = new Map();
      for (const c of s) cnt.set(c, (cnt.get(c) || 0) + 1);
      return F.bool(Math.max(...cnt.values()) <= Math.ceil(s.length / 2));
    },
    gen: (r) => [r.word(r.int(1, 16), r.bool() ? TINY : SMALL)],
  }),

  problem({
    title: 'Custom Sort String Order',
    difficulty: 'MEDIUM',
    topics: ['String', 'Sorting', 'Hash Table'],
    statement:
      'You are given an `order` string listing distinct characters, and a string `s`. Sort the characters of `s` so that they follow the relative order given by `order`. Characters of `s` that do not appear in `order` go at the end, keeping their original relative order.',
    params: [P.str('order', 'the priority order of characters'), P.str('s', 'the string to sort')],
    outputFormat: 'A single line containing the sorted string.',
    constraints: ['1 <= |order| <= 26', 'order contains distinct lowercase letters.', '1 <= |s| <= 200', 's consists of lowercase English letters.'],
    samples: [['cba', 'abcd'], ['bcafg', 'abcd'], ['abc', 'zzz']],
    solve: ([order, s]) => {
      const rank = new Map([...order].map((c, i) => [c, i]));
      const known = [...s].filter((c) => rank.has(c)).sort((a, b) => rank.get(a) - rank.get(b));
      const rest = [...s].filter((c) => !rank.has(c));
      return [...known, ...rest].join('');
    },
    gen: (r) => [r.shuffle([...SMALL]).slice(0, r.int(1, 5)).join(''), r.word(r.int(1, 16), SMALL + 'fgh')],
  }),

  problem({
    title: 'Excel Column Title to Number',
    difficulty: 'EASY',
    topics: ['String', 'Math'],
    statement:
      'Spreadsheet columns are labelled `A`, `B`, ..., `Z`, `AA`, `AB`, and so on. Given a column title, return its 1-based column number.',
    params: [P.str('title', 'the column title in uppercase letters')],
    outputFormat: 'A single integer — the column number.',
    constraints: ['1 <= |title| <= 7', 'title consists of uppercase English letters and represents a valid column number.'],
    samples: [['A'], ['AB'], ['ZY']],
    solve: ([title]) => {
      let n = 0;
      for (const c of title) n = n * 26 + (c.charCodeAt(0) - 64);
      return F.num(n);
    },
    gen: (r) => [r.word(r.int(1, 5), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')],
  }),

  problem({
    title: 'Excel Column Number to Title',
    difficulty: 'EASY',
    topics: ['String', 'Math'],
    statement:
      'Given a 1-based spreadsheet column number, return the corresponding column title (`1` -> `A`, `27` -> `AA`).',
    params: [P.int('n', 'the column number')],
    outputFormat: 'A single line containing the column title in uppercase letters.',
    constraints: ['1 <= n <= 2 * 10^9'],
    samples: [[1], [28], [701]],
    solve: ([n]) => {
      let x = n, s = '';
      while (x > 0) { x--; s = String.fromCharCode(65 + (x % 26)) + s; x = Math.floor(x / 26); }
      return s;
    },
    gen: (r) => [r.int(1, 200000)],
  }),

  problem({
    title: 'Count Say Sequence Term',
    difficulty: 'MEDIUM',
    topics: ['String', 'Simulation'],
    statement:
      'The count-and-say sequence starts with `1`. Each subsequent term describes the previous one by reading off runs of digits: `1` becomes `11` (one 1), which becomes `21` (two 1s), which becomes `1211`.\n\nReturn the n-th term.',
    params: [P.int('n', 'the 1-based term index')],
    outputFormat: 'A single line containing the n-th term of the sequence.',
    constraints: ['1 <= n <= 25'],
    samples: [[1], [4], [6]],
    solve: ([n]) => {
      let s = '1';
      for (let k = 1; k < n; k++) {
        let out = '', i = 0;
        while (i < s.length) {
          let j = i;
          while (j < s.length && s[j] === s[i]) j++;
          out += (j - i) + s[i];
          i = j;
        }
        s = out;
      }
      return s;
    },
    gen: (r) => [r.int(1, 22)],
  }),

  problem({
    title: 'Check One Edit Distance',
    difficulty: 'MEDIUM',
    topics: ['String', 'Two Pointers'],
    statement:
      'Given two strings `a` and `b`, determine whether they are exactly one edit apart — one insertion, one deletion, or one substitution. Identical strings are zero edits apart and do not count.',
    params: [P.str('a', 'the first string'), P.str('b', 'the second string')],
    outputFormat: 'Print `true` if the strings are exactly one edit apart, otherwise print `false`.',
    constraints: ['1 <= |a|, |b| <= 10^4', 'Both strings consist of lowercase English letters.'],
    samples: [['ab', 'acb'], ['cab', 'ad'], ['abc', 'abc']],
    solve: ([a, b]) => {
      if (Math.abs(a.length - b.length) > 1) return F.bool(false);
      const [s, t] = a.length <= b.length ? [a, b] : [b, a];
      let i = 0, j = 0, edits = 0;
      while (i < s.length && j < t.length) {
        if (s[i] === t[j]) { i++; j++; continue; }
        if (++edits > 1) return F.bool(false);
        if (s.length === t.length) i++;
        j++;
      }
      edits += t.length - j;
      return F.bool(edits === 1);
    },
    gen: (r) => [r.word(r.int(1, 10), TINY), r.word(r.int(1, 10), TINY)],
  }),

  problem({
    title: 'Longest Word in Dictionary',
    difficulty: 'MEDIUM',
    topics: ['String', 'Trie', 'Sorting'],
    statement:
      'Given a list of words, find the longest word that can be built one character at a time by other words in the list — every prefix of the answer must also be present.\n\nIf several words tie in length, return the lexicographically smallest.',
    params: [P.strArray('words', 'the dictionary words', 'n')],
    outputFormat: 'The longest buildable word, or `NONE` if no word qualifies.',
    constraints: ['1 <= n <= 1000', '1 <= |words[i]| <= 30', 'All words consist of lowercase English letters.'],
    samples: [[['w', 'wo', 'wor', 'worl', 'world']], [['a', 'banana', 'app', 'appl', 'ap', 'apply', 'apple']], [['zz']]],
    solve: ([words]) => {
      const set = new Set(words);
      let best = '';
      for (const w of [...words].sort()) {
        let ok = true;
        for (let k = 1; k < w.length; k++) if (!set.has(w.slice(0, k))) { ok = false; break; }
        if (ok && (w.length > best.length || (w.length === best.length && w < best))) best = w;
      }
      return best || 'NONE';
    },
    gen: (r) => {
      const base = r.word(r.int(1, 6), SMALL);
      const words = [];
      for (let k = 1; k <= base.length; k++) if (r.bool(0.85)) words.push(base.slice(0, k));
      for (let k = 0; k < r.int(0, 4); k++) words.push(r.word(r.int(1, 5), SMALL));
      return words.length ? [[...new Set(words)]] : null;
    },
  }),

  problem({
    title: 'Basic Calculator with Plus and Minus',
    difficulty: 'MEDIUM',
    topics: ['String', 'Stack', 'Math'],
    statement:
      'You are given a list of integers and the operators between them, each `+` or `-`. Evaluate the expression left to right.',
    params: [P.intArray('nums', 'the operands', 'n'), P.str('ops', 'the n-1 operators as one string of + and - characters')],
    outputFormat: 'A single integer — the value of the expression.',
    constraints: ['2 <= n <= 10^4', '-10^6 <= nums[i] <= 10^6', 'ops has exactly n-1 characters, each + or -.'],
    samples: [[[1, 2, 3], '+-'], [[10, 4], '-'], [[5, 5, 5, 5], '+++']],
    solve: ([nums, ops]) => {
      let total = nums[0];
      for (let i = 1; i < nums.length; i++) total += ops[i - 1] === '+' ? nums[i] : -nums[i];
      return F.num(total);
    },
    gen: (r) => {
      const n = r.int(2, 12);
      return [r.ints(n, -100, 100), Array.from({ length: n - 1 }, () => r.pick(['+', '-'])).join('')];
    },
  }),

  problem({
    title: 'Maximum Number of Balloons',
    difficulty: 'EASY',
    topics: ['String', 'Hash Table', 'Counting'],
    statement:
      'Given a string `s`, count how many times you can spell the word `balloon` using its characters. Each character of `s` may be used at most once.',
    params: [P.str('s', 'the available characters')],
    outputFormat: 'A single integer — the maximum number of copies of "balloon" that can be spelled.',
    constraints: ['1 <= |s| <= 10^4', 's consists of lowercase English letters.'],
    samples: [['nlaebolko'], ['loonbalxballpoon'], ['leetcode']],
    solve: ([s]) => {
      const c = (ch) => [...s].filter((x) => x === ch).length;
      return F.num(Math.min(c('b'), c('a'), Math.floor(c('l') / 2), Math.floor(c('o') / 2), c('n')));
    },
    gen: (r) => [r.word(r.int(1, 30), 'balloxn')],
  }),

  problem({
    title: 'Sort Characters By Frequency',
    difficulty: 'MEDIUM',
    topics: ['String', 'Hash Table', 'Sorting', 'Heap'],
    statement:
      'Given a string `s`, sort its characters in decreasing order of frequency. Characters with equal frequency must appear in increasing alphabetical order.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single line containing the reordered string.',
    constraints: ['1 <= |s| <= 5 * 10^5', 's consists of lowercase English letters.'],
    samples: [['tree'], ['cccaaa'], ['abbccc']],
    notes: 'The tie-break on equal frequency makes the answer unique.',
    solve: ([s]) => {
      const cnt = new Map();
      for (const c of s) cnt.set(c, (cnt.get(c) || 0) + 1);
      return [...cnt.entries()]
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
        .map(([c, n]) => c.repeat(n))
        .join('');
    },
    gen: (r) => [r.word(r.int(1, 30), SMALL)],
  }),

  problem({
    title: 'Backspace String Compare',
    difficulty: 'EASY',
    topics: ['String', 'Stack', 'Two Pointers'],
    statement:
      'Two strings may contain the character `#`, which means "backspace" and deletes the character before it. Determine whether the two strings are equal once all backspaces are applied.',
    params: [P.str('s', 'the first string'), P.str('t', 'the second string')],
    outputFormat: 'Print `true` if the typed results are equal, otherwise print `false`.',
    constraints: ['1 <= |s|, |t| <= 200', 'Both strings consist of lowercase English letters and the character #.'],
    samples: [['ab#c', 'ad#c'], ['a##c', '#a#c'], ['a#c', 'b']],
    notes: 'A backspace on an empty result does nothing.',
    solve: ([s, t]) => {
      const type = (x) => { const st = []; for (const c of x) c === '#' ? st.pop() : st.push(c); return st.join(''); };
      return F.bool(type(s) === type(t));
    },
    gen: (r) => [r.word(r.int(1, 12), 'abc##'), r.word(r.int(1, 12), 'abc##')],
  }),
];
