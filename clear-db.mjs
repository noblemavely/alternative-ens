#!/usr/bin/env node
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

async function clearDatabase() {
  let connection;
  try {
    console.log('Connecting to database...');
    // Use SSL for TiDB Cloud
    connection = await mysql.createConnection({
      host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2pAYQFKqSzQZhTi.6b26c34e7b5e',
      password: 'xlejP51HvmhiHu211vo6',
      database: 'alternative_ens',
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });
    
    const db = drizzle(connection, { schema });

    console.log('Clearing test data...');
    
    // Delete in reverse order of dependencies
    await db.delete(schema.shortlists).execute();
    console.log('✓ Deleted shortlists');
    
    await db.delete(schema.expertVerification).execute();
    console.log('✓ Deleted expertVerification');
    
    await db.delete(schema.expertEducation).execute();
    console.log('✓ Deleted expertEducation');
    
    await db.delete(schema.expertEmployment).execute();
    console.log('✓ Deleted expertEmployment');
    
    await db.delete(schema.experts).execute();
    console.log('✓ Deleted experts');
    
    await db.delete(schema.screeningQuestions).execute();
    console.log('✓ Deleted screeningQuestions');
    
    await db.delete(schema.projects).execute();
    console.log('✓ Deleted projects');
    
    await db.delete(schema.clients).execute();
    console.log('✓ Deleted clients');
    
    // Delete only non-admin users
    await db.delete(schema.users).where(schema.users.role === 'user').execute();
    console.log('✓ Deleted user accounts (kept admin)');

    console.log('\n✅ Database cleared successfully!');
    
    // Show remaining counts
    const userCount = await db.select({ count: schema.users.id }).from(schema.users).execute();
    const clientCount = await db.select({ count: schema.clients.id }).from(schema.clients).execute();
    const expertCount = await db.select({ count: schema.experts.id }).from(schema.experts).execute();
    
    console.log('\nRemaining data:');
    console.log(`- Users: ${userCount.length}`);
    console.log(`- Clients: ${clientCount.length}`);
    console.log(`- Experts: ${expertCount.length}`);
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

clearDatabase();
