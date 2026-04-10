import { drizzle } from 'drizzle-orm/mysql2/driver';
import mysql from 'mysql2/promise';
import fs from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(dbUrl);
const migrationSql = fs.readFileSync('./drizzle/0004_violet_kitty_pryde.sql', 'utf-8');

try {
  // Split by semicolon and execute each statement
  const statements = migrationSql.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      console.log('Executing:', stmt.trim().substring(0, 50) + '...');
      await connection.execute(stmt);
    }
  }
  console.log('Migration executed successfully');
} catch (error) {
  console.error('Migration error:', error.message);
} finally {
  await connection.end();
}
