import { createConnection } from 'mysql2/promise';

async function clearDatabase() {
  const connection = await createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🧹 Clearing all database tables...\n');
    
    // Delete in order of dependencies (foreign keys)
    const tables = [
      'expertVerification',
      'shortlists',
      'screeningQuestions',
      'projects',
      'expertEducation',
      'expertEmployment',
      'experts',
      'clients',
      'users',
    ];

    for (const table of tables) {
      await connection.execute(`DELETE FROM ${table}`);
      console.log(`✓ Cleared ${table}`);
    }

    console.log('\n✅ All tables cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

clearDatabase();
