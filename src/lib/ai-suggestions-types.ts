export type SuggestionFocus =
  | 'daily'
  | 'dsa'
  | 'aptitude'
  | 'contest'
  | 'interview'
  | 'roadmap'
  | 'jobs';

export interface Suggestion {
  title: string;
  detail: string;
  focus: SuggestionFocus;
}

export interface LearnerProfile {
  solvedTotal: number;
  easy: number;
  medium: number;
  hard: number;
  solvedThisWeek: number;
  daysSinceLastSolve: number | null;
  topTopics: string[];
  missingTopics: string[];
  aptitudeTests: number;
  aptitudeAverage: number;
  aptitudeWeakest: { topic: string; score: number } | null;
  aptitudeStrongest: { topic: string; score: number } | null;
  contestSubmissions: number;
  contestAcceptance: number | null;
  contestSolved: number;
  dailyStreak: number;
  dailyLongest: number;
  dailyThisMonth: number;
  dailySolvedToday: boolean;
  interviewsCompleted: number;
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  source: 'ai' | 'rules';
  generatedAt: string;
}

export const FOCUS_LINKS: Record<SuggestionFocus, { href: string; label: string }> = {
  daily: { href: '/dsasheet#daily-problem', label: 'Today’s problem' },
  dsa: { href: '/dsasheet', label: 'Open DSA sheet' },
  aptitude: { href: '/aptitude', label: 'Take a test' },
  contest: { href: '/contest', label: 'Browse contests' },
  interview: { href: '/interview', label: 'Mock interview' },
  roadmap: { href: '/roadmap', label: 'View roadmap' },
  jobs: { href: '/jobs', label: 'See jobs' },
};

export const CORE_TOPICS = [
  'Array',
  'String',
  'Hash Table',
  'Two Pointers',
  'Binary Search',
  'Sliding Window',
  'Linked List',
  'Stack',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Heap (Priority Queue)',
];
