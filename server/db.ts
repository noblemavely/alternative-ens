import { eq, and, like, or, inArray, sql } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import type { Pool } from "mysql2/promise";
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
  adminUsers,
  projectActivityTimeline,
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
  type AdminUser,
  type ProjectActivityTimeline,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: (MySql2Database<typeof schema> & { $client: Pool }) | null = null;

async function initializeSchema(pool: any) {
  try {
    const connection = await pool.getConnection();
    console.log("[Database] Checking schema...");

    // Create all essential tables using raw SQL
    const createTableStatements = [
      `CREATE TABLE IF NOT EXISTS sectors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS \`functions\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        companyName VARCHAR(255),
        companyWebsite VARCHAR(255),
        contactPerson VARCHAR(255),
        sector VARCHAR(255),
        industry VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS experts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        email VARCHAR(320) NOT NULL UNIQUE,
        phone VARCHAR(20),
        sector VARCHAR(255),
        \`function\` VARCHAR(255),
        linkedinUrl VARCHAR(500),
        biography LONGTEXT,
        cvUrl VARCHAR(500),
        cvKey VARCHAR(500),
        verificationToken VARCHAR(255),
        verificationTokenExpiry TIMESTAMP NULL,
        isVerified BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_verified (isVerified)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS expertEmployment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expertId INT NOT NULL,
        companyName VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        startDate VARCHAR(10),
        endDate VARCHAR(10),
        isCurrent BOOLEAN DEFAULT FALSE,
        description LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
        INDEX idx_expertId (expertId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS expertEducation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expertId INT NOT NULL,
        schoolName VARCHAR(255) NOT NULL,
        degree VARCHAR(255),
        fieldOfStudy VARCHAR(255),
        startDate VARCHAR(10),
        endDate VARCHAR(10),
        description LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
        INDEX idx_expertId (expertId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS expertVerification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expertId INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expiresAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expertId (expertId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS adminUsers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ];

    // Execute all table creation statements
    for (const statement of createTableStatements) {
      try {
        await connection.execute(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error?.message?.includes('already exists')) {
          console.warn("[Database] Table creation notice:", error?.message);
        }
      }
    }

    // Insert sample sectors if table is empty
    try {
      await connection.execute(
        `INSERT IGNORE INTO sectors (id, name, description) VALUES
        (1, 'Technology', 'Software, IT, and tech sector'),
        (2, 'Finance', 'Banking, investment, and financial services'),
        (3, 'Healthcare', 'Medical, pharmaceutical, and health services'),
        (4, 'Manufacturing', 'Industrial production and operations')`
      );
    } catch (error: any) {
      console.log("[Database] Sectors already populated:", error?.message?.substring(0, 50));
    }

    connection.release();
    console.log("[Database] Schema initialization completed successfully");
  } catch (error) {
    console.error("[Database] Schema initialization failed:", error);
    throw error;
  }
}

export async function getDb(): Promise<(MySql2Database<typeof schema> & { $client: Pool }) | null> {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbUrl = process.env.DATABASE_URL;
      console.log("[Database] Initializing with URL:", dbUrl.substring(0, 50) + "...");

      // Parse MySQL URL format: mysql://user:password@host:port/database
      const url = new URL(dbUrl);
      const config = {
        host: url.hostname,
        port: url.port ? parseInt(url.port) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading /
      };

      console.log("[Database] Connecting to:", config.host, "on port", config.port);
      const pool = mysql.createPool(config);

      // Initialize schema BEFORE creating drizzle instance
      console.log("[Database] Initializing schema...");
      await initializeSchema(pool);
      console.log("[Database] Schema initialization complete");

      _db = drizzle(pool, { schema, mode: "default" });
      console.log("[Database] Connection initialized successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
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
  const pool = (db as any).$client;

  // Get the inserted project ID
  const [rows] = await pool.execute('SELECT LAST_INSERT_ID() as id');
  const projectId = (rows[0] as any).id as number;

  // Create initial activity timeline event
  if (projectId) {
    await createProjectActivityEvent(
      projectId,
      "created",
      "Project Created",
      `Project was created with initial status: ${data.status || "Active"}`
    );
  }

  return result;
}

export async function getProjects() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(projects).orderBy(projects.createdAt);
}

export async function getProjectsByClientContact(clientContactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(projects).where(eq(projects.clientContactId, clientContactId)).orderBy(projects.createdAt);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
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

export async function getAllShortlists() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(shortlists);
}

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

export async function getAllClientContacts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(clientContacts);
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
    console.log("[seedDatabase] Starting seed operation");

    // Start with simple approach: just seed picklists (sectors and functions)
    // This is the minimal viable seed to populate the admin dropdowns

    // Clear existing data (in reverse order of dependencies)
    console.log("[seedDatabase] Clearing existing picklist data...");
    try {
      await db.delete(sectors);
      console.log("[seedDatabase] Deleted sectors");
    } catch (e) {
      console.log("[seedDatabase] No sectors to delete");
    }

    try {
      await db.delete(functions);
      console.log("[seedDatabase] Deleted functions");
    } catch (e) {
      console.log("[seedDatabase] No functions to delete");
    }

    // Seed Sectors
    console.log("[seedDatabase] Seeding sectors...");
    const sectorData = [
      { name: 'Technology', description: 'Software, IT, Cloud Computing' },
      { name: 'Finance', description: 'Banking, Investment, Insurance' },
      { name: 'Healthcare', description: 'Pharmaceuticals, Medical Devices, Healthcare Services' },
      { name: 'Manufacturing', description: 'Industrial, Automotive, Consumer Goods' },
      { name: 'Retail', description: 'E-commerce, Brick & Mortar, Fashion' },
    ];
    for (const sector of sectorData) {
      try {
        await db.insert(sectors).values(sector);
        console.log("[seedDatabase] Inserted sector:", sector.name);
      } catch (e) {
        console.log("[seedDatabase] Failed to insert sector:", sector.name, e);
      }
    }
    console.log("[seedDatabase] Sectors seeded successfully");

    // Seed Functions
    console.log("[seedDatabase] Seeding functions...");
    const functionData = [
      { name: 'Chief Executive Officer', description: 'C-level executive leadership' },
      { name: 'Chief Financial Officer', description: 'Financial leadership and strategy' },
      { name: 'Chief Technology Officer', description: 'Technology strategy and innovation' },
      { name: 'Vice President', description: 'Senior management level' },
      { name: 'Senior Manager', description: 'Management level' },
      { name: 'Product Manager', description: 'Product leadership and strategy' },
    ];
    for (const func of functionData) {
      try {
        await db.insert(functions).values(func);
        console.log("[seedDatabase] Inserted function:", func.name);
      } catch (e) {
        console.log("[seedDatabase] Failed to insert function:", func.name, e);
      }
    }
    console.log("[seedDatabase] Functions seeded successfully");


    console.log("[seedDatabase] Picklist seed completed successfully");
    return {
      success: true,
      message: 'Database seeded successfully with picklist data',
      summary: {
        sectors: 5,
        functions: 6,
      },
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// ============ ACTIVITY TIMELINE FUNCTIONS ============

export interface ActivityTimelineEvent {
  id: string;
  timestamp: Date;
  type: "expert_created" | "added_to_project" | "status_changed";
  title: string;
  description: string;
  projectId?: number;
  projectName?: string;
  fromStatus?: string;
  toStatus?: string;
}

/**
 * Get activity timeline for an expert on a specific project
 */
export async function getExpertProjectActivityTimeline(
  expertId: number,
  projectId: number
): Promise<ActivityTimelineEvent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const shortlist = await db
    .select()
    .from(shortlists)
    .leftJoin(projects, eq(shortlists.projectId, projects.id))
    .where(and(eq(shortlists.expertId, expertId), eq(shortlists.projectId, projectId)))
    .limit(1);

  if (!shortlist || shortlist.length === 0) {
    return [];
  }

  const sl = shortlist[0].shortlists;
  const proj = shortlist[0].projects;

  const events: ActivityTimelineEvent[] = [];

  // Add initial status event (when added to project)
  if (sl && proj) {
    events.push({
      id: `shortlist-${sl.id}`,
      timestamp: sl.createdAt,
      type: "added_to_project",
      title: `Added to ${proj.name}`,
      description: `Expert was added to this project with initial status: ${sl.status}`,
      projectId: proj.id,
      projectName: proj.name,
      toStatus: sl.status,
    });

    // If status changed after creation, add status change event
    if (sl.updatedAt > sl.createdAt && sl.status !== "pending") {
      events.push({
        id: `shortlist-update-${sl.id}`,
        timestamp: sl.updatedAt,
        type: "status_changed",
        title: `Status Updated`,
        description: `Status changed to: ${sl.status}${sl.notes ? ` - ${sl.notes}` : ""}`,
        projectId: proj.id,
        projectName: proj.name,
        toStatus: sl.status,
      });
    }
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get generic activity timeline for an expert (across all projects)
 */
export async function getExpertActivityTimeline(expertId: number): Promise<ActivityTimelineEvent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const events: ActivityTimelineEvent[] = [];

  // Get expert creation date
  const expert = await db.select().from(experts).where(eq(experts.id, expertId)).limit(1);

  if (expert && expert.length > 0) {
    const exp = expert[0];
    events.push({
      id: `expert-created-${exp.id}`,
      timestamp: exp.createdAt,
      type: "expert_created",
      title: "Expert Profile Created",
      description: `${exp.firstName} ${exp.lastName} was added to the system`,
    });

    // Get all projects expert is added to
    const shortlistsData = await db
      .select()
      .from(shortlists)
      .leftJoin(projects, eq(shortlists.projectId, projects.id))
      .where(eq(shortlists.expertId, expertId))
      .orderBy(shortlists.createdAt);

    for (const row of shortlistsData) {
      const sl = row.shortlists;
      const proj = row.projects;

      if (sl && proj) {
        // Add project addition event
        events.push({
          id: `shortlist-${sl.id}`,
          timestamp: sl.createdAt,
          type: "added_to_project",
          title: `Added to Project: ${proj.name}`,
          description: `Expert was added to ${proj.name} with status: ${sl.status}`,
          projectId: proj.id,
          projectName: proj.name,
          toStatus: sl.status,
        });

        // Add status change event if applicable
        if (sl.updatedAt > sl.createdAt) {
          events.push({
            id: `shortlist-update-${sl.id}`,
            timestamp: sl.updatedAt,
            type: "status_changed",
            title: `Status Changed on ${proj.name}`,
            description: `Status updated to: ${sl.status}${sl.notes ? ` - ${sl.notes}` : ""}`,
            projectId: proj.id,
            projectName: proj.name,
            toStatus: sl.status,
          });
        }
      }
    }
  }

  // Sort by timestamp descending (most recent first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Create a project activity timeline event
 */
export async function createProjectActivityEvent(
  projectId: number,
  type: "created" | "status_changed",
  title: string,
  description: string,
  fromStatus?: string,
  toStatus?: string,
  changedBy?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(projectActivityTimeline).values({
    projectId,
    type,
    title,
    description,
    fromStatus: fromStatus || null,
    toStatus: toStatus || null,
    changedBy: changedBy || null,
  });
}

/**
 * Get project activity timeline
 */
export async function getProjectActivityTimeline(projectId: number): Promise<ActivityTimelineEvent[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project || project.length === 0) {
    return [];
  }

  const activities = await db
    .select()
    .from(projectActivityTimeline)
    .where(eq(projectActivityTimeline.projectId, projectId));

  const events: ActivityTimelineEvent[] = activities.map((activity) => ({
    id: `project-activity-${activity.id}`,
    timestamp: activity.timestamp,
    type: activity.type === "created" ? "expert_created" : "status_changed",
    title: activity.title,
    description: activity.description || "",
    projectId: activity.projectId,
    fromStatus: activity.fromStatus || undefined,
    toStatus: activity.toStatus || undefined,
  }));

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
