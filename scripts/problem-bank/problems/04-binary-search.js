import { P } from '../lib/params.js';
import { problem, F } from '../lib/define.js';

const asc = (a) => a.slice().sort((x, y) => x - y);

export default [
  problem({
    title: 'Classic Binary Search',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Array'],
    statement:
      'Given a sorted array `nums` of distinct integers and a `target`, return the index of the target using binary search.',
    params: [P.intArray('nums', 'the sorted distinct values', 'n'), P.int('target', 'the value to find')],
    outputFormat: 'A single integer — the 0-based index of target, or -1 if it is not present.',
    constraints: ['1 <= n <= 10^4', '-10^4 <= nums[i], target <= 10^4', 'nums is sorted in increasing order with distinct values.'],
    samples: [[[-1, 0, 3, 5, 9, 12], 9], [[-1, 0, 3, 5, 9, 12], 2], [[5], 5]],
    solve: ([nums, target]) => {
      let lo = 0, hi = nums.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return F.num(mid);
        nums[mid] < target ? (lo = mid + 1) : (hi = mid - 1);
      }
      return '-1';
    },
    gen: (r) => {
      const nums = asc([...new Set(r.ints(r.int(1, 40), -60, 60))]);
      return [nums, r.bool() ? r.pick(nums) : r.int(-70, 70)];
    },
  }),

  problem({
    title: 'Search Insert Position',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Array'],
    statement:
      'Given a sorted array of distinct integers and a target, return the index where the target is found. If it is absent, return the index where it would be inserted to keep the array sorted.',
    params: [P.intArray('nums', 'the sorted distinct values', 'n'), P.int('target', 'the value to place')],
    outputFormat: 'A single integer — the index of the target, or its insertion position.',
    constraints: ['1 <= n <= 10^4', '-10^4 <= nums[i], target <= 10^4', 'nums is sorted in increasing order with distinct values.'],
    samples: [[[1, 3, 5, 6], 5], [[1, 3, 5, 6], 2], [[1, 3, 5, 6], 7]],
    solve: ([nums, target]) => {
      let lo = 0, hi = nums.length;
      while (lo < hi) { const mid = (lo + hi) >> 1; nums[mid] < target ? (lo = mid + 1) : (hi = mid); }
      return F.num(lo);
    },
    gen: (r) => [asc([...new Set(r.ints(r.int(1, 30), -40, 40))]), r.int(-45, 45)],
  }),

  problem({
    title: 'First and Last Position in Sorted Array',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Array'],
    statement:
      'Given a sorted array `nums` (values may repeat) and a `target`, find the first and last index at which the target occurs.',
    params: [P.intArray('nums', 'the sorted array', 'n'), P.int('target', 'the value to locate')],
    outputFormat: 'Two space-separated integers — the first and last index of target, or `-1 -1` if it is absent.',
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i], target <= 10^9', 'nums is sorted in non-decreasing order.'],
    samples: [[[5, 7, 7, 8, 8, 10], 8], [[5, 7, 7, 8, 8, 10], 6], [[1], 1]],
    solve: ([nums, target]) => {
      const bound = (t) => { let lo = 0, hi = nums.length; while (lo < hi) { const m = (lo + hi) >> 1; nums[m] < t ? (lo = m + 1) : (hi = m); } return lo; };
      const l = bound(target), r2 = bound(target + 1) - 1;
      return l <= r2 ? F.arr([l, r2]) : '-1 -1';
    },
    gen: (r) => { const nums = asc(r.ints(r.int(1, 30), -10, 10)); return [nums, r.bool(0.7) ? r.pick(nums) : r.int(-15, 15)]; },
  }),

  problem({
    title: 'Search in Rotated Sorted Array',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Array'],
    statement:
      'A sorted array of distinct values has been rotated at some unknown pivot. Given the rotated array and a `target`, find the target`s index in O(log n) time.',
    params: [P.intArray('nums', 'the rotated sorted array of distinct values', 'n'), P.int('target', 'the value to find')],
    outputFormat: 'A single integer — the index of target, or -1 if it is absent.',
    constraints: ['1 <= n <= 5000', '-10^4 <= nums[i], target <= 10^4', 'All values in nums are distinct.'],
    samples: [[[4, 5, 6, 7, 0, 1, 2], 0], [[4, 5, 6, 7, 0, 1, 2], 3], [[1], 0]],
    solve: ([nums, target]) => {
      let lo = 0, hi = nums.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return F.num(mid);
        if (nums[lo] <= nums[mid]) {
          if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
        } else {
          if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
        }
      }
      return '-1';
    },
    gen: (r) => {
      const base = asc([...new Set(r.ints(r.int(1, 25), -30, 30))]);
      const k = r.int(0, base.length - 1);
      const rot = [...base.slice(k), ...base.slice(0, k)];
      return [rot, r.bool(0.7) ? r.pick(rot) : r.int(-35, 35)];
    },
  }),

  problem({
    title: 'Minimum in Rotated Sorted Array',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Array'],
    statement:
      'A sorted array of distinct values has been rotated at some unknown pivot. Find its minimum element in O(log n) time.',
    params: [P.intArray('nums', 'the rotated sorted array of distinct values', 'n')],
    outputFormat: 'A single integer — the smallest element of the array.',
    constraints: ['1 <= n <= 5000', '-5000 <= nums[i] <= 5000', 'All values in nums are distinct.'],
    samples: [[[3, 4, 5, 1, 2]], [[4, 5, 6, 7, 0, 1, 2]], [[11, 13, 15, 17]]],
    solve: ([nums]) => {
      let lo = 0, hi = nums.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; nums[mid] > nums[hi] ? (lo = mid + 1) : (hi = mid); }
      return F.num(nums[lo]);
    },
    gen: (r) => {
      const base = asc([...new Set(r.ints(r.int(1, 25), -50, 50))]);
      const k = r.int(0, base.length - 1);
      return [[...base.slice(k), ...base.slice(0, k)]];
    },
  }),

  problem({
    title: 'Peak Element Index',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Array'],
    statement:
      'A peak element is strictly greater than its neighbours. Given an array where no two adjacent values are equal, return the index of **any** peak.\n\nTreat `nums[-1]` and `nums[n]` as negative infinity. To keep the answer unique, report the leftmost peak found by the standard binary search.',
    params: [P.intArray('nums', 'the array with no two adjacent values equal', 'n')],
    outputFormat: 'A single integer — the index of a peak element.',
    constraints: ['1 <= n <= 1000', '-2^31 <= nums[i] <= 2^31 - 1', 'nums[i] != nums[i + 1] for all valid i.'],
    samples: [[[1, 2, 3, 1]], [[1, 2, 1, 3, 5, 6, 4]], [[1]]],
    notes: 'Run the standard binary search: while lo < hi, if nums[mid] < nums[mid+1] move right, otherwise move left. The reported index is the one that search lands on.',
    solve: ([nums]) => {
      let lo = 0, hi = nums.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; nums[mid] < nums[mid + 1] ? (lo = mid + 1) : (hi = mid); }
      return F.num(lo);
    },
    gen: (r) => {
      const n = r.int(1, 25), out = [r.int(-20, 20)];
      for (let i = 1; i < n; i++) { let v = r.int(-20, 20); while (v === out[i - 1]) v = r.int(-20, 20); out.push(v); }
      return [out];
    },
  }),

  problem({
    title: 'Square Root Integer Part',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Math'],
    statement:
      'Given a non-negative integer `n`, return the integer part of its square root — the largest integer `k` with `k * k <= n`.',
    params: [P.int('n', 'the number whose square root is wanted')],
    outputFormat: 'A single integer — the floor of the square root of n.',
    constraints: ['0 <= n <= 2^31 - 1'],
    samples: [[4], [8], [0]],
    solve: ([n]) => {
      let lo = 0, hi = n;
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); mid * mid <= n ? (lo = mid) : (hi = mid - 1); }
      return F.num(lo);
    },
    gen: (r) => [r.int(0, 2000000)],
  }),

  problem({
    title: 'Valid Perfect Square',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Math'],
    statement: 'Given a positive integer `n`, determine whether it is a perfect square without using any built-in square-root function.',
    params: [P.int('n', 'the number to test')],
    outputFormat: 'Print `true` if n is a perfect square, otherwise print `false`.',
    constraints: ['1 <= n <= 2^31 - 1'],
    samples: [[16], [14], [1]],
    solve: ([n]) => {
      let lo = 1, hi = n;
      while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); const sq = mid * mid; if (sq === n) return F.bool(true); sq < n ? (lo = mid + 1) : (hi = mid - 1); }
      return F.bool(false);
    },
    gen: (r, i) => (i % 2 === 0 ? [r.int(1, 3000) ** 2] : [r.int(1, 1000000)]),
  }),

  problem({
    title: 'Koko Eating Bananas',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Greedy', 'Array'],
    statement:
      'There are `n` piles of bananas. Koko eats at a speed of `k` bananas per hour: each hour she picks one pile and eats up to `k` from it, moving on to the next hour even if the pile is smaller.\n\nGiven the pile sizes and a deadline of `h` hours, find the smallest `k` that lets her finish in time.',
    params: [P.intArray('piles', 'the sizes of the banana piles', 'n'), P.int('h', 'the number of hours available')],
    outputFormat: 'A single integer — the minimum eating speed.',
    constraints: ['1 <= n <= 10^4', '1 <= piles[i] <= 10^9', 'n <= h <= 10^9'],
    samples: [[[3, 6, 7, 11], 8], [[30, 11, 23, 4, 20], 5], [[1], 1]],
    solve: ([piles, h]) => {
      const hours = (k) => piles.reduce((a, p) => a + Math.ceil(p / k), 0);
      let lo = 1, hi = Math.max(...piles);
      while (lo < hi) { const mid = (lo + hi) >> 1; hours(mid) <= h ? (hi = mid) : (lo = mid + 1); }
      return F.num(lo);
    },
    gen: (r) => { const piles = r.ints(r.int(1, 15), 1, 100); return [piles, r.int(piles.length, piles.length * 6)]; },
  }),

  problem({
    title: 'Ship Packages Within D Days',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Greedy', 'Array'],
    statement:
      'Packages must be shipped in the given order within `days` days. Each day the ship loads packages in order without exceeding its capacity.\n\nFind the smallest capacity that allows all packages to ship within the deadline.',
    params: [P.intArray('weights', 'the package weights in shipping order', 'n'), P.int('days', 'the number of days available')],
    outputFormat: 'A single integer — the minimum ship capacity.',
    constraints: ['1 <= days <= n <= 5 * 10^4', '1 <= weights[i] <= 500'],
    samples: [[[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5], [[3, 2, 2, 4, 1, 4], 3], [[1, 2, 3], 3]],
    solve: ([w, days]) => {
      const need = (cap) => {
        let d = 1, cur = 0;
        for (const x of w) { if (cur + x > cap) { d++; cur = 0; } cur += x; }
        return d;
      };
      let lo = Math.max(...w), hi = w.reduce((a, b) => a + b, 0);
      while (lo < hi) { const mid = (lo + hi) >> 1; need(mid) <= days ? (hi = mid) : (lo = mid + 1); }
      return F.num(lo);
    },
    gen: (r) => { const w = r.ints(r.int(1, 20), 1, 30); return [w, r.int(1, w.length)]; },
  }),

  problem({
    title: 'Split Array Largest Sum',
    difficulty: 'HARD',
    topics: ['Binary Search', 'Dynamic Programming', 'Greedy'],
    statement:
      'Split the array `nums` into `k` non-empty contiguous parts so that the largest part sum is as small as possible. Return that minimal largest sum.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the number of parts')],
    outputFormat: 'A single integer — the minimised largest subarray sum.',
    constraints: ['1 <= k <= n <= 1000', '0 <= nums[i] <= 10^6'],
    samples: [[[7, 2, 5, 10, 8], 2], [[1, 2, 3, 4, 5], 2], [[1, 4, 4], 3]],
    solve: ([nums, k]) => {
      const parts = (cap) => { let p = 1, cur = 0; for (const x of nums) { if (cur + x > cap) { p++; cur = 0; } cur += x; } return p; };
      let lo = Math.max(...nums), hi = nums.reduce((a, b) => a + b, 0);
      while (lo < hi) { const mid = Math.floor((lo + hi) / 2); parts(mid) <= k ? (hi = mid) : (lo = mid + 1); }
      return F.num(lo);
    },
    gen: (r) => { const nums = r.ints(r.int(1, 18), 0, 50); return [nums, r.int(1, nums.length)]; },
  }),

  problem({
    title: 'Aggressive Cows Placement',
    difficulty: 'HARD',
    topics: ['Binary Search', 'Greedy', 'Sorting'],
    statement:
      'There are `n` stalls at the given positions along a line, and `k` cows to place in them. Place the cows so that the minimum distance between any two of them is as large as possible, and return that distance.',
    params: [P.intArray('positions', 'the stall positions', 'n'), P.int('k', 'the number of cows to place')],
    outputFormat: 'A single integer — the largest achievable minimum distance between two cows.',
    constraints: ['2 <= k <= n <= 10^5', '0 <= positions[i] <= 10^9', 'All positions are distinct.'],
    samples: [[[1, 2, 4, 8, 9], 3], [[0, 3, 4, 7, 10, 9], 4], [[1, 2], 2]],
    solve: ([positions, k]) => {
      const p = asc(positions);
      const fits = (d) => {
        let count = 1, last = p[0];
        for (const x of p) if (x - last >= d) { count++; last = x; }
        return count >= k;
      };
      let lo = 0, hi = p[p.length - 1] - p[0];
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); fits(mid) ? (lo = mid) : (hi = mid - 1); }
      return F.num(lo);
    },
    gen: (r) => {
      const p = [...new Set(r.ints(r.int(2, 20), 0, 100))];
      return p.length >= 2 ? [p, r.int(2, p.length)] : null;
    },
  }),

  problem({
    title: 'Allocate Minimum Pages',
    difficulty: 'HARD',
    topics: ['Binary Search', 'Greedy', 'Array'],
    statement:
      'Books with the given page counts must be handed out to `k` students. Each student receives a contiguous block of books and every book must be assigned.\n\nMinimise the maximum number of pages any single student reads, and return that value.',
    params: [P.intArray('pages', 'the page count of each book, in order', 'n'), P.int('k', 'the number of students')],
    outputFormat: 'A single integer — the minimised maximum page load, or -1 if there are fewer books than students.',
    constraints: ['1 <= n <= 10^5', '1 <= k <= 10^5', '1 <= pages[i] <= 10^6'],
    samples: [[[12, 34, 67, 90], 2], [[10, 20, 30, 40], 2], [[5, 10], 3]],
    solve: ([pages, k]) => {
      if (k > pages.length) return '-1';
      const need = (cap) => { let s = 1, cur = 0; for (const x of pages) { if (cur + x > cap) { s++; cur = 0; } cur += x; } return s; };
      let lo = Math.max(...pages), hi = pages.reduce((a, b) => a + b, 0);
      while (lo < hi) { const mid = Math.floor((lo + hi) / 2); need(mid) <= k ? (hi = mid) : (lo = mid + 1); }
      return F.num(lo);
    },
    gen: (r) => [r.ints(r.int(1, 18), 1, 100), r.int(1, 20)],
  }),

  problem({
    title: 'Median of Two Sorted Arrays',
    difficulty: 'HARD',
    topics: ['Binary Search', 'Divide and Conquer', 'Array'],
    statement:
      'Given two sorted arrays, find the median of their combined contents. Report the median multiplied by two so the answer is always an integer.',
    params: [P.intArray('a', 'the first sorted array', 'n'), P.intArray('b', 'the second sorted array', 'm')],
    outputFormat: 'A single integer — twice the median of the merged arrays.',
    constraints: ['0 <= n, m <= 1000', 'n + m >= 1', '-10^6 <= a[i], b[i] <= 10^6', 'Both arrays are sorted in non-decreasing order.'],
    notes: 'Doubling the median keeps the expected output exact for even-length merges.',
    samples: [[[1, 3], [2]], [[1, 2], [3, 4]], [[0, 0], [0, 0]]],
    solve: ([a, b]) => {
      const m = asc([...a, ...b]), n = m.length;
      return F.num(n % 2 ? 2 * m[(n - 1) / 2] : m[n / 2 - 1] + m[n / 2]);
    },
    gen: (r) => {
      const a = asc(r.ints(r.int(0, 15), -50, 50));
      const b = asc(r.ints(r.int(0, 15), -50, 50));
      return a.length + b.length >= 1 ? [a, b] : null;
    },
  }),

  problem({
    title: 'Kth Smallest Element in Sorted Matrix',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Heap', 'Matrix'],
    statement:
      'Given an `n x n` matrix where every row and every column is sorted in increasing order, return the k-th smallest element in the matrix.',
    params: [P.grid('matrix', 'the matrix, rows sorted and columns sorted'), P.int('k', 'the 1-based rank to return')],
    outputFormat: 'A single integer — the k-th smallest value in the matrix.',
    constraints: ['1 <= n <= 300', '-10^9 <= matrix[i][j] <= 10^9', '1 <= k <= n * n'],
    samples: [[[[1, 5, 9], [10, 11, 13], [12, 13, 15]], 8], [[[-5]], 1], [[[1, 2], [1, 3]], 2]],
    solve: ([m, k]) => F.num(asc(m.flat())[k - 1]),
    gen: (r) => {
      const n = r.int(1, 6);
      const vals = asc(r.ints(n * n, -30, 30));
      const m = Array.from({ length: n }, (_, i) => vals.slice(i * n, i * n + n));
      return [m, r.int(1, n * n)];
    },
  }),

  problem({
    title: 'Find Kth Largest Element',
    difficulty: 'MEDIUM',
    topics: ['Sorting', 'Heap', 'Quickselect'],
    statement: 'Given an array `nums` and an integer `k`, return the k-th largest element. Duplicates count separately.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'the 1-based rank from the largest')],
    outputFormat: 'A single integer — the k-th largest element.',
    constraints: ['1 <= k <= n <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    samples: [[[3, 2, 1, 5, 6, 4], 2], [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], [[1], 1]],
    solve: ([nums, k]) => F.num(nums.slice().sort((a, b) => b - a)[k - 1]),
    gen: (r) => { const n = r.int(1, 30); return [r.ints(n, -50, 50), r.int(1, n)]; },
  }),

  problem({
    title: 'Top K Frequent Values',
    difficulty: 'MEDIUM',
    topics: ['Sorting', 'Heap', 'Hash Table'],
    statement:
      'Given an array `nums` and an integer `k`, return the `k` most frequent values. Break ties in favour of the smaller value, and print the result in decreasing order of frequency.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('k', 'how many frequent values to return')],
    outputFormat: 'A single line of k space-separated integers — the most frequent values, most frequent first, ties broken by smaller value.',
    constraints: ['1 <= n <= 10^5', '-10^4 <= nums[i] <= 10^4', '1 <= k <= number of distinct values in nums'],
    samples: [[[1, 1, 1, 2, 2, 3], 2], [[1], 1], [[4, 4, 5, 5, 6], 2]],
    solve: ([nums, k]) => {
      const cnt = new Map();
      for (const x of nums) cnt.set(x, (cnt.get(x) || 0) + 1);
      return F.arr([...cnt.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, k).map((e) => e[0]));
    },
    gen: (r) => {
      const nums = r.ints(r.int(1, 30), -6, 6);
      return [nums, r.int(1, new Set(nums).size)];
    },
  }),

  problem({
    title: 'Sort Array by Parity',
    difficulty: 'EASY',
    topics: ['Sorting', 'Two Pointers', 'Array'],
    statement:
      'Rearrange `nums` so that every even number comes before every odd number. Within each group keep the original relative order.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single line of n space-separated integers — the rearranged array.',
    constraints: ['1 <= n <= 5000', '0 <= nums[i] <= 5000'],
    samples: [[[3, 1, 2, 4]], [[0]], [[1, 3, 5, 2]]],
    solve: ([nums]) => F.arr([...nums.filter((x) => x % 2 === 0), ...nums.filter((x) => x % 2 !== 0)]),
    gen: (r) => [r.ints(r.int(1, 30), 0, 60)],
  }),

  problem({
    title: 'Relative Sort Array',
    difficulty: 'EASY',
    topics: ['Sorting', 'Hash Table', 'Array'],
    statement:
      'Sort `a` so that its elements follow the relative order given by `order`. Elements of `a` that do not appear in `order` go at the end in increasing order.',
    params: [P.intArray('a', 'the array to sort', 'n'), P.intArray('order', 'the distinct values giving the priority order', 'm')],
    outputFormat: 'A single line of n space-separated integers — the sorted array.',
    constraints: ['1 <= n <= 1000', '1 <= m <= 1000', '0 <= a[i], order[i] <= 1000', 'All values in order are distinct.'],
    samples: [[[2, 3, 1, 3, 2, 4, 6, 7, 9, 2, 19], [2, 1, 4, 3, 9, 6]], [[1, 2, 3], [3]], [[5, 5], [5]]],
    solve: ([a, order]) => {
      const rank = new Map(order.map((v, i) => [v, i]));
      const known = a.filter((x) => rank.has(x)).sort((x, y) => rank.get(x) - rank.get(y));
      const rest = asc(a.filter((x) => !rank.has(x)));
      return F.arr([...known, ...rest]);
    },
    gen: (r) => [r.ints(r.int(1, 25), 0, 12), [...new Set(r.ints(r.int(1, 8), 0, 12))]],
  }),

  problem({
    title: 'H Index of Citations',
    difficulty: 'MEDIUM',
    topics: ['Sorting', 'Counting', 'Binary Search'],
    statement:
      'A researcher has an h-index of `h` if `h` of their papers have at least `h` citations each. Given the citation counts, compute the h-index.',
    params: [P.intArray('citations', 'the citation count of each paper', 'n')],
    outputFormat: 'A single integer — the h-index.',
    constraints: ['1 <= n <= 5000', '0 <= citations[i] <= 1000'],
    samples: [[[3, 0, 6, 1, 5]], [[1, 3, 1]], [[0]]],
    solve: ([c]) => {
      const s = c.slice().sort((a, b) => b - a);
      let h = 0;
      while (h < s.length && s[h] > h) h++;
      return F.num(h);
    },
    gen: (r) => [r.ints(r.int(1, 25), 0, 20)],
  }),

  problem({
    title: 'Wiggle Sort Arrangement',
    difficulty: 'MEDIUM',
    topics: ['Sorting', 'Greedy', 'Array'],
    statement:
      'Rearrange `nums` so that `nums[0] <= nums[1] >= nums[2] <= nums[3] ...`.\n\nTo keep the answer unique, produce the arrangement obtained by sorting the array and then swapping each adjacent pair starting at index 1.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single line of n space-separated integers — the wiggle arrangement.',
    constraints: ['1 <= n <= 5 * 10^4', '-10^9 <= nums[i] <= 10^9'],
    samples: [[[3, 5, 2, 1, 6, 4]], [[1]], [[6, 6, 5, 6, 3, 8]]],
    solve: ([nums]) => {
      const a = asc(nums);
      for (let i = 1; i + 1 < a.length; i += 2) [a[i], a[i + 1]] = [a[i + 1], a[i]];
      return F.arr(a);
    },
    gen: (r) => [r.ints(r.int(1, 25), -30, 30)],
  }),

  problem({
    title: 'Merge Sort Inversion Count',
    difficulty: 'HARD',
    topics: ['Sorting', 'Divide and Conquer', 'Merge Sort'],
    statement:
      'An inversion is a pair of indices `i < j` with `nums[i] > nums[j]`. Count the inversions in the array.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the number of inversions.',
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    samples: [[[2, 4, 1, 3, 5]], [[5, 4, 3, 2, 1]], [[1, 2, 3]]],
    explain: (_a, out) => `${out} pair(s) appear out of order.`,
    solve: ([nums]) => {
      let count = 0;
      const sortRec = (arr) => {
        if (arr.length < 2) return arr;
        const mid = arr.length >> 1;
        const l = sortRec(arr.slice(0, mid)), r2 = sortRec(arr.slice(mid));
        const out = [];
        let i = 0, j = 0;
        while (i < l.length && j < r2.length) {
          if (l[i] <= r2[j]) out.push(l[i++]);
          else { count += l.length - i; out.push(r2[j++]); }
        }
        while (i < l.length) out.push(l[i++]);
        while (j < r2.length) out.push(r2[j++]);
        return out;
      };
      sortRec(nums);
      return F.num(count);
    },
    gen: (r) => [r.ints(r.int(1, 40), -40, 40)],
  }),

  problem({
    title: 'Count Smaller Numbers After Self',
    difficulty: 'HARD',
    topics: ['Sorting', 'Binary Indexed Tree', 'Merge Sort'],
    statement:
      'For each index `i`, count how many elements to the right of `nums[i]` are strictly smaller than it.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single line of n space-separated integers — the counts, in index order.',
    constraints: ['1 <= n <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    samples: [[[5, 2, 6, 1]], [[-1]], [[-1, -1]]],
    solve: ([nums]) => {
      const n = nums.length, out = Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (nums[j] < nums[i]) out[i]++;
      return F.arr(out);
    },
    gen: (r) => [r.ints(r.int(1, 40), -25, 25)],
  }),

  problem({
    title: 'Largest Number From Array',
    difficulty: 'MEDIUM',
    topics: ['Sorting', 'Greedy', 'String'],
    statement:
      'Given a list of non-negative integers, arrange them so that concatenating their decimal representations forms the largest possible number.',
    params: [P.intArray('nums', 'the non-negative values', 'n')],
    outputFormat: 'A single line containing the largest number that can be formed, without leading zeroes unless the answer is `0`.',
    constraints: ['1 <= n <= 100', '0 <= nums[i] <= 10^9'],
    samples: [[[10, 2]], [[3, 30, 34, 5, 9]], [[0, 0]]],
    solve: ([nums]) => {
      const s = nums.map(String).sort((a, b) => (b + a).localeCompare(a + b));
      const out = s.join('');
      return out[0] === '0' ? '0' : out;
    },
    gen: (r) => [r.ints(r.int(1, 12), 0, 999)],
  }),

  problem({
    title: 'Sort Array by Digit Sum',
    difficulty: 'EASY',
    topics: ['Sorting', 'Math', 'Array'],
    statement:
      'Sort the array in increasing order of the sum of the decimal digits of each value. Values with the same digit sum keep their original relative order.',
    params: [P.intArray('nums', 'the non-negative values', 'n')],
    outputFormat: 'A single line of n space-separated integers — the sorted array.',
    constraints: ['1 <= n <= 10^4', '0 <= nums[i] <= 10^9'],
    samples: [[[12, 21, 3, 100]], [[5]], [[19, 91, 10]]],
    solve: ([nums]) => {
      const ds = (x) => String(x).split('').reduce((a, c) => a + +c, 0);
      return F.arr(nums.map((v, i) => [v, i]).sort((a, b) => ds(a[0]) - ds(b[0]) || a[1] - b[1]).map((e) => e[0]));
    },
    gen: (r) => [r.ints(r.int(1, 25), 0, 9999)],
  }),

  problem({
    title: 'Minimum Absolute Difference Pairs',
    difficulty: 'EASY',
    topics: ['Sorting', 'Array'],
    statement:
      'Given an array of distinct integers, find all pairs of elements with the minimum absolute difference, listed in increasing order of the first element.',
    params: [P.intArray('nums', 'the distinct values', 'n')],
    outputFormat: 'The number of pairs on the first line, then one pair per line as two space-separated integers in increasing order.',
    constraints: ['2 <= n <= 10^5', '-10^6 <= nums[i] <= 10^6', 'All values are distinct.'],
    samples: [[[4, 2, 1, 3]], [[1, 3, 6, 10, 15]], [[3, 8, -10, 23, 19, -4, -14, 27]]],
    solve: ([nums]) => {
      const a = asc(nums);
      let best = Infinity;
      for (let i = 1; i < a.length; i++) best = Math.min(best, a[i] - a[i - 1]);
      const out = [];
      for (let i = 1; i < a.length; i++) if (a[i] - a[i - 1] === best) out.push([a[i - 1], a[i]]);
      return F.countedRows(out);
    },
    gen: (r) => { const s = [...new Set(r.ints(r.int(2, 25), -60, 60))]; return s.length >= 2 ? [s] : null; },
  }),

  problem({
    title: 'Capacity of Consecutive Rooms',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Greedy', 'Array'],
    statement:
      'You have `n` rooms with the given capacities, and you must seat `groups` groups. Each group takes one whole room, and a room can seat a group only if its capacity is at least the group size.\n\nAll groups have the same size `s`. Find the largest `s` such that every group can be seated.',
    params: [P.intArray('capacities', 'the room capacities', 'n'), P.int('groups', 'the number of groups to seat')],
    outputFormat: 'A single integer — the largest workable group size, or 0 if there are not enough rooms.',
    constraints: ['1 <= n <= 10^5', '1 <= capacities[i] <= 10^9', '1 <= groups <= 10^5'],
    samples: [[[5, 3, 8, 1], 2], [[2, 2, 2], 3], [[4], 5]],
    solve: ([cap, groups]) => {
      if (groups > cap.length) return '0';
      const s = cap.slice().sort((a, b) => b - a);
      return F.num(s[groups - 1]);
    },
    gen: (r) => [r.ints(r.int(1, 20), 1, 50), r.int(1, 25)],
  }),

  problem({
    title: 'Find Duplicate Number',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Two Pointers', 'Array'],
    statement:
      'An array `nums` of `n + 1` integers holds values in the range `[1, n]`. Exactly one value is repeated (possibly many times). Find it without modifying the array.',
    params: [P.intArray('nums', 'the n+1 values, each in [1, n]', 'len')],
    outputFormat: 'A single integer — the repeated value.',
    constraints: ['2 <= len <= 10^5', '1 <= nums[i] <= len - 1', 'Exactly one value appears more than once.'],
    samples: [[[1, 3, 4, 2, 2]], [[3, 1, 3, 4, 2]], [[1, 1]]],
    solve: ([nums]) => {
      let slow = nums[0], fast = nums[0];
      do { slow = nums[slow]; fast = nums[nums[fast]]; } while (slow !== fast);
      slow = nums[0];
      while (slow !== fast) { slow = nums[slow]; fast = nums[fast]; }
      return F.num(slow);
    },
    gen: (r) => {
      const n = r.int(1, 25);
      const dup = r.int(1, n);
      const base = Array.from({ length: n }, (_, i) => i + 1).filter((v) => v !== dup);
      const arr = [...base, dup, dup];
      while (arr.length < n + 1) arr.push(dup);
      return [r.shuffle(arr.slice(0, n + 1))];
    },
  }),

  problem({
    title: 'Single Element in Sorted Array',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Array'],
    statement:
      'A sorted array contains every element exactly twice except one, which appears once. Find that single element in O(log n) time.',
    params: [P.intArray('nums', 'the sorted array', 'n')],
    outputFormat: 'A single integer — the element that appears exactly once.',
    constraints: ['1 <= n <= 10^5', 'n is odd.', '0 <= nums[i] <= 10^5', 'nums is sorted; every value but one appears exactly twice.'],
    samples: [[[1, 1, 2, 3, 3, 4, 4, 8, 8]], [[3, 3, 7, 7, 10, 11, 11]], [[1]]],
    solve: ([nums]) => {
      let lo = 0, hi = nums.length - 1;
      while (lo < hi) {
        let mid = (lo + hi) >> 1;
        if (mid % 2 === 1) mid--;
        if (nums[mid] === nums[mid + 1]) lo = mid + 2; else hi = mid;
      }
      return F.num(nums[lo]);
    },
    gen: (r) => {
      const vals = [...new Set(r.ints(r.int(1, 15), 0, 60))];
      const single = r.pick(vals);
      const out = [];
      for (const v of vals) { out.push(v); if (v !== single) out.push(v); }
      return [asc(out)];
    },
  }),

  problem({
    title: 'Search a 2D Matrix',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Matrix'],
    statement:
      'You are given a matrix where each row is sorted in increasing order and the first value of each row is greater than the last value of the previous row. Determine whether a `target` value is present.',
    params: [P.grid('matrix', 'the fully sorted matrix'), P.int('target', 'the value to find')],
    outputFormat: 'Print `true` if target is in the matrix, otherwise print `false`.',
    constraints: ['1 <= rows, cols <= 100', '-10^4 <= matrix[i][j], target <= 10^4'],
    samples: [[[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], [[[1]], 1]],
    solve: ([m, target]) => {
      const flat = m.flat();
      let lo = 0, hi = flat.length - 1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (flat[mid] === target) return F.bool(true); flat[mid] < target ? (lo = mid + 1) : (hi = mid - 1); }
      return F.bool(false);
    },
    gen: (r) => {
      const rows = r.int(1, 6), cols = r.int(1, 6);
      const vals = asc([...new Set(r.ints(rows * cols * 2, -50, 50))]).slice(0, rows * cols);
      if (vals.length < rows * cols) return null;
      const m = Array.from({ length: rows }, (_, i) => vals.slice(i * cols, i * cols + cols));
      return [m, r.bool(0.6) ? r.pick(vals) : r.int(-55, 55)];
    },
  }),

  problem({
    title: 'Search 2D Matrix Sorted Rows and Columns',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Matrix', 'Divide and Conquer'],
    statement:
      'Given a matrix in which every row is sorted left to right and every column is sorted top to bottom, determine whether a `target` value is present.',
    params: [P.grid('matrix', 'the matrix with sorted rows and columns'), P.int('target', 'the value to find')],
    outputFormat: 'Print `true` if target is in the matrix, otherwise print `false`.',
    constraints: ['1 <= rows, cols <= 300', '-10^9 <= matrix[i][j], target <= 10^9'],
    samples: [[[[1, 4, 7], [2, 5, 8], [3, 6, 9]], 5], [[[1, 4, 7], [2, 5, 8], [3, 6, 9]], 0], [[[5]], 5]],
    solve: ([m, target]) => {
      let i = 0, j = m[0].length - 1;
      while (i < m.length && j >= 0) {
        if (m[i][j] === target) return F.bool(true);
        m[i][j] > target ? j-- : i++;
      }
      return F.bool(false);
    },
    gen: (r) => {
      const rows = r.int(1, 6), cols = r.int(1, 6);
      const m = Array.from({ length: rows }, () => Array(cols).fill(0));
      for (let i = 0; i < rows; i++)
        for (let j = 0; j < cols; j++)
          m[i][j] = Math.max(i > 0 ? m[i - 1][j] : -20, j > 0 ? m[i][j - 1] : -20) + r.int(1, 4);
      return [m, r.bool(0.6) ? m[r.int(0, rows - 1)][r.int(0, cols - 1)] : r.int(-25, 60)];
    },
  }),

  problem({
    title: 'Find Smallest Missing Positive',
    difficulty: 'HARD',
    topics: ['Array', 'Hash Table', 'Sorting'],
    statement:
      'Given an unsorted array `nums`, find the smallest strictly positive integer that does not appear in it.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the smallest missing positive integer.',
    constraints: ['1 <= n <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],
    samples: [[[1, 2, 0]], [[3, 4, -1, 1]], [[7, 8, 9, 11, 12]]],
    solve: ([nums]) => {
      const s = new Set(nums);
      let k = 1;
      while (s.has(k)) k++;
      return F.num(k);
    },
    gen: (r) => [r.ints(r.int(1, 30), -10, 20)],
  }),

  problem({
    title: 'Guess Number Higher or Lower',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Simulation'],
    statement:
      'A number is picked from `1` to `n`. You are told, for a sequence of guesses made by classic binary search over `[1, n]`, how many guesses it takes to find the target.\n\nGiven `n` and the target, report the number of guesses standard binary search needs.',
    params: [P.ints(['n', 'target'], 'the upper bound of the range and the number to find')],
    outputFormat: 'A single integer — the number of guesses binary search makes, counting the successful one.',
    constraints: ['1 <= target <= n <= 2^31 - 1'],
    samples: [[[10, 6]], [[1, 1]], [[100, 1]]],
    notes: 'Each guess is the midpoint `lo + floor((hi - lo) / 2)` of the current range.',
    solve: ([[n, target]]) => {
      let lo = 1, hi = n, guesses = 0;
      while (lo <= hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        guesses++;
        if (mid === target) break;
        mid < target ? (lo = mid + 1) : (hi = mid - 1);
      }
      return F.num(guesses);
    },
    gen: (r) => { const n = r.int(1, 100000); return [[n, r.int(1, n)]]; },
  }),

  problem({
    title: 'Minimum Rotations to Sorted',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Array'],
    statement:
      'A sorted array of distinct values was rotated right some number of times. Given the result, report how many rotations were applied.',
    params: [P.intArray('nums', 'the rotated array of distinct values', 'n')],
    outputFormat: 'A single integer — the number of rotations, which is the index of the smallest element.',
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9', 'All values are distinct.'],
    samples: [[[15, 18, 2, 3, 6, 12]], [[7, 9, 11, 12, 5]], [[1, 2, 3]]],
    solve: ([nums]) => {
      let lo = 0, hi = nums.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; nums[mid] > nums[hi] ? (lo = mid + 1) : (hi = mid); }
      return F.num(lo);
    },
    gen: (r) => {
      const base = asc([...new Set(r.ints(r.int(1, 25), -50, 50))]);
      const k = r.int(0, base.length - 1);
      return [[...base.slice(base.length - k), ...base.slice(0, base.length - k)]];
    },
  }),

  problem({
    title: 'Count Occurrences in Sorted Array',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Array'],
    statement: 'Given a sorted array and a target value, count how many times the target occurs.',
    params: [P.intArray('nums', 'the sorted array', 'n'), P.int('target', 'the value to count')],
    outputFormat: 'A single integer — the number of occurrences of target.',
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i], target <= 10^9', 'nums is sorted in non-decreasing order.'],
    samples: [[[1, 1, 2, 2, 2, 3], 2], [[1, 2, 3], 4], [[5, 5, 5], 5]],
    solve: ([nums, target]) => {
      const bound = (t) => { let lo = 0, hi = nums.length; while (lo < hi) { const m = (lo + hi) >> 1; nums[m] < t ? (lo = m + 1) : (hi = m); } return lo; };
      return F.num(bound(target + 1) - bound(target));
    },
    gen: (r) => { const nums = asc(r.ints(r.int(1, 30), -8, 8)); return [nums, r.int(-10, 10)]; },
  }),

  problem({
    title: 'Nth Ugly Number',
    difficulty: 'MEDIUM',
    topics: ['Dynamic Programming', 'Heap', 'Math'],
    statement:
      'An ugly number has no prime factors other than 2, 3 and 5. The sequence starts `1, 2, 3, 4, 5, 6, 8, 9, 10, 12, ...`.\n\nReturn the n-th ugly number.',
    params: [P.int('n', 'the 1-based index in the sequence')],
    outputFormat: 'A single integer — the n-th ugly number.',
    constraints: ['1 <= n <= 1690'],
    samples: [[1], [10], [7]],
    solve: ([n]) => {
      const u = [1];
      let i2 = 0, i3 = 0, i5 = 0;
      while (u.length < n) {
        const next = Math.min(u[i2] * 2, u[i3] * 3, u[i5] * 5);
        u.push(next);
        if (next === u[i2] * 2) i2++;
        if (next === u[i3] * 3) i3++;
        if (next === u[i5] * 5) i5++;
      }
      return F.num(u[n - 1]);
    },
    gen: (r) => [r.int(1, 1500)],
  }),

  problem({
    title: 'Find Rotation Point in Words',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'String', 'Array'],
    statement:
      'An alphabetically sorted list of distinct words was rotated. Find the index of the alphabetically first word.',
    params: [P.strArray('words', 'the rotated sorted words', 'n')],
    outputFormat: 'A single integer — the index of the alphabetically smallest word.',
    constraints: ['1 <= n <= 10^5', '1 <= |words[i]| <= 20', 'All words are distinct lowercase strings.'],
    samples: [[['ptolemaic', 'retrograde', 'supplant', 'asymptote', 'babka', 'banoffee']], [['a']], [['b', 'c', 'a']]],
    solve: ([words]) => {
      let lo = 0, hi = words.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; words[mid] > words[hi] ? (lo = mid + 1) : (hi = mid); }
      return F.num(lo);
    },
    gen: (r) => {
      const base = [...new Set(Array.from({ length: r.int(1, 15) }, () => r.word(r.int(1, 6))))].sort();
      const k = r.int(0, base.length - 1);
      return [[...base.slice(k), ...base.slice(0, k)]];
    },
  }),

  problem({
    title: 'Maximum Value Smaller Than Target',
    difficulty: 'EASY',
    topics: ['Binary Search', 'Array', 'Sorting'],
    statement:
      'Given an array `nums` and a `target`, find the largest element strictly smaller than the target.',
    params: [P.intArray('nums', 'the array elements', 'n'), P.int('target', 'the exclusive upper bound')],
    outputFormat: 'A single integer — the largest element below target, or the word `NONE` if no element qualifies.',
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i], target <= 10^9'],
    samples: [[[1, 5, 3, 9], 5], [[10, 20], 5], [[-3, -7], 0]],
    solve: ([nums, target]) => {
      const cand = nums.filter((x) => x < target);
      return cand.length ? F.num(Math.max(...cand)) : 'NONE';
    },
    gen: (r) => [r.ints(r.int(1, 25), -50, 50), r.int(-55, 55)],
  }),

  problem({
    title: 'Longest Increasing Subsequence Length',
    difficulty: 'MEDIUM',
    topics: ['Binary Search', 'Dynamic Programming', 'Array'],
    statement:
      'Given an array `nums`, return the length of its longest strictly increasing subsequence.',
    params: [P.intArray('nums', 'the array elements', 'n')],
    outputFormat: 'A single integer — the length of the longest strictly increasing subsequence.',
    constraints: ['1 <= n <= 2500', '-10^4 <= nums[i] <= 10^4'],
    samples: [[[10, 9, 2, 5, 3, 7, 101, 18]], [[0, 1, 0, 3, 2, 3]], [[7, 7, 7, 7]]],
    solve: ([nums]) => {
      const tails = [];
      for (const x of nums) {
        let lo = 0, hi = tails.length;
        while (lo < hi) { const mid = (lo + hi) >> 1; tails[mid] < x ? (lo = mid + 1) : (hi = mid); }
        tails[lo] = x;
      }
      return F.num(tails.length);
    },
    gen: (r) => [r.ints(r.int(1, 35), -20, 20)],
  }),

  problem({
    title: 'Minimize Maximum Distance Between Gas Stations',
    difficulty: 'HARD',
    topics: ['Binary Search', 'Greedy', 'Array'],
    statement:
      'Gas stations sit at the given increasing positions along a road. You may add `k` more stations anywhere.\n\nMinimise the largest gap between adjacent stations, and report that gap multiplied by `10^6` and rounded down, so the answer is an integer.',
    params: [P.intArray('positions', 'the existing station positions, strictly increasing', 'n'), P.int('k', 'the number of stations you may add')],
    outputFormat: 'A single integer — floor(minimal largest gap * 10^6).',
    constraints: ['2 <= n <= 2000', '0 <= positions[i] <= 10^8', 'positions is strictly increasing.', '1 <= k <= 10^5'],
    samples: [[[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 9], [[0, 10], 1], [[0, 4, 10], 2]],
    solve: ([p, k]) => {
      const fits = (d) => {
        let need = 0;
        for (let i = 1; i < p.length; i++) need += Math.floor((p[i] - p[i - 1]) / d);
        return need <= k;
      };
      let lo = 0, hi = p[p.length - 1] - p[0];
      for (let iter = 0; iter < 100; iter++) {
        const mid = (lo + hi) / 2;
        if (mid <= 0) break;
        fits(mid) ? (hi = mid) : (lo = mid);
      }
      return F.num(Math.floor(hi * 1e6));
    },
    gen: (r) => {
      const n = r.int(2, 12);
      const p = [r.int(0, 5)];
      for (let i = 1; i < n; i++) p.push(p[i - 1] + r.int(1, 20));
      return [p, r.int(1, 15)];
    },
  }),
];
