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

    // Seed Clients - Enhanced with more realistic company names
    console.log('👥 Seeding clients...');
    const companyNamesByIndustry = {
      Technology: ['TechCorp Inc', 'Innovate Systems Ltd', 'Digital Solutions Partners', 'Cloud Nine Technologies', 'NextGen Software Group', 'AI Dynamics Corp', 'Quantum Computing Inc', 'VirtualWorks Ltd', 'DataStream Analytics'],
      Finance: ['FinancePlus LLC', 'Capital Growth Partners', 'Wealth Management Group', 'Investment horizons Inc', 'Treasury Solutions Ltd', 'Asset Management Partners', 'Fintech Innovations Corp', 'Credit Capital Group'],
      Healthcare: ['HealthCare Solutions', 'MediCare Innovations', 'Clinical Research Partners', 'Wellness Technologies Inc', 'PharmaCare Group', 'BioHealth Solutions Ltd', 'Patient Care Systems', 'MedDev Innovations'],
      Retail: ['RetailPro Inc', 'Commerce Solutions Ltd', 'Shopping Dynamics Group', 'Omni-Channel Retail Corp', 'Store Operations Partners', 'Merchandising Systems Inc'],
      Manufacturing: ['ManufactureCo Inc', 'Industrial Solutions Ltd', 'Production Dynamics Group', 'Supply Chain Partners', 'Quality Manufacturing Corp'],
    };

    const clients = [];
    const sectors = Object.keys(companyNamesByIndustry);
    for (const sector of sectors) {
      const companies = companyNamesByIndustry[sector];
      for (const company of companies.slice(0, 6)) { // 6 companies per sector = ~30 total
        clients.push({
          name: company,
          phone: `+1-555-${String(clients.length).padStart(4, '0')}`,
          companyWebsite: `https://${company.toLowerCase().replace(/\s+/g, '')}.com`,
          contactPerson: `Contact Person ${clients.length}`,
          sector: sector,
        });
      }
    }

    const clientIds = [];
    for (const client of clients) {
      const [result] = await connection.execute(
        'INSERT INTO clients (name, phone, companyWebsite, contactPerson, sector) VALUES (?, ?, ?, ?, ?)',
        [client.name, client.phone, client.companyWebsite, client.contactPerson, client.sector]
      );
      clientIds.push(result.insertId);
    }
    console.log('✅ Seeded 3 clients');

    // Seed Client Contacts - 3 per client
    console.log('📞 Seeding client contacts...');
    const roles = ['Hiring Manager', 'Project Lead', 'SPOC'];
    const workTypes = ['Recruitment', 'Advisory', 'Research'];
    const clientContacts = [];

    for (let clientIdx = 0; clientIdx < clientIds.length; clientIdx++) {
      for (let contactIdx = 0; contactIdx < 3; contactIdx++) {
        const role = roles[contactIdx];
        const workType = workTypes[contactIdx];
        clientContacts.push({
          clientId: clientIds[clientIdx],
          contactName: `Contact ${clientIdx}-${contactIdx}`,
          email: `contact-${clientIdx}-${contactIdx}@company${clientIdx}.com`,
          phone: `+1-555-${String(9000 + clientIdx * 100 + contactIdx).padStart(4, '0')}`,
          role: role,
          workType: workType,
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
    console.log('✅ Seeded 6 client contacts');

    // Seed Experts
    console.log('👨‍💼 Seeding experts...');
    const experts = [
      {
        email: 'expert1@example.com',
        phone: '+1-555-1001',
        firstName: 'Robert',
        lastName: 'Thompson',
        sector: 'Technology',
        function: 'Chief Technology Officer',
        biography: 'Experienced CTO with 15+ years in cloud infrastructure and AI/ML solutions.',
        linkedinUrl: 'https://linkedin.com/in/rthompson',
        isVerified: true,
      },
      {
        email: 'expert2@example.com',
        phone: '+1-555-1002',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        sector: 'Finance',
        function: 'Chief Financial Officer',
        biography: 'CFO with expertise in financial strategy, M&A, and capital markets.',
        linkedinUrl: 'https://linkedin.com/in/jmartinez',
        isVerified: true,
      },
      {
        email: 'expert3@example.com',
        phone: '+1-555-1003',
        firstName: 'Christopher',
        lastName: 'Lee',
        sector: 'Healthcare',
        function: 'Vice President',
        biography: 'VP of Operations in healthcare with focus on digital transformation.',
        linkedinUrl: 'https://linkedin.com/in/clee',
        isVerified: true,
      },
      {
        email: 'expert4@example.com',
        phone: '+1-555-1004',
        firstName: 'Amanda',
        lastName: 'White',
        sector: 'Technology',
        function: 'Product Manager',
        biography: 'Product Manager specializing in SaaS platforms and user experience.',
        linkedinUrl: 'https://linkedin.com/in/awhite',
        isVerified: false,
      },
      {
        email: 'expert5@example.com',
        phone: '+1-555-1005',
        firstName: 'Daniel',
        lastName: 'Garcia',
        sector: 'Retail',
        function: 'Chief Executive Officer',
        biography: 'CEO with proven track record in e-commerce and omnichannel retail.',
        linkedinUrl: 'https://linkedin.com/in/dgarcia',
        isVerified: true,
      },
    ];
    
    // Define employment records for each expert (before insertion so we can generate PDFs with this data)
    const employmentRecords = [
      { expertIdx: 0, companyName: 'Google', position: 'Senior Infrastructure Engineer', startDate: '2018-01', endDate: null, isCurrent: true, description: 'Led cloud infrastructure team' },
      { expertIdx: 0, companyName: 'Amazon', position: 'Cloud Architect', startDate: '2015-06', endDate: '2017-12', isCurrent: false, description: 'Designed AWS solutions for enterprise clients' },
      { expertIdx: 1, companyName: 'Goldman Sachs', position: 'Managing Director', startDate: '2019-03', endDate: null, isCurrent: true, description: 'Head of Financial Strategy' },
      { expertIdx: 1, companyName: 'JP Morgan', position: 'Vice President', startDate: '2014-09', endDate: '2019-02', isCurrent: false, description: 'Investment banking division' },
      { expertIdx: 2, companyName: 'Pfizer', position: 'VP Operations', startDate: '2017-05', endDate: null, isCurrent: true, description: 'Digital transformation initiatives' },
      { expertIdx: 2, companyName: 'Merck', position: 'Senior Manager', startDate: '2012-01', endDate: '2017-04', isCurrent: false, description: 'Operations and supply chain' },
    ];

    // Define education records for each expert
    const educationRecords = [
      { expertIdx: 0, schoolName: 'Stanford University', degree: 'Master of Science', fieldOfStudy: 'Computer Science', startDate: '2014-09', endDate: '2016-05', description: 'Specialized in distributed systems' },
      { expertIdx: 0, schoolName: 'UC Berkeley', degree: 'Bachelor of Science', fieldOfStudy: 'Electrical Engineering', startDate: '2010-09', endDate: '2014-05', description: 'GPA: 3.8' },
      { expertIdx: 1, schoolName: 'Harvard Business School', degree: 'MBA', fieldOfStudy: 'Business Administration', startDate: '2012-09', endDate: '2014-05', description: 'Baker Scholar' },
      { expertIdx: 1, schoolName: 'Yale University', degree: 'Bachelor of Science', fieldOfStudy: 'Economics', startDate: '2008-09', endDate: '2012-05', description: 'Cum Laude' },
      { expertIdx: 2, schoolName: 'Johns Hopkins University', degree: 'Master of Health Administration', fieldOfStudy: 'Healthcare Management', startDate: '2015-09', endDate: '2017-05', description: 'Focus on operations' },
      { expertIdx: 2, schoolName: 'University of Michigan', degree: 'Bachelor of Science', fieldOfStudy: 'Biology', startDate: '2010-09', endDate: '2014-05', description: 'Pre-med track' },
    ];

    // Map each expert to their static resume file
    const resumeFiles = {
      0: '/uploads/cv-uploads/robert-thompson-resume.pdf',
      1: '/uploads/cv-uploads/jennifer-martinez-resume.pdf',
      2: '/uploads/cv-uploads/christopher-lee-resume.pdf',
      3: '/uploads/cv-uploads/amanda-white-resume.pdf',
      4: '/uploads/cv-uploads/daniel-garcia-resume.pdf',
    };

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
    const projectTypes = ['Call', 'Advisory', 'ID'];
    const projectNames = [
      'Strategic Consultation',
      'Expert Research Study',
      'Market Analysis Project',
      'Implementation Review',
      'Technical Assessment',
    ];
    const projectDescriptions = [
      'Conduct a detailed assessment and provide strategic recommendations',
      'In-depth research and analysis on industry trends',
      'Market analysis and competitive benchmarking',
      'Review and optimize current implementation',
      'Technical review and assessment',
    ];

    const projects = [];
    for (let contactIdx = 0; contactIdx < clientContactIds.length; contactIdx++) {
      for (let projectIdx = 0; projectIdx < 5; projectIdx++) {
        projects.push({
          clientContactId: clientContactIds[contactIdx],
          name: `${projectNames[projectIdx]} - Client ${Math.floor(contactIdx / 3)}`,
          description: projectDescriptions[projectIdx],
          projectType: projectTypes[projectIdx % 3],
          targetCompanies: `Target Companies ${contactIdx}-${projectIdx}`,
          targetPersona: `Persona ${contactIdx}-${projectIdx}`,
          rate: String((150 + Math.random() * 250).toFixed(2)),
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

    // Seed Screening Questions - 2 per project
    console.log('❓ Seeding screening questions...');
    const screeningQuestionsTemplates = [
      'What is your experience with this domain?',
      'Have you worked on similar projects?',
      'What is your approach to problem-solving?',
      'How do you measure success?',
      'What are your key strengths?',
    ];

    let questionCount = 0;
    for (let projectIdx = 0; projectIdx < projectIds.length; projectIdx++) {
      for (let qIdx = 0; qIdx < 2; qIdx++) {
        await connection.execute(
          'INSERT INTO screeningQuestions (projectId, question, `order`) VALUES (?, ?, ?)',
          [projectIds[projectIdx], screeningQuestionsTemplates[qIdx % 5], qIdx + 1]
        );
        questionCount++;
      }
    }
    console.log(`✅ Seeded ${questionCount} screening questions`);

    // Seed Shortlists
    console.log('⭐ Seeding shortlists...');
    const shortlists = [
      { projectId: projectIds[0], expertId: expertIds[0], status: 'contacted', notes: 'Excellent fit for cloud migration' },
      { projectId: projectIds[0], expertId: expertIds[1], status: 'pending', notes: 'Awaiting response' },
      { projectId: projectIds[1], expertId: expertIds[3], status: 'interested', notes: 'Very interested in AI/ML role' },
      { projectId: projectIds[2], expertId: expertIds[1], status: 'engaged', notes: 'In discussions about engagement' },
      { projectId: projectIds[2], expertId: expertIds[4], status: 'pending', notes: 'Initial outreach sent' },
      { projectId: projectIds[3], expertId: expertIds[1], status: 'contacted', notes: 'Confirmed availability' },
      { projectId: projectIds[4], expertId: expertIds[2], status: 'engaged', notes: 'Proposal under review' },
      { projectId: projectIds[5], expertId: expertIds[2], status: 'interested', notes: 'Strong regulatory background' },
      { projectId: projectIds[5], expertId: expertIds[4], status: 'pending', notes: 'Awaiting confirmation' },
    ];
    
    for (const shortlist of shortlists) {
      await connection.execute(
        'INSERT INTO shortlists (projectId, expertId, status, notes) VALUES (?, ?, ?, ?)',
        [shortlist.projectId, shortlist.expertId, shortlist.status, shortlist.notes]
      );
    }
    console.log('✅ Seeded 9 shortlist records');

    // Seed Expert-Client Mapping
    console.log('🔗 Seeding expert-client mappings...');
    const expertClientMappings = [
      { expertId: expertIds[0], clientId: clientIds[0], status: 'engaged', notes: 'Active engagement on cloud project' },
      { expertId: expertIds[1], clientId: clientIds[0], status: 'contacted', notes: 'Initial conversation completed' },
      { expertId: expertIds[1], clientId: clientIds[1], status: 'engaged', notes: 'Working on financial strategy' },
      { expertId: expertIds[2], clientId: clientIds[2], status: 'engaged', notes: 'Digital transformation lead' },
      { expertId: expertIds[3], clientId: clientIds[0], status: 'shortlisted', notes: 'Potential for AI/ML projects' },
      { expertId: expertIds[4], clientId: clientIds[1], status: 'contacted', notes: 'Fintech expertise valuable' },
      { expertId: expertIds[4], clientId: clientIds[2], status: 'shortlisted', notes: 'Retail background relevant' },
    ];
    
    for (const mapping of expertClientMappings) {
      await connection.execute(
        'INSERT INTO expertClientMapping (expertId, clientId, status, notes) VALUES (?, ?, ?, ?)',
        [mapping.expertId, mapping.clientId, mapping.status, mapping.notes]
      );
    }
    console.log('✅ Seeded 7 expert-client mappings');

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
    console.log(`  - ${clientContactIds.length} Client Contacts`);
    console.log(`  - ${projectIds.length} Projects`);
    console.log(`  - 5 Experts (2 with sample CVs)`);
    console.log('  - 6 Employment Records');
    console.log('  - 6 Education Records');
    console.log('  - 6 Projects');
    console.log('  - 10 Screening Questions');
    console.log('  - 9 Shortlist Records');
    console.log('  - 7 Expert-Client Mappings');
    console.log('  - 8 Activity Timeline Records');

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
