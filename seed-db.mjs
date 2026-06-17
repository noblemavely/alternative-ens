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

    // Seed Clients - Enhanced with ~30 companies
    console.log('👥 Seeding clients...');
    const clients = [
      // Technology Companies
      { name: 'Alphabet Inc', phone: '+1-650-253-0000', companyWebsite: 'https://google.com', contactPerson: 'Tech Director', sector: 'Technology' },
      { name: 'Microsoft Corporation', phone: '+1-425-882-8080', companyWebsite: 'https://microsoft.com', contactPerson: 'Enterprise Lead', sector: 'Technology' },
      { name: 'Apple Inc', phone: '+1-408-996-1010', companyWebsite: 'https://apple.com', contactPerson: 'Operations Manager', sector: 'Technology' },
      { name: 'Meta Platforms Inc', phone: '+1-650-308-7300', companyWebsite: 'https://meta.com', contactPerson: 'Product Director', sector: 'Technology' },
      { name: 'Amazon Web Services', phone: '+1-206-266-1000', companyWebsite: 'https://aws.amazon.com', contactPerson: 'Talent Manager', sector: 'Technology' },
      { name: 'Tesla Inc', phone: '+1-888-518-3752', companyWebsite: 'https://tesla.com', contactPerson: 'Engineering Lead', sector: 'Technology' },
      { name: 'Nvidia Corporation', phone: '+1-408-486-2000', companyWebsite: 'https://nvidia.com', contactPerson: 'Research Director', sector: 'Technology' },
      { name: 'Intel Corporation', phone: '+1-408-765-8080', companyWebsite: 'https://intel.com', contactPerson: 'Innovation Manager', sector: 'Technology' },

      // Finance Companies
      { name: 'JPMorgan Chase', phone: '+1-212-270-6000', companyWebsite: 'https://jpmorganchase.com', contactPerson: 'Finance VP', sector: 'Finance' },
      { name: 'Goldman Sachs', phone: '+1-212-902-1000', companyWebsite: 'https://goldmansachs.com', contactPerson: 'Senior Analyst', sector: 'Finance' },
      { name: 'Morgan Stanley', phone: '+1-212-761-4000', companyWebsite: 'https://morganstanley.com', contactPerson: 'Investment Manager', sector: 'Finance' },
      { name: 'Bank of America', phone: '+1-704-386-5000', companyWebsite: 'https://bankofamerica.com', contactPerson: 'Operations Lead', sector: 'Finance' },
      { name: 'Citigroup Inc', phone: '+1-212-559-1000', companyWebsite: 'https://citigroup.com', contactPerson: 'Strategy Lead', sector: 'Finance' },
      { name: 'Berkshire Hathaway', phone: '+1-402-346-1400', companyWebsite: 'https://berkshirehathaway.com', contactPerson: 'Investment Director', sector: 'Finance' },

      // Healthcare Companies
      { name: 'UnitedHealth Group', phone: '+1-952-931-5000', companyWebsite: 'https://unitedhealthgroup.com', contactPerson: 'Healthcare Executive', sector: 'Healthcare' },
      { name: 'Pfizer Inc', phone: '+1-212-733-2323', companyWebsite: 'https://pfizer.com', contactPerson: 'Research Manager', sector: 'Healthcare' },
      { name: 'Johnson & Johnson', phone: '+1-908-874-1000', companyWebsite: 'https://jnj.com', contactPerson: 'Medical Director', sector: 'Healthcare' },
      { name: 'Merck & Co', phone: '+1-908-423-1000', companyWebsite: 'https://merck.com', contactPerson: 'Clinical Lead', sector: 'Healthcare' },
      { name: 'AbbVie Inc', phone: '+1-847-935-3100', companyWebsite: 'https://abbvie.com', contactPerson: 'Development Manager', sector: 'Healthcare' },

      // Manufacturing Companies
      { name: 'Toyota Motor Corporation', phone: '+1-248-577-0100', companyWebsite: 'https://toyota.com', contactPerson: 'Manufacturing Lead', sector: 'Manufacturing' },
      { name: 'Volkswagen AG', phone: '+1-540-742-1500', companyWebsite: 'https://volkswagen.com', contactPerson: 'Operations Manager', sector: 'Manufacturing' },
      { name: 'General Motors', phone: '+1-313-556-5000', companyWebsite: 'https://gm.com', contactPerson: 'Engineering Director', sector: 'Manufacturing' },
      { name: 'BMW Group', phone: '+1-201-307-4000', companyWebsite: 'https://bmw.com', contactPerson: 'Product Manager', sector: 'Manufacturing' },

      // Retail Companies
      { name: 'Walmart Inc', phone: '+1-479-273-8000', companyWebsite: 'https://walmart.com', contactPerson: 'Retail Director', sector: 'Retail' },
      { name: 'Amazon.com Inc', phone: '+1-206-266-1000', companyWebsite: 'https://amazon.com', contactPerson: 'E-commerce Lead', sector: 'Retail' },
      { name: 'Costco Wholesale', phone: '+1-425-313-8100', companyWebsite: 'https://costco.com', contactPerson: 'Supply Chain Manager', sector: 'Retail' },
      { name: 'The Home Depot', phone: '+1-770-433-8211', companyWebsite: 'https://homedepot.com', contactPerson: 'Operations Head', sector: 'Retail' },
      { name: 'Target Corporation', phone: '+1-612-696-6000', companyWebsite: 'https://target.com', contactPerson: 'Strategy Manager', sector: 'Retail' },
    ];

    const clientIds = [];
    for (const client of clients) {
      const [result] = await connection.execute(
        'INSERT INTO clients (name, phone, companyWebsite, contactPerson, sector) VALUES (?, ?, ?, ?, ?)',
        [client.name, client.phone, client.companyWebsite, client.contactPerson, client.sector]
      );
      clientIds.push(result.insertId);
    }
    console.log('✅ Seeded 3 clients');

    // Seed Client Contacts - 3 per company
    console.log('📞 Seeding client contacts...');
    const contactRoles = ['Hiring Manager', 'Project Lead', 'SPOC'];
    const contactWorkTypes = ['Recruitment', 'Advisory', 'Research'];
    const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isabel', 'James'];
    const lastNames = ['Brown', 'Wilson', 'Davis', 'Miller', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'Martin', 'Lee'];

    const clientContacts = [];
    let contactIndex = 0;
    for (const clientId of clientIds) {
      for (let i = 0; i < 3; i++) {
        const firstName = firstNames[contactIndex % firstNames.length];
        const lastName = lastNames[contactIndex % lastNames.length];
        const domain = clients[clientIds.indexOf(clientId)].name.toLowerCase().replace(/\s+/g, '').substring(0, 10);

        clientContacts.push({
          clientId,
          contactName: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}.com`,
          phone: `+1-${Math.floor(200 + contactIndex / 3)}-${String(contactIndex).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
          role: contactRoles[i % contactRoles.length],
          workType: contactWorkTypes[i % contactWorkTypes.length],
        });
        contactIndex++;
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
    console.log(`✅ Seeded ${clientContactIds.length} client contacts (3 per company)`);

    // Seed Experts - Enhanced with ~200 experts
    console.log('👨‍💼 Seeding 200 experts...');
    const expertFirstNames = ['Robert', 'Jennifer', 'Christopher', 'Amanda', 'Daniel', 'Michelle', 'James', 'Sarah', 'Michael', 'Jessica', 'David', 'Emily', 'John', 'Lisa', 'Richard', 'Karen', 'Charles', 'Nancy', 'Joseph', 'Sandra', 'Thomas', 'Betty', 'William', 'Dorothy', 'Edward', 'Margaret', 'Brian', 'Susan', 'Ronald', 'Ashley', 'Anthony', 'Kimberly'];
    const expertLastNames = ['Thompson', 'Martinez', 'Lee', 'White', 'Garcia', 'Rodriguez', 'Wang', 'Chen', 'Cohen', 'Kumar', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'Martin', 'Ahmed', 'Kim', 'Hassan', 'Patel', 'Singh', 'Schmidt', 'Mueller', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Richter', 'Klein', 'Wolf'];
    const sectorList = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail'];
    const functionList = ['Chief Executive Officer', 'Chief Financial Officer', 'Chief Technology Officer', 'Vice President', 'Senior Manager', 'Product Manager'];

    const experts = [];
    for (let i = 0; i < 200; i++) {
      const firstName = expertFirstNames[i % expertFirstNames.length];
      const lastName = expertLastNames[i % expertLastNames.length];
      const sector = sectorList[i % sectorList.length];
      const func = functionList[i % functionList.length];
      const isVerified = i % 5 !== 0; // 80% verified

      experts.push({
        email: `expert${i + 1}@expert-network.com`,
        phone: `+1-${String(555 + Math.floor(i / 100)).substring(0, 3)}-${String(1000 + (i % 1000)).padStart(4, '0')}`,
        firstName,
        lastName,
        sector,
        function: func,
        biography: `Experienced ${func} with deep expertise in ${sector.toLowerCase()} sector. ${i} years of industry experience.`,
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`,
        isVerified,
      });
    }
    
    // Generate employment records for each expert
    const techCompanies = ['Google', 'Amazon', 'Microsoft', 'Apple', 'Meta', 'Netflix', 'Tesla', 'Intel', 'Nvidia'];
    const financeCompanies = ['Goldman Sachs', 'JPMorgan Chase', 'Morgan Stanley', 'Citigroup', 'Bank of America', 'Berkshire Hathaway'];
    const healthcareCompanies = ['Pfizer', 'Merck', 'Johnson & Johnson', 'Novartis', 'Roche'];
    const manufacturingCompanies = ['Toyota', 'Volkswagen', 'General Motors', 'BMW', 'Mercedes-Benz'];
    const retailCompanies = ['Walmart', 'Amazon', 'Target', 'Costco', 'Home Depot'];

    const employmentRecords = [];
    for (let i = 0; i < 200; i++) {
      const sector = sectorList[i % sectorList.length];
      let companies;
      if (sector === 'Technology') companies = techCompanies;
      else if (sector === 'Finance') companies = financeCompanies;
      else if (sector === 'Healthcare') companies = healthcareCompanies;
      else if (sector === 'Manufacturing') companies = manufacturingCompanies;
      else companies = retailCompanies;

      for (let j = 0; j < 2; j++) {
        const isCurrentRole = j === 0;
        employmentRecords.push({
          expertIdx: i,
          companyName: companies[i % companies.length],
          position: functionList[i % functionList.length],
          startDate: `${2020 - j * 5}-01`,
          endDate: isCurrentRole ? null : `${2024 - j * 5}-12`,
          isCurrent: isCurrentRole,
          description: `Expertise in ${sector.toLowerCase()} sector operations`
        });
      }
    }

    // Generate education records for each expert
    const universities = ['Stanford University', 'Harvard University', 'MIT', 'Yale University', 'Princeton University', 'UC Berkeley', 'Chicago University', 'Johns Hopkins University', 'Columbia University'];
    const degrees = ['Bachelor of Science', 'Master of Science', 'MBA', 'Ph.D.', 'Master of Engineering'];

    const educationRecords = [];
    for (let i = 0; i < 200; i++) {
      for (let j = 0; j < 2; j++) {
        educationRecords.push({
          expertIdx: i,
          schoolName: universities[i % universities.length],
          degree: degrees[i % degrees.length],
          fieldOfStudy: sectorList[i % sectorList.length],
          startDate: `${2015 - j * 5}-09`,
          endDate: `${2017 - j * 5}-05`,
          description: `Advanced degree with focus on ${sectorList[i % sectorList.length]}`
        });
      }
    }

    // Map each expert to their static resume file (sample PDFs for first 5, null for others)
    const resumeFiles = {};
    const samplePDFs = [
      '/uploads/cv-uploads/robert-thompson-resume.pdf',
      '/uploads/cv-uploads/jennifer-martinez-resume.pdf',
      '/uploads/cv-uploads/christopher-lee-resume.pdf',
      '/uploads/cv-uploads/amanda-white-resume.pdf',
      '/uploads/cv-uploads/daniel-garcia-resume.pdf',
    ];

    for (let i = 0; i < 200; i++) {
      resumeFiles[i] = i < samplePDFs.length ? samplePDFs[i] : null;
    }

    const expertIds = [];
    for (let i = 0; i < experts.length; i++) {
      const expert = experts[i];
      const cvUrl = resumeFiles[i] || null;

      const [result] = await connection.execute(
        'INSERT INTO experts (email, phone, firstName, lastName, sector, `function`, biography, linkedinUrl, cvUrl, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [expert.email, expert.phone, expert.firstName, expert.lastName, expert.sector, expert.function, expert.biography, expert.linkedinUrl, cvUrl, expert.isVerified]
      );
      expertIds.push(result.insertId);
    }
    console.log('✅ Seeded 5 experts with resume PDFs');

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

    // Seed Projects - 5 per client contact
    console.log('📁 Seeding projects...');
    const projectTypes = ['Advisory', 'Call', 'ID', 'Research', 'Recruitment'];
    const projectNames = [
      'Cloud Migration Initiative', 'AI/ML Expert Search', 'Financial Strategy Review',
      'Market Research', 'Digital Transformation', 'Regulatory Compliance Study',
      'Innovation Workshop', 'Talent Acquisition Drive', 'Technology Assessment',
      'Process Optimization', 'Strategic Planning Session', 'Product Development'
    ];
    const projectDescriptions = [
      'Migrate legacy systems to cloud infrastructure',
      'Find subject matter experts for specialized roles',
      'Review and optimize strategic direction',
      'Conduct comprehensive market research',
      'Plan digital transformation initiatives',
      'Ensure regulatory compliance and alignment'
    ];

    const projects = [];
    for (let contactIdx = 0; contactIdx < clientContactIds.length; contactIdx++) {
      for (let projectIdx = 0; projectIdx < 5; projectIdx++) {
        const rate = (150 + (contactIdx * 7 + projectIdx * 13) % 200).toFixed(2);
        projects.push({
          clientContactId: clientContactIds[contactIdx],
          name: `${projectNames[(contactIdx * 5 + projectIdx) % projectNames.length]} - ${contactIdx}-${projectIdx}`,
          description: projectDescriptions[(contactIdx + projectIdx) % projectDescriptions.length],
          projectType: projectTypes[(contactIdx * 5 + projectIdx) % projectTypes.length],
          targetCompanies: sectorList[(contactIdx + projectIdx) % sectorList.length] + ' Companies',
          targetPersona: functionList[(contactIdx * 5 + projectIdx) % functionList.length],
          rate,
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

    // Seed Screening Questions
    console.log('❓ Seeding screening questions...');
    const questionTemplates = [
      'What is your experience with {sector} domain?',
      'Describe your expertise in {function} role',
      'Have you worked with {sector} clients?',
      'What are your key achievements in {sector}?',
      'How would you approach a {sector} challenge?',
      'What certifications do you hold in {sector}?',
      'Have you led teams in {sector} industry?',
      'Describe your leadership philosophy for {function}',
    ];

    const screeningQuestions = [];
    for (let projectIdx = 0; projectIdx < projectIds.length; projectIdx++) {
      for (let qIdx = 0; qIdx < 3; qIdx++) {
        const question = questionTemplates[(projectIdx + qIdx) % questionTemplates.length]
          .replace('{sector}', sectorList[projectIdx % sectorList.length])
          .replace('{function}', functionList[projectIdx % functionList.length]);

        screeningQuestions.push({
          projectId: projectIds[projectIdx],
          question,
          order: qIdx + 1
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

    // Seed Shortlists - 2-3 per project
    console.log('⭐ Seeding shortlists...');
    const shortlistStatuses = ['pending', 'contacted', 'interested', 'engaged'];
    const shortlistNotes = [
      'Excellent fit for the project',
      'Good background match',
      'Awaiting response',
      'In discussions about engagement',
      'Proposal under review',
      'Strong expertise in this area',
      'Available for immediate engagement'
    ];

    let shortlistsCount = 0;
    for (let projectIdx = 0; projectIdx < projectIds.length; projectIdx++) {
      const shortlistsPerProject = 2 + (projectIdx % 2);
      for (let sIdx = 0; sIdx < shortlistsPerProject; sIdx++) {
        const expertIdx = (projectIdx * 3 + sIdx) % expertIds.length;
        const status = shortlistStatuses[(projectIdx + sIdx) % shortlistStatuses.length];
        const notes = shortlistNotes[(projectIdx + sIdx) % shortlistNotes.length];

        await connection.execute(
          'INSERT INTO shortlists (projectId, expertId, status, notes) VALUES (?, ?, ?, ?)',
          [projectIds[projectIdx], expertIds[expertIdx], status, notes]
        );
        shortlistsCount++;
      }
    }
    console.log(`✅ Seeded ${shortlistsCount} shortlist records`);

    // Seed Expert-Client Mapping - 2-3 clients per expert
    console.log('🔗 Seeding expert-client mappings...');
    const mappingStatuses = ['engaged', 'contacted', 'shortlisted', 'interested'];
    const mappingNotes = [
      'Active engagement on project',
      'Initial conversation completed',
      'Working on strategy',
      'Potential for future projects',
      'Expertise valuable for client',
      'Background relevant'
    ];

    let mappingCount = 0;
    for (let expertIdx = 0; expertIdx < expertIds.length; expertIdx++) {
      const clientsPerExpert = 2 + (expertIdx % 2);
      for (let cIdx = 0; cIdx < clientsPerExpert; cIdx++) {
        const clientIdx = (expertIdx * 2 + cIdx) % clientIds.length;
        const status = mappingStatuses[(expertIdx + cIdx) % mappingStatuses.length];
        const notes = mappingNotes[(expertIdx + cIdx) % mappingNotes.length];

        await connection.execute(
          'INSERT INTO expertClientMapping (expertId, clientId, status, notes) VALUES (?, ?, ?, ?)',
          [expertIds[expertIdx], clientIds[clientIdx], status, notes]
        );
        mappingCount++;
      }
    }
    console.log(`✅ Seeded ${mappingCount} expert-client mappings`);

    // Seed Activity/Audit Logs
    console.log('📝 Seeding activity timeline records...');
    const auditLogs = [
      { entityType: 'expert', entityId: expertIds[0], operationType: 'create', adminId: null, reason: 'Expert registration via portal' },
      { entityType: 'expert', entityId: expertIds[1], operationType: 'create', adminId: null, reason: 'Expert registration via portal' },
      { entityType: 'expert', entityId: expertIds[2], operationType: 'create', adminId: null, reason: 'Expert registration via portal' },
      { entityType: 'expert', entityId: expertIds[3], operationType: 'create', adminId: null, reason: 'Expert registration via portal' },
      { entityType: 'expert', entityId: expertIds[4], operationType: 'create', adminId: null, reason: 'Expert registration via portal' },
      { entityType: 'shortlist', entityId: 1, operationType: 'create', adminId: null, reason: 'Expert shortlisted for project' },
      { entityType: 'shortlist', entityId: 2, operationType: 'update', adminId: null, reason: 'Status changed from pending to contacted', oldValue: '{"status":"pending"}', newValue: '{"status":"contacted"}' },
      { entityType: 'shortlist', entityId: 3, operationType: 'update', adminId: null, reason: 'Status changed from contacted to engaged', oldValue: '{"status":"contacted"}', newValue: '{"status":"engaged"}' },
    ];

    for (const log of auditLogs) {
      await connection.execute(
        'INSERT INTO auditLog (entityType, entityId, operationType, adminId, fieldChanged, oldValue, newValue, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [log.entityType, log.entityId, log.operationType, log.adminId, log.fieldChanged || null, log.oldValue || null, log.newValue || null, log.reason]
      );
    }
    console.log('✅ Seeded 8 activity timeline records');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 5 Sectors');
    console.log('  - 6 Functions');
    console.log(`  - ${clientIds.length} Clients`);
    console.log(`  - ${clientContactIds.length} Client Contacts (3 per client)`);
    console.log(`  - ${expertIds.length} Experts (200 total)`);
    console.log(`  - ${employmentRecords.length} Employment Records`);
    console.log(`  - ${educationRecords.length} Education Records`);
    console.log(`  - ${projectIds.length} Projects (5 per client contact)`);
    console.log(`  - ${screeningQuestions.length} Screening Questions`);
    console.log(`  - ${shortlistsCount} Shortlist Records`);
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
