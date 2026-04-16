import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdminUser() {
  let connection;
  try {
    // Parse DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);
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

    // Hash the password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM admin_users WHERE email = ?',
      ['admin@alternatives.nativeworld.com']
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists:', existingAdmin[0].email);
      console.log('   ID:', existingAdmin[0].id);
      console.log('   Name:', existingAdmin[0].name);
      console.log('   Role:', existingAdmin[0].role);
    } else {
      // Create admin user
      const [result] = await connection.execute(
        'INSERT INTO admin_users (email, password, name, role, isActive) VALUES (?, ?, ?, ?, ?)',
        ['admin@alternatives.nativeworld.com', hashedPassword, 'Admin User', 'super_admin', true]
      );

      console.log('✅ Admin user created successfully!');
      console.log('   ID:', result.insertId);
      console.log('   Email: admin@alternatives.nativeworld.com');
      console.log('   Password: admin123');
      console.log('   Role: super_admin');
    }

    console.log('\n📋 Admin Login Details:');
    console.log('   URL: https://alternatives.nativeworld.com/admin-login');
    console.log('   Email: admin@alternatives.nativeworld.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedAdminUser();
