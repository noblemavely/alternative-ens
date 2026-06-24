import { eq, and, like, or, inArray, sql } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
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
  leads,
  expertNotes,
  questionnaires,
  questionnaireQuestions,
  questionnaireSubmissions,
  type Lead,
  type InsertLead,
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
  type ExpertNote,
  type InsertExpertNote,
  type Questionnaire,
  type QuestionnaireQuestion,
  type QuestionnaireSubmission,
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
        location VARCHAR(255),
        verificationToken VARCHAR(255),
        verificationTokenExpiry TIMESTAMP NULL,
        isVerified BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_verified (isVerified)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS expert_employment (
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

      `CREATE TABLE IF NOT EXISTS expert_education (
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

      `CREATE TABLE IF NOT EXISTS expert_verification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expertId INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expiresAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expertId (expertId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        isActive BOOLEAN DEFAULT TRUE,
        lastLogin TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS client_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clientId INT NOT NULL,
        contactName VARCHAR(255) NOT NULL,
        email VARCHAR(320) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(255),
        workType VARCHAR(255),
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
        INDEX idx_email (email),
        INDEX idx_clientId (clientId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clientContactId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description LONGTEXT,
        project_type ENUM('Call', 'Advisory', 'ID') NOT NULL,
        targetCompanies TEXT,
        targetPersona TEXT,
        rate DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
        status ENUM('Active', 'On Hold', 'Closed') DEFAULT 'Active' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clientContactId) REFERENCES client_contacts(id) ON DELETE CASCADE,
        INDEX idx_clientContactId (clientContactId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS screening_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        question LONGTEXT NOT NULL,
        \`order\` INT DEFAULT 0 NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_projectId (projectId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS shortlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        expertId INT NOT NULL,
        status ENUM('attached', 'invited', 'accepted', 'questionnaire_responded', 'p2c_done', 'declined', 'calls_done') DEFAULT 'attached' NOT NULL,
        consultantInChargeId INT,
        notes LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
        FOREIGN KEY (consultantInChargeId) REFERENCES admin_users(id) ON DELETE SET NULL,
        INDEX idx_projectId (projectId),
        INDEX idx_expertId (expertId),
        INDEX idx_consultantInChargeId (consultantInChargeId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS expert_client_mapping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expertId INT NOT NULL,
        clientId INT NOT NULL,
        status ENUM('shortlisted', 'contacted', 'attempting_contact', 'engaged', 'qualified', 'proposal_sent', 'negotiation', 'verbal_agreement', 'closed_won', 'closed_lost') DEFAULT 'shortlisted' NOT NULL,
        notes LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
        FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
        INDEX idx_expertId (expertId),
        INDEX idx_clientId (clientId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entityType ENUM('client', 'expert', 'project', 'admin_user', 'contact', 'shortlist') NOT NULL,
        entity_id INT NOT NULL,
        operationType ENUM('create', 'update', 'delete') NOT NULL,
        adminId INT,
        fieldChanged VARCHAR(255),
        oldValue LONGTEXT,
        newValue LONGTEXT,
        reason TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_entityType (entityType),
        INDEX idx_entityId (entity_id),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS project_activity_timeline (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        type ENUM('created', 'status_changed') NOT NULL,
        fromStatus VARCHAR(50),
        toStatus VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        changedBy INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_projectId (projectId),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        queryType ENUM('client', 'advisor', 'other') NOT NULL,
        otherQuery TEXT,
        utm_source   VARCHAR(255),
        utm_medium   VARCHAR(255),
        utm_campaign VARCHAR(255),
        utm_content  VARCHAR(255),
        utm_term     VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_email (email),
        INDEX idx_createdAt (createdAt),
        INDEX idx_utm_campaign (utm_campaign),
        INDEX idx_utm_source (utm_source)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      /* Add UTM columns to existing leads table (safe — IF NOT EXISTS via IGNORE) */
      `ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS utm_source   VARCHAR(255) AFTER otherQuery,
        ADD COLUMN IF NOT EXISTS utm_medium   VARCHAR(255) AFTER utm_source,
        ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255) AFTER utm_medium,
        ADD COLUMN IF NOT EXISTS utm_content  VARCHAR(255) AFTER utm_campaign,
        ADD COLUMN IF NOT EXISTS utm_term     VARCHAR(255) AFTER utm_content`,

      `CREATE TABLE IF NOT EXISTS expert_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expertId INT NOT NULL,
        content LONGTEXT NOT NULL,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
        INDEX idx_expertId (expertId),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      /* Migrate shortlists.status ENUM to new workflow values */
      `ALTER TABLE shortlists MODIFY COLUMN status ENUM('attached','invited','accepted','questionnaire_responded','p2c_done','declined','calls_done') DEFAULT 'attached' NOT NULL`,

      /* Add consultantInChargeId column to shortlists table */
      `ALTER TABLE shortlists ADD COLUMN consultantInChargeId INT`,

      /* Add location column to experts table */
      `ALTER TABLE experts ADD COLUMN location VARCHAR(255) AFTER cvKey`,

      /* Questionnaire tables */
      `CREATE TABLE IF NOT EXISTS questionnaires (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projectId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        token VARCHAR(64) NOT NULL UNIQUE,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_projectId (projectId),
        INDEX idx_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      /* Add isPublished column to questionnaires table */
      `ALTER TABLE questionnaires ADD COLUMN isPublished BOOLEAN DEFAULT FALSE NOT NULL`,

      `CREATE TABLE IF NOT EXISTS questionnaire_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questionnaireId INT NOT NULL,
        questionText LONGTEXT NOT NULL,
        questionType ENUM('long_text','yes_no','dropdown','multi_select') NOT NULL,
        options TEXT,
        \`order\` INT DEFAULT 0 NOT NULL,
        isRequired BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (questionnaireId) REFERENCES questionnaires(id) ON DELETE CASCADE,
        INDEX idx_questionnaireId (questionnaireId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS questionnaire_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questionnaireId INT NOT NULL,
        expertId INT,
        respondentEmail VARCHAR(255) NOT NULL,
        respondentName VARCHAR(255),
        answers LONGTEXT NOT NULL,
        submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (questionnaireId) REFERENCES questionnaires(id) ON DELETE CASCADE,
        INDEX idx_questionnaireId (questionnaireId),
        INDEX idx_expertId (expertId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS isPublished BOOLEAN DEFAULT FALSE NOT NULL`,

      `CREATE TABLE IF NOT EXISTS questionnaire_invitations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        questionnaireId INT NOT NULL,
        expertId INT NOT NULL,
        shortlistId INT,
        token VARCHAR(64) NOT NULL UNIQUE,
        status ENUM('pending','completed') DEFAULT 'pending' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (questionnaireId) REFERENCES questionnaires(id) ON DELETE CASCADE,
        INDEX idx_questionnaireId (questionnaireId),
        INDEX idx_expertId (expertId),
        INDEX idx_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ];

    // Execute all table creation statements
    for (const statement of createTableStatements) {
      try {
        await connection.execute(statement);
      } catch (error: any) {
        // Ignore "already exists" and "duplicate column" errors
        if (!error?.message?.includes('already exists') && !error?.message?.includes('Duplicate column')) {
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

    // Create default admin user if none exists
    try {
      const [existingAdmins] = await connection.execute(
        `SELECT id FROM admin_users WHERE email = 'admin@alternative.com'`
      );

      if ((existingAdmins as any[]).length === 0) {
        // Create hashed password for 'admin123'
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await connection.execute(
          `INSERT INTO admin_users (email, password, name, role, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          ['admin@alternative.com', hashedPassword, 'Admin User', 'super_admin', true]
        );
        console.log("[Database] Default admin user created successfully");
      } else {
        console.log("[Database] Admin user already exists");
      }
    } catch (error: any) {
      console.warn("[Database] Admin user creation warning:", error?.message?.substring(0, 100));
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

export async function getExpertByEmailOrPhone(email: string, phone?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(experts.email, email)];
  if (phone) {
    conditions.push(eq(experts.phone, phone));
  }

  const result = await db.select().from(experts).where(or(...conditions)).limit(1);
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
  location?: string;
  // Employment filters
  companyName?: string;
  designation?: string;
  employmentYearFrom?: string;
  employmentYearTo?: string;
  // Education filters
  university?: string;
  degree?: string;
  fieldOfStudy?: string;
  educationYearFrom?: string;
  educationYearTo?: string;
  // Legacy single-year filter
  year?: string;
  skillsets?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const whereClauses: string[] = [];
  const params: any[] = [];

  // ── Basic expert-table filters ──────────────────────────────────────────
  if (filters.sector) {
    whereClauses.push("e.sector LIKE ?");
    params.push(`%${filters.sector}%`);
  }
  if (filters.function) {
    whereClauses.push("e.`function` LIKE ?");
    params.push(`%${filters.function}%`);
  }
  if (filters.location) {
    whereClauses.push("e.location LIKE ?");
    params.push(`%${filters.location}%`);
  }
  if (filters.keyword) {
    whereClauses.push("(e.firstName LIKE ? OR e.lastName LIKE ? OR e.biography LIKE ? OR e.sector LIKE ? OR e.`function` LIKE ?)");
    params.push(...Array(5).fill(`%${filters.keyword}%`));
  }

  // ── Employment EXISTS subquery ──────────────────────────────────────────
  // Period overlap: startDate <= yearTo AND (endDate >= yearFrom OR endDate is null/current)
  const empConds: string[] = [];
  const empParams: any[] = [];
  const empYearFrom = filters.employmentYearFrom || filters.year;
  const empYearTo   = filters.employmentYearTo   || filters.year;

  if (filters.companyName) { empConds.push("ee.companyName LIKE ?"); empParams.push(`%${filters.companyName}%`); }
  if (filters.designation)  { empConds.push("ee.position LIKE ?");   empParams.push(`%${filters.designation}%`); }
  if (empYearTo)   { empConds.push("LEFT(ee.startDate, 4) <= ?"); empParams.push(empYearTo); }
  if (empYearFrom) { empConds.push("(ee.endDate IS NULL OR ee.endDate = '' OR ee.isCurrent = 1 OR LEFT(ee.endDate, 4) >= ?)"); empParams.push(empYearFrom); }

  if (empConds.length > 0) {
    whereClauses.push(`EXISTS (SELECT 1 FROM expert_employment ee WHERE ee.expertId = e.id AND ${empConds.join(" AND ")})`);
    params.push(...empParams);
  }

  // ── Education EXISTS subquery ───────────────────────────────────────────
  const eduConds: string[] = [];
  const eduParams: any[] = [];

  if (filters.university)    { eduConds.push("edu.schoolName LIKE ?");    eduParams.push(`%${filters.university}%`); }
  if (filters.degree)        { eduConds.push("edu.degree LIKE ?");        eduParams.push(`%${filters.degree}%`); }
  if (filters.fieldOfStudy)  { eduConds.push("edu.fieldOfStudy LIKE ?"); eduParams.push(`%${filters.fieldOfStudy}%`); }
  if (filters.educationYearTo)   { eduConds.push("LEFT(edu.startDate, 4) <= ?"); eduParams.push(filters.educationYearTo); }
  if (filters.educationYearFrom) { eduConds.push("(edu.endDate IS NULL OR edu.endDate = '' OR LEFT(edu.endDate, 4) >= ?)"); eduParams.push(filters.educationYearFrom); }

  if (eduConds.length > 0) {
    whereClauses.push(`EXISTS (SELECT 1 FROM expert_education edu WHERE edu.expertId = e.id AND ${eduConds.join(" AND ")})`);
    params.push(...eduParams);
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const [rows] = await (db as any).$client.execute(
    `SELECT e.* FROM experts e ${whereSQL} ORDER BY e.createdAt DESC`,
    params
  );
  const experts = rows as any[];
  if (experts.length === 0) return [];

  // ── Batch-enrich with employment + education for display ────────────────
  const ids = experts.map((e: any) => e.id);
  const ph  = ids.map(() => "?").join(",");
  const [empRows]: any = await (db as any).$client.execute(
    `SELECT * FROM expert_employment WHERE expertId IN (${ph}) ORDER BY isCurrent DESC, startDate DESC`,
    ids
  );
  const [eduRows]: any = await (db as any).$client.execute(
    `SELECT * FROM expert_education WHERE expertId IN (${ph}) ORDER BY endDate DESC`,
    ids
  );

  return experts.map((e: any) => ({
    ...e,
    employment: empRows.filter((r: any) => r.expertId === e.id),
    education:  eduRows.filter((r: any) => r.expertId === e.id),
  }));
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

export async function getShortlistById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(shortlists)
    .where(eq(shortlists.id, id))
    .limit(1);

  return result[0] || null;
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

  return db.insert(expertVerification).values({
    ...data,
    createdAt: new Date(),
  } as typeof expertVerification.$inferInsert);
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

    // Clear existing data (in reverse order of dependencies)
    console.log("[seedDatabase] Deleting existing data...");
    await db.delete(expertVerification);
    console.log("[seedDatabase] Deleted expertVerification");
    await db.delete(shortlists);
    console.log("[seedDatabase] Deleted shortlists");
    await db.delete(expertClientMapping);
    console.log("[seedDatabase] Deleted expertClientMapping");
    await db.delete(screeningQuestions);
    console.log("[seedDatabase] Deleted screeningQuestions");
    await db.delete(projects);
    console.log("[seedDatabase] Deleted projects");
    await db.delete(expertEducation);
    console.log("[seedDatabase] Deleted expertEducation");
    await db.delete(expertEmployment);
    console.log("[seedDatabase] Deleted expertEmployment");
    await db.delete(experts);
    console.log("[seedDatabase] Deleted experts");
    await db.delete(clientContacts);
    console.log("[seedDatabase] Deleted clientContacts");
    await db.delete(clients);
    console.log("[seedDatabase] Deleted clients");
    await db.delete(functions);
    console.log("[seedDatabase] Deleted functions");
    await db.delete(sectors);
    console.log("[seedDatabase] Deleted sectors");

    // Seed Sectors
    console.log("[seedDatabase] Seeding sectors...");
    const sectorData = [
      { name: 'Technology', description: 'Software, IT, Cloud Computing' },
      { name: 'Finance', description: 'Banking, Investment, Insurance' },
      { name: 'Healthcare', description: 'Pharmaceuticals, Medical Devices, Healthcare Services' },
      { name: 'Manufacturing', description: 'Industrial, Automotive, Consumer Goods' },
      { name: 'Retail', description: 'E-commerce, Brick & Mortar, Fashion' },
    ];
    await db.insert(sectors).values(sectorData);
    console.log("[seedDatabase] Sectors seeded successfully");

    // Seed Functions
    const functionData = [
      { name: 'Chief Executive Officer', description: 'C-level executive leadership' },
      { name: 'Chief Financial Officer', description: 'Financial leadership and strategy' },
      { name: 'Chief Technology Officer', description: 'Technology strategy and innovation' },
      { name: 'Vice President', description: 'Senior management level' },
      { name: 'Senior Manager', description: 'Management level' },
      { name: 'Product Manager', description: 'Product leadership and strategy' },
    ];
    await db.insert(functions).values(functionData);

    // Seed Clients
    const clientData = [
      {
        name: 'TechCorp Inc',
        email: 'contact@techcorp.com',
        phone: '+1-555-0101',
        companyName: 'TechCorp Inc',
        companyWebsite: 'https://techcorp.com',
        contactPerson: 'John Smith',
        sector: 'Technology',
      },
      {
        name: 'FinancePlus LLC',
        email: 'contact@financeplus.com',
        phone: '+1-555-0102',
        companyName: 'FinancePlus LLC',
        companyWebsite: 'https://financeplus.com',
        contactPerson: 'Sarah Johnson',
        sector: 'Finance',
      },
      {
        name: 'HealthCare Solutions',
        email: 'contact@healthcaresolutions.com',
        phone: '+1-555-0103',
        companyName: 'HealthCare Solutions',
        companyWebsite: 'https://healthcaresolutions.com',
        contactPerson: 'Michael Chen',
        sector: 'Healthcare',
      },
    ];

    // Insert clients and retrieve their IDs
    const insertedClients = await db.insert(clients).values(clientData);
    // For Drizzle, we need to fetch the inserted clients to get their IDs
    // Fetch in the same order as the original data to maintain consistency
    const fetchedClients = await Promise.all(
      clientData.map(c =>
        db.select().from(clients).where(eq(clients.email, c.email)).limit(1)
      )
    );
    const clientIds = fetchedClients.map(result => result[0]?.id).filter((id): id is number => id !== undefined);

    // Seed Client Contacts
    const clientContactData = [
      { clientId: clientIds[0], contactName: 'Alice Brown', email: 'alice.brown@techcorp.com', phone: '+1-555-0201', role: 'Hiring Manager', workType: 'Recruitment', isActive: true },
      { clientId: clientIds[0], contactName: 'Bob Wilson', email: 'bob.wilson@techcorp.com', phone: '+1-555-0202', role: 'Project Lead', workType: 'Advisory', isActive: true },
      { clientId: clientIds[1], contactName: 'Carol Davis', email: 'carol.davis@financeplus.com', phone: '+1-555-0203', role: 'SPOC', workType: 'Research', isActive: true },
      { clientId: clientIds[1], contactName: 'David Miller', email: 'david.miller@financeplus.com', phone: '+1-555-0204', role: 'Hiring Manager', workType: 'Recruitment', isActive: true },
      { clientId: clientIds[2], contactName: 'Emma Taylor', email: 'emma.taylor@healthcaresolutions.com', phone: '+1-555-0205', role: 'Project Lead', workType: 'Advisory', isActive: true },
      { clientId: clientIds[2], contactName: 'Frank Anderson', email: 'frank.anderson@healthcaresolutions.com', phone: '+1-555-0206', role: 'SPOC', workType: 'Research', isActive: true },
    ];

    await db.insert(clientContacts).values(clientContactData);
    const fetchedContacts = await Promise.all(
      clientContactData.map(c =>
        db.select().from(clientContacts).where(eq(clientContacts.email, c.email)).limit(1)
      )
    );
    const contactIds = fetchedContacts.map(result => result[0]?.id).filter((id): id is number => id !== undefined);

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
        cvUrl: '',
        cvKey: '',
        location: 'United States',
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
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
        cvUrl: '',
        cvKey: '',
        location: 'United Kingdom',
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
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
        cvUrl: '',
        cvKey: '',
        location: 'Singapore',
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
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
        cvUrl: '',
        cvKey: '',
        location: 'India',
        isVerified: false,
        verificationToken: null,
        verificationTokenExpiry: null,
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
        cvUrl: '',
        cvKey: '',
        location: 'United Arab Emirates',
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    ];

    // Use raw SQL to avoid Drizzle nullable field issues
    const pool = (db as any).$client;
    for (const expert of expertData) {
      await pool.execute(
        `INSERT IGNORE INTO experts (email, phone, firstName, lastName, sector, \`function\`, biography, linkedinUrl, cvUrl, cvKey, location, isVerified, verificationToken, verificationTokenExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [expert.email, expert.phone, expert.firstName, expert.lastName, expert.sector, expert.function, expert.biography, expert.linkedinUrl, expert.cvUrl, expert.cvKey, expert.location, expert.isVerified ? 1 : 0, expert.verificationToken, expert.verificationTokenExpiry]
      );
    }

    // Fetch the inserted experts
    const expertIds: number[] = [];
    for (const expert of expertData) {
      const [rows]: any = await pool.execute("SELECT id FROM experts WHERE email = ? LIMIT 1", [expert.email]);
      if (rows?.[0]?.id) expertIds.push(rows[0].id);
    }

    // Seed Expert Employment History
    const employmentData = [
      { expertId: expertIds[0], companyName: 'Google', position: 'Senior Infrastructure Engineer', startDate: '2018-01', endDate: null, isCurrent: true, description: 'Led cloud infrastructure team' },
      { expertId: expertIds[0], companyName: 'Amazon', position: 'Cloud Architect', startDate: '2015-06', endDate: '2017-12', isCurrent: false, description: 'Designed AWS solutions for enterprise clients' },
      { expertId: expertIds[1], companyName: 'Goldman Sachs', position: 'Managing Director', startDate: '2019-03', endDate: null, isCurrent: true, description: 'Head of Financial Strategy' },
      { expertId: expertIds[1], companyName: 'JP Morgan', position: 'Vice President', startDate: '2014-09', endDate: '2019-02', isCurrent: false, description: 'Investment banking division' },
      { expertId: expertIds[2], companyName: 'Pfizer', position: 'VP Operations', startDate: '2017-05', endDate: null, isCurrent: true, description: 'Digital transformation initiatives' },
      { expertId: expertIds[2], companyName: 'Merck', position: 'Senior Manager', startDate: '2012-01', endDate: '2017-04', isCurrent: false, description: 'Operations and supply chain' },
    ];
    await db.insert(expertEmployment).values(employmentData);

    // Seed Expert Education History
    const educationData = [
      { expertId: expertIds[0], schoolName: 'Stanford University', degree: 'Master of Science', fieldOfStudy: 'Computer Science', startDate: '2014-09', endDate: '2016-05', description: 'Specialized in distributed systems' },
      { expertId: expertIds[0], schoolName: 'UC Berkeley', degree: 'Bachelor of Science', fieldOfStudy: 'Electrical Engineering', startDate: '2010-09', endDate: '2014-05', description: 'GPA: 3.8' },
      { expertId: expertIds[1], schoolName: 'Harvard Business School', degree: 'MBA', fieldOfStudy: 'Business Administration', startDate: '2012-09', endDate: '2014-05', description: 'Baker Scholar' },
      { expertId: expertIds[1], schoolName: 'Yale University', degree: 'Bachelor of Science', fieldOfStudy: 'Economics', startDate: '2008-09', endDate: '2012-05', description: 'Cum Laude' },
      { expertId: expertIds[2], schoolName: 'Johns Hopkins University', degree: 'Master of Health Administration', fieldOfStudy: 'Healthcare Management', startDate: '2015-09', endDate: '2017-05', description: 'Focus on operations' },
      { expertId: expertIds[2], schoolName: 'University of Michigan', degree: 'Bachelor of Science', fieldOfStudy: 'Biology', startDate: '2010-09', endDate: '2014-05', description: 'Pre-med track' },
    ];
    await db.insert(expertEducation).values(educationData);

    // Seed Projects
    const projectData = [
      {
        clientContactId: contactIds[0],
        name: 'Cloud Migration Initiative',
        description: 'Migrate legacy systems to AWS cloud infrastructure',
        projectType: 'Advisory' as const,
        targetCompanies: 'Fortune 500 Tech Companies',
        targetPersona: 'CTO, VP Engineering',
        rate: '5000.00',
        currency: 'USD',
        status: 'Active' as const,
      },
      {
        clientContactId: contactIds[1],
        name: 'AI/ML Expert Search',
        description: 'Find senior AI/ML engineers for new research division',
        projectType: 'Call' as const,
        targetCompanies: 'FAANG Companies',
        targetPersona: 'Senior ML Engineer, Research Scientist',
        rate: '500.00',
        currency: 'USD',
        status: 'Active' as const,
      },
      {
        clientContactId: contactIds[2],
        name: 'Financial Strategy Review',
        description: 'Review and optimize financial strategy for next 5 years',
        projectType: 'Advisory' as const,
        targetCompanies: 'Investment Banks',
        targetPersona: 'CFO, VP Finance',
        rate: '5500.00',
        currency: 'USD',
        status: 'Active' as const,
      },
      {
        clientContactId: contactIds[3],
        name: 'Market Research - Fintech',
        description: 'Conduct market research on fintech disruption',
        projectType: 'ID' as const,
        targetCompanies: 'Fintech Startups, Banks',
        targetPersona: 'Industry Expert, Analyst',
        rate: '7000.00',
        currency: 'USD',
        status: 'Active' as const,
      },
      {
        clientContactId: contactIds[4],
        name: 'Digital Health Transformation',
        description: 'Plan digital transformation for healthcare provider',
        projectType: 'Call' as const,
        targetCompanies: 'Healthcare Systems',
        targetPersona: 'CIO, VP Operations',
        rate: '600.00',
        currency: 'EUR',
        status: 'Active' as const,
      },
      {
        clientContactId: contactIds[5],
        name: 'Regulatory Compliance Study',
        description: 'Study new healthcare regulations and compliance requirements',
        projectType: 'ID' as const,
        targetCompanies: 'Healthcare Consultants',
        targetPersona: 'Compliance Expert, Regulatory Specialist',
        rate: '6500.00',
        currency: 'GBP',
        status: 'Active' as const,
      },
    ];

    await db.insert(projects).values(projectData);
    const fetchedProjects = await Promise.all(
      projectData.map(p =>
        db.select().from(projects).where(eq(projects.name, p.name)).limit(1)
      )
    );
    const projectIds = fetchedProjects.map(result => result[0]?.id).filter((id): id is number => id !== undefined);

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
    await db.insert(screeningQuestions).values(questionData);

    // Seed Shortlists
    const shortlistData = [
      { projectId: projectIds[0], expertId: expertIds[0], status: 'invited' as const, notes: 'Excellent fit for cloud migration' },
      { projectId: projectIds[0], expertId: expertIds[1], status: 'attached' as const, notes: 'Awaiting response' },
      { projectId: projectIds[1], expertId: expertIds[3], status: 'accepted' as const, notes: 'Very interested in AI/ML role' },
      { projectId: projectIds[2], expertId: expertIds[1], status: 'p2c_done' as const, notes: 'In discussions about engagement' },
      { projectId: projectIds[2], expertId: expertIds[4], status: 'attached' as const, notes: 'Initial outreach sent' },
      { projectId: projectIds[3], expertId: expertIds[1], status: 'invited' as const, notes: 'Confirmed availability' },
      { projectId: projectIds[4], expertId: expertIds[2], status: 'calls_done' as const, notes: 'Call completed, review pending' },
      { projectId: projectIds[5], expertId: expertIds[2], status: 'accepted' as const, notes: 'Strong regulatory background' },
      { projectId: projectIds[5], expertId: expertIds[4], status: 'attached' as const, notes: 'Awaiting confirmation' },
    ];
    await db.insert(shortlists).values(shortlistData);

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
    await db.insert(expertClientMapping).values(mappingData);
    console.log("[seedDatabase] All data seeded successfully");

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

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function createLead(data: InsertLead): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data);
  return (result[0] as any).insertId;
}

export async function listLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(leads).orderBy(leads.createdAt);
}

// ─── Expert Notes ────────────────────────────────────────────────────────────

export async function createExpertNote(data: Omit<InsertExpertNote, "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(expertNotes).values(data);
}

export async function getExpertNotes(expertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(expertNotes)
    .where(eq(expertNotes.expertId, expertId))
    .orderBy(expertNotes.createdAt);
}

export async function updateExpertNote(id: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(expertNotes).set({ content }).where(eq(expertNotes.id, id));
}

export async function deleteExpertNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(expertNotes).where(eq(expertNotes.id, id));
}

// ============ QUESTIONNAIRE FUNCTIONS ============

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

export async function createQuestionnaire(data: { projectId: number; title: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = generateToken();
  await db.insert(questionnaires).values({ ...data, token, isActive: true });
  const [q] = await db.select().from(questionnaires).where(eq(questionnaires.token, token)).limit(1);
  return q;
}

export async function getQuestionnaireByProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [q] = await db.select().from(questionnaires).where(eq(questionnaires.projectId, projectId)).limit(1);
  if (!q) return null;
  const questions = await db.select().from(questionnaireQuestions)
    .where(eq(questionnaireQuestions.questionnaireId, q.id))
    .orderBy(questionnaireQuestions.order);
  return { ...q, questions };
}

export async function getQuestionnaireByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [q] = await db.select().from(questionnaires).where(eq(questionnaires.token, token)).limit(1);
  if (!q) return null;
  const questions = await db.select().from(questionnaireQuestions)
    .where(eq(questionnaireQuestions.questionnaireId, q.id))
    .orderBy(questionnaireQuestions.order);
  return { ...q, questions };
}

export async function addQuestionnaireQuestion(data: {
  questionnaireId: number;
  questionText: string;
  questionType: "long_text" | "yes_no" | "dropdown" | "multi_select";
  options?: string[];
  order?: number;
  isRequired?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(questionnaireQuestions).values({
    questionnaireId: data.questionnaireId,
    questionText: data.questionText,
    questionType: data.questionType,
    options: data.options ? JSON.stringify(data.options) : null,
    order: data.order ?? 0,
    isRequired: data.isRequired ?? true,
  });
}

export async function deleteQuestionnaireQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(questionnaireQuestions).where(eq(questionnaireQuestions.id, id));
}

export async function submitQuestionnaireResponse(data: {
  questionnaireId: number;
  respondentEmail: string;
  respondentName?: string;
  answers: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Link to expert if email matches
  const pool = (db as any).$client;
  const [expertRows]: any = await pool.execute(
    "SELECT id FROM experts WHERE email = ? LIMIT 1",
    [data.respondentEmail]
  );
  const expertId = expertRows?.[0]?.id ?? null;

  await db.insert(questionnaireSubmissions).values({
    questionnaireId: data.questionnaireId,
    expertId,
    respondentEmail: data.respondentEmail,
    respondentName: data.respondentName ?? null,
    answers: JSON.stringify(data.answers),
  });
}

export async function getQuestionnaireSubmissions(questionnaireId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select().from(questionnaireSubmissions)
    .where(eq(questionnaireSubmissions.questionnaireId, questionnaireId))
    .orderBy(questionnaireSubmissions.submittedAt);

  return rows.map(r => ({
    ...r,
    answers: (() => { try { return JSON.parse(r.answers); } catch { return {}; } })(),
  }));
}

export async function deleteQuestionnaire(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(questionnaires).where(eq(questionnaires.id, id));
}

export async function publishQuestionnaire(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(questionnaires).set({ isPublished: true }).where(eq(questionnaires.id, id));
}

export async function updateQuestionnaireQuestion(id: number, data: {
  questionText?: string;
  questionType?: "long_text" | "yes_no" | "dropdown" | "multi_select";
  options?: string[];
  isRequired?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(questionnaireQuestions).set({
    ...(data.questionText !== undefined && { questionText: data.questionText }),
    ...(data.questionType !== undefined && { questionType: data.questionType }),
    ...(data.options !== undefined && { options: JSON.stringify(data.options) }),
    ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
  }).where(eq(questionnaireQuestions.id, id));
}

export async function createOrGetInvitation(data: {
  questionnaireId: number;
  expertId: number;
  shortlistId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pool = (db as any).$client;

  // Return existing invitation for this expert+questionnaire
  const [existing]: any = await pool.execute(
    "SELECT * FROM questionnaire_invitations WHERE questionnaireId = ? AND expertId = ? LIMIT 1",
    [data.questionnaireId, data.expertId]
  );
  if (existing?.[0]) return existing[0];

  // Create new invitation
  const token = generateToken();
  await pool.execute(
    "INSERT INTO questionnaire_invitations (questionnaireId, expertId, shortlistId, token, status) VALUES (?, ?, ?, ?, 'pending')",
    [data.questionnaireId, data.expertId, data.shortlistId ?? null, token]
  );
  const [created]: any = await pool.execute(
    "SELECT * FROM questionnaire_invitations WHERE token = ? LIMIT 1",
    [token]
  );
  return created[0];
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pool = (db as any).$client;

  const [invRows]: any = await pool.execute(
    "SELECT * FROM questionnaire_invitations WHERE token = ? LIMIT 1",
    [token]
  );
  const inv = invRows?.[0];
  if (!inv) return null;

  const [qRows]: any = await pool.execute(
    "SELECT * FROM questionnaires WHERE id = ? LIMIT 1",
    [inv.questionnaireId]
  );
  const q = qRows?.[0];
  if (!q) return null;

  const [questionRows]: any = await pool.execute(
    "SELECT * FROM questionnaire_questions WHERE questionnaireId = ? ORDER BY `order` ASC",
    [inv.questionnaireId]
  );

  const [expertRows]: any = await pool.execute(
    "SELECT id, firstName, lastName, email FROM experts WHERE id = ? LIMIT 1",
    [inv.expertId]
  );
  const expert = expertRows?.[0] ?? null;

  const [projectRows]: any = await pool.execute(
    "SELECT id, name, clientId FROM projects WHERE id = ? LIMIT 1",
    [q.projectId]
  );
  const project = projectRows?.[0] ?? null;

  let client = null;
  if (project?.clientId) {
    const [clientRows]: any = await pool.execute(
      "SELECT id, name FROM clients WHERE id = ? LIMIT 1",
      [project.clientId]
    );
    client = clientRows?.[0] ?? null;
  }

  return {
    invitation: inv,
    questionnaire: { ...q, questions: questionRows ?? [] },
    expert,
    project,
    client,
  };
}

export async function submitInvitationResponse(data: {
  token: string;
  answers: Record<string, any>;
  respondentName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pool = (db as any).$client;

  const [invRows]: any = await pool.execute(
    "SELECT * FROM questionnaire_invitations WHERE token = ? LIMIT 1",
    [data.token]
  );
  const inv = invRows?.[0];
  if (!inv) throw new Error("Invitation not found");

  const [expertRows]: any = await pool.execute(
    "SELECT email FROM experts WHERE id = ? LIMIT 1",
    [inv.expertId]
  );
  const expertEmail = expertRows?.[0]?.email ?? "";

  await db.insert(questionnaireSubmissions).values({
    questionnaireId: inv.questionnaireId,
    expertId: inv.expertId,
    respondentEmail: expertEmail,
    respondentName: data.respondentName ?? null,
    answers: JSON.stringify(data.answers),
  });

  // Mark invitation completed
  await pool.execute(
    "UPDATE questionnaire_invitations SET status = 'completed' WHERE token = ?",
    [data.token]
  );
}
