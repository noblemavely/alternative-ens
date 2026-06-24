import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminAuthRouter } from "./routers/adminAuth";
import { leadsRouter } from "./routers/leads";
import { questionnairesRouter } from "./routers/questionnaires";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  createClientContact,
  getAllClientContacts,
  getClientContacts,
  getClientContactById,
  updateClientContact,
  deleteClientContact,
  createExpert,
  getExperts,
  getExpertById,
  getExpertByEmail,
  getExpertByEmailOrPhone,
  updateExpert,
  deleteExpert,
  searchExperts,
  createProject,
  getProjects,
  getProjectsByClientContact,
  getProjectById,
  updateProject,
  deleteProject,
  createScreeningQuestion,
  getScreeningQuestionsByProject,
  updateScreeningQuestion,
  deleteScreeningQuestion,
  getAllShortlists,
  addToShortlist,
  getShortlistById,
  getShortlistByProjectAndExpert,
  getShortlistsByProject,
  updateShortlist,
  removeFromShortlist,
  createExpertEmployment,
  getExpertEmploymentHistory,
  updateExpertEmployment,
  deleteExpertEmployment,
  createExpertEducation,
  getExpertEducationHistory,
  updateExpertEducation,
  deleteExpertEducation,
  createExpertVerification,
  getVerificationByToken,
  deleteExpertVerification,
  createExpertClientMapping,
  getExpertClientMappingsByExpert,
  getExpertClientMappingsByClient,
  updateExpertClientMappingStatus,
  deleteExpertClientMapping,
  listSectors,
  createSector,
  updateSector,
  deleteSector,
  listFunctions,
  createFunction,
  updateFunction,
  deleteFunction,
  getExpertProjectActivityTimeline,
  getExpertActivityTimeline,
  createProjectActivityEvent,
  getProjectActivityTimeline,
  getDb,
  createExpertNote,
  getExpertNotes,
  updateExpertNote,
  deleteExpertNote,
  getQuestionnaireByProject,
  createOrGetInvitation,
  createFreshInvitation,
} from "./db";
import { storagePut, storageGet } from "./storage";
import { nanoid } from "nanoid";
import { parseLinkedInProfile, isValidLinkedInUrl } from "./linkedinParser";
import { sql } from "drizzle-orm";
import { expertVerification } from "../drizzle/schema";
import { getLinkedInAuthUrl, exchangeCodeForToken, fetchLinkedInProfile } from "./linkedinOAuth";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if user is admin via JWT or OAuth
  const isAdmin =
    ctx.adminUser?.role === "super_admin" ||
    ctx.adminUser?.role === "admin" ||
    ctx.user?.role === "admin";

  if (!isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const appRouter = router({
  // ============ AUTH ROUTERS ============
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      // Return admin user if authenticated via JWT
      if (ctx.adminUser) {
        return {
          id: ctx.adminUser.adminId,
          email: ctx.adminUser.email,
          name: ctx.adminUser.email, // Use email as name for now
          role: ctx.adminUser.role,
          isAdmin: true,
        };
      }
      // Otherwise return regular OAuth user
      return ctx.user || null;
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ UPLOAD ROUTERS ============
  upload: router({
    uploadCV: publicProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(), // base64 encoded file data
          contentType: z.string().default("application/pdf"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.fileData, "base64");
          const key = `cv-uploads/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9.-]/g, "")}`;
          const result = await storagePut(key, buffer, input.contentType);
          return {
            success: true,
            url: result.url,
            key: result.key,
          };
        } catch (error) {
          console.error("Upload error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload file",
          });
        }
      }),

    parseResume: publicProcedure
      .input(
        z.object({
          fileData: z.string(), // base64 encoded file data
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { parseResume } = await import("./resume-parser");
          const buffer = Buffer.from(input.fileData, "base64");
          const parsed = await parseResume(buffer);
          console.log("[parseResume Router] Received parsed data:", {
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            phone: parsed.phone,
            linkedinUrl: parsed.linkedinUrl,
            employment_count: parsed.employment.length,
            education_count: parsed.education.length,
            employment_sample: parsed.employment[0],
            education_sample: parsed.education[0],
          });
          return {
            success: true,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            phone: parsed.phone,
            linkedinUrl: parsed.linkedinUrl,
            employment: parsed.employment,
            education: parsed.education,
          };
        } catch (error) {
          console.error("Resume parsing error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to parse resume",
          });
        }
      }),

    enrichLinkedInProfile: publicProcedure
      .input(
        z.object({
          linkedinUrl: z.string().url(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { enrichLinkedInProfile } = await import("./linkedin-enrichment");
          const result = await enrichLinkedInProfile(input.linkedinUrl);
          return result;
        } catch (error) {
          console.error("LinkedIn enrichment error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to enrich LinkedIn profile",
          });
        }
      }),
  }),

  adminAuth: adminAuthRouter,
  leads: leadsRouter,
  questionnaires: questionnairesRouter,

  // ============ CLIENT ROUTERS ============
  clients: router({
    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          companyName: z.string().optional(),
          companyWebsite: z.string().optional(),
          contactPerson: z.string().optional(),
          sector: z.string().optional(),
          industry: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const clientData = {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          companyName: input.companyName ?? null,
          companyWebsite: input.companyWebsite ?? null,
          contactPerson: input.contactPerson ?? null,
          sector: input.sector ?? null,
          industry: input.industry ?? null,
        };
        const client = await createClient(clientData);
        return client;
      }),

    list: adminProcedure.query(async () => {
      return getClients();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const client = await getClientById(input.id);
        if (!client) throw new TRPCError({ code: "NOT_FOUND" });
        return client;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          companyName: z.string().optional(),
          companyWebsite: z.string().optional(),
          contactPerson: z.string().optional(),
          sector: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateClient(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClient(input.id);
        return { success: true };
      }),
  }),

  // ============ CLIENT CONTACTS ROUTERS ============
  clientContacts: router({
    create: adminProcedure
      .input(
        z.object({
          clientId: z.number(),
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const contact = await createClientContact({
          clientId: input.clientId,
          contactName: input.name,
          email: input.email,
          phone: input.phone || null,
          role: null,
          workType: null,
          isActive: true,
        });
        return contact;
      }),

    list: adminProcedure.query(async () => {
      return getAllClientContacts();
    }),

    listByClient: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return getClientContacts(input.clientId);
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getClientContactById(input.id);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, name, ...data } = input;
        await updateClientContact(id, {
          contactName: name,
          ...data,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClientContact(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPERT ROUTERS ============
  experts: router({
    submitProfile: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          phone: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          sector: z.string().optional(),
          function: z.string().optional(),
          biography: z.string().optional(),
          linkedinUrl: z.string().optional(),
          cvUrl: z.string().optional(),
          cvKey: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { phone, firstName, lastName, sector, function: fn, biography, linkedinUrl, cvUrl, cvKey } = input;

          // Check for duplicate by email or phone
          const existing = await getExpertByEmailOrPhone(input.email, phone);

          if (existing) {
            // Check if this is the same expert (by email) or a different one
            if (existing.email !== input.email) {
              // Different expert with same phone
              throw new TRPCError({
                code: "CONFLICT",
                message: "An expert with this phone number already exists. Please use a different phone number.",
              });
            }
            // Update existing expert (from email verification flow)
            console.log(`[submitProfile] Updating expert ${existing.id}`);
            await updateExpert(existing.id, {
              phone: phone || null,
              firstName: firstName || null,
              lastName: lastName || null,
              sector: sector || null,
              function: fn || null,
              biography: biography || null,
              linkedinUrl: linkedinUrl || null,
              cvUrl: cvUrl || null,
              cvKey: cvKey || null,
              isVerified: true,
              verificationToken: null,
              verificationTokenExpiry: null,
            });
            console.log(`[submitProfile] Updated expert ${existing.id}`);
          } else {
            // Create new expert if not exists
            console.log(`[submitProfile] Creating new expert`);
            await createExpert({
              email: input.email,
              phone: phone || null,
              firstName: firstName || null,
              lastName: lastName || null,
              sector: sector || null,
              function: fn || null,
              biography: biography || null,
              linkedinUrl: linkedinUrl || null,
              cvUrl: cvUrl || null,
              cvKey: cvKey || null,
              isVerified: true,
              verificationToken: null,
              verificationTokenExpiry: null,
            });
            console.log(`[submitProfile] Created new expert`);
          }

          // Send T&C copy to the expert
          try {
            const { sendEmail } = await import("./email");
            const TC_PDF_URL = "https://www.w3.org/WAI/WCAG21/Techniques/pdf/pdf-sample.pdf";
            await sendEmail({
              to: input.email,
              subject: "AlterNatives — Your Terms & Conditions Copy",
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#0F172A;padding:20px 24px;border-radius:8px 8px 0 0">
                    <h2 style="color:#fff;margin:0;font-size:18px">Welcome to AlterNatives</h2>
                  </div>
                  <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                    <p style="color:#333">Hi ${input.firstName || "there"},</p>
                    <p style="color:#555">Thank you for joining the AlterNatives Expert Network. Your profile has been successfully submitted.</p>
                    <p style="color:#555">As requested, please find a copy of the Terms &amp; Conditions you accepted during registration:</p>
                    <div style="margin:24px 0;text-align:center">
                      <a href="${TC_PDF_URL}" style="display:inline-block;padding:12px 28px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Download Terms &amp; Conditions</a>
                    </div>
                    <p style="color:#555;font-size:13px">Our team will review your profile and be in touch within 24 hours.</p>
                    <p style="color:#888;font-size:12px;margin-top:24px">© ${new Date().getFullYear()} AlterNatives · nativeworld.com</p>
                  </div>
                </div>`,
            });
          } catch (tcMailErr) {
            console.warn("[submitProfile] T&C email to expert failed:", tcMailErr);
          }

          // Notify admin of new expert registration
          try {
            const { sendEmail } = await import("./email");
            await sendEmail({
              to: "alternatives@nativeworld.com",
              subject: `New Expert Registration — ${input.firstName || ""} ${input.lastName || ""}`.trim(),
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#0F172A;padding:20px 24px;border-radius:8px 8px 0 0">
                    <h2 style="color:#fff;margin:0;font-size:18px">New Expert Registered</h2>
                  </div>
                  <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                    <table style="width:100%;border-collapse:collapse">
                      <tr><td style="padding:8px 0;color:#555;width:140px">Name</td><td style="font-weight:600">${input.firstName || ""} ${input.lastName || ""}</td></tr>
                      <tr><td style="padding:8px 0;color:#555">Email</td><td style="font-weight:600">${input.email}</td></tr>
                      ${input.phone ? `<tr><td style="padding:8px 0;color:#555">Phone</td><td>${input.phone}</td></tr>` : ""}
                      ${input.sector ? `<tr><td style="padding:8px 0;color:#555">Sector</td><td>${input.sector}</td></tr>` : ""}
                      ${input.function ? `<tr><td style="padding:8px 0;color:#555">Function</td><td>${input.function}</td></tr>` : ""}
                      ${input.linkedinUrl ? `<tr><td style="padding:8px 0;color:#555">LinkedIn</td><td><a href="${input.linkedinUrl}">${input.linkedinUrl}</a></td></tr>` : ""}
                    </table>
                    <div style="margin-top:20px">
                      <a href="https://alternatives.nativeworld.com/admin/experts" style="display:inline-block;padding:10px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View in Admin</a>
                    </div>
                  </div>
                </div>`,
            });
          } catch (mailErr) {
            console.warn("[submitProfile] Admin notification email failed:", mailErr);
          }

          return { success: true };
        } catch (error) {
          console.error(`[submitProfile] Error:`, error instanceof Error ? error.message : error);
          console.error(`[submitProfile] Stack:`, error instanceof Error ? error.stack : "");
          throw error;
        }
      }),

    create: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          phone: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          sector: z.string().optional(),
          function: z.string().optional(),
          biography: z.string().optional(),
          linkedinUrl: z.string().optional(),
          cvUrl: z.string().optional(),
          cvKey: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await getExpertByEmailOrPhone(input.email, input.phone);
        if (existing) {
          if (existing.email === input.email) {
            throw new TRPCError({ code: "CONFLICT", message: "Expert with this email already exists" });
          } else {
            throw new TRPCError({ code: "CONFLICT", message: "Expert with this phone number already exists" });
          }
        }
        const { phone, firstName, lastName, sector, function: fn, biography, linkedinUrl, cvUrl, cvKey } = input;
        await createExpert({
          email: input.email,
          phone: phone || null,
          firstName: firstName || null,
          lastName: lastName || null,
          sector: sector || null,
          function: fn || null,
          biography: biography || null,
          linkedinUrl: linkedinUrl || null,
          cvUrl: cvUrl || null,
          cvKey: cvKey || null,
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        });
        return { success: true };
      }),

    list: adminProcedure.query(async () => {
      return getExperts();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const expert = await getExpertById(input.id);
        if (!expert) throw new TRPCError({ code: "NOT_FOUND" });
        return expert;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          sector: z.string().optional(),
          function: z.string().optional(),
          biography: z.string().optional(),
          linkedinUrl: z.string().optional(),
          cvUrl: z.string().optional(),
          cvKey: z.string().optional(),
          isVerified: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateExpert(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpert(input.id);
        return { success: true };
      }),

    search: publicProcedure
      .input(
        z.object({
          keyword: z.string().optional(),
          sector: z.string().optional(),
          function: z.string().optional(),
          location: z.string().optional(),
          // Employment
          companyName: z.string().optional(),
          designation: z.string().optional(),
          employmentYearFrom: z.string().optional(),
          employmentYearTo: z.string().optional(),
          // Education
          university: z.string().optional(),
          degree: z.string().optional(),
          fieldOfStudy: z.string().optional(),
          educationYearFrom: z.string().optional(),
          educationYearTo: z.string().optional(),
          // Legacy
          year: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        })
      )
      .query(async ({ input }) => {
        return searchExperts(input);
      }),

    getActivityTimeline: adminProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return getExpertActivityTimeline(input.expertId);
      }),

    getProjectActivityTimeline: adminProcedure
      .input(z.object({ expertId: z.number(), projectId: z.number() }))
      .query(async ({ input }) => {
        return getExpertProjectActivityTimeline(input.expertId, input.projectId);
      }),

    getProjectsForExpert: adminProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        // Get all projects expert is shortlisted for
        const allShortlists = await getAllShortlists();
        const expertShortlists = allShortlists.filter(
          (s: any) => s.expertId === input.expertId
        );

        // Get unique projects
        const projectIds = Array.from(new Set(expertShortlists.map((s: any) => s.projectId)));
        const projects = [];

        for (const projectId of projectIds) {
          const project = await getProjectById(projectId);
          if (project) {
            projects.push(project);
          }
        }

        return projects;
      }),

    extractProfile: publicProcedure
      .input(
        z.object({
          linkedinUrl: z.string().optional(),
          resumeText: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { linkedinUrl, resumeText } = input;

          if (!linkedinUrl && !resumeText) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Either LinkedIn URL or resume text is required",
            });
          }

          let profileData = null;

          // Try Apollo.io first for LinkedIn URLs
          if (linkedinUrl) {
            console.log(`[extractProfile] ========== LINKEDIN EXTRACTION START ==========`);
            console.log(`[extractProfile] URL:`, linkedinUrl);
            console.log(`[extractProfile] ENV CHECK - apolloApiKey exists:`, !!process.env.APOLLO_API_KEY);
            console.log(`[extractProfile] ENV CHECK - apolloClientId exists:`, !!process.env.APOLLO_CLIENT_ID);
            console.log(`[extractProfile] ENV CHECK - apolloClientSecret exists:`, !!process.env.APOLLO_CLIENT_SECRET);

            const { searchApolloByLinkedInUrl, isApolloConfigured } = await import(
              "./services/apolloLinkedinExtractor"
            );

            const configured = isApolloConfigured();
            console.log(`[extractProfile] isApolloConfigured() returned:`, configured);

            if (configured) {
              try {
                console.log(`[extractProfile] Calling searchApolloByLinkedInUrl...`);
                profileData = await searchApolloByLinkedInUrl(linkedinUrl);

                if (profileData && profileData.firstName) {
                  console.log(`[extractProfile] ✅ SUCCESS: Apollo returned profile for ${profileData.firstName} ${profileData.lastName}`);
                  console.log(`[extractProfile] Employment count:`, profileData.employment?.length || 0);
                  console.log(`[extractProfile] ========== LINKEDIN EXTRACTION SUCCESS ==========`);
                  return profileData;
                } else {
                  console.warn(`[extractProfile] Apollo returned empty/null data`);
                }
              } catch (apolloError) {
                console.error(`[extractProfile] Apollo extraction error:`, apolloError instanceof Error ? apolloError.message : apolloError);
              }
            } else {
              console.warn(`[extractProfile] Apollo NOT configured - skipping Apollo attempt`);
            }

            // Fallback to Claude if Apollo not configured or failed
            console.log(`[extractProfile] Falling back to Claude API for LinkedIn URL`);
            const { getProfileExtractor } = await import("./services/aiProfileExtractor");
            const extractor = getProfileExtractor("claude");
            profileData = await extractor.extractFromURL(linkedinUrl);
            console.log(`[extractProfile] Claude extraction completed:`, !!profileData);
          } else if (resumeText) {
            console.log(`[extractProfile] Extracting from resume text`);
            const { getProfileExtractor } = await import("./services/aiProfileExtractor");
            const extractor = getProfileExtractor("claude");
            profileData = await extractor.extractFromText(resumeText);
            console.log(`[extractProfile] Resume extraction completed:`, !!profileData);
          }

          if (!profileData) {
            console.error(`[extractProfile] Final profileData is null/empty`);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to extract profile data. Please try again or fill in manually.",
            });
          }

          console.log(`[extractProfile] Returning extracted profile data`);
          return profileData;
        } catch (error: any) {
          console.error("[extractProfile] Error:", error);
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error?.message || "Failed to extract profile data",
          });
        }
      }),
  }),

  // ============ PROJECT ROUTERS ============
  projects: router({
    create: adminProcedure
      .input(
        z.object({
          clientContactId: z.number(),
          name: z.string().min(1),
          description: z.string().optional(),
          projectType: z.enum(["Call", "Advisory", "ID"]),
          targetCompanies: z.string().optional(),
          targetPersona: z.string().optional(),
          rate: z.number().optional(),
          currency: z.string().default("USD"),
        })
      )
      .mutation(async ({ input }) => {
        const projectData = {
          clientContactId: input.clientContactId,
          name: input.name,
          projectType: input.projectType,
          description: input.description ?? null,
          targetCompanies: input.targetCompanies ?? null,
          targetPersona: input.targetPersona ?? null,
          rate: input.rate ? input.rate.toString() : null,
          currency: input.currency || "USD",
          status: "Active" as const,
        };
        const project = await createProject(projectData);
        return project;
      }),

    list: adminProcedure.query(async () => {
      return getProjects();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const project = await getProjectById(input.id);
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        return project;
      }),

    getByClientContact: adminProcedure
      .input(z.object({ clientContactId: z.number() }))
      .query(async ({ input }) => {
        return getProjectsByClientContact(input.clientContactId);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          scope: z.string().optional(),
          type: z.enum(["Call", "Advisory", "ID"]).optional(),
          targetCompanies: z.string().optional(),
          rate: z.number().optional(),
          currency: z.string().optional(),
          status: z.enum(["Active", "On Hold", "Closed"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, status, ...data } = input;

        // Get current project to track status change
        const currentProject = await getProjectById(id);
        if (!currentProject) throw new TRPCError({ code: "NOT_FOUND" });

        // If status is being changed, create an activity timeline event
        if (status && status !== currentProject.status) {
          await createProjectActivityEvent(
            id,
            "status_changed",
            `Status Updated to ${status}`,
            `Project status changed from ${currentProject.status} to ${status}`,
            currentProject.status,
            status
          );
        }

        const normalizedData = {
          ...data,
          ...(status && { status }),
          rate: data.rate ? data.rate.toString() : undefined,
          currency: data.currency || undefined,
          type: data.type ? (data.type as "Call" | "Advisory" | "ID") : undefined,
        };
        await updateProject(id, normalizedData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProject(input.id);
        return { success: true };
      }),

    getActivityTimeline: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getProjectActivityTimeline(input.projectId);
      }),
  }),

  // ============ SCREENING QUESTIONS ROUTERS ============
  screeningQuestions: router({
    add: adminProcedure
      .input(
        z.object({
          projectId: z.number(),
          question: z.string(),
          order: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        const question = await createScreeningQuestion(input);
        return question;
      }),

    getByProject: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getScreeningQuestionsByProject(input.projectId);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          question: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateScreeningQuestion(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteScreeningQuestion(input.id);
        return { success: true };
      }),
  }),

  // ============ SHORTLIST ROUTERS ============
  shortlists: router({
    list: adminProcedure.query(async () => {
      return getAllShortlists();
    }),

    add: adminProcedure
      .input(
        z.object({
          projectId: z.number(),
          expertId: z.number(),
          status: z.enum(["attached", "invited", "accepted", "questionnaire_responded", "p2c_done", "declined", "calls_done"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const shortlist = await addToShortlist({
          ...input,
          status: input.status || "attached",
          notes: input.notes || null,
          consultantInChargeId: ctx.adminUser?.id || null,
        });
        return shortlist;
      }),

    getByProject: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getShortlistsByProject(input.projectId);
      }),

    getByExpert: adminProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        const shortlists = await getAllShortlists();
        return shortlists.filter((s: any) => s.expertId === input.expertId);
      }),

    getByProjectAndExpert: adminProcedure
      .input(z.object({ projectId: z.number(), expertId: z.number() }))
      .query(async ({ input }) => {
        return getShortlistByProjectAndExpert(input.projectId, input.expertId);
      }),

    generateQuestionnaireEmailDraft: adminProcedure
      .input(z.object({ shortlistId: z.number() }))
      .query(async ({ input }) => {
        try {
          const shortlist = await getShortlistById(input.shortlistId);
          if (!shortlist) throw new Error("Shortlist not found");

          const q = await getQuestionnaireByProject(shortlist.projectId);
          if (!q) throw new Error("No questionnaire created for this project. Please create one first.");

          const expert = await getExpertById(shortlist.expertId);
          if (!expert) throw new Error("Expert not found");

          const project = await getProjectById(shortlist.projectId);

          // Create unique per-expert invitation
          const invitation = await createOrGetInvitation({
            questionnaireId: q.id,
            expertId: shortlist.expertId,
            shortlistId: shortlist.id,
          });

          const link = `${process.env.APP_ORIGIN || 'https://alternatives.nativeworld.com'}/questionnaire/${invitation.token}`;

          return {
            expertEmail: expert.email,
            expertName: expert.firstName,
            projectName: project?.name || 'a project',
            questionnaireLink: link,
            subject: `${expert.firstName}, You're invited to complete a questionnaire`,
            body: `Hi ${expert.firstName},\n\nYou have been invited to complete a questionnaire for ${project?.name || 'a project'}.\n\nPlease click the link below to complete the questionnaire:\n\n${link}`,
            htmlBody: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <p>Hi ${expert.firstName},</p>
              <p>You have been invited to complete a questionnaire for <strong>${project?.name || 'a project'}</strong>.</p>
              <p><a href="${link}" style="display:inline-block;padding:12px 28px;background:#2563EB;color:white;text-decoration:none;border-radius:6px;font-weight:600">Complete Questionnaire</a></p>
              <p style="color:#888;font-size:12px;margin-top:24px">© ${new Date().getFullYear()} AlterNatives</p>
            </div>`,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to generate email draft";
          throw new Error(message);
        }
      }),

    sendQuestionnaireEmailAndUpdateStatus: adminProcedure
      .input(
        z.object({
          shortlistId: z.number(),
          subject: z.string(),
          htmlBody: z.string(),
          textBody: z.string(),
          updateOtherFields: z.object({
            consultantInChargeId: z.number().optional(),
            notes: z.string().optional(),
          }).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { sendEmail } = await import("./email");

        const shortlist = await getShortlistById(input.shortlistId);
        if (!shortlist) throw new Error("Shortlist not found");

        const expert = await getExpertById(shortlist.expertId);
        if (!expert?.email) throw new Error("Expert not found");

        const q = await getQuestionnaireByProject(shortlist.projectId);
        if (!q) throw new Error("No questionnaire for this project");

        // Create FRESH invitation token (delete old ones, create new)
        const invitation = await createFreshInvitation({
          questionnaireId: q.id,
          expertId: shortlist.expertId,
          shortlistId: shortlist.id,
        });

        if (!invitation?.token) throw new Error("Failed to create invitation");

        // Replace the questionnaire link in the email with the actual invitation token
        const appOrigin = process.env.APP_ORIGIN || 'https://alternatives.nativeworld.com';
        const invitationLink = `${appOrigin}/questionnaire/${invitation.token}`;
        const updatedHtmlBody = input.htmlBody.replace(
          /https:\/\/[^\s"<>]+\/questionnaire\/[a-z0-9]+/g,
          invitationLink
        );
        const updatedTextBody = input.textBody.replace(
          /https:\/\/[^\s]+\/questionnaire\/[a-z0-9]+/g,
          invitationLink
        );

        // Send email with both HTML and text content
        await sendEmail({
          to: expert.email,
          subject: input.subject,
          html: updatedHtmlBody,
          text: updatedTextBody,
        });

        // Update status to invited
        await updateShortlist(input.shortlistId, {
          status: "invited",
          consultantInChargeId: input.updateOtherFields?.consultantInChargeId,
          notes: input.updateOtherFields?.notes,
        });

        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["attached", "invited", "accepted", "questionnaire_responded", "p2c_done", "declined", "calls_done"]).optional(),
          consultantInChargeId: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, status, consultantInChargeId, notes } = input;

        // Get current shortlist before updating
        const oldShortlist = await getShortlistById(id);
        if (!oldShortlist) throw new Error("Shortlist not found");

        // Don't update if status is "invited" - use sendQuestionnaireEmailAndUpdateStatus instead
        if (status === "invited") {
          throw new Error("Use sendQuestionnaireEmailAndUpdateStatus endpoint for invited status with email");
        }

        await updateShortlist(id, {
          status: status || oldShortlist.status,
          consultantInChargeId: consultantInChargeId !== undefined ? consultantInChargeId : oldShortlist.consultantInChargeId,
          notes: notes !== undefined ? notes : oldShortlist.notes,
        });

        return { success: true };
      }),

    remove: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeFromShortlist(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPERT EMPLOYMENT ROUTERS ============
  expertEmployment: router({
    add: protectedProcedure
      .input(
        z.object({
          expertId: z.number().optional(),
          companyName: z.string(),
          position: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
          isCurrent: z.boolean().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { companyName, position, startDate, endDate, isCurrent, description } = input;
        const employment = await createExpertEmployment({
          expertId: input.expertId || 0,
          companyName,
          position,
          startDate,
          endDate: endDate || null,
          isCurrent: isCurrent || false,
          description: description || null,
        });
        return employment;
      }),

    getByExpert: publicProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return getExpertEmploymentHistory(input.expertId);
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          company: z.string().optional(),
          position: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          currentlyWorking: z.boolean().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateExpertEmployment(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpertEmployment(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPERT EDUCATION ROUTERS ============
  expertEducation: router({
    add: publicProcedure
      .input(
        z.object({
          expertId: z.number().optional(),
          schoolName: z.string(),
          degree: z.string(),
          fieldOfStudy: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { schoolName, degree, fieldOfStudy, startDate, endDate, description } = input;
        const education = await createExpertEducation({
          expertId: input.expertId || 0,
          schoolName,
          degree,
          fieldOfStudy,
          startDate,
          endDate: endDate || null,
          description: description || null,
        });
        return education;
      }),

    getByExpert: publicProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return getExpertEducationHistory(input.expertId);
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          school: z.string().optional(),
          degree: z.string().optional(),
          fieldOfStudy: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateExpertEducation(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpertEducation(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPERT NOTES ROUTERS ============
  expertNotes: router({
    add: adminProcedure
      .input(
        z.object({
          expertId: z.number(),
          content: z.string(),
          createdBy: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const note = await createExpertNote({
          expertId: input.expertId,
          content: input.content,
          createdBy: input.createdBy || null,
        });
        return note;
      }),

    getByExpert: adminProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return getExpertNotes(input.expertId);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await updateExpertNote(input.id, input.content);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpertNote(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPERT VERIFICATION ROUTERS ============
  expertVerification: router({
    sendVerificationEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        try {
          const { sendEmail, getVerificationEmailContent } = await import("./email");

          let expert = await getExpertByEmail(input.email);
          const token = nanoid(32);
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          if (!expert) {
            // Create unverified expert
            await createExpert({
              email: input.email,
              isVerified: false,
              verificationToken: token,
              verificationTokenExpiry: expiresAt,
              phone: null,
              firstName: null,
              lastName: null,
              sector: null,
              function: null,
              biography: null,
              linkedinUrl: null,
              cvUrl: null,
              cvKey: null,
            });
            expert = await getExpertByEmail(input.email);
          }

          if (expert) {
            // Generate a 6-digit numeric code for user-friendly verification
            const numericCode = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
            // Also keep the full token for URL-based verification
            const fullToken = nanoid(32);

            await createExpertVerification({
              expertId: expert.id,
              token: numericCode, // Store the 6-digit code as the primary token for manual entry
              expiresAt,
            });

            // Send verification email
            try {
              const appUrl = (process.env.APP_URL || 'https://alternatives.nativeworld.com').replace(/\/$/, '');
              // Use full token for URL, numeric code for manual entry
              const verificationUrl = `${appUrl}/verify-email?token=${fullToken}`;

              const { html, text } = getVerificationEmailContent(verificationUrl, numericCode);

              await sendEmail({
                to: input.email,
                subject: 'Verify Your Email - Alternatives',
                html,
                text,
              });

              console.log(`[sendVerificationEmail] Email sent to ${input.email}`);
              return {
                success: true,
                message: "Verification email sent! Please check your inbox."
              };
            } catch (emailError) {
              console.error(`[sendVerificationEmail] Email sending failed:`, emailError);
              // Don't fail the entire request if email sending fails
              return {
                success: true,
                message: "Verification created but email sending failed. Please contact support."
              };
            }
          }

          return { success: false, message: "Failed to create expert record" };
        } catch (error) {
          console.error('[sendVerificationEmail] Error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process verification email request',
          });
        }
      }),

    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        // Accept the token (either 6-digit code for manual entry, or full token for URL)
        const verification = await getVerificationByToken(input.token);

        if (!verification) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid verification code" });
        }

        if (verification.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Verification code expired" });
        }

        await updateExpert(verification.expertId, { isVerified: true, verificationToken: null });
        await deleteExpertVerification(verification.id);
        return { success: true };
      }),
  }),
  linkedinOAuth: router({
    getAuthUrl: publicProcedure
      .input(z.object({ redirectUri: z.string().url() }))
      .query(({ input }) => {
        const state = nanoid();
        const authUrl = getLinkedInAuthUrl(input.redirectUri, state);
        return { authUrl, state };
      }),

    handleCallback: publicProcedure
      .input(
        z.object({
          code: z.string(),
          state: z.string(),
          redirectUri: z.string().url(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const token = await exchangeCodeForToken(input.code, input.redirectUri);
          const profile = await fetchLinkedInProfile(token);
          return {
            success: true,
            profile: {
              firstName: profile.firstName || "",
              lastName: profile.lastName || "",
              email: profile.email || "",
              headline: profile.headline || "",
            },
          };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to exchange code for token or fetch profile",
          });
        }
      }),
  }),

  linkedin: router({

  // ============ EXPERT-CLIENT MAPPING ROUTERS ============
  expertClientMapping: router({
    create: adminProcedure
      .input(
        z.object({
          expertId: z.number(),
          clientId: z.number(),
          status: z.enum(["shortlisted", "contacted", "attempting_contact", "engaged", "qualified", "proposal_sent", "negotiation", "verbal_agreement", "closed_won", "closed_lost"]).default("shortlisted"),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createExpertClientMapping(input.expertId, input.clientId, input.status, input.notes);
        return { success: true };
      }),

    listByExpert: adminProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return getExpertClientMappingsByExpert(input.expertId);
      }),

    listByClient: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return getExpertClientMappingsByClient(input.clientId);
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["shortlisted", "contacted", "attempting_contact", "engaged", "qualified", "proposal_sent", "negotiation", "verbal_agreement", "closed_won", "closed_lost"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateExpertClientMappingStatus(input.id, input.status, input.notes);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpertClientMapping(input.id);
        return { success: true };
      }),
  }),
    parseProfile: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        if (!isValidLinkedInUrl(input.url)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid LinkedIn URL" });
        }
        const profile = parseLinkedInProfile(input.url);
        return profile;
      }),
  }),

  sectors: router({
    list: publicProcedure.query(async () => {
      return listSectors();
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return createSector(input.name, input.description);
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateSector(input.id, input.name, input.description);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteSector(input.id);
      }),
  }),

  functions: router({
    list: publicProcedure.query(async () => {
      return listFunctions();
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return createFunction(input.name, input.description);
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await updateFunction(input.id, input.name, input.description);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteFunction(input.id);
      }),
  }),

  system: systemRouter,
});

export type AppRouter = typeof appRouter;
