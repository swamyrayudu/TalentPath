/**
 * Metadata only — deliberately free of any `import` of the sheet JSON so client
 * components can list the sheets without pulling every problem into the bundle.
 * Keep the counts in step with the JSON when a sheet is added or refreshed.
 */
export interface SheetSummary {
  slug: string;
  name: string;
  author: string;
  description: string;
  problemCount: number;
  stepCount: number;
  /** Sheets whose source does not grade problems hide the difficulty split. */
  graded?: boolean;
}

export const SHEET_CATALOG: SheetSummary[] = [
  {
    slug: 'striver-a2z',
    name: "Striver's A2Z DSA Sheet",
    author: 'takeUforward',
    description:
      'A structured A-to-Z path — language basics through advanced graphs and DP.',
    problemCount: 474,
    stepCount: 18,
    graded: true,
  },
  {
    slug: 'striver-sde',
    name: "Striver's SDE Sheet",
    author: 'takeUforward',
    description:
      'The classic interview crunch — top coding-round problems, grouped day by day.',
    problemCount: 191,
    stepCount: 27,
    graded: true,
  },
  {
    slug: 'neetcode-150',
    name: 'NeetCode 150',
    author: 'NeetCode',
    description: 'The 150 problems that cover every core interview pattern.',
    problemCount: 150,
    stepCount: 18,
    graded: true,
  },
  {
    slug: 'blind-75',
    name: 'Blind 75',
    author: 'NeetCode',
    description: 'The original short list for when interviews are only weeks away.',
    problemCount: 75,
    stepCount: 18,
    graded: true,
  },
  {
    slug: 'dsa-450',
    name: '450 DSA Cracker',
    author: 'Love Babbar',
    description:
      'Topic-wise breadth across 15 areas — from arrays to dynamic programming.',
    problemCount: 448,
    stepCount: 15,
    graded: false,
  },
];
