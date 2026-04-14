// MUST be first: load environment variables before anything else
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

// Manually load .env.local and .env files into process.env
const envLocalPath = path.join(projectRoot, ".env.local");
const envPath = path.join(projectRoot, ".env");

if (fs.existsSync(envLocalPath)) {
  const envLocal = fs.readFileSync(envLocalPath, "utf-8");
  envLocal.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#")) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, "utf-8");
  env.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#") && !process.env[key.trim()]) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

console.log("[ENV] DATABASE_URL loaded:", process.env.DATABASE_URL ? "YES - " + process.env.DATABASE_URL.substring(0, 30) + "..." : "NO");
console.log("[ENV] CLAUDE_API_KEY loaded:", process.env.CLAUDE_API_KEY ? "YES - " + process.env.CLAUDE_API_KEY.substring(0, 20) + "..." : "NO");
console.log("[ENV] APOLLO_API_KEY loaded:", process.env.APOLLO_API_KEY ? "YES" : "NO");

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve uploaded files from /uploads directory (development only)
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  // OAuth authentication has been removed
  // TODO: Implement email/password or other authentication method

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
