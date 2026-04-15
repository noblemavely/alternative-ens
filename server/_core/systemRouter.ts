import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb, seedDatabase } from "../db";
import { experts, clients, projects, shortlists, expertEmployment, expertEducation, expertVerification, screeningQuestions, users, expertClientMapping } from "../../drizzle/schema";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  clearAllData: adminProcedure.mutation(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Delete in order of dependencies (reverse of creation order)
      await db.delete(expertClientMapping);
      await db.delete(shortlists);
      await db.delete(screeningQuestions);
      await db.delete(expertEmployment);
      await db.delete(expertEducation);
      await db.delete(expertVerification);
      await db.delete(experts);
      await db.delete(projects);
      await db.delete(clients);
      await db.delete(users);

      return {
        success: true,
        message: "All data cleared successfully",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error clearing database:", error);
      throw new Error(`Failed to clear database: ${errorMessage}`);
    }
  }),

  seedDatabase: adminProcedure.mutation(async () => {
    try {
      const result = await seedDatabase();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error seeding database:", error);
      throw new Error(`Failed to seed database: ${errorMessage}`);
    }
  }),
});
