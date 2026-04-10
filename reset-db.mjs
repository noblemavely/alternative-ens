import { getDb } from './server/db.ts';
import { users, clients, experts, projects, expertEmployment, expertEducation, shortlists, screeningQuestions, expertVerification } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
  try {
    const db = await getDb();
    console.log('🧹 Resetting database...\n');
    
    // Delete in reverse order of dependencies
    await db.delete(expertVerification);
    console.log('✓ Cleared expertVerification');
    
    await db.delete(shortlists);
    console.log('✓ Cleared shortlists');
    
    await db.delete(screeningQuestions);
    console.log('✓ Cleared screeningQuestions');
    
    await db.delete(projects);
    console.log('✓ Cleared projects');
    
    await db.delete(expertEducation);
    console.log('✓ Cleared expertEducation');
    
    await db.delete(expertEmployment);
    console.log('✓ Cleared expertEmployment');
    
    await db.delete(experts);
    console.log('✓ Cleared experts');
    
    await db.delete(clients);
    console.log('✓ Cleared clients');
    
    await db.delete(users);
    console.log('✓ Cleared users');
    
    console.log('\n✅ Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetDatabase();
