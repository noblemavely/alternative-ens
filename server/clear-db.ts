import { getDb } from './db';
import { users, clients, experts, expertEmployment, expertEducation, projects, screeningQuestions, shortlists, expertVerification, expertClientMapping, clientContacts } from '../drizzle/schema';

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Delete in order of dependencies (foreign keys)
    await db.delete(expertClientMapping);
    await db.delete(clientContacts);
    await db.delete(shortlists);
    await db.delete(screeningQuestions);
    await db.delete(expertEmployment);
    await db.delete(expertEducation);
    await db.delete(expertVerification);
    await db.delete(experts);
    await db.delete(projects);
    await db.delete(clients);
    await db.delete(users);
    
    console.log('✅ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
