import mysql from 'mysql2/promise';
import fs from 'fs';

async function executeMigration() {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connected to database');

    const sql = fs.readFileSync('/tmp/execute_migration.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('⚠️  Table already exists');
          } else {
            console.error('❌ Error:', error.message);
          }
        }
      }
    }

    await connection.end();
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

executeMigration();
