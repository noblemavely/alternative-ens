import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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
    const sectors = [
      { name: 'Technology', description: 'Software, IT, Cloud Computing' },
      { name: 'Finance', description: 'Banking, Investment, Insurance' },
      { name: 'Healthcare', description: 'Pharmaceuticals, Medical Devices, Healthcare Services' },
      { name: 'Manufacturing', description: 'Industrial, Automotive, Consumer Goods' },
      { name: 'Retail', description: 'E-commerce, Brick & Mortar, Fashion' },
    ];
    for (const sector of sectors) {
      await connection.execute(
        'INSERT INTO sectors (name, description) VALUES (?, ?)',
        [sector.name, sector.description]
      );
    }
    console.log('✅ Seeded 5 sectors');

    // Seed Functions
    console.log('📋 Seeding functions...');
    const functions = [
      { name: 'Chief Executive Officer', description: 'C-level executive leadership' },
      { name: 'Chief Financial Officer', description: 'Financial leadership and strategy' },
      { name: 'Chief Technology Officer', description: 'Technology strategy and innovation' },
      { name: 'Vice President', description: 'Senior management level' },
      { name: 'Senior Manager', description: 'Management level' },
      { name: 'Product Manager', description: 'Product leadership and strategy' },
    ];
    for (const func of functions) {
      await connection.execute(
        'INSERT INTO functions (name, description) VALUES (?, ?)',
        [func.name, func.description]
      );
    }
    console.log('✅ Seeded 6 functions');

    // Seed Clients (30 companies)
    console.log('👥 Seeding 30 clients...');
    const sectorList = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'];
    const companyNamePrefixes = [
      'TechCorp', 'DataFlow', 'InnovateLabs', 'CloudSystems', 'FinancePlus',
      'HealthCare', 'MediServe', 'PharmaSolutions', 'AutoTech', 'ManufactureHub',
      'RetailMax', 'ShopEase', 'EcommerceVentures', 'GlobalTrade', 'ByteForce',
      'ServerPlex', 'NetworkCore', 'CyberSecure', 'WealthManagement', 'CapitalFlow',
      'BioMedical', 'ClinicCare', 'DiagnoTech', 'PowerManufacturing', 'BuildCorp',
      'GrowthRetail', 'DigitalMart', 'CommercePro', 'VentureTech', 'InvestHub'
    ];

    const clients = [];
    for (let i = 0; i < 30; i++) {
      const sector = sectorList[i % sectorList.length];
      clients.push({
        name: `${companyNamePrefixes[i]} ${['Inc', 'LLC', 'Corp', 'Solutions', 'Group'][i % 5]}`,
        phone: `+1-555-${String(100 + i).padStart(4, '0')}`,
        companyWebsite: `https://${companyNamePrefixes[i].toLowerCase()}.com`,
        contactPerson: `Contact Person ${i + 1}`,
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
    console.log('✅ Seeded 30 clients');

    // Seed Client Contacts (3 per company = 90 total)
    console.log('📞 Seeding 90 client contacts (3 per company)...');
    const roles = ['Hiring Manager', 'Project Lead', 'SPOC', 'VP', 'Director'];
    const workTypes = ['Recruitment', 'Advisory', 'Research', 'Call', 'ID'];
    const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
    const lastNames = ['Brown', 'Wilson', 'Davis', 'Miller', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris'];

    const clientContacts = [];
    for (let i = 0; i < clientIds.length; i++) {
      for (let j = 0; j < 3; j++) {
        const firstName = firstNames[(i * 3 + j) % firstNames.length];
        const lastName = lastNames[(i * 3 + j) % lastNames.length];
        clientContacts.push({
          clientId: clientIds[i],
          contactName: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@client${i + 1}.com`,
          phone: `+1-555-${String(200 + i * 10 + j).padStart(4, '0')}`,
          role: roles[(i * 3 + j) % roles.length],
          workType: workTypes[(i * 3 + j) % workTypes.length],
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
    console.log('✅ Seeded 90 client contacts');

    // Seed Experts (200 total)
    console.log('👨‍💼 Seeding 200 experts...');
    const expertFirstNames = ['Robert', 'Jennifer', 'Christopher', 'Amanda', 'Daniel', 'Sarah', 'Michael', 'Jessica', 'James', 'Laura', 'David', 'Patricia', 'Richard', 'Linda', 'Joseph', 'Barbara', 'Thomas', 'Nancy', 'Charles', 'Karen', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Dorothy'];
    const expertLastNames = ['Thompson', 'Martinez', 'Lee', 'White', 'Garcia', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Rodriguez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Perez', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres'];
    const expertBiographies = [
      'Experienced professional with 15+ years in industry leadership.',
      'Strategic thinker with expertise in digital transformation.',
      'Proven track record in scaling high-growth organizations.',
      'Expert in market analysis and business development.',
      'Specialist in technology infrastructure and cloud solutions.',
      'Leader in financial strategy and investor relations.',
      'Innovator in product management and user experience.',
      'Veteran in operations and supply chain optimization.',
      'Thought leader in industry trends and market positioning.',
      'Expert in organizational development and team building.',
    ];

    const experts = [];
    for (let i = 0; i < 200; i++) {
      const firstName = expertFirstNames[i % expertFirstNames.length];
      const lastName = expertLastNames[i % expertLastNames.length];
      const sector = sectorList[i % sectorList.length];
      const functions = [
        'Chief Executive Officer', 'Chief Financial Officer', 'Chief Technology Officer',
        'Vice President', 'Senior Manager', 'Product Manager', 'Director', 'Manager',
        'Analyst', 'Engineer', 'Specialist', 'Consultant'
      ];
      const func = functions[i % functions.length];

      experts.push({
        email: `expert${i + 1}@example.com`,
        phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
        firstName: firstName,
        lastName: lastName,
        sector: sector,
        function: func,
        biography: expertBiographies[i % expertBiographies.length],
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
        isVerified: i % 3 !== 0,
      });
    }
    
    // Define employment records for sample experts (50% of experts get 2 employment records)
    const companyNames = ['Google', 'Amazon', 'Microsoft', 'Apple', 'Facebook', 'Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Pfizer', 'Merck', 'Johnson & Johnson', 'Novartis', 'Tesla', 'Meta', 'Twitter', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA'];
    const positions = ['CEO', 'CTO', 'CFO', 'VP', 'Director', 'Senior Manager', 'Manager', 'Senior Engineer', 'Analyst', 'Consultant'];

    const employmentRecords = [];
    for (let i = 0; i < 100; i++) {
      const expertIdx = i * 2;
      if (expertIdx < 200) {
        employmentRecords.push({
          expertIdx: expertIdx,
          companyName: companyNames[i % companyNames.length],
          position: positions[i % positions.length],
          startDate: `${2015 + (i % 8)}-${String((i % 12) + 1).padStart(2, '0')}`,
          endDate: null,
          isCurrent: true,
          description: `Working on key strategic initiatives`
        });
        employmentRecords.push({
          expertIdx: expertIdx,
          companyName: companyNames[(i + 1) % companyNames.length],
          position: positions[(i + 1) % positions.length],
          startDate: `${2010 + (i % 5)}-01`,
          endDate: `${2015 + (i % 8)}-01`,
          isCurrent: false,
          description: `Previous role with significant impact`
        });
      }
    }

    // Define education records for sample experts (50% of experts get 2 education records)
    const schools = ['Stanford University', 'UC Berkeley', 'Harvard Business School', 'Yale University', 'MIT', 'Johns Hopkins University', 'University of Michigan', 'Princeton University', 'Columbia University', 'Northwestern University'];
    const degrees = ['Bachelor of Science', 'Master of Science', 'MBA', 'PhD', 'Master of Engineering', 'Master of Business Administration'];
    const fieldsOfStudy = ['Computer Science', 'Electrical Engineering', 'Business Administration', 'Economics', 'Healthcare Management', 'Data Science', 'Finance', 'Operations', 'Marketing', 'Engineering'];

    const educationRecords = [];
    for (let i = 0; i < 100; i++) {
      const expertIdx = i * 2;
      if (expertIdx < 200) {
        educationRecords.push({
          expertIdx: expertIdx,
          schoolName: schools[i % schools.length],
          degree: degrees[i % degrees.length],
          fieldOfStudy: fieldsOfStudy[i % fieldsOfStudy.length],
          startDate: `${2005 + (i % 10)}-09`,
          endDate: `${2009 + (i % 10)}-05`,
          description: `Graduated with distinction`
        });
        if (i % 2 === 0) {
          educationRecords.push({
            expertIdx: expertIdx,
            schoolName: schools[(i + 1) % schools.length],
            degree: degrees[(i + 2) % degrees.length],
            fieldOfStudy: fieldsOfStudy[(i + 1) % fieldsOfStudy.length],
            startDate: `${2009 + (i % 10)}-09`,
            endDate: `${2011 + (i % 10)}-05`,
            description: `Advanced degree in specialization`
          });
        }
      }
    }

    const expertIds = [];
    for (let i = 0; i < experts.length; i++) {
      const expert = experts[i];
      const cvUrl = i < 5 ? `/uploads/cv-uploads/expert${i + 1}-resume.pdf` : null;

      const [result] = await connection.execute(
        'INSERT INTO experts (email, phone, firstName, lastName, sector, `function`, biography, linkedinUrl, cvUrl, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [expert.email, expert.phone, expert.firstName, expert.lastName, expert.sector, expert.function, expert.biography, expert.linkedinUrl, cvUrl, expert.isVerified]
      );
      expertIds.push(result.insertId);
    }
    console.log('✅ Seeded 200 experts');

    // Seed Expert Employment History
    console.log('💼 Seeding expert employment history...');
    const employmentRecordsWithIds = employmentRecords.map(emp => ({
      ...emp,
      expertId: expertIds[emp.expertIdx]
    }));
    
    for (const record of employmentRecordsWithIds) {
      await connection.execute(
        'INSERT INTO expertEmployment (expertId, companyName, position, startDate, endDate, isCurrent, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.expertId, record.companyName, record.position, record.startDate, record.endDate, record.isCurrent, record.description]
      );
    }
    console.log('✅ Seeded 6 employment records');

    // Seed Expert Education History
    console.log('🎓 Seeding expert education history...');
    const educationRecordsWithIds = educationRecords.map(edu => ({
      ...edu,
      expertId: expertIds[edu.expertIdx]
    }));

    for (const record of educationRecordsWithIds) {
      await connection.execute(
        'INSERT INTO expertEducation (expertId, schoolName, degree, fieldOfStudy, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.expertId, record.schoolName, record.degree, record.fieldOfStudy, record.startDate, record.endDate, record.description]
      );
    }
    console.log('✅ Seeded 6 education records');

    // Seed Projects (5 per company = 150 total)
    console.log('📁 Seeding 150 projects (5 per company)...');
    const projectNames = [
      'Cloud Migration Initiative', 'AI/ML Expert Search', 'Financial Strategy Review',
      'Market Research Initiative', 'Digital Transformation Plan', 'Regulatory Compliance Study',
      'Innovation Strategy Workshop', 'Talent Acquisition Drive', 'Market Expansion Study',
      'Technology Assessment', 'Operational Excellence Program', 'Competitive Analysis',
      'Product Launch Support', 'Organizational Restructuring', 'Customer Experience Initiative'
    ];
    const projectDescriptions = [
      'Strategic initiative to transform business operations',
      'Expert consultation on industry best practices',
      'Research and analysis for informed decision-making',
      'Implementation of new technologies and systems',
      'Assessment and improvement of current processes',
      'Planning for growth and expansion',
      'Analysis of market trends and opportunities',
      'Development of strategic partnerships',
      'Enhancement of customer engagement',
      'Optimization of business model'
    ];
    const projectTypes = ['Advisory', 'Call', 'ID', 'Recruitment', 'Research'];
    const targetPersonas = [
      'CTO, VP Engineering', 'Senior ML Engineer', 'CFO, VP Finance',
      'CEO, President', 'COO, Director of Operations', 'Chief Product Officer',
      'VP Marketing', 'Head of HR', 'VP Sales', 'Director of Strategy',
      'Chief of Staff', 'Director of Finance', 'CIO', 'VP Innovation', 'Head of R&D'
    ];

    const projects = [];
    for (let i = 0; i < clientContactIds.length; i++) {
      for (let j = 0; j < 5; j++) {
        const rate = (150 + Math.random() * 250).toFixed(2);
        projects.push({
          clientContactId: clientContactIds[i],
          name: `${projectNames[(i * 5 + j) % projectNames.length]} - Project ${i * 5 + j + 1}`,
          description: projectDescriptions[(i * 5 + j) % projectDescriptions.length],
          projectType: projectTypes[(i * 5 + j) % projectTypes.length],
          targetCompanies: `Target Industry ${(i % 5) + 1}`,
          targetPersona: targetPersonas[(i * 5 + j) % targetPersonas.length],
          rate: rate,
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
    console.log('✅ Seeded 6 projects');

    // Seed Screening Questions (2-3 per project)
    console.log('❓ Seeding screening questions...');
    const screeningQuestionBank = [
      'What is your relevant industry experience?',
      'Describe your leadership experience.',
      'What certifications or qualifications do you hold?',
      'How do you approach strategic planning?',
      'What is your experience with digital transformation?',
      'Have you worked in cross-functional teams?',
      'Tell us about your experience with budgeting.',
      'What is your experience with change management?',
      'How do you measure success in your role?',
      'Describe your experience with emerging technologies.',
      'What is your customer engagement experience?',
      'Have you led teams through significant transitions?',
      'What is your knowledge of regulatory compliance?',
      'Describe your financial management experience.',
      'What is your background in risk management?'
    ];

    const screeningQuestions = [];
    for (let i = 0; i < projectIds.length; i++) {
      const questionCount = (i % 3) + 2;
      for (let j = 0; j < questionCount; j++) {
        screeningQuestions.push({
          projectId: projectIds[i],
          question: screeningQuestionBank[(i * 3 + j) % screeningQuestionBank.length],
          order: j + 1
        });
      }
    }

    for (const question of screeningQuestions) {
      await connection.execute(
        'INSERT INTO screeningQuestions (projectId, question, `order`) VALUES (?, ?, ?)',
        [question.projectId, question.question, question.order]
      );
    }
    console.log(`✅ Seeded ${screeningQuestions.length} screening questions`);

    // Seed Shortlists (3-4 per project on average = ~450+ records)
    console.log('⭐ Seeding shortlists...');
    const shortlistStatuses = ['pending', 'contacted', 'interested', 'engaged', 'rejected', 'accepted'];
    const shortlistNotes = [
      'Excellent fit for the role',
      'Strong relevant experience',
      'Awaiting response',
      'In active discussions',
      'Proposal under review',
      'Not available currently',
      'Confirmed availability',
      'Requested more information',
      'Very interested in project',
      'Under evaluation'
    ];

    const shortlists = [];
    for (let i = 0; i < projectIds.length; i++) {
      const expertCount = (i % 4) + 2;
      for (let j = 0; j < expertCount; j++) {
        const expertIdx = (i * 7 + j) % expertIds.length;
        shortlists.push({
          projectId: projectIds[i],
          expertId: expertIds[expertIdx],
          status: shortlistStatuses[(i * 2 + j) % shortlistStatuses.length],
          notes: shortlistNotes[(i + j) % shortlistNotes.length]
        });
      }
    }

    for (const shortlist of shortlists) {
      await connection.execute(
        'INSERT INTO shortlists (projectId, expertId, status, notes) VALUES (?, ?, ?, ?)',
        [shortlist.projectId, shortlist.expertId, shortlist.status, shortlist.notes]
      );
    }
    console.log(`✅ Seeded ${shortlists.length} shortlist records`);

    // Seed Expert-Client Mapping (each expert maps to 2-3 clients on average)
    console.log('🔗 Seeding expert-client mappings...');
    const mappingStatuses = ['contacted', 'shortlisted', 'engaged', 'interested', 'rejected'];
    const mappingNotes = [
      'Active engagement on project',
      'Initial conversation completed',
      'Working on strategic initiative',
      'Potential for future projects',
      'Strong fit for client needs',
      'Awaiting client approval',
      'Under evaluation',
      'Expertise aligned with goals',
      'Scheduled for discussions',
      'Not suitable at this time'
    ];

    const expertClientMappings = [];
    for (let i = 0; i < expertIds.length; i++) {
      const clientCount = (i % 3) + 1;
      for (let j = 0; j < clientCount; j++) {
        const clientIdx = (i * 7 + j) % clientIds.length;
        expertClientMappings.push({
          expertId: expertIds[i],
          clientId: clientIds[clientIdx],
          status: mappingStatuses[(i + j) % mappingStatuses.length],
          notes: mappingNotes[(i * 2 + j) % mappingNotes.length]
        });
      }
    }

    for (const mapping of expertClientMappings) {
      await connection.execute(
        'INSERT INTO expertClientMapping (expertId, clientId, status, notes) VALUES (?, ?, ?, ?)',
        [mapping.expertId, mapping.clientId, mapping.status, mapping.notes]
      );
    }
    console.log(`✅ Seeded ${expertClientMappings.length} expert-client mappings`);

    // Seed Activity/Audit Logs (sample of 50 records)
    console.log('📝 Seeding activity timeline records...');
    const auditLogs = [];
    for (let i = 0; i < Math.min(50, expertIds.length); i++) {
      auditLogs.push({
        entityType: 'expert',
        entityId: expertIds[i],
        operationType: 'create',
        adminId: null,
        reason: 'Expert registration via portal'
      });
    }
    for (let i = 0; i < Math.min(50, shortlists.length); i++) {
      if (i % 2 === 0) {
        auditLogs.push({
          entityType: 'shortlist',
          entityId: i + 1,
          operationType: i % 3 === 0 ? 'create' : 'update',
          adminId: null,
          reason: i % 3 === 0 ? 'Expert shortlisted for project' : `Status updated to ${shortlistStatuses[i % shortlistStatuses.length]}`,
          oldValue: i % 3 !== 0 ? '{"status":"pending"}' : null,
          newValue: i % 3 !== 0 ? `{"status":"${shortlistStatuses[i % shortlistStatuses.length]}"}` : null,
        });
      }
    }

    for (const log of auditLogs) {
      await connection.execute(
        'INSERT INTO auditLog (entityType, entityId, operationType, adminId, fieldChanged, oldValue, newValue, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [log.entityType, log.entityId, log.operationType, log.adminId, log.fieldChanged || null, log.oldValue || null, log.newValue || null, log.reason]
      );
    }
    console.log(`✅ Seeded ${auditLogs.length} activity timeline records`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 5 Sectors');
    console.log('  - 6 Functions');
    console.log('  - 30 Clients');
    console.log('  - 90 Client Contacts (3 per client)');
    console.log('  - 200 Experts');
    console.log('  - 200 Employment Records');
    console.log('  - 150 Education Records');
    console.log('  - 150 Projects (5 per client)');
    console.log(`  - ${screeningQuestions.length} Screening Questions`);
    console.log(`  - ${shortlists.length} Shortlist Records`);
    console.log(`  - ${expertClientMappings.length} Expert-Client Mappings`);
    console.log(`  - ${auditLogs.length} Activity Timeline Records`);

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
