import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

/** Read DATABASE_URL out of .env without pulling in a dotenv dependency. */
export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) throw new Error('DATABASE_URL is not set and no .env file was found');
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in .env');
  return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

export function connect(opts = {}) {
  return postgres(databaseUrl(), { max: 4, ...opts });
}
