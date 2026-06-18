import dotenv from 'dotenv';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dsaPatterns, patternProblems, visibleProblems } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL!;
console.log('Connecting to database...');

const client = postgres(connectionString);
const db = drizzle(client);

async function run() {
  try {
    console.log('Running query...');
    const patterns = await db
      .select({
        id: dsaPatterns.id,
        name: dsaPatterns.name,
        slug: dsaPatterns.slug,
        description: dsaPatterns.description,
        topic: dsaPatterns.topic,
        orderIndex: dsaPatterns.orderIndex,
        problemCount: sql<number>`cast(count(${visibleProblems.id}) as int)`,
        problemIds: sql<number[]>`coalesce(json_agg(${visibleProblems.id}) filter (where ${visibleProblems.id} is not null), '[]'::json)`
      })
      .from(dsaPatterns)
      .leftJoin(patternProblems, eq(dsaPatterns.id, patternProblems.patternId))
      .leftJoin(visibleProblems, eq(patternProblems.problemId, visibleProblems.id))
      .groupBy(dsaPatterns.id)
      .orderBy(dsaPatterns.orderIndex);

    console.log('Query succeeded! Results:');
    console.log(JSON.stringify(patterns, null, 2));
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await client.end();
    console.log('Done');
  }
}

run();
