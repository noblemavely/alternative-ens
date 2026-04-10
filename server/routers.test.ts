import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create admin context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// Helper to create user context
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Client Router", () => {
  it("admin can create a client", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clients.create({
      name: "Test Client",
      email: "client@test.com",
      phone: "+1-555-0001",
      companyName: "Test Company",
      companyWebsite: "https://test.com",
      contactPerson: "John Doe",
    });

    expect(result).toBeDefined();
  });

  it("admin can list clients", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.clients.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot create client", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.clients.create({
        name: "Test Client",
        email: "client@test.com",
        phone: "+1-555-0001",
        companyName: "Test Company",
        companyWebsite: "https://test.com",
        contactPerson: "John Doe",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("Expert Router", () => {
  it("admin can create an expert", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.experts.create({
      email: `expert-${Date.now()}@test.com`,
      phone: "+1-555-0002",
      firstName: "Jane",
      lastName: "Expert",
      sector: "Technology",
      function: "Product Manager",
      biography: "Experienced PM",
      linkedinUrl: "https://linkedin.com/in/janeexpert",
      cvUrl: "",
      cvKey: "",
      isVerified: true,
    });

    expect(result).toBeDefined();
  });

  it("admin can list experts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.experts.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can search experts by sector", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.experts.search({
      sector: "Technology",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can search experts by function", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.experts.search({
      function: "Product Manager",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can search experts by keyword", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.experts.search({
      keyword: "expert",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot create expert", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.experts.create({
        email: `expert-${Date.now()}@test.com`,
        phone: "+1-555-0002",
        firstName: "Jane",
        lastName: "Expert",
        sector: "Technology",
        function: "Product Manager",
        biography: "Experienced PM",
        linkedinUrl: "https://linkedin.com/in/janeexpert",
        cvUrl: null,
        cvKey: null,
        isVerified: true,
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("Project Router", () => {
  it("admin can create a project", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create a client
    const clientResult = await caller.clients.create({
      name: "Project Test Client",
      email: `client-${Date.now()}@test.com`,
      phone: "+1-555-0003",
      companyName: "Project Test Company",
      companyWebsite: "https://test.com",
      contactPerson: "John Doe",
    });

    // Then create a project
    const result = await caller.projects.create({
      clientContactId: 1, // Using first client contact ID
      name: "Test Project",
      description: "Test project description",
      projectType: "Advisory",
      targetCompanies: "Company A, Company B",
      targetPersona: "VP of Product",
      hourlyRate: 250,
    });

    expect(result).toBeDefined();
  });

  it("admin can list projects", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot create project", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.projects.create({
        clientId: 1,
        name: "Test Project",
        description: "Test project description",
        projectType: "Advisory",
        targetCompanies: "Company A, Company B",
        targetPersona: "VP of Product",
        hourlyRate: 250,
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("LinkedIn Parser Router", () => {
  it("admin can parse LinkedIn profile", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.linkedin.parseProfile({
      url: "https://linkedin.com/in/johndoe",
    });

    expect(result).toBeDefined();
    expect(result.firstName).toBeDefined();
    expect(result.lastName).toBeDefined();
    expect(result.sector).toBeDefined();
  });

  it("admin cannot parse invalid LinkedIn URL", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.linkedin.parseProfile({
        url: "https://example.com/profile",
      });
      expect.fail("Should have thrown error for invalid URL");
    } catch (error: any) {
      expect(error.message).toContain("Invalid LinkedIn URL");
    }
  });

  it("public user can parse LinkedIn profile", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.linkedin.parseProfile({
      url: "https://linkedin.com/in/johndoe",
    });

    expect(result).toBeDefined();
  });
});

describe("Shortlist Router", () => {
  it("admin can add expert to shortlist", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.shortlists.add({
        projectId: 1,
        expertId: 1,
        notes: "Good fit for this project",
      });
      expect(result).toBeDefined();
    } catch (error: any) {
      if (error.message !== "Expert already shortlisted") {
        throw error;
      }
    }
  });

  it("admin can list shortlisted experts for project", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.shortlists.getByProject({
      projectId: 1,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot add to shortlist", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.shortlists.add({
        projectId: 1,
        expertId: 1,
        notes: "Good fit for this project",
      });
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("Auth Router", () => {
  it("user can check their auth status", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.role).toBe("user");
  });

  it("admin can check their auth status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.role).toBe("admin");
  });
});


describe("System Router - Clear All Data", () => {
  it("admin can clear all data from database", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // First create some test data
    await caller.clients.create({
      name: "Test Client",
      contactName: "John Doe",
      email: `test-${Date.now()}@example.com`,
      phone: "+1234567890",
      company: "Test Company",
    });
    
    await caller.experts.create({
      email: `expert-${Date.now()}@example.com`,
      phone: "+1234567890",
      firstName: "Jane",
      lastName: "Expert",
      sector: "Technology",
      function: "Engineer",
      biography: "Test bio",
    });
    
    // Verify data exists
    let clients = await caller.clients.list();
    let experts = await caller.experts.list();
    expect(clients.length).toBeGreaterThan(0);
    expect(experts.length).toBeGreaterThan(0);
    
    // Clear all data
    const result = await caller.system.clearAllData();
    expect(result.success).toBe(true);
    
    // Verify data is cleared
    clients = await caller.clients.list();
    experts = await caller.experts.list();
    expect(clients.length).toBe(0);
    expect(experts.length).toBe(0);
  });

  it("non-admin cannot clear all data", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      await caller.system.clearAllData();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});
