import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  longtext,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for admin/user distinction.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - represents companies/organizations using the platform
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }),
  companyWebsite: varchar("companyWebsite", { length: 255 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  sector: varchar("sector", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Client Contacts table - multiple contacts per client for different work types
 */
export const clientContacts = mysqlTable("clientContacts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 255 }), // e.g., "Hiring Manager", "Project Lead", "SPOC"
  workType: varchar("workType", { length: 255 }), // e.g., "Advisory", "Recruitment", "Research"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClientContact = typeof clientContacts.$inferSelect;
export type InsertClientContact = typeof clientContacts.$inferInsert;

/**
 * Experts table - represents expert professionals in the network
 */
export const experts = mysqlTable("experts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  sector: varchar("sector", { length: 255 }),
  function: varchar("function", { length: 255 }),
  biography: longtext("biography"),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  cvUrl: varchar("cvUrl", { length: 500 }),
  cvKey: varchar("cvKey", { length: 500 }), // S3 key for CV
  isVerified: boolean("isVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 255 }),
  verificationTokenExpiry: timestamp("verificationTokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expert = typeof experts.$inferSelect;
export type InsertExpert = typeof experts.$inferInsert;

/**
 * Expert Employment History
 */
export const expertEmployment = mysqlTable("expertEmployment", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  startDate: varchar("startDate", { length: 10 }), // YYYY-MM format
  endDate: varchar("endDate", { length: 10 }), // YYYY-MM format, null if current
  isCurrent: boolean("isCurrent").default(false).notNull(),
  description: longtext("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpertEmployment = typeof expertEmployment.$inferSelect;
export type InsertExpertEmployment = typeof expertEmployment.$inferInsert;

/**
 * Expert Education History
 */
export const expertEducation = mysqlTable("expertEducation", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  degree: varchar("degree", { length: 255 }),
  fieldOfStudy: varchar("fieldOfStudy", { length: 255 }),
  startDate: varchar("startDate", { length: 10 }), // YYYY-MM format
  endDate: varchar("endDate", { length: 10 }), // YYYY-MM format
  description: longtext("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpertEducation = typeof expertEducation.$inferSelect;
export type InsertExpertEducation = typeof expertEducation.$inferInsert;

/**
 * Projects table - represents projects/opportunities
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  clientContactId: int("clientContactId").notNull(), // Reference to specific contact for this project
  name: varchar("name", { length: 255 }).notNull(),
  description: longtext("description"),
  projectType: mysqlEnum("projectType", ["Call", "Advisory", "ID"]).notNull(),
  targetCompanies: text("targetCompanies"), // Comma-separated or JSON
  targetPersona: text("targetPersona"),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Screening Questions table - questions associated with projects
 */
export const screeningQuestions = mysqlTable("screeningQuestions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  question: longtext("question").notNull(),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScreeningQuestion = typeof screeningQuestions.$inferSelect;
export type InsertScreeningQuestion = typeof screeningQuestions.$inferInsert;

/**
 * Shortlist table - tracks which experts are shortlisted for which projects
 */
export const shortlists = mysqlTable("shortlists", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  expertId: int("expertId").notNull(),
  status: mysqlEnum("status", ["pending", "interested", "rejected", "new", "contacted", "attempting_contact", "engaged", "qualified", "proposal_sent", "negotiation", "verbal_agreement", "closed_won", "closed_lost"]).default("pending").notNull(),
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shortlist = typeof shortlists.$inferSelect;
export type InsertShortlist = typeof shortlists.$inferInsert;

/**
 * Expert Verification table - tracks email verification tokens
 */
export const expertVerification = mysqlTable("expertVerification", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExpertVerification = typeof expertVerification.$inferSelect;
export type InsertExpertVerification = typeof expertVerification.$inferInsert;

/**
 * Expert-Client Mapping table - tracks relationship between experts and clients with status
 */
export const expertClientMapping = mysqlTable("expertClientMapping", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),
  clientId: int("clientId").notNull(),
  status: mysqlEnum("status", ["shortlisted", "contacted", "attempting_contact", "engaged", "qualified", "proposal_sent", "negotiation", "verbal_agreement", "closed_won", "closed_lost"]).default("shortlisted").notNull(),
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpertClientMapping = typeof expertClientMapping.$inferSelect;
export type InsertExpertClientMapping = typeof expertClientMapping.$inferInsert;


/**
 * Master list for sectors - configurable by admins
 */
export const sectors = mysqlTable("sectors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sector = typeof sectors.$inferSelect;
export type InsertSector = typeof sectors.$inferInsert;

/**
 * Master list for functions - configurable by admins
 */
export const functions = mysqlTable("functions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Function = typeof functions.$inferSelect;
export type InsertFunction = typeof functions.$inferInsert;

/**
 * Admin users table - for local email/password auth
 */
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["super_admin", "admin"]).default("admin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
