const mysql = require('mysql2/promise');
const fs = require('fs');

async function executeMigration() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

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
    console.log('✅ Migration completed');
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

executeMigration();
