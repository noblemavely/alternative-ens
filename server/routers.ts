import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  createExpert,
  getExperts,
  getExpertById,
  getExpertByEmail,
  updateExpert,
  deleteExpert,
  searchExperts,
  createProject,
  getProjects,
  getProjectsByClient,
  getProjectById,
  updateProject,
  deleteProject,
  createScreeningQuestion,
  getScreeningQuestionsByProject,
  updateScreeningQuestion,
  deleteScreeningQuestion,
  addToShortlist,
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
} from "./db";
import { storagePut, storageGet } from "./storage";
import { nanoid } from "nanoid";
import { parseLinkedInProfile, isValidLinkedInUrl } from "./linkedinParser";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ CLIENT ROUTERS ============
  clients: router({
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          companyName: z.string().optional(),
          companyWebsite: z.string().optional(),
          contactPerson: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { phone, companyName, companyWebsite, contactPerson, ...rest } = input;
        await createClient({
          ...rest,
          phone: phone || null,
          companyName: companyName || null,
          companyWebsite: companyWebsite || null,
          contactPerson: contactPerson || null,
        });
        return { success: true };
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
          email: z.string().email().optional(),
          phone: z.string().optional(),
          companyName: z.string().optional(),
          companyWebsite: z.string().optional(),
          contactPerson: z.string().optional(),
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

  // ============ EXPERT ROUTERS ============
  experts: router({
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
        const existing = await getExpertByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Expert already exists" });
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

    search: adminProcedure
      .input(
        z.object({
          sector: z.string().optional(),
          function: z.string().optional(),
          keyword: z.string().optional(),
          skillsets: z.array(z.string()).optional(),
        })
      )
      .query(async ({ input }) => {
        return searchExperts(input);
      }),
  }),

  // ============ PROJECT ROUTERS ============
  projects: router({
    create: adminProcedure
      .input(
        z.object({
          clientId: z.number(),
          name: z.string().min(1),
          description: z.string().optional(),
          projectType: z.enum(["Call", "Advisory", "ID"]),
          targetCompanies: z.string().optional(),
          targetPersona: z.string().optional(),
          hourlyRate: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { description, targetCompanies, targetPersona, hourlyRate, ...rest } = input;
        await createProject({
          ...rest,
          description: description || null,
          targetCompanies: targetCompanies || null,
          targetPersona: targetPersona || null,
          hourlyRate: hourlyRate ? String(hourlyRate) : null,
        });
        return { success: true };
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

    getByClient: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return getProjectsByClient(input.clientId);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          projectType: z.enum(["Call", "Advisory", "ID"]).optional(),
          targetCompanies: z.string().optional(),
          targetPersona: z.string().optional(),
          hourlyRate: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, description, targetCompanies, targetPersona, hourlyRate, ...rest } = input;
        const cleanData: any = { ...rest };
        if (description !== undefined) cleanData.description = description || null;
        if (targetCompanies !== undefined) cleanData.targetCompanies = targetCompanies || null;
        if (targetPersona !== undefined) cleanData.targetPersona = targetPersona || null;
        if (hourlyRate !== undefined) cleanData.hourlyRate = hourlyRate ? String(hourlyRate) : null;
        await updateProject(id, cleanData);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ============ SCREENING QUESTION ROUTERS ============
  screeningQuestions: router({
    create: adminProcedure
      .input(
        z.object({
          projectId: z.number(),
          question: z.string().min(1),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createScreeningQuestion({
          projectId: input.projectId,
          question: input.question,
          order: input.order || 0,
        });
        return { success: true };
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
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, question, order } = input;
        const cleanData: any = {};
        if (question !== undefined) cleanData.question = question;
        if (order !== undefined) cleanData.order = order;
        await updateScreeningQuestion(id, cleanData);
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
    add: adminProcedure
      .input(
        z.object({
          projectId: z.number(),
          expertId: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const existing = await getShortlistByProjectAndExpert(input.projectId, input.expertId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Expert already shortlisted" });
        await addToShortlist({
          projectId: input.projectId,
          expertId: input.expertId,
          status: "pending",
          notes: input.notes || null,
        });
        return { success: true };
      }),

    getByProject: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getShortlistsByProject(input.projectId);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "interested", "rejected"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, status, notes } = input;
        const cleanData: any = {};
        if (status !== undefined) cleanData.status = status;
        if (notes !== undefined) cleanData.notes = notes || null;
        await updateShortlist(id, cleanData);
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
    create: protectedProcedure
      .input(
        z.object({
          expertId: z.number(),
          companyName: z.string().min(1),
          position: z.string().min(1),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          isCurrent: z.boolean().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { startDate, endDate, isCurrent, description, ...rest } = input;
        await createExpertEmployment({
          ...rest,
          startDate: startDate || null,
          endDate: endDate || null,
          isCurrent: isCurrent || false,
          description: description || null,
        });
        return { success: true };
      }),

    getByExpert: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return getExpertEmploymentHistory(input.expertId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          companyName: z.string().optional(),
          position: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          isCurrent: z.boolean().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const cleanData = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
        );
        await updateExpertEmployment(id, cleanData as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpertEmployment(input.id);
        return { success: true };
      }),
  }),

  // ============ EXPERT EDUCATION ROUTERS ============
  expertEducation: router({
    create: protectedProcedure
      .input(
        z.object({
          expertId: z.number(),
          schoolName: z.string().min(1),
          degree: z.string().min(1),
          fieldOfStudy: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { fieldOfStudy, startDate, endDate, description, ...rest } = input;
        await createExpertEducation({
          ...rest,
          fieldOfStudy: fieldOfStudy || null,
          startDate: startDate || null,
          endDate: endDate || null,
          description: description || null,
        });
        return { success: true };
      }),

    getByExpert: protectedProcedure
      .input(z.object({ expertId: z.number() }))
      .query(async ({ input }) => {
        return getExpertEducationHistory(input.expertId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          schoolName: z.string().optional(),
          degree: z.string().optional(),
          fieldOfStudy: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const cleanData = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])
        );
        await updateExpertEducation(id, cleanData as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteExpertEducation(input.id);
        return { success: true };
      }),
  }),

  // ============ FILE UPLOAD ROUTERS ============
  files: router({
    uploadCV: protectedProcedure
      .input(
        z.object({
          filename: z.string(),
          data: z.string(), // base64 encoded
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.data, "base64");
        const fileKey = `cv/${nanoid()}/${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        return { url, key: fileKey };
      }),
  }),

  // ============ LINKEDIN PARSING ROUTERS ============
  linkedin: router({
    parseProfile: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .mutation(async ({ input }) => {
        if (!isValidLinkedInUrl(input.url)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid LinkedIn URL" });
        }
        try {
          const profile = parseLinkedInProfile(input.url);
          return profile;
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to parse LinkedIn profile" });
        }
      }),
  }),

  // ============ EXPERT VERIFICATION ROUTERS ============
  expertVerification: router({
    sendVerificationEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
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
          await createExpertVerification({
            expertId: expert.id,
            token,
            expiresAt,
          });
        }
        // For testing, return the token so it can be displayed in UI
        return { success: true, token, message: "Verification code sent! Use the code below for testing." };
      }),

    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        // Accept dummy code 123456 for testing
        if (input.token === "123456") {
          return { success: true };
        }
        
        const verification = await getVerificationByToken(input.token);
        if (!verification) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid token" });

        if (verification.expiresAt < new Date()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Token expired" });
        }

        await updateExpert(verification.expertId, { isVerified: true, verificationToken: null });
        await deleteExpertVerification(verification.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
