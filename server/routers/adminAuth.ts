import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { verifyAdminPassword, updateAdminLastLogin } from "../db.admin";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

const ENV = process.env;

export const adminAuthRouter = router({
  login: publicProcedure
    .mutation(async ({ ctx }) => {
      // Extract input from request body
      let loginInput = ctx.req.body;

      console.log("[AdminAuth] Raw request body type:", typeof loginInput);
      console.log("[AdminAuth] Raw request body:", JSON.stringify(loginInput).slice(0, 500));
      console.log("[AdminAuth] Body keys:", Object.keys(loginInput || {}));

      // Handle batch format from httpBatchLink
      // Format can be: {"0": {"json": {email, password}}} or {"0": {"input": {email, password}}}
      if (loginInput && typeof loginInput === 'object' && !loginInput.email && !loginInput.password) {
        if (loginInput['0']) {
          console.log("[AdminAuth] Found batch key '0':", JSON.stringify(loginInput['0']).slice(0, 300));
          if (loginInput['0'].json) {
            loginInput = loginInput['0'].json;
            console.log("[AdminAuth] Extracted from json key");
          } else if (loginInput['0'].input) {
            loginInput = loginInput['0'].input;
            console.log("[AdminAuth] Extracted from input key");
          }
        }
      }

      console.log("[AdminAuth] After extraction - email:", loginInput?.email, "password exists:", !!loginInput?.password);

      // Validate input
      if (!loginInput?.email || !loginInput?.password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email and password are required",
        });
      }

      try {
        const admin = await verifyAdminPassword(loginInput.email, loginInput.password);

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
