import { eq, and, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clients,
  clientContacts,
  experts,
  projects,
  screeningQuestions,
  shortlists,
  expertEmployment,
  expertEducation,
  expertVerification,
  expertClientMapping,
  sectors,
  functions,
  type Client,
  type ClientContact,
  type Expert,
  type Project,
  type ScreeningQuestion,
  type Shortlist,
  type ExpertEmployment,
  type ExpertEducation,
  type Sector,
  type Function,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CLIENT FUNCTIONS ============

export async function createClient(data: Omit<Client, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedData = {
    ...data,
    phone: data.phone ?? null,
    companyName: data.companyName ?? null,
    companyWebsite: data.companyWebsite ?? null,
    contactPerson: data.contactPerson ?? null,
  };

  const result = await db.insert(clients).values(normalizedData);
  return result;
}

export async function getClients() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(clients).orderBy(clients.createdAt);
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateClient(id: number, data: Partial<Omit<Client, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(clients).where(eq(clients.id, id));
}

// ============ EXPERT FUNCTIONS ============

export async function createExpert(data: Omit<Expert, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(experts).values(data);
  return result;
}

export async function getExperts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(experts).orderBy(experts.createdAt);
}

export async function getExpertById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(experts).where(eq(experts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getExpertByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(experts).where(eq(experts.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateExpert(id: number, data: Partial<Omit<Expert, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(experts).set(data).where(eq(experts.id, id));
}

export async function deleteExpert(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(experts).where(eq(experts.id, id));
}

export async function searchExperts(filters: {
  sector?: string;
  function?: string;
  keyword?: string;
  skillsets?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.sector) {
    conditions.push(like(experts.sector, `%${filters.sector}%`));
  }

  if (filters.function) {
    conditions.push(like(experts.function, `%${filters.function}%`));
  }

  if (filters.keyword) {
    conditions.push(
      or(
        like(experts.firstName, `%${filters.keyword}%`),
        like(experts.lastName, `%${filters.keyword}%`),
        like(experts.biography, `%${filters.keyword}%`),
        like(experts.sector, `%${filters.keyword}%`),
        like(experts.function, `%${filters.keyword}%`)
      )
    );
  }

  if (conditions.length > 0) {
    return db.select().from(experts).where(and(...conditions)).orderBy(experts.createdAt);
  }

  return db.select().from(experts).orderBy(experts.createdAt);
}

// ============ PROJECT FUNCTIONS ============

export async function createProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projects).values(data);
  return result;
}

export async function getProjects() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(projects).orderBy(projects.createdAt);
}

export async function getProjectsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(projects.createdAt);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProject(id: number, data: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projects).where(eq(projects.id, id));
}

// ============ SCREENING QUESTION FUNCTIONS ============

export async function createScreeningQuestion(data: Omit<ScreeningQuestion, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(screeningQuestions).values(data);
}

export async function getScreeningQuestionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(screeningQuestions)
    .where(eq(screeningQuestions.projectId, projectId))
    .orderBy(screeningQuestions.order);
}

export async function updateScreeningQuestion(id: number, data: Partial<Omit<ScreeningQuestion, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(screeningQuestions).set(data).where(eq(screeningQuestions.id, id));
}

export async function deleteScreeningQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(screeningQuestions).where(eq(screeningQuestions.id, id));
}

// ============ SHORTLIST FUNCTIONS ============

export async function addToShortlist(data: Omit<Shortlist, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(shortlists).values(data);
}

export async function getShortlistByProjectAndExpert(projectId: number, expertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(shortlists)
    .where(and(eq(shortlists.projectId, projectId), eq(shortlists.expertId, expertId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getShortlistsByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: shortlists.id,
      projectId: shortlists.projectId,
      expertId: shortlists.expertId,
      status: shortlists.status,
      notes: shortlists.notes,
      createdAt: shortlists.createdAt,
      updatedAt: shortlists.updatedAt,
      expert: {
        id: experts.id,
        firstName: experts.firstName,
        lastName: experts.lastName,
        email: experts.email,
        sector: experts.sector,
        function: experts.function,
      },
    })
    .from(shortlists)
    .leftJoin(experts, eq(shortlists.expertId, experts.id))
    .where(eq(shortlists.projectId, projectId))
    .orderBy(shortlists.createdAt);
}

export async function updateShortlist(id: number, data: Partial<Omit<Shortlist, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(shortlists).set(data).where(eq(shortlists.id, id));
}

export async function removeFromShortlist(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(shortlists).where(eq(shortlists.id, id));
}

// ============ EXPERT EMPLOYMENT FUNCTIONS ============

export async function createExpertEmployment(data: Omit<ExpertEmployment, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(expertEmployment).values(data);
}

export async function getExpertEmploymentHistory(expertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(expertEmployment)
    .where(eq(expertEmployment.expertId, expertId))
    .orderBy(expertEmployment.createdAt);
}

export async function updateExpertEmployment(id: number, data: Partial<Omit<ExpertEmployment, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(expertEmployment).set(data).where(eq(expertEmployment.id, id));
}

export async function deleteExpertEmployment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(expertEmployment).where(eq(expertEmployment.id, id));
}

// ============ EXPERT EDUCATION FUNCTIONS ============

export async function createExpertEducation(data: Omit<ExpertEducation, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(expertEducation).values(data);
}

export async function getExpertEducationHistory(expertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(expertEducation)
    .where(eq(expertEducation.expertId, expertId))
    .orderBy(expertEducation.createdAt);
}

export async function updateExpertEducation(id: number, data: Partial<Omit<ExpertEducation, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(expertEducation).set(data).where(eq(expertEducation.id, id));
}

export async function deleteExpertEducation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(expertEducation).where(eq(expertEducation.id, id));
}

// ============ EXPERT VERIFICATION FUNCTIONS ============

export async function createExpertVerification(data: Omit<typeof expertVerification.$inferInsert, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(expertVerification).values(data);
}

export async function getVerificationByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(expertVerification)
    .where(eq(expertVerification.token, token))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function deleteExpertVerification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(expertVerification).where(eq(expertVerification.id, id));
}


// Expert-Client Mapping Functions
export async function createExpertClientMapping(
  expertId: number,
  clientId: number,
  status: string = "shortlisted",
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(expertClientMapping)
    .values({
      expertId,
      clientId,
      status: status as any,
      notes,
    });

  return result;
}

export async function getExpertClientMappingsByExpert(expertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(expertClientMapping)
    .where(eq(expertClientMapping.expertId, expertId));
}

export async function getExpertClientMappingsByClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(expertClientMapping)
    .where(eq(expertClientMapping.clientId, clientId));
}

export async function updateExpertClientMappingStatus(
  id: number,
  status: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = { status: status as any };
  if (notes !== undefined) {
    updates.notes = notes;
  }

  await db
    .update(expertClientMapping)
    .set(updates)
    .where(eq(expertClientMapping.id, id));
}

export async function deleteExpertClientMapping(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(expertClientMapping)
    .where(eq(expertClientMapping.id, id));
}

export async function getExpertClientMapping(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(expertClientMapping)
    .where(eq(expertClientMapping.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}


// ============ CLIENT CONTACTS FUNCTIONS ============

export async function createClientContact(data: Omit<ClientContact, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clientContacts).values(data);
  return result;
}

export async function getClientContacts(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(clientContacts)
    .where(eq(clientContacts.clientId, clientId));
}

export async function getClientContactById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(clientContacts)
    .where(eq(clientContacts.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateClientContact(id: number, data: Partial<Omit<ClientContact, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(clientContacts)
    .set(data)
    .where(eq(clientContacts.id, id));
}

export async function deleteClientContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(clientContacts)
    .where(eq(clientContacts.id, id));
}


// ============ MASTER LISTS (Sectors & Functions) ============

export async function listSectors(): Promise<Sector[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sectors).orderBy(sectors.name);
}

export async function createSector(name: string, description?: string): Promise<Sector> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sectors).values({
    name,
    description: description || null,
  });
  
  return { id: result[0].insertId as number, name, description: description || null, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateSector(id: number, name: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(sectors).set({ name, description: description || null }).where(eq(sectors.id, id));
}

export async function deleteSector(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(sectors).where(eq(sectors.id, id));
}

export async function listFunctions(): Promise<Function[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(functions).orderBy(functions.name);
}

export async function createFunction(name: string, description?: string): Promise<Function> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(functions).values({
    name,
    description: description || null,
  });
  
  return { id: result[0].insertId as number, name, description: description || null, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateFunction(id: number, name: string, description?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(functions).set({ name, description: description || null }).where(eq(functions.id, id));
}

export async function deleteFunction(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(functions).where(eq(functions.id, id));
}


// ============ SEED DATABASE FUNCTION ============

export async function seedDatabase() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Clear existing data (in reverse order of dependencies)
    await db.delete(expertVerification);
    await db.delete(shortlists);
    await db.delete(expertClientMapping);
    await db.delete(screeningQuestions);
    await db.delete(projects);
    await db.delete(expertEducation);
    await db.delete(expertEmployment);
    await db.delete(experts);
    await db.delete(clientContacts);
    await db.delete(clients);
    await db.delete(functions);
    await db.delete(sectors);

    // Seed Sectors
    const sectorData = [
      { name: 'Technology', description: 'Software, IT, Cloud Computing' },
      { name: 'Finance', description: 'Banking, Investment, Insurance' },
      { name: 'Healthcare', description: 'Pharmaceuticals, Medical Devices, Healthcare Services' },
      { name: 'Manufacturing', description: 'Industrial, Automotive, Consumer Goods' },
      { name: 'Retail', description: 'E-commerce, Brick & Mortar, Fashion' },
    ];
    for (const sector of sectorData) {
      await db.insert(sectors).values(sector);
    }

    // Seed Functions
    const functionData = [
      { name: 'Chief Executive Officer', description: 'C-level executive leadership' },
      { name: 'Chief Financial Officer', description: 'Financial leadership and strategy' },
      { name: 'Chief Technology Officer', description: 'Technology strategy and innovation' },
      { name: 'Vice President', description: 'Senior management level' },
      { name: 'Senior Manager', description: 'Management level' },
      { name: 'Product Manager', description: 'Product leadership and strategy' },
    ];
    for (const func of functionData) {
      await db.insert(functions).values(func);
    }

    // Seed Clients
    const clientData = [
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
    
    const clientResults = [];
    for (const client of clientData) {
      const result = await db.insert(clients).values(client);
      clientResults.push(result);
    }
    const clientIds = clientResults.map(r => r[0].insertId as number);

    // Seed Client Contacts
    const clientContactData = [
      { clientId: clientIds[0], contactName: 'Alice Brown', email: 'alice.brown@techcorp.com', phone: '+1-555-0201', role: 'Hiring Manager', workType: 'Recruitment', isActive: true },
      { clientId: clientIds[0], contactName: 'Bob Wilson', email: 'bob.wilson@techcorp.com', phone: '+1-555-0202', role: 'Project Lead', workType: 'Advisory', isActive: true },
      { clientId: clientIds[1], contactName: 'Carol Davis', email: 'carol.davis@financeplus.com', phone: '+1-555-0203', role: 'SPOC', workType: 'Research', isActive: true },
      { clientId: clientIds[1], contactName: 'David Miller', email: 'david.miller@financeplus.com', phone: '+1-555-0204', role: 'Hiring Manager', workType: 'Recruitment', isActive: true },
      { clientId: clientIds[2], contactName: 'Emma Taylor', email: 'emma.taylor@healthcaresolutions.com', phone: '+1-555-0205', role: 'Project Lead', workType: 'Advisory', isActive: true },
      { clientId: clientIds[2], contactName: 'Frank Anderson', email: 'frank.anderson@healthcaresolutions.com', phone: '+1-555-0206', role: 'SPOC', workType: 'Research', isActive: true },
    ];
    
    const contactResults = [];
    for (const contact of clientContactData) {
      const result = await db.insert(clientContacts).values(contact);
      contactResults.push(result);
    }
    const contactIds = contactResults.map(r => r[0].insertId as number);

    // Seed Experts
    const expertData = [
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
    
    const expertResults = [];
    for (const expert of expertData) {
      const result = await db.insert(experts).values(expert);
      expertResults.push(result);
    }
    const expertIds = expertResults.map(r => r[0].insertId as number);

    // Seed Expert Employment History
    const employmentData = [
      { expertId: expertIds[0], companyName: 'Google', position: 'Senior Infrastructure Engineer', startDate: '2018-01', endDate: null, isCurrent: true, description: 'Led cloud infrastructure team' },
      { expertId: expertIds[0], companyName: 'Amazon', position: 'Cloud Architect', startDate: '2015-06', endDate: '2017-12', isCurrent: false, description: 'Designed AWS solutions for enterprise clients' },
      { expertId: expertIds[1], companyName: 'Goldman Sachs', position: 'Managing Director', startDate: '2019-03', endDate: null, isCurrent: true, description: 'Head of Financial Strategy' },
      { expertId: expertIds[1], companyName: 'JP Morgan', position: 'Vice President', startDate: '2014-09', endDate: '2019-02', isCurrent: false, description: 'Investment banking division' },
      { expertId: expertIds[2], companyName: 'Pfizer', position: 'VP Operations', startDate: '2017-05', endDate: null, isCurrent: true, description: 'Digital transformation initiatives' },
      { expertId: expertIds[2], companyName: 'Merck', position: 'Senior Manager', startDate: '2012-01', endDate: '2017-04', isCurrent: false, description: 'Operations and supply chain' },
    ];
    
    for (const record of employmentData) {
      await db.insert(expertEmployment).values(record);
    }

    // Seed Expert Education History
    const educationData = [
      { expertId: expertIds[0], schoolName: 'Stanford University', degree: 'Master of Science', fieldOfStudy: 'Computer Science', startDate: '2014-09', endDate: '2016-05', description: 'Specialized in distributed systems' },
      { expertId: expertIds[0], schoolName: 'UC Berkeley', degree: 'Bachelor of Science', fieldOfStudy: 'Electrical Engineering', startDate: '2010-09', endDate: '2014-05', description: 'GPA: 3.8' },
      { expertId: expertIds[1], schoolName: 'Harvard Business School', degree: 'MBA', fieldOfStudy: 'Business Administration', startDate: '2012-09', endDate: '2014-05', description: 'Baker Scholar' },
      { expertId: expertIds[1], schoolName: 'Yale University', degree: 'Bachelor of Science', fieldOfStudy: 'Economics', startDate: '2008-09', endDate: '2012-05', description: 'Cum Laude' },
      { expertId: expertIds[2], schoolName: 'Johns Hopkins University', degree: 'Master of Health Administration', fieldOfStudy: 'Healthcare Management', startDate: '2015-09', endDate: '2017-05', description: 'Focus on operations' },
      { expertId: expertIds[2], schoolName: 'University of Michigan', degree: 'Bachelor of Science', fieldOfStudy: 'Biology', startDate: '2010-09', endDate: '2014-05', description: 'Pre-med track' },
    ];
    
    for (const record of educationData) {
      await db.insert(expertEducation).values(record);
    }

    // Seed Projects
    const projectData = [
      {
        clientId: clientIds[0],
        clientContactId: contactIds[0],
        name: 'Cloud Migration Initiative',
        description: 'Migrate legacy systems to AWS cloud infrastructure',
        projectType: 'Advisory' as const,
        targetCompanies: 'Fortune 500 Tech Companies',
        targetPersona: 'CTO, VP Engineering',
        hourlyRate: '250.00',
      },
      {
        clientId: clientIds[0],
        clientContactId: contactIds[1],
        name: 'AI/ML Expert Search',
        description: 'Find senior AI/ML engineers for new research division',
        projectType: 'Call' as const,
        targetCompanies: 'FAANG Companies',
        targetPersona: 'Senior ML Engineer, Research Scientist',
        hourlyRate: '200.00',
      },
      {
        clientId: clientIds[1],
        clientContactId: contactIds[2],
        name: 'Financial Strategy Review',
        description: 'Review and optimize financial strategy for next 5 years',
        projectType: 'Advisory' as const,
        targetCompanies: 'Investment Banks',
        targetPersona: 'CFO, VP Finance',
        hourlyRate: '300.00',
      },
      {
        clientId: clientIds[1],
        clientContactId: contactIds[3],
        name: 'Market Research - Fintech',
        description: 'Conduct market research on fintech disruption',
        projectType: 'ID' as const,
        targetCompanies: 'Fintech Startups, Banks',
        targetPersona: 'Industry Expert, Analyst',
        hourlyRate: '180.00',
      },
      {
        clientId: clientIds[2],
        clientContactId: contactIds[4],
        name: 'Digital Health Transformation',
        description: 'Plan digital transformation for healthcare provider',
        projectType: 'Call' as const,
        targetCompanies: 'Healthcare Systems',
        targetPersona: 'CIO, VP Operations',
        hourlyRate: '280.00',
      },
      {
        clientId: clientIds[2],
        clientContactId: contactIds[5],
        name: 'Regulatory Compliance Study',
        description: 'Study new healthcare regulations and compliance requirements',
        projectType: 'ID' as const,
        targetCompanies: 'Healthcare Consultants',
        targetPersona: 'Compliance Expert, Regulatory Specialist',
        hourlyRate: '220.00',
      },
    ];
    
    const projectResults = [];
    for (const project of projectData) {
      const result = await db.insert(projects).values(project);
      projectResults.push(result);
    }
    const projectIds = projectResults.map(r => r[0].insertId as number);

    // Seed Screening Questions
    const questionData = [
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
    
    for (const question of questionData) {
      await db.insert(screeningQuestions).values(question);
    }

    // Seed Shortlists
    const shortlistData = [
      { projectId: projectIds[0], expertId: expertIds[0], status: 'contacted' as const, notes: 'Excellent fit for cloud migration' },
      { projectId: projectIds[0], expertId: expertIds[1], status: 'pending' as const, notes: 'Awaiting response' },
      { projectId: projectIds[1], expertId: expertIds[3], status: 'interested' as const, notes: 'Very interested in AI/ML role' },
      { projectId: projectIds[2], expertId: expertIds[1], status: 'engaged' as const, notes: 'In discussions about engagement' },
      { projectId: projectIds[2], expertId: expertIds[4], status: 'pending' as const, notes: 'Initial outreach sent' },
      { projectId: projectIds[3], expertId: expertIds[1], status: 'contacted' as const, notes: 'Confirmed availability' },
      { projectId: projectIds[4], expertId: expertIds[2], status: 'engaged' as const, notes: 'Proposal under review' },
      { projectId: projectIds[5], expertId: expertIds[2], status: 'interested' as const, notes: 'Strong regulatory background' },
      { projectId: projectIds[5], expertId: expertIds[4], status: 'pending' as const, notes: 'Awaiting confirmation' },
    ];
    
    for (const shortlist of shortlistData) {
      await db.insert(shortlists).values(shortlist);
    }

    // Seed Expert-Client Mapping
    const mappingData = [
      { expertId: expertIds[0], clientId: clientIds[0], status: 'engaged' as const, notes: 'Active engagement on cloud project' },
      { expertId: expertIds[1], clientId: clientIds[0], status: 'contacted' as const, notes: 'Initial conversation completed' },
      { expertId: expertIds[1], clientId: clientIds[1], status: 'engaged' as const, notes: 'Working on financial strategy' },
      { expertId: expertIds[2], clientId: clientIds[2], status: 'engaged' as const, notes: 'Digital transformation lead' },
      { expertId: expertIds[3], clientId: clientIds[0], status: 'shortlisted' as const, notes: 'Potential for AI/ML projects' },
      { expertId: expertIds[4], clientId: clientIds[1], status: 'contacted' as const, notes: 'Fintech expertise valuable' },
      { expertId: expertIds[4], clientId: clientIds[2], status: 'shortlisted' as const, notes: 'Retail background relevant' },
    ];
    
    for (const mapping of mappingData) {
      await db.insert(expertClientMapping).values(mapping);
    }

    return {
      success: true,
      message: 'Database seeded successfully with sample data',
      summary: {
        sectors: 5,
        functions: 6,
        clients: 3,
        clientContacts: 6,
        experts: 5,
        employmentRecords: 6,
        educationRecords: 6,
        projects: 6,
        screeningQuestions: 10,
        shortlistRecords: 9,
        expertClientMappings: 7,
      },
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
