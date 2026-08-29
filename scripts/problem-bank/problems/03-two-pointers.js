import { P } from '../lib/params.js';
import { problem, F } from '../lib/define.js';

const sortAsc = (a) => a.slice().sort((x, y) => x - y);

export default [
  problem({
    title: 'Two Sum in Sorted Array',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Array', 'Binary Search'],
    statement:
      'Given a **sorted** array `nums` and a target value, find two elements that add up to the target and return their 1-based positions.',
    params: [P.intArray('nums', 'the sorted array', 'n'), P.int('target', 'the target sum')],
    outputFormat: 'Two space-separated integers — the 1-based indices of the two numbers, smaller index first, or `-1 -1` if no pair exists.',
    constraints: ['2 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9', 'nums is sorted in non-decreasing order.'],
    samples: [[[2, 7, 11, 15], 9], [[2, 3, 4], 6], [[1, 2, 3], 100]],
    solve: ([nums, target]) => {
      let i = 0, j = nums.length - 1;
      while (i < j) {
        const s = nums[i] + nums[j];
        if (s === target) return F.arr([i + 1, j + 1]);
        s < target ? i++ : j--;
      }
      return '-1 -1';
    },
    gen: (r) => {
      const nums = sortAsc(r.ints(r.int(2, 40), -100, 100));
      return [nums, r.int(-200, 200)];
    },
  }),

  problem({
    title: 'Container With Most Water Area',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Array', 'Greedy'],
    statement:
      'You are given `n` vertical lines where the i-th line runs from `(i, 0)` to `(i, height[i])`. Pick two lines that, together with the x-axis, hold the most water.\n\nReturn that maximum amount of water.',
    params: [P.intArray('height', 'the heights of the lines', 'n')],
    outputFormat: 'A single integer — the maximum area of water that can be contained.',
    constraints: ['2 <= n <= 10^5', '0 <= height[i] <= 10^4'],
    samples: [[[1, 8, 6, 2, 5, 4, 8, 3, 7]], [[1, 1]], [[4, 3, 2, 1, 4]]],
    explain: (_a, out) => `The best pair of lines encloses an area of ${out}.`,
    solve: ([h]) => {
      let i = 0, j = h.length - 1, best = 0;
      while (i < j) {
        best = Math.max(best, (j - i) * Math.min(h[i], h[j]));
        h[i] < h[j] ? i++ : j--;
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(2, 40), 0, 100)],
  }),

  problem({
    title: 'Trapping Rain Water Volume',
    difficulty: 'HARD',
    topics: ['Two Pointers', 'Array', 'Dynamic Programming', 'Stack'],
    statement:
      'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much rain water can be trapped after it rains.',
    params: [P.intArray('height', 'the bar heights', 'n')],
    outputFormat: 'A single integer — the total units of trapped water.',
    constraints: ['1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    samples: [[[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], [[4, 2, 0, 3, 2, 5]], [[1, 2, 3]]],
    explain: (_a, out) => `${out} unit(s) of water rest between the bars.`,
    solve: ([h]) => {
      let i = 0, j = h.length - 1, lo = 0, hi = 0, total = 0;
      while (i < j) {
        if (h[i] < h[j]) { lo = Math.max(lo, h[i]); total += lo - h[i]; i++; }
        else { hi = Math.max(hi, h[j]); total += hi - h[j]; j--; }
      }
      return F.num(total);
    },
    gen: (r) => [r.ints(r.int(1, 40), 0, 12)],
  }),

  problem({
    title: 'Three Sum Triplet Count',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Array', 'Sorting'],
    statement:
      'Given an array `nums`, count the number of **distinct** triplets of values `(a, b, c)` taken from it with `a + b + c = 0`. Two triplets are the same if they contain the same multiset of values.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the number of distinct zero-sum triplets.',
    constraints: ['1 <= n <= 3000', '-10^5 <= nums[i] <= 10^5'],
    samples: [[[-1, 0, 1, 2, -1, -4]], [[0, 1, 1]], [[0, 0, 0, 0]]],
    solve: ([nums]) => {
      const a = sortAsc(nums), n = a.length, found = new Set();
      for (let i = 0; i < n - 2; i++) {
        let l = i + 1, r2 = n - 1;
        while (l < r2) {
          const s = a[i] + a[l] + a[r2];
          if (s === 0) { found.add(`${a[i]},${a[l]},${a[r2]}`); l++; r2--; }
          else if (s < 0) l++;
          else r2--;
        }
      }
      return F.num(found.size);
    },
    gen: (r) => [r.ints(r.int(1, 30), -8, 8)],
  }),

  problem({
    title: 'Three Sum Closest',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Array', 'Sorting'],
    statement:
      'Given an array `nums` of at least three integers and a `target`, find three elements whose sum is closest to the target and return that sum.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('target', 'the target value')],
    outputFormat: 'A single integer — the sum of the three chosen elements.',
    constraints: ['3 <= n <= 500', '-1000 <= nums[i] <= 1000', '-10^4 <= target <= 10^4', 'Exactly one answer sum exists.'],
    samples: [[[-1, 2, 1, -4], 1], [[0, 0, 0], 1], [[4, 0, 5, -5, 3, 3, 0, -4, -5], -2]],
    solve: ([nums, target]) => {
      const a = sortAsc(nums), n = a.length;
      let best = a[0] + a[1] + a[2];
      for (let i = 0; i < n - 2; i++) {
        let l = i + 1, r2 = n - 1;
        while (l < r2) {
          const s = a[i] + a[l] + a[r2];
          if (Math.abs(s - target) < Math.abs(best - target)) best = s;
          if (s === target) return F.num(s);
          s < target ? l++ : r2--;
        }
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(3, 25), -50, 50), r.int(-40, 40)],
  }),

  problem({
    title: 'Remove Duplicates From Sorted Array Length',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Array'],
    statement:
      'Given a sorted array `nums`, remove the duplicates in place so each unique element appears once. Return the number of unique elements followed by those elements.',
    params: [P.intArray('nums', 'the sorted array', 'n')],
    outputFormat: 'The count of unique elements on the first line, then those elements in sorted order on the second line.',
    constraints: ['1 <= n <= 3 * 10^4', '-100 <= nums[i] <= 100', 'nums is sorted in non-decreasing order.'],
    samples: [[[1, 1, 2]], [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], [[5]]],
    solve: ([nums]) => F.counted([...new Set(nums)]),
    gen: (r) => [sortAsc(r.ints(r.int(1, 30), -10, 10))],
  }),

  problem({
    title: 'Squares of a Sorted Array',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Array', 'Sorting'],
    statement:
      'Given an array `nums` sorted in non-decreasing order, return an array of the squares of each number, also sorted in non-decreasing order.',
    params: [P.intArray('nums', 'the sorted array', 'n')],
    outputFormat: 'A single line of n space-separated integers — the sorted squares.',
    constraints: ['1 <= n <= 10^4', '-10^4 <= nums[i] <= 10^4', 'nums is sorted in non-decreasing order.'],
    samples: [[[-4, -1, 0, 3, 10]], [[-7, -3, 2, 3, 11]], [[1, 2, 3]]],
    solve: ([nums]) => F.arr(sortAsc(nums.map((x) => x * x))),
    gen: (r) => [sortAsc(r.ints(r.int(1, 30), -50, 50))],
  }),

  problem({
    title: 'Minimum Size Subarray Sum',
    difficulty: 'MEDIUM',
    topics: ['Sliding Window', 'Two Pointers', 'Array'],
    statement:
      'Given an array of **positive** integers `nums` and a positive integer `target`, find the length of the shortest contiguous subarray whose sum is greater than or equal to `target`.',
    params: [P.intArray('nums', 'the positive array elements', 'n'), P.int('target', 'the required sum')],
    outputFormat: 'A single integer — the minimal subarray length, or 0 if no such subarray exists.',
    constraints: ['1 <= n <= 10^5', '1 <= nums[i] <= 10^4', '1 <= target <= 10^9'],
    samples: [[[2, 3, 1, 2, 4, 3], 7], [[1, 4, 4], 4], [[1, 1, 1, 1], 11]],
    solve: ([nums, target]) => {
      let lo = 0, sum = 0, best = Infinity;
      for (let hi = 0; hi < nums.length; hi++) {
        sum += nums[hi];
        while (sum >= target) { best = Math.min(best, hi - lo + 1); sum -= nums[lo++]; }
      }
      return F.num(best === Infinity ? 0 : best);
    },
    gen: (r) => [r.ints(r.int(1, 40), 1, 20), r.int(1, 120)],
  }),

  problem({
    title: 'Maximum Average Subarray',
    difficulty: 'EASY',
    topics: ['Sliding Window', 'Array'],
    statement:
      'Given an array `nums` and an integer `k`, find the contiguous subarray of length exactly `k` with the maximum sum, and report that sum.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the window length')],
    outputFormat: 'A single integer — the maximum sum over all windows of length k.',
    constraints: ['1 <= k <= n <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    samples: [[[1, 12, -5, -6, 50, 3], 4], [[5], 1], [[-1, -2, -3], 2]],
    solve: ([nums, k]) => {
      let sum = 0;
      for (let i = 0; i < k; i++) sum += nums[i];
      let best = sum;
      for (let i = k; i < nums.length; i++) { sum += nums[i] - nums[i - k]; best = Math.max(best, sum); }
      return F.num(best);
    },
    gen: (r) => { const n = r.int(1, 40); return [r.ints(n, -50, 50), r.int(1, n)]; },
  }),

  problem({
    title: 'Sliding Window Maximums',
    difficulty: 'HARD',
    topics: ['Sliding Window', 'Deque', 'Heap'],
    statement:
      'Given an array `nums` and a window size `k`, output the maximum of every contiguous window of length `k` as the window slides from left to right.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the window size')],
    outputFormat: 'A single line of n - k + 1 space-separated integers — the maximum of each window, left to right.',
    constraints: ['1 <= k <= n <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    samples: [[[1, 3, -1, -3, 5, 3, 6, 7], 3], [[1], 1], [[9, 8, 7, 6], 2]],
    solve: ([nums, k]) => {
      const dq = [], out = [];
      for (let i = 0; i < nums.length; i++) {
        while (dq.length && dq[0] <= i - k) dq.shift();
        while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop();
        dq.push(i);
        if (i >= k - 1) out.push(nums[dq[0]]);
      }
      return F.arr(out);
    },
    gen: (r) => { const n = r.int(1, 40); return [r.ints(n, -30, 30), r.int(1, n)]; },
  }),

  problem({
    title: 'Fruit Into Baskets',
    difficulty: 'MEDIUM',
    topics: ['Sliding Window', 'Hash Table', 'Array'],
    statement:
      'You walk along a row of trees, each producing one type of fruit given by `fruits[i]`. You carry two baskets and each basket holds only a single type of fruit.\n\nStarting at any tree and moving right, you must pick one fruit from every tree until you cannot. Return the maximum number of fruits you can pick — that is, the longest contiguous stretch containing at most two distinct types.',
    params: [P.intArray('fruits', 'the fruit type of each tree', 'n')],
    outputFormat: 'A single integer — the maximum number of fruits that can be picked.',
    constraints: ['1 <= n <= 10^5', '0 <= fruits[i] <= 10^9'],
    samples: [[[1, 2, 1]], [[0, 1, 2, 2]], [[1, 2, 3, 2, 2]]],
    solve: ([f]) => {
      const cnt = new Map();
      let lo = 0, best = 0;
      for (let hi = 0; hi < f.length; hi++) {
        cnt.set(f[hi], (cnt.get(f[hi]) || 0) + 1);
        while (cnt.size > 2) {
          cnt.set(f[lo], cnt.get(f[lo]) - 1);
          if (cnt.get(f[lo]) === 0) cnt.delete(f[lo]);
          lo++;
        }
        best = Math.max(best, hi - lo + 1);
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 40), 0, 4)],
  }),

  problem({
    title: 'Max Consecutive Ones After Flips',
    difficulty: 'MEDIUM',
    topics: ['Sliding Window', 'Array', 'Two Pointers'],
    statement:
      'Given a binary array `nums` and an integer `k`, return the length of the longest contiguous run of `1`s obtainable by flipping at most `k` zeroes to ones.',
    params: [P.intArray('nums', 'the binary array', 'n'), P.int('k', 'the number of zeroes you may flip')],
    outputFormat: 'A single integer — the length of the longest achievable run of ones.',
    constraints: ['1 <= n <= 10^5', 'nums[i] is 0 or 1.', '0 <= k <= n'],
    samples: [[[1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2], [[0, 0, 0], 0], [[1, 1, 1], 1]],
    solve: ([nums, k]) => {
      let lo = 0, zeros = 0, best = 0;
      for (let hi = 0; hi < nums.length; hi++) {
        if (nums[hi] === 0) zeros++;
        while (zeros > k) { if (nums[lo] === 0) zeros--; lo++; }
        best = Math.max(best, hi - lo + 1);
      }
      return F.num(best);
    },
    gen: (r) => { const n = r.int(1, 40); return [r.ints(n, 0, 1), r.int(0, Math.min(5, n))]; },
  }),

  problem({
    title: 'Longest Subarray With Equal Zeros and Ones',
    difficulty: 'MEDIUM',
    topics: ['Prefix Sum', 'Hash Table', 'Array'],
    statement:
      'Given a binary array `nums`, find the length of the longest contiguous subarray containing an equal number of `0`s and `1`s.',
    params: [P.intArray('nums', 'the binary array', 'n')],
    outputFormat: 'A single integer — the length of the longest balanced subarray, or 0 if none exists.',
    constraints: ['1 <= n <= 10^5', 'nums[i] is 0 or 1.'],
    samples: [[[0, 1]], [[0, 1, 0]], [[1, 1, 1]]],
    solve: ([nums]) => {
      const first = new Map([[0, -1]]);
      let bal = 0, best = 0;
      for (let i = 0; i < nums.length; i++) {
        bal += nums[i] === 1 ? 1 : -1;
        if (first.has(bal)) best = Math.max(best, i - first.get(bal));
        else first.set(bal, i);
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 40), 0, 1)],
  }),

  problem({
    title: 'Subarray Sum Equals K',
    difficulty: 'MEDIUM',
    topics: ['Prefix Sum', 'Hash Table', 'Array'],
    statement:
      'Given an array `nums` and an integer `k`, count how many contiguous subarrays sum to exactly `k`.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the target sum')],
    outputFormat: 'A single integer — the number of subarrays summing to k.',
    constraints: ['1 <= n <= 2 * 10^4', '-1000 <= nums[i] <= 1000', '-10^7 <= k <= 10^7'],
    samples: [[[1, 1, 1], 2], [[1, 2, 3], 3], [[-1, -1, 1], 0]],
    solve: ([nums, k]) => {
      const seen = new Map([[0, 1]]);
      let sum = 0, total = 0;
      for (const x of nums) {
        sum += x;
        total += seen.get(sum - k) || 0;
        seen.set(sum, (seen.get(sum) || 0) + 1);
      }
      return F.num(total);
    },
    gen: (r) => [r.ints(r.int(1, 30), -6, 6), r.int(-10, 10)],
  }),

  problem({
    title: 'Count Nice Subarrays With K Odds',
    difficulty: 'MEDIUM',
    topics: ['Sliding Window', 'Prefix Sum', 'Array'],
    statement:
      'A subarray is *nice* if it contains exactly `k` odd numbers. Given an array `nums` and an integer `k`, count the nice subarrays.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the required number of odd values')],
    outputFormat: 'A single integer — the number of nice subarrays.',
    constraints: ['1 <= n <= 5 * 10^4', '1 <= nums[i] <= 10^5', '1 <= k <= n'],
    samples: [[[1, 1, 2, 1, 1], 3], [[2, 4, 6], 1], [[2, 2, 2, 1, 2, 2, 1, 2, 2, 2], 2]],
    solve: ([nums, k]) => {
      const cnt = new Map([[0, 1]]);
      let odds = 0, total = 0;
      for (const x of nums) {
        odds += x % 2;
        total += cnt.get(odds - k) || 0;
        cnt.set(odds, (cnt.get(odds) || 0) + 1);
      }
      return F.num(total);
    },
    gen: (r) => { const n = r.int(1, 30); return [r.ints(n, 1, 20), r.int(1, n)]; },
  }),

  problem({
    title: 'Partition Array Into Three Equal Parts',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Array', 'Greedy'],
    statement:
      'Given an array `nums`, determine whether it can be split into three contiguous, non-empty parts with equal sums.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'Print `true` if such a partition exists, otherwise print `false`.',
    constraints: ['3 <= n <= 5 * 10^4', '-10^4 <= nums[i] <= 10^4'],
    samples: [[[0, 2, 1, -6, 6, -7, 9, 1, 2, 0, 1]], [[0, 2, 1, -6, 6, 7, 9, -1, 2, 0, 1]], [[3, 3, 6, 5, -2, 2, 5, 1, -9, 4]]],
    solve: ([nums]) => {
      const total = nums.reduce((a, b) => a + b, 0);
      if (total % 3 !== 0) return F.bool(false);
      const part = total / 3;
      let sum = 0, parts = 0;
      for (let i = 0; i < nums.length; i++) {
        sum += nums[i];
        if (sum === part && parts < 2 && i < nums.length - 1) { parts++; sum = 0; }
      }
      return F.bool(parts === 2 && sum === part);
    },
    gen: (r, i) => {
      if (i % 2 === 0) {
        const part = r.ints(r.int(1, 4), -5, 5);
        const target = part.reduce((a, b) => a + b, 0);
        const make = () => { const p = r.ints(r.int(1, 3), -5, 5); return [...p, target - p.reduce((a, b) => a + b, 0)]; };
        return [[...part, ...make(), ...make()]];
      }
      return [r.ints(r.int(3, 20), -8, 8)];
    },
  }),

  problem({
    title: 'Sort Colors Dutch Flag',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Sorting', 'Array'],
    statement:
      'Given an array containing only the values `0`, `1` and `2`, sort it in place in a single pass so that all `0`s come first, then all `1`s, then all `2`s.',
    params: [P.intArray('nums', 'the array of colours', 'n')],
    outputFormat: 'A single line of n space-separated integers — the sorted array.',
    constraints: ['1 <= n <= 300', 'nums[i] is 0, 1 or 2.'],
    samples: [[[2, 0, 2, 1, 1, 0]], [[2, 0, 1]], [[0]]],
    solve: ([nums]) => {
      const c = [0, 0, 0];
      for (const x of nums) c[x]++;
      return F.arr([...Array(c[0]).fill(0), ...Array(c[1]).fill(1), ...Array(c[2]).fill(2)]);
    },
    gen: (r) => [r.ints(r.int(1, 30), 0, 2)],
  }),

  problem({
    title: 'Intersection of Two Sorted Arrays',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Hash Table', 'Sorting'],
    statement:
      'Given two arrays, return the distinct values that appear in both, in increasing order.',
    params: [P.intArray('a', 'the first array', 'n'), P.intArray('b', 'the second array', 'm')],
    outputFormat: 'The count of common values on the first line, then those values in increasing order on the second line. Print only `0` when there are none.',
    constraints: ['1 <= n, m <= 10^4', '-10^9 <= a[i], b[i] <= 10^9'],
    samples: [[[1, 2, 2, 1], [2, 2]], [[4, 9, 5], [9, 4, 9, 8, 4]], [[1, 2], [3, 4]]],
    solve: ([a, b]) => {
      const sb = new Set(b);
      return F.counted(sortAsc([...new Set(a.filter((x) => sb.has(x)))]));
    },
    gen: (r) => [r.ints(r.int(1, 20), -10, 10), r.ints(r.int(1, 20), -10, 10)],
  }),

  problem({
    title: 'Merge Overlapping Intervals',
    difficulty: 'MEDIUM',
    topics: ['Intervals', 'Sorting', 'Array'],
    statement:
      'Given a collection of intervals, merge every group of overlapping intervals and return the resulting non-overlapping set sorted by start.',
    params: [P.pairs('intervals', 'each line gives the start and end of one interval', 'n')],
    outputFormat: 'The number of merged intervals on the first line, then one interval per line as two space-separated integers, sorted by start.',
    constraints: ['1 <= n <= 10^4', '0 <= start <= end <= 10^5'],
    samples: [[[[1, 3], [2, 6], [8, 10], [15, 18]]], [[[1, 4], [4, 5]]], [[[5, 6]]]],
    solve: ([iv]) => {
      const s = iv.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const out = [];
      for (const [a, b] of s) {
        if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b);
        else out.push([a, b]);
      }
      return F.countedRows(out);
    },
    gen: (r) => [Array.from({ length: r.int(1, 12) }, () => { const a = r.int(0, 30); return [a, a + r.int(0, 8)]; })],
  }),

  problem({
    title: 'Insert Interval Into Sorted List',
    difficulty: 'MEDIUM',
    topics: ['Intervals', 'Array'],
    statement:
      'You are given a list of non-overlapping intervals sorted by start, and one new interval. Insert the new interval, merging where necessary, and return the resulting list.',
    params: [P.pairs('intervals', 'the existing sorted, non-overlapping intervals', 'n'), P.ints(['s', 'e'], 'the start and end of the interval to insert')],
    outputFormat: 'The number of resulting intervals on the first line, then one interval per line as two space-separated integers, sorted by start.',
    constraints: ['0 <= n <= 10^4', '0 <= start <= end <= 10^5', 'The given intervals are sorted by start and do not overlap.'],
    samples: [[[[1, 3], [6, 9]], [2, 5]], [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], [[[1, 5]], [6, 8]]],
    solve: ([iv, [s, e]]) => {
      const out = [];
      let lo = s, hi = e, placed = false;
      for (const [a, b] of iv) {
        if (b < lo) out.push([a, b]);
        else if (a > hi) { if (!placed) { out.push([lo, hi]); placed = true; } out.push([a, b]); }
        else { lo = Math.min(lo, a); hi = Math.max(hi, b); }
      }
      if (!placed) out.push([lo, hi]);
      return F.countedRows(out.sort((x, y) => x[0] - y[0]));
    },
    gen: (r) => {
      const n = r.int(0, 8);
      const iv = [];
      let cur = r.int(0, 5);
      for (let i = 0; i < n; i++) { const a = cur, b = a + r.int(0, 5); iv.push([a, b]); cur = b + r.int(1, 5); }
      const s = r.int(0, 40);
      return [iv, [s, s + r.int(0, 10)]];
    },
  }),

  problem({
    title: 'Non Overlapping Intervals Removal',
    difficulty: 'MEDIUM',
    topics: ['Intervals', 'Greedy', 'Sorting'],
    statement:
      'Given a set of intervals, find the minimum number you must remove so that the remaining intervals do not overlap. Intervals that merely touch at an endpoint do not overlap.',
    params: [P.pairs('intervals', 'each line gives the start and end of one interval', 'n')],
    outputFormat: 'A single integer — the minimum number of intervals to remove.',
    constraints: ['1 <= n <= 10^5', '-5 * 10^4 <= start < end <= 5 * 10^4'],
    samples: [[[[1, 2], [2, 3], [3, 4], [1, 3]]], [[[1, 2], [1, 2], [1, 2]]], [[[1, 2], [2, 3]]]],
    explain: (_a, out) => `Keeping the largest compatible set requires removing ${out} interval(s).`,
    solve: ([iv]) => {
      const s = iv.slice().sort((a, b) => a[1] - b[1]);
      let kept = 0, end = -Infinity;
      for (const [a, b] of s) if (a >= end) { kept++; end = b; }
      return F.num(iv.length - kept);
    },
    gen: (r) => [Array.from({ length: r.int(1, 14) }, () => { const a = r.int(-20, 20); return [a, a + r.int(1, 8)]; })],
  }),

  problem({
    title: 'Meeting Rooms Required',
    difficulty: 'MEDIUM',
    topics: ['Intervals', 'Heap', 'Sorting'],
    statement:
      'Given the start and end times of a set of meetings, find the minimum number of rooms needed so that no two meetings share a room at the same time. A meeting ending at time `t` frees the room for a meeting starting at `t`.',
    params: [P.pairs('meetings', 'each line gives the start and end time of one meeting', 'n')],
    outputFormat: 'A single integer — the minimum number of rooms required.',
    constraints: ['1 <= n <= 10^4', '0 <= start < end <= 10^6'],
    samples: [[[[0, 30], [5, 10], [15, 20]]], [[[7, 10], [2, 4]]], [[[1, 5], [2, 6], [3, 7]]]],
    solve: ([m]) => {
      const events = [];
      for (const [a, b] of m) { events.push([a, 1]); events.push([b, -1]); }
      events.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
      let cur = 0, best = 0;
      for (const [, d] of events) { cur += d; best = Math.max(best, cur); }
      return F.num(best);
    },
    gen: (r) => [Array.from({ length: r.int(1, 14) }, () => { const a = r.int(0, 30); return [a, a + r.int(1, 10)]; })],
  }),

  problem({
    title: 'Longest Mountain in Array',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Array'],
    statement:
      'A *mountain* is a contiguous subarray of length at least 3 that strictly increases to a single peak and then strictly decreases. Return the length of the longest mountain in `nums`.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the length of the longest mountain, or 0 if there is none.',
    constraints: ['1 <= n <= 10^4', '0 <= nums[i] <= 10^4'],
    samples: [[[2, 1, 4, 7, 3, 2, 5]], [[2, 2, 2]], [[0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]]],
    solve: ([a]) => {
      const n = a.length;
      let best = 0;
      for (let i = 1; i < n - 1; i++) {
        if (a[i - 1] < a[i] && a[i] > a[i + 1]) {
          let l = i, r2 = i;
          while (l > 0 && a[l - 1] < a[l]) l--;
          while (r2 < n - 1 && a[r2] > a[r2 + 1]) r2++;
          best = Math.max(best, r2 - l + 1);
        }
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 30), 0, 8)],
  }),

  problem({
    title: 'Valid Mountain Array',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Array'],
    statement:
      'Determine whether the whole array is a valid mountain: it must have length at least 3, strictly increase to a single peak that is not the first or last element, and then strictly decrease.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'Print `true` if the array is a valid mountain, otherwise print `false`.',
    constraints: ['1 <= n <= 10^4', '0 <= nums[i] <= 10^4'],
    samples: [[[0, 3, 2, 1]], [[3, 5, 5]], [[2, 1]]],
    solve: ([a]) => {
      const n = a.length;
      let i = 0;
      while (i + 1 < n && a[i] < a[i + 1]) i++;
      if (i === 0 || i === n - 1) return F.bool(false);
      while (i + 1 < n && a[i] > a[i + 1]) i++;
      return F.bool(i === n - 1);
    },
    gen: (r, i) => {
      if (i % 2 === 0) {
        const up = r.int(1, 5), down = r.int(1, 5);
        const arr = [];
        let v = 0;
        for (let k = 0; k <= up; k++) { arr.push(v); v += r.int(1, 3); }
        for (let k = 0; k < down; k++) { v -= r.int(1, 3); arr.push(v); }
        return [arr];
      }
      return [r.ints(r.int(1, 12), 0, 6)];
    },
  }),

  problem({
    title: 'Backspace Compare Arrays',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Stack', 'Array'],
    statement:
      'Two sequences of integers are typed, where the value `-1` means "backspace" and removes the previously typed value. Determine whether the two sequences produce the same result.',
    params: [P.intArray('a', 'the first typed sequence', 'n'), P.intArray('b', 'the second typed sequence', 'm')],
    outputFormat: 'Print `true` if the resulting sequences are equal, otherwise print `false`.',
    constraints: ['1 <= n, m <= 10^4', 'a[i], b[i] is -1 or in the range [0, 9]'],
    samples: [[[1, 2, -1, 3], [1, 3]], [[1, -1, -1, 2], [2]], [[1, 2], [2, 1]]],
    solve: ([a, b]) => {
      const type = (x) => { const st = []; for (const v of x) v === -1 ? st.pop() : st.push(v); return st.join(','); };
      return F.bool(type(a) === type(b));
    },
    gen: (r) => {
      const seq = () => Array.from({ length: r.int(1, 12) }, () => (r.bool(0.3) ? -1 : r.int(0, 3)));
      return [seq(), seq()];
    },
  }),

  problem({
    title: 'Shortest Unsorted Continuous Subarray',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Sorting', 'Array'],
    statement:
      'Find the shortest contiguous subarray such that sorting it alone would leave the whole array sorted in non-decreasing order. Return its length.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the length of the shortest such subarray, or 0 if the array is already sorted.',
    constraints: ['1 <= n <= 10^4', '-10^5 <= nums[i] <= 10^5'],
    samples: [[[2, 6, 4, 8, 10, 9, 15]], [[1, 2, 3, 4]], [[1]]],
    solve: ([nums]) => {
      const s = sortAsc(nums);
      let l = 0, r2 = nums.length - 1;
      while (l <= r2 && nums[l] === s[l]) l++;
      while (r2 >= l && nums[r2] === s[r2]) r2--;
      return F.num(r2 - l + 1);
    },
    gen: (r, i) => {
      if (i % 3 === 0) return [sortAsc(r.ints(r.int(1, 20), -20, 20))];
      return [r.ints(r.int(1, 25), -20, 20)];
    },
  }),

  problem({
    title: 'Boats to Save People',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Greedy', 'Sorting'],
    statement:
      'Each boat carries at most two people and has a weight limit. Given each person`s weight and the boat limit, return the minimum number of boats needed to carry everyone.',
    params: [P.intArray('people', 'the weights of the people', 'n'), P.int('limit', 'the weight limit of each boat')],
    outputFormat: 'A single integer — the minimum number of boats.',
    constraints: ['1 <= n <= 5 * 10^4', '1 <= people[i] <= limit <= 3 * 10^4'],
    samples: [[[1, 2], 3], [[3, 2, 2, 1], 3], [[3, 5, 3, 4], 5]],
    solve: ([people, limit]) => {
      const a = sortAsc(people);
      let i = 0, j = a.length - 1, boats = 0;
      while (i <= j) { if (a[i] + a[j] <= limit) i++; j--; boats++; }
      return F.num(boats);
    },
    gen: (r) => { const limit = r.int(3, 20); return [r.ints(r.int(1, 25), 1, limit), limit]; },
  }),

  problem({
    title: 'Minimum Difference Between Pairs',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Sorting', 'Array'],
    statement:
      'Given an array `nums` of at least two integers, find the smallest absolute difference between any two of its elements.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the smallest absolute difference between any two elements.',
    constraints: ['2 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    samples: [[[3, 8, 15, 17]], [[1, 1]], [[-5, 10, 2]]],
    solve: ([nums]) => {
      const a = sortAsc(nums);
      let best = Infinity;
      for (let i = 1; i < a.length; i++) best = Math.min(best, a[i] - a[i - 1]);
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(2, 30), -100, 100)],
  }),

  problem({
    title: 'Count Pairs With Given Difference',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Hash Table', 'Sorting'],
    statement:
      'Given an array `nums` and a non-negative integer `k`, count the distinct pairs of **values** `(a, b)` with `a < b` and `b - a = k` that both appear in the array. When `k` is 0, count values that appear at least twice.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the required difference')],
    outputFormat: 'A single integer — the number of distinct qualifying value pairs.',
    constraints: ['1 <= n <= 10^4', '-10^7 <= nums[i] <= 10^7', '0 <= k <= 10^7'],
    samples: [[[3, 1, 4, 1, 5], 2], [[1, 2, 3, 4, 5], 1], [[1, 3, 1, 5, 4], 0]],
    solve: ([nums, k]) => {
      const cnt = new Map();
      for (const x of nums) cnt.set(x, (cnt.get(x) || 0) + 1);
      let total = 0;
      for (const [v, c] of cnt) {
        if (k === 0) { if (c > 1) total++; }
        else if (cnt.has(v + k)) total++;
      }
      return F.num(total);
    },
    gen: (r) => [r.ints(r.int(1, 25), -10, 10), r.int(0, 5)],
  }),

  problem({
    title: 'Four Sum Count of Quadruplets',
    difficulty: 'HARD',
    topics: ['Two Pointers', 'Hash Table', 'Sorting'],
    statement:
      'Given an array `nums` and a `target`, count the number of **distinct** quadruplets of values `(a, b, c, d)` from the array with `a + b + c + d = target`. Two quadruplets are the same if they use the same multiset of values.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('target', 'the target sum')],
    outputFormat: 'A single integer — the number of distinct quadruplets.',
    constraints: ['1 <= n <= 200', '-1000 <= nums[i] <= 1000', '-10^6 <= target <= 10^6'],
    samples: [[[1, 0, -1, 0, -2, 2], 0], [[2, 2, 2, 2, 2], 8], [[1, 2, 3], 100]],
    solve: ([nums, target]) => {
      const a = sortAsc(nums), n = a.length, found = new Set();
      for (let i = 0; i < n - 3; i++)
        for (let j = i + 1; j < n - 2; j++) {
          let l = j + 1, r2 = n - 1;
          while (l < r2) {
            const s = a[i] + a[j] + a[l] + a[r2];
            if (s === target) { found.add(`${a[i]},${a[j]},${a[l]},${a[r2]}`); l++; r2--; }
            else if (s < target) l++;
            else r2--;
          }
        }
      return F.num(found.size);
    },
    gen: (r) => [r.ints(r.int(1, 22), -6, 6), r.int(-12, 12)],
  }),

  problem({
    title: 'Reverse Only Vowels',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'String'],
    statement:
      'Given a string `s`, reverse only the vowels (`a`, `e`, `i`, `o`, `u` in either case) and leave every other character in place.',
    params: [P.str('s', 'the string')],
    outputFormat: 'A single line containing the transformed string.',
    constraints: ['1 <= |s| <= 3 * 10^5', 's consists of printable ASCII characters without spaces.'],
    samples: [['hello'], ['leetcode'], ['xyz']],
    solve: ([s]) => {
      const isV = (c) => 'aeiouAEIOU'.includes(c);
      const arr = [...s];
      let i = 0, j = arr.length - 1;
      while (i < j) {
        if (!isV(arr[i])) i++;
        else if (!isV(arr[j])) j--;
        else { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; j--; }
      }
      return arr.join('');
    },
    gen: (r) => [r.word(r.int(1, 25), 'abcdeiouxyz')],
  }),

  problem({
    title: 'Two Sum Less Than K',
    difficulty: 'EASY',
    topics: ['Two Pointers', 'Sorting', 'Array'],
    statement:
      'Given an array `nums` and an integer `k`, find the largest sum of two distinct elements that is strictly less than `k`.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the exclusive upper bound')],
    outputFormat: 'A single integer — the maximum qualifying sum, or -1 if no pair sums to less than k.',
    constraints: ['1 <= n <= 100', '1 <= nums[i] <= 1000', '1 <= k <= 2000'],
    samples: [[[34, 23, 1, 24, 75, 33, 54, 8], 60], [[10, 20, 30], 15], [[1, 2], 4]],
    solve: ([nums, k]) => {
      const a = sortAsc(nums);
      let i = 0, j = a.length - 1, best = -1;
      while (i < j) {
        const s = a[i] + a[j];
        if (s < k) { best = Math.max(best, s); i++; } else j--;
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 25), 1, 100), r.int(1, 150)],
  }),

  problem({
    title: 'Maximum Erasure Value',
    difficulty: 'MEDIUM',
    topics: ['Sliding Window', 'Hash Table', 'Array'],
    statement:
      'Given an array of positive integers `nums`, find the maximum sum of a contiguous subarray in which every element is unique.',
    params: [P.intArray('nums', 'the positive array elements', 'n')],
    outputFormat: 'A single integer — the maximum sum of a subarray with all distinct values.',
    constraints: ['1 <= n <= 10^5', '1 <= nums[i] <= 10^4'],
    samples: [[[4, 2, 4, 5, 6]], [[5, 2, 1, 2, 5, 2, 1, 2, 5]], [[1, 2, 3]]],
    solve: ([nums]) => {
      const seen = new Set();
      let lo = 0, sum = 0, best = 0;
      for (let hi = 0; hi < nums.length; hi++) {
        while (seen.has(nums[hi])) { seen.delete(nums[lo]); sum -= nums[lo]; lo++; }
        seen.add(nums[hi]); sum += nums[hi];
        best = Math.max(best, sum);
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 30), 1, 8)],
  }),

  problem({
    title: 'Number of Subarrays With Bounded Maximum',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Array', 'Counting'],
    statement:
      'Given an array `nums` and bounds `left` and `right`, count the contiguous subarrays whose maximum element lies in the inclusive range `[left, right]`.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.ints(['left', 'right'], 'the inclusive bounds on the subarray maximum')],
    outputFormat: 'A single integer — the number of qualifying subarrays.',
    constraints: ['1 <= n <= 10^5', '0 <= nums[i] <= 10^9', '0 <= left <= right <= 10^9'],
    samples: [[[2, 1, 4, 3], [2, 3]], [[2, 9, 2, 5, 6], [2, 8]], [[1, 1, 1], [2, 3]]],
    solve: ([nums, [left, right]]) => {
      const atMost = (bound) => {
        let run = 0, total = 0;
        for (const x of nums) { run = x <= bound ? run + 1 : 0; total += run; }
        return total;
      };
      return F.num(atMost(right) - atMost(left - 1));
    },
    gen: (r) => { const lo = r.int(0, 8); return [r.ints(r.int(1, 25), 0, 12), [lo, lo + r.int(0, 6)]]; },
  }),

  problem({
    title: 'Rearrange Array Alternating Signs',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Array', 'Simulation'],
    statement:
      'You are given an array with an equal number of positive and negative integers. Rearrange it so signs alternate starting with a positive number, while preserving the relative order within the positives and within the negatives.',
    params: [P.intArray('nums', 'the array, with equally many positive and negative values', 'n')],
    outputFormat: 'A single line of n space-separated integers — the rearranged array.',
    constraints: ['2 <= n <= 2 * 10^5', 'n is even.', '-10^5 <= nums[i] <= 10^5, nums[i] != 0', 'The array contains exactly n/2 positive and n/2 negative values.'],
    samples: [[[3, 1, -2, -5, 2, -4]], [[-1, 1]], [[1, -1, 2, -2]]],
    solve: ([nums]) => {
      const pos = nums.filter((x) => x > 0), neg = nums.filter((x) => x < 0);
      const out = [];
      for (let i = 0; i < pos.length; i++) { out.push(pos[i], neg[i]); }
      return F.arr(out);
    },
    gen: (r) => {
      const k = r.int(1, 12);
      const pos = Array.from({ length: k }, () => r.int(1, 50));
      const neg = Array.from({ length: k }, () => -r.int(1, 50));
      return [r.shuffle([...pos, ...neg])];
    },
  }),

  problem({
    title: 'Longest Subarray of Ones After Deleting One',
    difficulty: 'MEDIUM',
    topics: ['Sliding Window', 'Array', 'Two Pointers'],
    statement:
      'Given a binary array `nums`, you must delete exactly one element. Return the length of the longest run of `1`s in the resulting array.',
    params: [P.intArray('nums', 'the binary array', 'n')],
    outputFormat: 'A single integer — the longest run of ones after removing exactly one element.',
    constraints: ['1 <= n <= 10^5', 'nums[i] is 0 or 1.'],
    samples: [[[1, 1, 0, 1]], [[0, 1, 1, 1, 0, 1, 1, 0, 1]], [[1, 1, 1]]],
    explain: ([nums], out) => `Exactly one element is removed from the ${nums.length}-element array, leaving a run of ${out} one(s).`,
    solve: ([nums]) => {
      let lo = 0, zeros = 0, best = 0;
      for (let hi = 0; hi < nums.length; hi++) {
        if (nums[hi] === 0) zeros++;
        while (zeros > 1) { if (nums[lo] === 0) zeros--; lo++; }
        best = Math.max(best, hi - lo);
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 30), 0, 1)],
  }),

  problem({
    title: 'Find K Closest Elements',
    difficulty: 'MEDIUM',
    topics: ['Two Pointers', 'Binary Search', 'Sorting'],
    statement:
      'Given a sorted array `nums`, an integer `k` and a value `x`, return the `k` elements closest to `x`, sorted in increasing order. When two elements are equally close, the smaller one is preferred.',
    params: [P.intArray('nums', 'the sorted array', 'n'), P.ints(['k', 'x'], 'how many elements to return, and the reference value')],
    outputFormat: 'A single line of k space-separated integers — the closest elements in increasing order.',
    constraints: ['1 <= k <= n <= 10^4', '-10^4 <= nums[i], x <= 10^4', 'nums is sorted in non-decreasing order.'],
    samples: [[[1, 2, 3, 4, 5], [4, 3]], [[1, 2, 3, 4, 5], [4, -1]], [[1, 1, 2, 2, 2, 2, 2, 3, 3], [3, 3]]],
    solve: ([nums, [k, x]]) => {
      let lo = 0, hi = nums.length - k;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (x - nums[mid] > nums[mid + k] - x) lo = mid + 1; else hi = mid;
      }
      return F.arr(nums.slice(lo, lo + k));
    },
    gen: (r) => { const nums = sortAsc(r.ints(r.int(1, 25), -30, 30)); return [nums, [r.int(1, nums.length), r.int(-35, 35)]]; },
  }),

  problem({
    title: 'Interval List Intersections',
    difficulty: 'MEDIUM',
    topics: ['Intervals', 'Two Pointers'],
    statement:
      'You are given two lists of closed intervals, each sorted by start and internally non-overlapping. Return the intersection of the two lists.',
    params: [P.pairs('a', 'the first list of intervals', 'n'), P.pairs('b', 'the second list of intervals', 'm')],
    outputFormat: 'The number of intersecting intervals on the first line, then one interval per line as two space-separated integers. Print only `0` when the lists do not intersect.',
    constraints: ['0 <= n, m <= 1000', '0 <= start <= end <= 10^9', 'Each list is sorted by start and internally disjoint.'],
    samples: [[[[0, 2], [5, 10]], [[1, 5], [8, 12]]], [[[1, 3], [5, 9]], [[]].slice(0, 0)], [[[1, 7]], [[3, 10]]]],
    solve: ([a, b]) => {
      const out = [];
      let i = 0, j = 0;
      while (i < a.length && j < b.length) {
        const lo = Math.max(a[i][0], b[j][0]), hi = Math.min(a[i][1], b[j][1]);
        if (lo <= hi) out.push([lo, hi]);
        a[i][1] < b[j][1] ? i++ : j++;
      }
      return F.countedRows(out);
    },
    gen: (r) => {
      const mk = () => {
        const out = [];
        let cur = r.int(0, 4);
        for (let i = 0; i < r.int(0, 6); i++) { const s = cur, e = s + r.int(0, 5); out.push([s, e]); cur = e + r.int(1, 4); }
        return out;
      };
      return [mk(), mk()];
    },
  }),

  problem({
    title: 'Minimum Swaps to Group Ones',
    difficulty: 'MEDIUM',
    topics: ['Sliding Window', 'Array'],
    statement:
      'Given a binary array `nums`, find the minimum number of swaps needed to bring all the `1`s together into one contiguous block.',
    params: [P.intArray('nums', 'the binary array', 'n')],
    outputFormat: 'A single integer — the minimum number of swaps required.',
    constraints: ['1 <= n <= 10^5', 'nums[i] is 0 or 1.'],
    samples: [[[1, 0, 1, 0, 1]], [[0, 0, 0]], [[1, 1, 0, 0, 1]]],
    notes: 'If the array holds fewer than two ones, no swaps are needed.',
    solve: ([nums]) => {
      const total = nums.reduce((a, b) => a + b, 0);
      if (total <= 1) return '0';
      let ones = 0;
      for (let i = 0; i < total; i++) ones += nums[i];
      let best = total - ones;
      for (let i = total; i < nums.length; i++) {
        ones += nums[i] - nums[i - total];
        best = Math.min(best, total - ones);
      }
      return F.num(best);
    },
    gen: (r) => [r.ints(r.int(1, 30), 0, 1)],
  }),
];
