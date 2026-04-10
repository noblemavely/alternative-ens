import { eq, and, like, or, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  clients,
  experts,
  projects,
  screeningQuestions,
  shortlists,
  expertEmployment,
  expertEducation,
  expertVerification,
  expertClientMapping,
  type Client,
  type Expert,
  type Project,
  type ScreeningQuestion,
  type Shortlist,
  type ExpertEmployment,
  type ExpertEducation,
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

  const result = await db.insert(clients).values(data);
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

  return db.select().from(shortlists).where(eq(shortlists.projectId, projectId)).orderBy(shortlists.createdAt);
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
