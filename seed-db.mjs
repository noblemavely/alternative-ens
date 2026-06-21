import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Helper functions for generating realistic data
const firstNames = ['Robert', 'Jennifer', 'Christopher', 'Amanda', 'Daniel', 'Jessica', 'Michael', 'Sarah', 'David', 'Lisa', 'James', 'Karen', 'John', 'Nancy', 'William', 'Margaret', 'Richard', 'Susan', 'Joseph', 'Patricia', 'Thomas', 'Barbara', 'Charles', 'Mary', 'Matthew', 'Elizabeth', 'Mark', 'Victoria', 'Andrew', 'Sandra'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const companyNames = ['TechCorp Inc', 'FinancePlus LLC', 'HealthCare Solutions', 'RetailMax Pro', 'ManufactureCo', 'CloudTech Systems', 'DataDrive Analytics', 'SecureNet Labs', 'InnovateLabs', 'FutureForce', 'GlobalTech Partners', 'VenturePro', 'TechVision Group', 'DigitalWorks', 'SmartSystems', 'ProTech Solutions', 'NextGen Industries', 'Quantum Computing Corp', 'Nexus Networks', 'Prime Analytics', 'Elite Consulting', 'Advanced Tech', 'Digital Innovations', 'Enterprise Solutions', 'Apex Systems', 'Core Technologies', 'Fusion Tech', 'Horizon Industries', 'Impact Ventures'];

const sectors = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'];
const functions = ['Chief Executive Officer', 'Chief Financial Officer', 'Chief Technology Officer', 'Vice President', 'Senior Manager', 'Product Manager'];
const roles = ['Hiring Manager', 'Project Lead', 'SPOC', 'VP', 'Director'];
const workTypes = ['Recruitment', 'Advisory', 'Research', 'Implementation', 'Strategy'];
const projectTypes = ['Call', 'Advisory', 'ID', 'Research', 'Engagement'];
const shortlistStatuses = ['pending', 'contacted', 'interested', 'engaged', 'rejected'];

function generateEmail(firstName, lastName, companyDomain) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyDomain}`;
}

function generatePhone() {
  return `+1-555-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

function generateCompanyDomain(companyName) {
  return companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.com';
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedDatabase() {
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

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await connection.execute('DELETE FROM expertVerification');
    await connection.execute('DELETE FROM shortlists');
    await connection.execute('DELETE FROM expertClientMapping');
    await connection.execute('DELETE FROM screeningQuestions');
    await connection.execute('DELETE FROM projectActivityEvents');
    await connection.execute('DELETE FROM projects');
    await connection.execute('DELETE FROM expertEducation');
    await connection.execute('DELETE FROM expertEmployment');
    await connection.execute('DELETE FROM experts');
    await connection.execute('DELETE FROM clientContacts');
    await connection.execute('DELETE FROM clients');
    await connection.execute('DELETE FROM functions');
    await connection.execute('DELETE FROM sectors');
    console.log('✅ Cleared existing data');

    // Seed Sectors
    console.log('📊 Seeding sectors...');
    const sectorNames = sectors;
    const sectorDescriptions = {
      'Technology': 'Software, IT, Cloud Computing, AI/ML',
      'Finance': 'Banking, Investment, Insurance, Fintech',
      'Healthcare': 'Pharmaceuticals, Medical Devices, Healthcare Services',
      'Manufacturing': 'Industrial, Automotive, Consumer Goods',
      'Retail': 'E-commerce, Brick & Mortar, Fashion'
    };

    for (const sector of sectorNames) {
      await connection.execute(
        'INSERT INTO sectors (name, description) VALUES (?, ?)',
        [sector, sectorDescriptions[sector]]
      );
    }
    console.log(`✅ Seeded ${sectorNames.length} sectors`);

    // Seed Functions
    console.log('📋 Seeding functions...');
    const functionDescriptions = {
      'Chief Executive Officer': 'C-level executive leadership',
      'Chief Financial Officer': 'Financial leadership and strategy',
      'Chief Technology Officer': 'Technology strategy and innovation',
      'Vice President': 'Senior management level',
      'Senior Manager': 'Management and operational level',
      'Product Manager': 'Product leadership and strategy'
    };

    for (const func of functions) {
      await connection.execute(
        'INSERT INTO functions (name, description) VALUES (?, ?)',
        [func, functionDescriptions[func]]
      );
    }
    console.log(`✅ Seeded ${functions.length} functions`);

    // Seed 30 Clients
    console.log('👥 Seeding 30 companies (clients)...');
    const clients = [];
    for (let i = 0; i < 30; i++) {
      const companyName = companyNames[i];
      const sector = getRandomItem(sectors);
      const contactPerson = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const domain = generateCompanyDomain(companyName);

      clients.push({
        name: companyName,
        phone: generatePhone(),
        companyWebsite: `https://${domain}`,
        contactPerson: contactPerson,
        sector: sector,
      });
    }

    const clientIds = [];
    for (const client of clients) {
      const [result] = await connection.execute(
        'INSERT INTO clients (name, phone, companyWebsite, contactPerson, sector) VALUES (?, ?, ?, ?, ?)',
        [client.name, client.phone, client.companyWebsite, client.contactPerson, client.sector]
      );
      clientIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${clients.length} companies`);

    // Seed ~90 Client Contacts (3 per company)
    console.log('📞 Seeding ~90 client contacts (3 per company)...');
    const clientContacts = [];
    for (let i = 0; i < clientIds.length; i++) {
      const domain = generateCompanyDomain(clients[i].name);
      for (let j = 0; j < 3; j++) {
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        clientContacts.push({
          clientId: clientIds[i],
          contactName: `${firstName} ${lastName}`,
          email: generateEmail(firstName, lastName, domain),
          phone: generatePhone(),
          role: getRandomItem(roles),
          workType: getRandomItem(workTypes),
        });
      }
    }

    const clientContactIds = [];
    for (const contact of clientContacts) {
      const [result] = await connection.execute(
        'INSERT INTO clientContacts (clientId, contactName, email, phone, role, workType, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [contact.clientId, contact.contactName, contact.email, contact.phone, contact.role, contact.workType, true]
      );
      clientContactIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${clientContacts.length} client contacts`);

    // Seed 200+ Experts
    console.log('👨‍💼 Seeding 200+ experts...');
    const experts = [];
    const usedEmails = new Set();

    for (let i = 0; i < 200; i++) {
      let email;
      do {
        const firstName = getRandomItem(firstNames);
        const lastName = getRandomItem(lastNames);
        email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@expertnetwork.com`;
      } while (usedEmails.has(email));

      usedEmails.add(email);
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);

      experts.push({
        email: email,
        phone: generatePhone(),
        firstName: firstName,
        lastName: lastName,
        sector: getRandomItem(sectors),
        function: getRandomItem(functions),
        biography: `Experienced professional with 10+ years in industry expertise and strategic advisory.`,
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
        isVerified: Math.random() > 0.3, // 70% verified
      });
    }

    const expertIds = [];
    for (const expert of experts) {
      const [result] = await connection.execute(
        'INSERT INTO experts (email, phone, firstName, lastName, sector, `function`, biography, linkedinUrl, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [expert.email, expert.phone, expert.firstName, expert.lastName, expert.sector, expert.function, expert.biography, expert.linkedinUrl, expert.isVerified]
      );
      expertIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${experts.length} experts`);

    // Seed ~150 Projects (5 per company)
    console.log('📁 Seeding ~150 projects (5 per company)...');
    const projects = [];
    const projectNames = [
      'Cloud Migration Initiative', 'AI/ML Expert Search', 'Financial Strategy Review',
      'Market Research', 'Digital Transformation', 'Regulatory Compliance Study',
      'Process Optimization', 'Technology Stack Evaluation', 'Data Analytics Platform',
      'Cybersecurity Assessment', 'Team Expansion Planning', 'M&A Advisory'
    ];

    for (let i = 0; i < clientContactIds.length; i++) {
      for (let j = 0; j < 5; j++) {
        const projectName = `${getRandomItem(projectNames)} - Phase ${j + 1}`;
        projects.push({
          clientContactId: clientContactIds[i],
          name: projectName,
          description: `Project to support strategic objectives and operational excellence.`,
          projectType: getRandomItem(projectTypes),
          targetCompanies: getRandomItem(['Fortune 500', 'Mid-cap', 'Startups', 'Global Enterprises']),
          targetPersona: `${getRandomItem(functions)} / Director level`,
          rate: (150 + Math.random() * 300).toFixed(2),
        });
      }
    }

    const projectIds = [];
    for (const project of projects) {
      const [result] = await connection.execute(
        'INSERT INTO projects (clientContactId, name, description, projectType, targetCompanies, targetPersona, rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project.clientContactId, project.name, project.description, project.projectType, project.targetCompanies, project.targetPersona, project.rate]
      );
      projectIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${projects.length} projects`);

    // Seed Screening Questions (~2 per project)
    console.log('❓ Seeding screening questions...');
    const questionTemplates = [
      'What is your experience with {field}?',
      'Have you worked with {technology}?',
      'What is your expertise in {domain}?',
      'How many years of experience do you have in {area}?',
      'Describe your experience with {skill}',
      'Have you led teams in {domain}?',
    ];

    let questionCount = 0;
    for (const projectId of projectIds) {
      for (let j = 0; j < 2; j++) {
        const question = getRandomItem(questionTemplates).replace('{field}', 'your domain').replace('{technology}', 'relevant technologies').replace('{domain}', 'your industry').replace('{area}', 'your field').replace('{skill}', 'required skills');

        await connection.execute(
          'INSERT INTO screeningQuestions (projectId, question, `order`) VALUES (?, ?, ?)',
          [projectId, question, j + 1]
        );
        questionCount++;
      }
    }
    console.log(`✅ Seeded ${questionCount} screening questions`);

    // Seed Shortlists (~3 per project on average)
    console.log('⭐ Seeding shortlist records...');
    let shortlistCount = 0;
    for (const projectId of projectIds) {
      const numExperts = Math.floor(Math.random() * 5) + 2; // 2-6 experts per project
      const selectedExperts = new Set();

      for (let i = 0; i < numExperts; i++) {
        let expertId;
        do {
          expertId = expertIds[Math.floor(Math.random() * expertIds.length)];
        } while (selectedExperts.has(expertId));

        selectedExperts.add(expertId);

        await connection.execute(
          'INSERT INTO shortlists (projectId, expertId, status, notes) VALUES (?, ?, ?, ?)',
          [projectId, expertId, getRandomItem(shortlistStatuses), 'Expert shortlisted for project engagement']
        );
        shortlistCount++;
      }
    }
    console.log(`✅ Seeded ${shortlistCount} shortlist records`);

    // Seed Expert-Client Mappings
    console.log('🔗 Seeding expert-client mappings...');
    let mappingCount = 0;
    const mappings = new Set();

    for (const shortlist of projectIds) {
      // Create mappings from shortlist data
      const shortlistResult = await connection.execute(
        'SELECT DISTINCT projectId, expertId FROM shortlists LIMIT 300'
      );

      if (shortlistResult[0]) {
        for (const row of shortlistResult[0]) {
          const projectResult = await connection.execute(
            'SELECT clientId FROM projects JOIN clientContacts ON projects.clientContactId = clientContacts.id WHERE projects.id = ?',
            [row.projectId]
          );

          if (projectResult[0] && projectResult[0][0]) {
            const key = `${row.expertId}-${projectResult[0][0].clientId}`;
            if (!mappings.has(key)) {
              mappings.add(key);
              await connection.execute(
                'INSERT INTO expertClientMapping (expertId, clientId, status, notes) VALUES (?, ?, ?, ?)',
                [row.expertId, projectResult[0][0].clientId, getRandomItem(['contacted', 'interested', 'engaged']), 'Expert-client engagement']
              );
              mappingCount++;
            }
          }
        }
      }
    }
    console.log(`✅ Seeded ${mappingCount} expert-client mappings`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - ${sectorNames.length} Sectors`);
    console.log(`  - ${functions.length} Functions`);
    console.log(`  - ${clients.length} Companies (Clients)`);
    console.log(`  - ${clientContacts.length} Client Contacts`);
    console.log(`  - ${experts.length} Experts`);
    console.log(`  - ${projects.length} Projects`);
    console.log(`  - ${questionCount} Screening Questions`);
    console.log(`  - ${shortlistCount} Shortlist Records`);
    console.log(`  - ${mappingCount} Expert-Client Mappings`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
