import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function seedTestData() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log('🌱 Seeding test data...');

    // Clear existing data
    await connection.execute('DELETE FROM shortlists');
    await connection.execute('DELETE FROM expertClientMapping');
    await connection.execute('DELETE FROM screeningQuestions');
    await connection.execute('DELETE FROM projects');
    await connection.execute('DELETE FROM clientContacts');
    await connection.execute('DELETE FROM clients');
    await connection.execute('DELETE FROM expertVerification');
    await connection.execute('DELETE FROM expertEducation');
    await connection.execute('DELETE FROM expertEmployment');
    await connection.execute('DELETE FROM experts');

    // Add 3 Clients
    const clients = [
      {
        name: 'John Smith',
        email: 'john@techcorp.com',
        phone: '+1-555-0101',
        companyName: 'TechCorp Inc',
        companyWebsite: 'https://techcorp.com',
        contactPerson: 'John Smith',
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@innovate.io',
        phone: '+1-555-0102',
        companyName: 'Innovate Solutions',
        companyWebsite: 'https://innovate.io',
        contactPerson: 'Sarah Johnson',
      },
      {
        name: 'Michael Chen',
        email: 'michael@globaltech.com',
        phone: '+1-555-0103',
        companyName: 'GlobalTech Ventures',
        companyWebsite: 'https://globaltech.com',
        contactPerson: 'Michael Chen',
      },
    ];

    const clientIds = [];
    for (const client of clients) {
      const [result] = await connection.execute(
        'INSERT INTO clients (name, email, phone, companyName, companyWebsite, contactPerson) VALUES (?, ?, ?, ?, ?, ?)',
        [client.name, client.email, client.phone, client.companyName, client.companyWebsite, client.contactPerson]
      );
      clientIds.push(result.insertId);
      console.log(`✓ Created client: ${client.companyName}`);
    }

    // Add 3 Experts
    const experts = [
      {
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@expert.com',
        phone: '+1-555-1001',
        sector: 'Technology',
        function: 'Strategy',
        biography: 'Expert in digital transformation and enterprise strategy with 15+ years of experience.',
        linkedinUrl: 'https://linkedin.com/in/alice-williams',
      },
      {
        firstName: 'David',
        lastName: 'Martinez',
        email: 'david.martinez@expert.com',
        phone: '+1-555-1002',
        sector: 'Finance',
        function: 'Operations',
        biography: 'Financial operations specialist with expertise in process optimization and cost reduction.',
        linkedinUrl: 'https://linkedin.com/in/david-martinez',
      },
      {
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@expert.com',
        phone: '+1-555-1003',
        sector: 'Healthcare',
        function: 'Compliance',
        biography: 'Healthcare compliance expert specializing in regulatory frameworks and quality assurance.',
        linkedinUrl: 'https://linkedin.com/in/emma-thompson',
      },
    ];

    const expertIds = [];
    for (const expert of experts) {
      const [result] = await connection.execute(
        'INSERT INTO experts (firstName, lastName, email, phone, sector, function, biography, linkedinUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [expert.firstName, expert.lastName, expert.email, expert.phone, expert.sector, expert.function, expert.biography, expert.linkedinUrl]
      );
      expertIds.push(result.insertId);
      console.log(`✓ Created expert: ${expert.firstName} ${expert.lastName}`);
    }

    // Add 3 Projects
    const projects = [
      {
        clientId: clientIds[0],
        name: 'Digital Transformation Initiative',
        description: 'End-to-end digital transformation program for enterprise systems modernization.',
        projectType: 'Advisory',
        targetPersona: 'CTO, VP Technology',
        hourlyRate: '250',
      },
      {
        clientId: clientIds[1],
        name: 'Market Entry Strategy',
        description: 'Go-to-market strategy development for new product line in Asian markets.',
        projectType: 'Call',
        targetPersona: 'VP Marketing, Product Lead',
        hourlyRate: '300',
      },
      {
        clientId: clientIds[2],
        name: 'Regulatory Compliance Audit',
        description: 'Comprehensive compliance audit and remediation planning for healthcare operations.',
        projectType: 'ID',
        targetPersona: 'Compliance Officer, Quality Director',
        hourlyRate: '275',
      },
    ];

    const projectIds = [];
    for (const project of projects) {
      const [result] = await connection.execute(
        'INSERT INTO projects (clientId, name, description, projectType, targetPersona, hourlyRate) VALUES (?, ?, ?, ?, ?, ?)',
        [project.clientId, project.name, project.description, project.projectType, project.targetPersona, project.hourlyRate]
      );
      projectIds.push(result.insertId);
      console.log(`✓ Created project: ${project.name}`);
    }

    // Add shortlists (experts to projects)
    const shortlists = [
      { projectId: projectIds[0], expertId: expertIds[0], status: 'interested' },
      { projectId: projectIds[0], expertId: expertIds[1], status: 'contacted' },
      { projectId: projectIds[1], expertId: expertIds[1], status: 'interested' },
      { projectId: projectIds[1], expertId: expertIds[2], status: 'engaged' },
      { projectId: projectIds[2], expertId: expertIds[2], status: 'interested' },
      { projectId: projectIds[2], expertId: expertIds[0], status: 'contacted' },
    ];

    for (const shortlist of shortlists) {
      await connection.execute(
        'INSERT INTO shortlists (projectId, expertId, status) VALUES (?, ?, ?)',
        [shortlist.projectId, shortlist.expertId, shortlist.status]
      );
    }
    console.log(`✓ Created ${shortlists.length} shortlist entries`);

    // Add expert employment history
    const employmentRecords = [
      { expertId: expertIds[0], companyName: 'McKinsey & Company', position: 'Senior Consultant', startDate: '2015-01', endDate: '2020-12', description: 'Led digital transformation engagements for Fortune 500 clients.' },
      { expertId: expertIds[0], companyName: 'Accenture', position: 'Manager', startDate: '2010-06', endDate: '2014-12', description: 'Managed enterprise technology implementation projects.' },
      { expertId: expertIds[1], companyName: 'Goldman Sachs', position: 'Vice President', startDate: '2016-01', endDate: '2022-06', description: 'Led financial operations and process optimization initiatives.' },
      { expertId: expertIds[1], companyName: 'JP Morgan Chase', position: 'Senior Manager', startDate: '2012-03', endDate: '2015-12', description: 'Oversaw operations for trading division.' },
      { expertId: expertIds[2], companyName: 'FDA', position: 'Compliance Specialist', startDate: '2014-09', endDate: '2021-08', description: 'Managed regulatory compliance and audit programs.' },
      { expertId: expertIds[2], companyName: 'Mayo Clinic', position: 'Quality Assurance Manager', startDate: '2011-01', endDate: '2014-08', description: 'Led quality improvement initiatives.' },
    ];

    for (const emp of employmentRecords) {
      await connection.execute(
        'INSERT INTO expertEmployment (expertId, companyName, position, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?)',
        [emp.expertId, emp.companyName, emp.position, emp.startDate, emp.endDate, emp.description]
      );
    }
    console.log(`✓ Created ${employmentRecords.length} employment records`);

    // Add expert education history
    const educationRecords = [
      { expertId: expertIds[0], schoolName: 'Stanford University', degree: 'MBA', fieldOfStudy: 'Business Administration', startDate: '2008-09', endDate: '2010-06' },
      { expertId: expertIds[0], schoolName: 'UC Berkeley', degree: 'BS', fieldOfStudy: 'Computer Science', startDate: '2004-09', endDate: '2008-05' },
      { expertId: expertIds[1], schoolName: 'Harvard University', degree: 'MBA', fieldOfStudy: 'Finance', startDate: '2010-09', endDate: '2012-06' },
      { expertId: expertIds[1], schoolName: 'MIT', degree: 'BS', fieldOfStudy: 'Mathematics', startDate: '2006-09', endDate: '2010-05' },
      { expertId: expertIds[2], schoolName: 'Yale University', degree: 'MS', fieldOfStudy: 'Public Health', startDate: '2012-09', endDate: '2014-05' },
      { expertId: expertIds[2], schoolName: 'Johns Hopkins University', degree: 'BS', fieldOfStudy: 'Biology', startDate: '2007-09', endDate: '2011-05' },
    ];

    for (const edu of educationRecords) {
      await connection.execute(
        'INSERT INTO expertEducation (expertId, schoolName, degree, fieldOfStudy, startDate, endDate) VALUES (?, ?, ?, ?, ?, ?)',
        [edu.expertId, edu.schoolName, edu.degree, edu.fieldOfStudy, edu.startDate, edu.endDate]
      );
    }
    console.log(`✓ Created ${educationRecords.length} education records`);

    // Add screening questions for projects
    const screeningQuestions = [
      { projectId: projectIds[0], question: 'What is your experience with cloud migration?' },
      { projectId: projectIds[0], question: 'Have you worked on enterprise ERP implementations?' },
      { projectId: projectIds[1], question: 'Describe your experience in Asian market expansion.' },
      { projectId: projectIds[1], question: 'Do you have B2B SaaS go-to-market experience?' },
      { projectId: projectIds[2], question: 'What regulatory frameworks have you worked with?' },
      { projectId: projectIds[2], question: 'Have you managed FDA compliance audits?' },
    ];

    for (const sq of screeningQuestions) {
      await connection.execute(
        'INSERT INTO screeningQuestions (projectId, question) VALUES (?, ?)',
        [sq.projectId, sq.question]
      );
    }
    console.log(`✓ Created ${screeningQuestions.length} screening questions`);

    // Add client contacts (for multi-contact support)
    const clientContacts = [
      { clientId: clientIds[0], contactName: 'John Smith', email: 'john@techcorp.com', phone: '+1-555-0101', role: 'CTO', workType: 'Full-time', isActive: true },
      { clientId: clientIds[0], contactName: 'Lisa Anderson', email: 'lisa@techcorp.com', phone: '+1-555-0104', role: 'VP Operations', workType: 'Full-time', isActive: true },
      { clientId: clientIds[1], contactName: 'Sarah Johnson', email: 'sarah@innovate.io', phone: '+1-555-0102', role: 'CEO', workType: 'Full-time', isActive: true },
      { clientId: clientIds[1], contactName: 'Robert Lee', email: 'robert@innovate.io', phone: '+1-555-0105', role: 'CFO', workType: 'Full-time', isActive: true },
      { clientId: clientIds[2], contactName: 'Michael Chen', email: 'michael@globaltech.com', phone: '+1-555-0103', role: 'Compliance Lead', workType: 'Full-time', isActive: true },
      { clientId: clientIds[2], contactName: 'Jennifer White', email: 'jennifer@globaltech.com', phone: '+1-555-0106', role: 'Quality Director', workType: 'Full-time', isActive: true },
    ];

    for (const cc of clientContacts) {
      await connection.execute(
        'INSERT INTO clientContacts (clientId, contactName, email, phone, role, workType, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cc.clientId, cc.contactName, cc.email, cc.phone, cc.role, cc.workType, cc.isActive ? 1 : 0]
      );
    }
    console.log(`✓ Created ${clientContacts.length} client contacts`);

    console.log('\n✅ Test data seeding completed successfully!');
    console.log(`\n📊 Summary:\n  - 3 Clients\n  - 3 Experts\n  - 3 Projects\n  - 6 Shortlist entries\n  - 6 Employment records\n  - 6 Education records\n  - 6 Screening questions\n  - 6 Client contacts`);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedTestData();
