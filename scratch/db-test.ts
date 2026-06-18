import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
console.log('Using connection string:', connectionString ? connectionString.replace(/:[^:@]+@/, ':***@') : 'undefined');

async function test() {
  if (!connectionString) {
    console.error('DATABASE_URL is not set!');
    process.exit(1);
  }
  
  console.log('Connecting...');
  const sql = postgres(connectionString, { timeout: 5 });
  try {
    const result = await sql`SELECT 1 as val`;
    console.log('Query succeeded:', result);
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await sql.end();
    console.log('Connection closed');
  }
}

test();
