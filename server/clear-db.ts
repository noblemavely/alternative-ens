import { db } from './db';
import { users, clients, experts, expertEmployment, expertEducation, projects, screeningQuestions, shortlists, expertVerification } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    
    // Delete in order of dependencies (foreign keys)
    await db.execute(sql`DELETE FROM expertVerification`);
    await db.execute(sql`DELETE FROM shortlists`);
    await db.execute(sql`DELETE FROM screeningQuestions`);
    await db.execute(sql`DELETE FROM projects`);
    await db.execute(sql`DELETE FROM expertEducation`);
    await db.execute(sql`DELETE FROM expertEmployment`);
    await db.execute(sql`DELETE FROM experts`);
    await db.execute(sql`DELETE FROM clients`);
    await db.execute(sql`DELETE FROM users`);
    
    console.log('✅ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
