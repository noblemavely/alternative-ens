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
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }),
  companyWebsite: varchar("companyWebsite", { length: 255 }),
  contactPerson: varchar("contactPerson", { length: 255 }),
  sector: varchar("sector", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Client Contacts table - multiple contacts per client for different work types
 */
export const clientContacts = mysqlTable("client_contacts", {
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
  location: varchar("location", { length: 255 }),
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
export const expertEmployment = mysqlTable("expert_employment", {
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
export const expertEducation = mysqlTable("expert_education", {
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
  projectType: mysqlEnum("project_type", ["Call", "Advisory", "ID"]).notNull(),
  targetCompanies: text("targetCompanies"), // Comma-separated or JSON
  targetPersona: text("targetPersona"),
  rate: decimal("rate", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(), // ISO 4217 currency code
  status: mysqlEnum("status", ["Active", "On Hold", "Closed"]).default("Active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Screening Questions table - questions associated with projects
 */
export const screeningQuestions = mysqlTable("screening_questions", {
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
  status: mysqlEnum("status", ["attached", "invited", "accepted", "questionnaire_responded", "p2c_done", "declined", "calls_done"]).default("attached").notNull(),
  consultantInChargeId: int("consultantInChargeId"),
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shortlist = typeof shortlists.$inferSelect;
export type InsertShortlist = typeof shortlists.$inferInsert;

/**
 * Expert Verification table - tracks email verification tokens
 */
export const expertVerification = mysqlTable("expert_verification", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expert_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export type ExpertVerification = typeof expertVerification.$inferSelect;
export type InsertExpertVerification = typeof expertVerification.$inferInsert;

/**
 * Expert-Client Mapping table - tracks relationship between experts and clients with status
 */
export const expertClientMapping = mysqlTable("expert_client_mapping", {
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

/**
 * Audit Log table - tracks all changes to entities
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["client", "expert", "project", "admin_user", "contact", "shortlist"]).notNull(),
  entityId: int("entity_id").notNull(),
  operationType: mysqlEnum("operationType", ["create", "update", "delete"]).notNull(),
  adminId: int("adminId"), // References adminUsers.id - nullable for system operations
  fieldChanged: varchar("fieldChanged", { length: 255 }), // Which field was modified
  oldValue: longtext("oldValue"), // JSON representation
  newValue: longtext("newValue"), // JSON representation
  reason: text("reason"), // Optional reason for the change
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * Project Activity Timeline table - tracks status changes for projects
 */
export const projectActivityTimeline = mysqlTable("project_activity_timeline", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  type: mysqlEnum("type", ["created", "status_changed"]).notNull(),
  fromStatus: varchar("fromStatus", { length: 50 }),
  toStatus: varchar("toStatus", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description"),
  changedBy: int("changedBy"), // References adminUsers.id
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ProjectActivityTimeline = typeof projectActivityTimeline.$inferSelect;
export type InsertProjectActivityTimeline = typeof projectActivityTimeline.$inferInsert;

/**
 * Leads table — public connect form submissions
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  organization: varchar("organization", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  queryType: mysqlEnum("queryType", ["client", "advisor", "other"]).notNull(),
  otherQuery: text("otherQuery"),
  utmSource:   varchar("utm_source",   { length: 255 }),
  utmMedium:   varchar("utm_medium",   { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmContent:  varchar("utm_content",  { length: 255 }),
  utmTerm:     varchar("utm_term",     { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Expert Notes table — captures timestamped notes against expert profiles
 */
export const expertNotes = mysqlTable("expert_notes", {
  id: int("id").autoincrement().primaryKey(),
  expertId: int("expertId").notNull(),
  content: longtext("content").notNull(),
  createdBy: int("createdBy"), // References adminUsers.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpertNote = typeof expertNotes.$inferSelect;
export type InsertExpertNote = typeof expertNotes.$inferInsert;

/**
 * Questionnaires — one per project, sent to experts via a shareable link
 */
export const questionnaires = mysqlTable("questionnaires", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Questionnaire = typeof questionnaires.$inferSelect;
export type InsertQuestionnaire = typeof questionnaires.$inferInsert;

/**
 * Questions within a questionnaire
 */
export const questionnaireQuestions = mysqlTable("questionnaire_questions", {
  id: int("id").autoincrement().primaryKey(),
  questionnaireId: int("questionnaireId").notNull(),
  questionText: longtext("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["long_text", "yes_no", "dropdown", "multi_select"]).notNull(),
  options: text("options"), // JSON array for dropdown / multi_select choices
  order: int("order").default(0).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuestionnaireQuestion = typeof questionnaireQuestions.$inferSelect;
export type InsertQuestionnaireQuestion = typeof questionnaireQuestions.$inferInsert;

/**
 * Questionnaire submissions — one row per expert response
 */
export const questionnaireSubmissions = mysqlTable("questionnaire_submissions", {
  id: int("id").autoincrement().primaryKey(),
  questionnaireId: int("questionnaireId").notNull(),
  expertId: int("expertId"),
  respondentEmail: varchar("respondentEmail", { length: 255 }).notNull(),
  respondentName: varchar("respondentName", { length: 255 }),
  answers: longtext("answers").notNull(), // JSON: { [questionId]: answer }
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});

export type QuestionnaireSubmission = typeof questionnaireSubmissions.$inferSelect;
export type InsertQuestionnaireSubmission = typeof questionnaireSubmissions.$inferInsert;

/**
 * Per-expert questionnaire invitations — unique token per expert+questionnaire
 */
export const questionnaireInvitations = mysqlTable("questionnaire_invitations", {
  id: int("id").autoincrement().primaryKey(),
  questionnaireId: int("questionnaireId").notNull(),
  expertId: int("expertId").notNull(),
  shortlistId: int("shortlistId"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuestionnaireInvitation = typeof questionnaireInvitations.$inferSelect;
export type InsertQuestionnaireInvitation = typeof questionnaireInvitations.$inferInsert;
