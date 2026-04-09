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
import { getLinkedInAuthUrl, exchangeCodeForToken, fetchLinkedInProfile } from "./linkedinOAuth";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const appRouter = router({
  // ============ AUTH ROUTERS ============
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
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
        })
      )
      .mutation(async ({ input }) => {
        const client = await createClient(input);
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
        const existing = await getExpertByEmail(input.email);
        const { phone, firstName, lastName, sector, function: fn, biography, linkedinUrl, cvUrl, cvKey } = input;
        
        if (existing) {
          // Update existing expert (from email verification flow)
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
        } else {
          // Create new expert if not exists
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
        }
        return { success: true };
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
          limit: z.number().optional().default(10),
          offset: z.number().optional().default(0),
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
        const project = await createProject(input);
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

    getByClient: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        return getProjectsByClient(input.clientId);
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
          hourlyRate: z.number().optional(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProject(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProject(input.id);
        return { success: true };
      }),
  }),

  // ============ SCREENING QUESTIONS ROUTERS ============
  screeningQuestions: router({
    add: adminProcedure
      .input(
        z.object({
          projectId: z.number(),
          question: z.string(),
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
    add: adminProcedure
      .input(
        z.object({
          projectId: z.number(),
          expertId: z.number(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const shortlist = await addToShortlist(input);
        return shortlist;
      }),

    getByProject: adminProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return getShortlistsByProject(input.projectId);
      }),

    getByProjectAndExpert: adminProcedure
      .input(z.object({ projectId: z.number(), expertId: z.number() }))
      .query(async ({ input }) => {
        return getShortlistByProjectAndExpert(input.projectId, input.expertId);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateShortlist(id, data);
        return { success: true };
      }),

    remove: adminProcedure
      .input(z.object({ projectId: z.number(), expertId: z.number() }))
      .mutation(async ({ input }) => {
        await removeFromShortlist(input.projectId, input.expertId);
        return { success: true };
      }),
  }),

  // ============ EXPERT EMPLOYMENT ROUTERS ============
  expertEmployment: router({
    add: publicProcedure
      .input(
        z.object({
          expertId: z.number().optional(),
          company: z.string(),
          position: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
          currentlyWorking: z.boolean().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { company, position, startDate, endDate, currentlyWorking, description } = input;
        const employment = await createExpertEmployment({
          expertId: input.expertId || 0,
          company,
          position,
          startDate,
          endDate: endDate || null,
          currentlyWorking: currentlyWorking || false,
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
          school: z.string(),
          degree: z.string(),
          fieldOfStudy: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { school, degree, fieldOfStudy, startDate, endDate } = input;
        const education = await createExpertEducation({
          expertId: input.expertId || 0,
          school,
          degree,
          fieldOfStudy,
          startDate,
          endDate: endDate || null,
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
              firstName: profile.localizedFirstName || "",
              lastName: profile.localizedLastName || "",
              email: profile.elements?.[0]?.["handle~"]?.emailAddress || "",
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

  system: systemRouter,
});

export type AppRouter = typeof appRouter;
