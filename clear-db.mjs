import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function confirmDeletion() {
  return new Promise((resolve) => {
    rl.question(
      '⚠️  WARNING: This will DELETE ALL DATA from the database. Type "yes" to confirm: ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function clearDatabase() {
  let connection;
  try {
    // Ask for confirmation before proceeding
    const confirmed = await confirmDeletion();
    if (!confirmed) {
      console.log('❌ Deletion cancelled.');
      process.exit(0);
    }

    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {
        rejectUnauthorized: false,
      },
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');

    // Clear all data in reverse order of dependencies
    console.log('🗑️  Clearing all data...');

    const tables = [
      'auditLog',
      'expertVerification',
      'shortlists',
      'expertClientMapping',
      'screeningQuestions',
      'projects',
      'expertEducation',
      'expertEmployment',
      'experts',
      'clientContacts',
      'clients',
      'adminUsers',
      'functions',
      'sectors',
    ];

    for (const table of tables) {
      try {
        await connection.execute(`DELETE FROM ${table}`);
        console.log(`  ✓ Cleared ${table}`);
      } catch (error) {
        // Table might not exist or be empty, continue
        if (!error.message.includes('Table') && !error.message.includes('1146')) {
          console.warn(`  ⚠ Warning clearing ${table}: ${error.message}`);
        }
      }
    }

    console.log('✅ All data cleared successfully');
    console.log('📊 Tables are now empty and ready for fresh seed data');
    console.log('💡 Tip: Run "node seed-db.mjs" to populate sample data');

  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearDatabase().catch((error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});
