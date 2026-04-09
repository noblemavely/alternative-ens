import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Clear shortlists table
  await connection.execute('DELETE FROM shortlists');
  console.log('✓ Shortlists table cleared');
  
  // Optionally clear other test data
  // await connection.execute('DELETE FROM experts WHERE email LIKE "%test%"');
  // await connection.execute('DELETE FROM projects WHERE name LIKE "%test%"');
  // await connection.execute('DELETE FROM clients WHERE name LIKE "%test%"');
  
  console.log('Data cleared successfully');
} catch (error) {
  console.error('Error clearing data:', error);
} finally {
  await connection.end();
}
