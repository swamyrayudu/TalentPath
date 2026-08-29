import striverA2z from './striver-a2z.json';
import striverSde from './striver-sde.json';
import neetcode150 from './neetcode-150.json';
import blind75 from './blind-75.json';
import dsa450 from './dsa-450.json';

export type SheetDifficulty = 'easy' | 'medium' | 'hard';

export interface SheetProblem {
  id: string;
  title: string;
  /** Absent on sheets whose source does not grade problems (e.g. the 450 sheet). */
  difficulty?: SheetDifficulty;
  /** Where "solve" points — the LeetCode problem when there is one. */
  url?: string;
  leetcodeUrl?: string;
  articleUrl?: string;
  videoUrl?: string;
  /** A second practice site for the same problem, where the source lists one. */
  altUrl?: string;
}

export interface SheetSubStep {
  title: string;
  problems: SheetProblem[];
}

export interface SheetStep {
  slug: string;
  /** Short label used in the UI. */
  title: string;
  /** The step name as the original sheet writes it. */
  fullTitle: string;
  subSteps: SheetSubStep[];
}

export interface Sheet {
  slug: string;
  name: string;
  author: string;
  sourceUrl: string;
  description: string;
  steps: SheetStep[];
}

/**
 * Curated sheets, kept as static data rather than DB rows: they change a few
 * times a year, and shipping them as JSON keeps the pages renderable without a
 * query. Add a new sheet by dropping its JSON in this folder and listing it here.
 */
export const SHEETS: Sheet[] = [
  striverA2z as Sheet,
  striverSde as Sheet,
  neetcode150 as Sheet,
  blind75 as Sheet,
  dsa450 as Sheet,
];

export function getSheet(slug: string): Sheet | undefined {
  return SHEETS.find((sheet) => sheet.slug === slug);
}

export function getStep(sheet: Sheet, stepSlug: string): SheetStep | undefined {
  return sheet.steps.find((step) => step.slug === stepSlug);
}

export function stepProblems(step: SheetStep): SheetProblem[] {
  return step.subSteps.flatMap((sub) => sub.problems);
}

export function sheetProblems(sheet: Sheet): SheetProblem[] {
  return sheet.steps.flatMap(stepProblems);
}

export function countByDifficulty(problems: SheetProblem[]) {
  return {
    easy: problems.filter((p) => p.difficulty === 'easy').length,
    medium: problems.filter((p) => p.difficulty === 'medium').length,
    hard: problems.filter((p) => p.difficulty === 'hard').length,
  };
}

/** Whether a sheet grades its problems at all. */
export function hasDifficulty(problems: SheetProblem[]) {
  return problems.some((p) => !!p.difficulty);
}

/** Stable key for a problem's progress entry, unique across sheets. */
export function progressKey(sheetSlug: string, problemId: string) {
  return `${sheetSlug}:${problemId}`;
}
