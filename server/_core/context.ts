import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminUser?: any;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let adminUser: any = undefined;

  // OAuth has been removed - authentication is optional for now
  // TODO: Implement email/password authentication or other auth method
  user = null;

  // Check for admin JWT token in Authorization header or cookies
  const authHeader = opts.req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      adminUser = decoded;
      console.log("[Context] Admin user verified:", decoded.email);
    } catch (error) {
      console.log("[Context] Token verification failed:", (error as Error).message);
    }
  } else if (authHeader) {
    console.log("[Context] Invalid auth header format:", authHeader.slice(0, 50));
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    adminUser,
  };
}
