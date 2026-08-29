import { P } from '../lib/params.js';
import { problem, F } from '../lib/define.js';

export default [
  problem({
    title: 'Two Sum Indices',
    difficulty: 'EASY',
    topics: ['Array', 'Hash Table'],
    statement:
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nEach input has exactly one solution, and the same element may not be used twice. Return the indices in increasing order.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('target', 'the target sum')],
    outputFormat: 'Two space-separated integers — the 0-based indices of the two numbers, smaller index first.',
    constraints: ['2 <= n <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Exactly one valid answer exists.'],
    samples: [[[2, 7, 11, 15], 9], [[3, 2, 4], 6], [[-1, -2, -3, -4, -5], -8]],
    explain: ([, target]) => `The two reported positions hold values summing to ${target}.`,
    solve: ([nums, target]) => {
      const seen = new Map();
      for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen.has(need)) return F.arr([seen.get(need), i]);
        if (!seen.has(nums[i])) seen.set(nums[i], i);
      }
      return '-1 -1';
    },
    gen: (r) => {
      const n = r.int(2, 60);
      const nums = r.ints(n, -500, 500);
      const i = r.int(0, n - 1);
      let j = r.int(0, n - 1);
      while (j === i) j = r.int(0, n - 1);
      const target = nums[i] + nums[j];
      // Only keep the case when the answer is unique, as the statement promises.
      let pairs = 0;
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (nums[a] + nums[b] === target) pairs++;
      return pairs === 1 ? [nums, target] : null;
    },
  }),

  problem({
    title: 'Maximum Subarray Sum',
    difficulty: 'EASY',
    topics: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    statement:
      "Given an integer array `nums`, find the contiguous subarray containing at least one number which has the largest sum, and return that sum.\n\nThis is the classic Kadane's algorithm problem.",
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the largest sum of any contiguous subarray.',
    constraints: ['1 <= n <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    samples: [[[-2, 1, -3, 4, -1, 2, 1, -5, 4]], [[1]], [[5, 4, -1, 7, 8]]],
    explain: (_a, out) => `The best contiguous block sums to ${out}.`,
    solve: ([nums]) => {
      let best = nums[0], cur = nums[0];
      for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); best = Math.max(best, cur); }
      return F.num(best);
    },
    gen: (r, i) => {
      if (i === 0) return [r.ints(r.int(3, 12), -20, -1)]; // every element negative
      return [r.ints(r.int(1, 80), -50, 50)];
    },
  }),

  problem({
    title: 'Move Zeroes to the End',
    difficulty: 'EASY',
    topics: ['Array', 'Two Pointers'],
    statement:
      'Given an integer array `nums`, move all `0`s to the end of it while maintaining the relative order of the non-zero elements.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single line of n space-separated integers — the array after moving all zeroes to the end.',
    constraints: ['1 <= n <= 10^4', '-2^31 <= nums[i] <= 2^31 - 1'],
    samples: [[[0, 1, 0, 3, 12]], [[0]], [[4, 0, 0, 5, 0, 9]]],
    solve: ([nums]) => {
      const nz = nums.filter((x) => x !== 0);
      return F.arr([...nz, ...Array(nums.length - nz.length).fill(0)]);
    },
    gen: (r, i) => {
      if (i === 0) return [Array(r.int(2, 8)).fill(0)];
      return [Array.from({ length: r.int(1, 40) }, () => (r.bool(0.4) ? 0 : r.int(-100, 100)))];
    },
  }),

  problem({
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'EASY',
    topics: ['Array', 'Dynamic Programming'],
    statement:
      'You are given an array `prices` where `prices[i]` is the price of a given stock on the i-th day.\n\nChoose a single day to buy one stock and a different, later day to sell it. Return the maximum profit you can achieve. If no profit is possible, return `0`.',
    params: [P.intArray('prices', 'the daily prices', 'n')],
    outputFormat: 'A single integer — the maximum achievable profit, or 0 if no profitable trade exists.',
    constraints: ['1 <= n <= 10^5', '0 <= prices[i] <= 10^4'],
    samples: [[[7, 1, 5, 3, 6, 4]], [[7, 6, 4, 3, 1]], [[2, 4, 1]]],
    explain: (_a, out) => (out === '0' ? 'Prices never rise after a cheaper day, so no transaction is made.' : `Buying at the running minimum and selling later yields ${out}.`),
    solve: ([prices]) => {
      let lo = Infinity, best = 0;
      for (const p of prices) { lo = Math.min(lo, p); best = Math.max(best, p - lo); }
      return F.num(best);
    },
    gen: (r, i) => {
      if (i === 0) { const n = r.int(3, 15); return [Array.from({ length: n }, (_, k) => 100 - k * 3)]; }
      return [r.ints(r.int(1, 60), 0, 300)];
    },
  }),

  problem({
    title: 'Contains Duplicate Within K',
    difficulty: 'EASY',
    topics: ['Array', 'Hash Table', 'Sliding Window'],
    statement:
      'Given an integer array `nums` and an integer `k`, determine whether there are two distinct indices `i` and `j` such that `nums[i] == nums[j]` and `abs(i - j) <= k`.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the maximum allowed index distance')],
    outputFormat: 'Print `true` if such a pair exists, otherwise print `false`.',
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9', '0 <= k <= 10^5'],
    samples: [[[1, 2, 3, 1], 3], [[1, 0, 1, 1], 1], [[1, 2, 3, 1, 2, 3], 2]],
    solve: ([nums, k]) => {
      const last = new Map();
      for (let i = 0; i < nums.length; i++) {
        if (last.has(nums[i]) && i - last.get(nums[i]) <= k) return F.bool(true);
        last.set(nums[i], i);
      }
      return F.bool(false);
    },
    gen: (r) => [r.ints(r.int(1, 40), 0, r.int(2, 15)), r.int(0, 6)],
  }),

  problem({
    title: 'Product of Array Except Self',
    difficulty: 'MEDIUM',
    topics: ['Array', 'Prefix Sum'],
    statement:
      'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nYou must solve it without using the division operation and in O(n) time.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single line of n space-separated integers — the products.',
    constraints: ['2 <= n <= 10^5', '-30 <= nums[i] <= 30', 'The product of any prefix or suffix fits in a 32-bit integer.'],
    samples: [[[1, 2, 3, 4]], [[-1, 1, 0, -3, 3]], [[2, 3]]],
    solve: ([nums]) => {
      const n = nums.length, out = Array(n).fill(1);
      let pre = 1;
      for (let i = 0; i < n; i++) { out[i] = pre; pre *= nums[i]; }
      let suf = 1;
      for (let i = n - 1; i >= 0; i--) { out[i] *= suf; suf *= nums[i]; }
      return F.arr(out);
    },
    gen: (r, i) => {
      const n = r.int(2, 14);
      if (i === 0) return [Array.from({ length: n }, (_, k) => (k === n - 1 ? 0 : r.int(-5, 5)))];
      return [r.ints(n, -6, 6)];
    },
  }),

  problem({
    title: 'Rotate Array by K Steps',
    difficulty: 'MEDIUM',
    topics: ['Array', 'Two Pointers', 'Math'],
    statement:
      'Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative.\n\nFor example, rotating `[1,2,3,4,5]` by 2 gives `[4,5,1,2,3]`.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the number of steps to rotate right')],
    outputFormat: 'A single line of n space-separated integers — the rotated array.',
    constraints: ['1 <= n <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1', '0 <= k <= 10^5'],
    samples: [[[1, 2, 3, 4, 5, 6, 7], 3], [[-1, -100, 3, 99], 2], [[1, 2], 5]],
    explain: ([nums, k]) => `Each element shifts ${k} place(s) right and wraps around; k mod n = ${k % nums.length}.`,
    solve: ([nums, k]) => {
      const n = nums.length, s = ((k % n) + n) % n;
      return F.arr([...nums.slice(n - s), ...nums.slice(0, n - s)]);
    },
    gen: (r) => { const n = r.int(1, 30); return [r.ints(n, -100, 100), r.int(0, 3 * n + 5)]; },
  }),

  problem({
    title: 'Merge Two Sorted Arrays',
    difficulty: 'EASY',
    topics: ['Array', 'Two Pointers', 'Sorting'],
    statement:
      'You are given two integer arrays `a` and `b`, both sorted in non-decreasing order. Merge them into a single array sorted in non-decreasing order.',
    params: [P.intArray('a', 'the first sorted array', 'n'), P.intArray('b', 'the second sorted array', 'm')],
    outputFormat: 'A single line of n + m space-separated integers — the merged sorted array.',
    constraints: ['1 <= n, m <= 10^5', '-10^9 <= a[i], b[i] <= 10^9', 'Both arrays are given in non-decreasing order.'],
    samples: [[[1, 2, 3], [2, 5, 6]], [[1], [1]], [[-5, 0, 7], [-9, -1, 2, 8]]],
    solve: ([a, b]) => {
      const out = []; let i = 0, j = 0;
      while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
      while (i < a.length) out.push(a[i++]);
      while (j < b.length) out.push(b[j++]);
      return F.arr(out);
    },
    gen: (r) => [r.ints(r.int(1, 25), -50, 50).sort((x, y) => x - y), r.ints(r.int(1, 25), -50, 50).sort((x, y) => x - y)],
  }),

  problem({
    title: 'Majority Element',
    difficulty: 'EASY',
    topics: ['Array', 'Hash Table', 'Divide and Conquer'],
    statement:
      'Given an array `nums` of size `n`, return the majority element — the element that appears **more than** `n / 2` times.\n\nYou may assume the majority element always exists in the array.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the majority element.',
    constraints: ['1 <= n <= 5 * 10^4', '-10^9 <= nums[i] <= 10^9', 'A majority element is guaranteed to exist.'],
    samples: [[[3, 2, 3]], [[2, 2, 1, 1, 1, 2, 2]], [[7]]],
    solve: ([nums]) => {
      let cand = nums[0], cnt = 0;
      for (const x of nums) { if (cnt === 0) cand = x; cnt += x === cand ? 1 : -1; }
      return F.num(cand);
    },
    gen: (r) => {
      const n = r.int(1, 41);
      const maj = r.int(-20, 20);
      const need = Math.floor(n / 2) + 1;
      const rest = Array.from({ length: n - need }, () => { let v = r.int(-20, 20); while (v === maj) v = r.int(-20, 20); return v; });
      return [r.shuffle([...Array(need).fill(maj), ...rest])];
    },
  }),

  problem({
    title: 'Missing Number in Range',
    difficulty: 'EASY',
    topics: ['Array', 'Math', 'Bit Manipulation'],
    statement:
      'Given an array `nums` containing `n` distinct numbers taken from the range `[0, n]`, return the one number in that range which is missing from the array.',
    params: [P.intArray('nums', 'the n distinct numbers', 'n')],
    outputFormat: 'A single integer — the missing number.',
    constraints: ['1 <= n <= 10^4', '0 <= nums[i] <= n', 'All values in nums are distinct.'],
    samples: [[[3, 0, 1]], [[0, 1]], [[9, 6, 4, 2, 3, 5, 7, 0, 1]]],
    explain: ([nums], out) => `The range is [0, ${nums.length}] and ${out} is the only value absent from the array.`,
    solve: ([nums]) => {
      const n = nums.length;
      return F.num((n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0));
    },
    gen: (r) => {
      const n = r.int(1, 40);
      const missing = r.int(0, n);
      const all = [];
      for (let i = 0; i <= n; i++) if (i !== missing) all.push(i);
      return [r.shuffle(all)];
    },
  }),

  problem({
    title: 'Longest Consecutive Sequence',
    difficulty: 'MEDIUM',
    topics: ['Array', 'Hash Table', 'Union Find'],
    statement:
      'Given an unsorted array of integers `nums`, return the length of the longest sequence of consecutive integers that can be formed from its elements.\n\nThe elements do not need to be adjacent in the array. Your algorithm should run in O(n) time.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the length of the longest consecutive run.',
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    samples: [[[100, 4, 200, 1, 3, 2]], [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], [[5]]],
    explain: (_a, out) => `The longest run of consecutive integers has length ${out}.`,
    solve: ([nums]) => {
      const s = new Set(nums); let best = 0;
      for (const x of s) {
        if (s.has(x - 1)) continue;
        let len = 1;
        while (s.has(x + len)) len++;
        best = Math.max(best, len);
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 50), -25, 25)],
  }),

  problem({
    title: 'Maximum Product Subarray',
    difficulty: 'MEDIUM',
    topics: ['Array', 'Dynamic Programming'],
    statement:
      'Given an integer array `nums`, find a contiguous non-empty subarray that has the largest product, and return that product.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the largest product of any contiguous subarray.',
    constraints: ['1 <= n <= 2 * 10^4', '-10 <= nums[i] <= 10', 'The answer fits in a 32-bit signed integer.'],
    samples: [[[2, 3, -2, 4]], [[-2, 0, -1]], [[-2, 3, -4]]],
    solve: ([nums]) => {
      let best = nums[0], hi = nums[0], lo = nums[0];
      for (let i = 1; i < nums.length; i++) {
        const x = nums[i];
        const cands = [x, hi * x, lo * x];
        hi = Math.max(...cands); lo = Math.min(...cands);
        best = Math.max(best, hi);
      }
      return F.num(best);
    },
    gen: (r, i) => {
      if (i === 0) return [r.ints(r.int(2, 8), -4, -1)];
      return [r.ints(r.int(1, 16), -6, 6)];
    },
  }),
];
