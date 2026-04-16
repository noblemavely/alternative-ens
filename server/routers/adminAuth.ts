import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { verifyAdminPassword, updateAdminLastLogin } from "../db.admin";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

const ENV = process.env;

export const adminAuthRouter = router({
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      // Input is already validated by Zod schema above

      try {
        const admin = await verifyAdminPassword(input.email, input.password);

        if (!admin) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Update last login
        await updateAdminLastLogin(admin.id);

        // Generate JWT token
        const token = jwt.sign(
          {
            adminId: admin.id,
            email: admin.email,
            role: admin.role,
          },
          ENV.JWT_SECRET || "your-secret-key",
          { expiresIn: "7d" }
        );

        return {
          success: true,
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
          },
        };
      } catch (error: any) {
        console.error("[AdminAuth.login]Error during login:", error);
        if (error.code === "UNAUTHORIZED") {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed",
        });
      }
    }),

  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ input }) => {
      try {
        const decoded = jwt.verify(input.token, ENV.JWT_SECRET || "your-secret-key");
        return {
          valid: true,
          admin: decoded,
        };
      } catch (error) {
        return {
          valid: false,
          admin: null,
        };
      }
    }),

  getUserById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getAdminUserById } = await import("../db.admin");
      const user = await getAdminUserById(input.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Admin user not found",
        });
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  updateUser: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(["admin", "super_admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const { updateAdminUser } = await import("../db.admin");
      const user = await updateAdminUser(input.id, {
        name: input.name,
        email: input.email,
        role: input.role,
      });
      return {
        success: true,
        user,
      };
    }),

  deleteUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { deleteAdminUser } = await import("../db.admin");
      await deleteAdminUser(input.id);
      return { success: true };
    }),

  listUsers: adminProcedure.query(async () => {
    const { getAllAdminUsers } = await import("../db.admin");
    const users = await getAllAdminUsers();
    return users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastLogin: user.lastLogin,
    }));
  }),

  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        role: z.enum(["admin", "super_admin"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { createAdminUser } = await import("../db.admin");
      const result = await createAdminUser(input.email, input.password, input.name, input.role);
      return { success: true, result };
    }),
});
