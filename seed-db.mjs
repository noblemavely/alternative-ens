import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function seedDatabase() {
  let connection;
  try {
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

    // Seed Clients
    console.log('👥 Seeding clients...');
    const clients = [
      {
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        phone: '+1-555-0101',
        companyName: 'TechCorp Inc',
        companyWebsite: 'https://techcorp.com',
        contactPerson: 'John Smith',
        sector: 'Technology',
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@financeplus.com',
        phone: '+1-555-0102',
        companyName: 'FinancePlus LLC',
        companyWebsite: 'https://financeplus.com',
        contactPerson: 'Sarah Johnson',
        sector: 'Finance',
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@healthcare.com',
        phone: '+1-555-0103',
        companyName: 'HealthCare Solutions',
        companyWebsite: 'https://healthcaresolutions.com',
        contactPerson: 'Michael Chen',
        sector: 'Healthcare',
      },
    ];
    
    const clientIds = [];
    for (const client of clients) {
      const [result] = await connection.execute(
        'INSERT INTO clients (name, email, phone, companyName, companyWebsite, contactPerson, sector) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [client.name, client.email, client.phone, client.companyName, client.companyWebsite, client.contactPerson, client.sector]
      );
      clientIds.push(result.insertId);
    }
    console.log('✅ Seeded 3 clients');

    // Seed Client Contacts
    console.log('📞 Seeding client contacts...');
    const clientContacts = [
      { clientId: clientIds[0], contactName: 'Alice Brown', email: 'alice.brown@techcorp.com', phone: '+1-555-0201', role: 'Hiring Manager', workType: 'Recruitment' },
      { clientId: clientIds[0], contactName: 'Bob Wilson', email: 'bob.wilson@techcorp.com', phone: '+1-555-0202', role: 'Project Lead', workType: 'Advisory' },
      { clientId: clientIds[1], contactName: 'Carol Davis', email: 'carol.davis@financeplus.com', phone: '+1-555-0203', role: 'SPOC', workType: 'Research' },
      { clientId: clientIds[1], contactName: 'David Miller', email: 'david.miller@financeplus.com', phone: '+1-555-0204', role: 'Hiring Manager', workType: 'Recruitment' },
      { clientId: clientIds[2], contactName: 'Emma Taylor', email: 'emma.taylor@healthcaresolutions.com', phone: '+1-555-0205', role: 'Project Lead', workType: 'Advisory' },
      { clientId: clientIds[2], contactName: 'Frank Anderson', email: 'frank.anderson@healthcaresolutions.com', phone: '+1-555-0206', role: 'SPOC', workType: 'Research' },
    ];
    
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
    
    const expertIds = [];
    for (let i = 0; i < experts.length; i++) {
      const expert = experts[i];
      // Add cvUrl for first two experts (sample CV files)
      const cvUrl = i < 2 ? `/uploads/cv-uploads-${expert.firstName.toLowerCase()}-${expert.lastName.toLowerCase()}-cv.pdf` : null;

      const [result] = await connection.execute(
        'INSERT INTO experts (email, phone, firstName, lastName, sector, `function`, biography, linkedinUrl, cvUrl, isVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [expert.email, expert.phone, expert.firstName, expert.lastName, expert.sector, expert.function, expert.biography, expert.linkedinUrl, cvUrl, expert.isVerified]
      );
      expertIds.push(result.insertId);
    }
    console.log('✅ Seeded 5 experts (2 with sample CVs)');

    // Seed Expert Employment History
    console.log('💼 Seeding expert employment history...');
    const employmentRecords = [
      { expertId: expertIds[0], companyName: 'Google', position: 'Senior Infrastructure Engineer', startDate: '2018-01', endDate: null, isCurrent: true, description: 'Led cloud infrastructure team' },
      { expertId: expertIds[0], companyName: 'Amazon', position: 'Cloud Architect', startDate: '2015-06', endDate: '2017-12', isCurrent: false, description: 'Designed AWS solutions for enterprise clients' },
      { expertId: expertIds[1], companyName: 'Goldman Sachs', position: 'Managing Director', startDate: '2019-03', endDate: null, isCurrent: true, description: 'Head of Financial Strategy' },
      { expertId: expertIds[1], companyName: 'JP Morgan', position: 'Vice President', startDate: '2014-09', endDate: '2019-02', isCurrent: false, description: 'Investment banking division' },
      { expertId: expertIds[2], companyName: 'Pfizer', position: 'VP Operations', startDate: '2017-05', endDate: null, isCurrent: true, description: 'Digital transformation initiatives' },
      { expertId: expertIds[2], companyName: 'Merck', position: 'Senior Manager', startDate: '2012-01', endDate: '2017-04', isCurrent: false, description: 'Operations and supply chain' },
    ];
    
    for (const record of employmentRecords) {
      await connection.execute(
        'INSERT INTO expertEmployment (expertId, companyName, position, startDate, endDate, isCurrent, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.expertId, record.companyName, record.position, record.startDate, record.endDate, record.isCurrent, record.description]
      );
    }
    console.log('✅ Seeded 6 employment records');

    // Seed Expert Education History
    console.log('🎓 Seeding expert education history...');
    const educationRecords = [
      { expertId: expertIds[0], schoolName: 'Stanford University', degree: 'Master of Science', fieldOfStudy: 'Computer Science', startDate: '2014-09', endDate: '2016-05', description: 'Specialized in distributed systems' },
      { expertId: expertIds[0], schoolName: 'UC Berkeley', degree: 'Bachelor of Science', fieldOfStudy: 'Electrical Engineering', startDate: '2010-09', endDate: '2014-05', description: 'GPA: 3.8' },
      { expertId: expertIds[1], schoolName: 'Harvard Business School', degree: 'MBA', fieldOfStudy: 'Business Administration', startDate: '2012-09', endDate: '2014-05', description: 'Baker Scholar' },
      { expertId: expertIds[1], schoolName: 'Yale University', degree: 'Bachelor of Science', fieldOfStudy: 'Economics', startDate: '2008-09', endDate: '2012-05', description: 'Cum Laude' },
      { expertId: expertIds[2], schoolName: 'Johns Hopkins University', degree: 'Master of Health Administration', fieldOfStudy: 'Healthcare Management', startDate: '2015-09', endDate: '2017-05', description: 'Focus on operations' },
      { expertId: expertIds[2], schoolName: 'University of Michigan', degree: 'Bachelor of Science', fieldOfStudy: 'Biology', startDate: '2010-09', endDate: '2014-05', description: 'Pre-med track' },
    ];
    
    for (const record of educationRecords) {
      await connection.execute(
        'INSERT INTO expertEducation (expertId, schoolName, degree, fieldOfStudy, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [record.expertId, record.schoolName, record.degree, record.fieldOfStudy, record.startDate, record.endDate, record.description]
      );
    }
    console.log('✅ Seeded 6 education records');

    // Seed Projects
    console.log('📁 Seeding projects...');
    const projects = [
      {
        clientContactId: clientContactIds[0],
        name: 'Cloud Migration Initiative',
        description: 'Migrate legacy systems to AWS cloud infrastructure',
        projectType: 'Advisory',
        targetCompanies: 'Fortune 500 Tech Companies',
        targetPersona: 'CTO, VP Engineering',
        hourlyRate: '250.00',
      },
      {
        clientContactId: clientContactIds[1],
        name: 'AI/ML Expert Search',
        description: 'Find senior AI/ML engineers for new research division',
        projectType: 'Call',
        targetCompanies: 'FAANG Companies',
        targetPersona: 'Senior ML Engineer, Research Scientist',
        hourlyRate: '200.00',
      },
      {
        clientContactId: clientContactIds[2],
        name: 'Financial Strategy Review',
        description: 'Review and optimize financial strategy for next 5 years',
        projectType: 'Advisory',
        targetCompanies: 'Investment Banks',
        targetPersona: 'CFO, VP Finance',
        hourlyRate: '300.00',
      },
      {
        clientContactId: clientContactIds[3],
        name: 'Market Research - Fintech',
        description: 'Conduct market research on fintech disruption',
        projectType: 'ID',
        targetCompanies: 'Fintech Startups, Banks',
        targetPersona: 'Industry Expert, Analyst',
        hourlyRate: '180.00',
      },
      {
        clientContactId: clientContactIds[4],
        name: 'Digital Health Transformation',
        description: 'Plan digital transformation for healthcare provider',
        projectType: 'Call',
        targetCompanies: 'Healthcare Systems',
        targetPersona: 'CIO, VP Operations',
        hourlyRate: '280.00',
      },
      {
        clientContactId: clientContactIds[5],
        name: 'Regulatory Compliance Study',
        description: 'Study new healthcare regulations and compliance requirements',
        projectType: 'ID',
        targetCompanies: 'Healthcare Consultants',
        targetPersona: 'Compliance Expert, Regulatory Specialist',
        hourlyRate: '220.00',
      },
    ];
    
    const projectIds = [];
    for (const project of projects) {
      const [result] = await connection.execute(
        'INSERT INTO projects (clientContactId, name, description, projectType, targetCompanies, targetPersona, hourlyRate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [project.clientContactId, project.name, project.description, project.projectType, project.targetCompanies, project.targetPersona, project.hourlyRate]
      );
      projectIds.push(result.insertId);
    }
    console.log('✅ Seeded 6 projects');

    // Seed Screening Questions
    console.log('❓ Seeding screening questions...');
    const screeningQuestions = [
      { projectId: projectIds[0], question: 'What is your experience with AWS cloud migration?', order: 1 },
      { projectId: projectIds[0], question: 'Have you worked with legacy system modernization?', order: 2 },
      { projectId: projectIds[0], question: 'What is your experience with cost optimization?', order: 3 },
      { projectId: projectIds[1], question: 'What is your experience with machine learning models?', order: 1 },
      { projectId: projectIds[1], question: 'Have you published research papers?', order: 2 },
      { projectId: projectIds[2], question: 'What is your experience with financial planning?', order: 1 },
      { projectId: projectIds[2], question: 'Have you worked on M&A transactions?', order: 2 },
      { projectId: projectIds[3], question: 'What is your knowledge of fintech trends?', order: 1 },
      { projectId: projectIds[4], question: 'What is your experience with EHR systems?', order: 1 },
      { projectId: projectIds[5], question: 'What is your knowledge of healthcare regulations?', order: 1 },
    ];
    
    for (const question of screeningQuestions) {
      await connection.execute(
        'INSERT INTO screeningQuestions (projectId, question, `order`) VALUES (?, ?, ?)',
        [question.projectId, question.question, question.order]
      );
    }
    console.log('✅ Seeded 10 screening questions');

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
    console.log('  - 3 Clients');
    console.log('  - 6 Client Contacts');
    console.log('  - 5 Experts (2 with sample CVs)');
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
