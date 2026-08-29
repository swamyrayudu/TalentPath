// Auto-discovers every file in problems/. Each one default-exports an array of
// problem() definitions, and files load in filename order so the generated
// dataset stays stable between runs.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'problems');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();

const loaded = [];
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  if (!Array.isArray(mod.default)) throw new Error(`problems/${f} must default-export an array`);
  loaded.push(...mod.default);
}

export const ALL_PROBLEMS = loaded;
export const PROBLEM_FILES = files;
