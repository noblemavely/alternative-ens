import { describe, expect, it, beforeEach } from "vitest";
import {
  createClient,
  getClients,
  createExpert,
  getExperts,
  getExpertByEmail,
  createProject,
  getProjects,
  searchExperts,
  addToShortlist,
  getShortlistsByProject,
} from "./db";
import { parseLinkedInProfile, isValidLinkedInUrl } from "./linkedinParser";

describe("Client Management", () => {
  it("should create a client", async () => {
    const client = await createClient({
      name: "Acme Corp",
      email: "contact@acme.com",
      phone: "+1-555-0100",
      companyName: "Acme Corporation",
      companyWebsite: "https://acme.com",
      contactPerson: "John Doe",
    });
    expect(client).toBeDefined();
  });

  it("should retrieve all clients", async () => {
    const clients = await getClients();
    expect(Array.isArray(clients)).toBe(true);
  });
});

describe("Expert Management", () => {
  it("should create an expert", async () => {
    const expert = await createExpert({
      email: `expert-${Date.now()}@example.com`,
      phone: "+1-555-0200",
      firstName: "Jane",
      lastName: "Smith",
      sector: "Technology",
      function: "Product Manager",
      biography: "Experienced product manager with 10+ years in tech",
      linkedinUrl: "https://linkedin.com/in/janesmith",
      cvUrl: null,
      cvKey: null,
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });
    expect(expert).toBeDefined();
  });

  it("should retrieve all experts", async () => {
    const experts = await getExperts();
    expect(Array.isArray(experts)).toBe(true);
  });

  it("should search experts by sector", async () => {
    const results = await searchExperts({ sector: "Technology" });
    expect(Array.isArray(results)).toBe(true);
  });

  it("should search experts by function", async () => {
    const results = await searchExperts({ function: "Product Manager" });
    expect(Array.isArray(results)).toBe(true);
  });

  it("should search experts by keyword", async () => {
    const results = await searchExperts({ keyword: "expert" });
    expect(Array.isArray(results)).toBe(true);
  });
});

describe("Project Management", () => {
  it("should create a project", async () => {
    const clients = await getClients();
    if (clients.length === 0) {
      throw new Error("No clients available for project creation");
    }

    const project = await createProject({
      clientId: clients[0].id,
      name: "Market Research Initiative",
      description: "Research market trends in technology sector",
      projectType: "Advisory",
      targetCompanies: "Apple, Google, Microsoft",
      targetPersona: "VP of Product, 10+ years experience",
      hourlyRate: "250",
    });
    expect(project).toBeDefined();
  });

  it("should retrieve all projects", async () => {
    const projects = await getProjects();
    expect(Array.isArray(projects)).toBe(true);
  });
});

describe("Expert Shortlisting", () => {
  it("should add expert to shortlist", async () => {
    const experts = await getExperts();
    const projects = await getProjects();

    if (experts.length === 0 || projects.length === 0) {
      throw new Error("Need at least one expert and one project");
    }

    const shortlist = await addToShortlist({
      projectId: projects[0].id,
      expertId: experts[0].id,
      notes: "Great fit for this project",
    });
    expect(shortlist).toBeDefined();
  });

  it("should retrieve shortlisted experts for a project", async () => {
    const projects = await getProjects();
    if (projects.length === 0) {
      throw new Error("No projects available");
    }

    const shortlisted = await getShortlistsByProject(projects[0].id);
    expect(Array.isArray(shortlisted)).toBe(true);
  });
});

describe("LinkedIn Profile Parser", () => {
  it("should validate LinkedIn URL", () => {
    const validUrl = "https://linkedin.com/in/johndoe";
    expect(isValidLinkedInUrl(validUrl)).toBe(true);
  });

  it("should reject invalid LinkedIn URL", () => {
    const invalidUrl = "https://example.com/profile";
    expect(isValidLinkedInUrl(invalidUrl)).toBe(false);
  });

  it("should parse LinkedIn profile", () => {
    const url = "https://linkedin.com/in/johndoe";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.firstName).toBeDefined();
    expect(profile.lastName).toBeDefined();
    expect(profile.sector).toBeDefined();
    expect(profile.biography).toBeDefined();
  });

  it("should parse LinkedIn profile with employment history", () => {
    const url = "https://linkedin.com/in/johndoe";
    const profile = parseLinkedInProfile(url);

    expect(profile.employment).toBeDefined();
    expect(Array.isArray(profile.employment)).toBe(true);
    if (profile.employment && profile.employment.length > 0) {
      expect(profile.employment[0].companyName).toBeDefined();
      expect(profile.employment[0].position).toBeDefined();
    }
  });

  it("should parse LinkedIn profile with education history", () => {
    const url = "https://linkedin.com/in/johndoe";
    const profile = parseLinkedInProfile(url);

    expect(profile.education).toBeDefined();
    expect(Array.isArray(profile.education)).toBe(true);
    if (profile.education && profile.education.length > 0) {
      expect(profile.education[0].schoolName).toBeDefined();
      expect(profile.education[0].degree).toBeDefined();
    }
  });

  it("should handle different LinkedIn URL formats", () => {
    const urls = [
      "https://www.linkedin.com/in/johndoe",
      "https://linkedin.com/in/jane-smith",
      "https://linkedin.com/in/tech-expert",
    ];

    urls.forEach((url) => {
      const profile = parseLinkedInProfile(url);
      expect(profile).toBeDefined();
      expect(profile.firstName).toBeDefined();
    });
  });
});

describe("Data Validation", () => {
  it("should handle empty search results", async () => {
    const results = await searchExperts({ sector: "NonexistentSector12345" });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("should create expert with minimal fields", async () => {
    const expert = await createExpert({
      email: `minimal-${Date.now()}@example.com`,
      phone: null,
      firstName: null,
      lastName: null,
      sector: null,
      function: null,
      biography: null,
      linkedinUrl: null,
      cvUrl: null,
      cvKey: null,
      isVerified: false,
      verificationToken: null,
      verificationTokenExpiry: null,
    });
    expect(expert).toBeDefined();
  });
});

describe("Expert Self-Registration (Public)", () => {
  it("should allow public expert self-registration without admin auth", async () => {
    const email = `public-expert-${Date.now()}@example.com`;
    const result = await createExpert({
      email: email,
      phone: "+1-555-0300",
      firstName: "Public",
      lastName: "Expert",
      sector: "Finance",
      function: "CFO",
      biography: "Self-registered expert",
      linkedinUrl: "https://linkedin.com/in/publicexpert",
      cvUrl: null,
      cvKey: null,
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });
    expect(result).toBeDefined();
    // Verify by fetching the created expert
    const expert = await getExpertByEmail(email);
    expect(expert).toBeDefined();
    expect(expert?.firstName).toBe("Public");
    expect(expert?.isVerified).toBe(true);
  });
});
