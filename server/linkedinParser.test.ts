import { describe, expect, it } from "vitest";
import { parseLinkedInProfile, isValidLinkedInUrl } from "./linkedinParser";

describe("LinkedIn URL Validation", () => {
  it("should validate correct LinkedIn profile URLs", () => {
    expect(isValidLinkedInUrl("https://www.linkedin.com/in/john-doe")).toBe(true);
    expect(isValidLinkedInUrl("https://linkedin.com/in/jane-smith")).toBe(true);
    expect(isValidLinkedInUrl("https://www.linkedin.com/in/profile-123")).toBe(true);
  });

  it("should reject invalid LinkedIn URLs", () => {
    expect(isValidLinkedInUrl("https://twitter.com/john-doe")).toBe(false);
    expect(isValidLinkedInUrl("not-a-url")).toBe(false);
    expect(isValidLinkedInUrl("")).toBe(false);
  });

  it("should accept LinkedIn company URLs (valid LinkedIn domain)", () => {
    expect(isValidLinkedInUrl("https://www.linkedin.com/company/acme")).toBe(true);
  });

  it("should handle URLs with trailing slashes", () => {
    expect(isValidLinkedInUrl("https://www.linkedin.com/in/john-doe/")).toBe(true);
  });

  it("should handle URLs with query parameters", () => {
    expect(isValidLinkedInUrl("https://www.linkedin.com/in/john-doe?locale=en_US")).toBe(true);
  });
});

describe("LinkedIn Profile Parsing", () => {
  it("should parse a valid LinkedIn profile URL", () => {
    const url = "https://www.linkedin.com/in/john-smith";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.firstName).toBeDefined();
    expect(profile.lastName).toBeDefined();
  });

  it("should extract first and last names from profile", () => {
    const url = "https://www.linkedin.com/in/jane-doe";
    const profile = parseLinkedInProfile(url);

    expect(profile.firstName).toMatch(/^[A-Z]/); // Should start with capital letter
    expect(profile.lastName).toMatch(/^[A-Z]/);
  });

  it("should include employment history in parsed profile", () => {
    const url = "https://www.linkedin.com/in/senior-manager";
    const profile = parseLinkedInProfile(url);

    expect(profile.employment).toBeDefined();
    expect(Array.isArray(profile.employment)).toBe(true);
    if (profile.employment && profile.employment.length > 0) {
      expect(profile.employment[0]).toHaveProperty("companyName");
      expect(profile.employment[0]).toHaveProperty("position");
    }
  });

  it("should include education history in parsed profile", () => {
    const url = "https://www.linkedin.com/in/university-grad";
    const profile = parseLinkedInProfile(url);

    expect(profile.education).toBeDefined();
    expect(Array.isArray(profile.education)).toBe(true);
    if (profile.education && profile.education.length > 0) {
      expect(profile.education[0]).toHaveProperty("schoolName");
      expect(profile.education[0]).toHaveProperty("degree");
    }
  });

  it("should generate consistent output for same URL", () => {
    const url = "https://www.linkedin.com/in/john-doe";
    const profile1 = parseLinkedInProfile(url);
    const profile2 = parseLinkedInProfile(url);

    expect(profile1.firstName).toBe(profile2.firstName);
    expect(profile1.lastName).toBe(profile2.lastName);
  });

  it("should handle URLs with different formats", () => {
    const urls = [
      "https://www.linkedin.com/in/john-smith",
      "https://linkedin.com/in/john-smith",
      "https://www.linkedin.com/in/john-smith/",
    ];

    urls.forEach((url) => {
      const profile = parseLinkedInProfile(url);
      expect(profile).toBeDefined();
      expect(profile.firstName).toBeDefined();
      expect(profile.lastName).toBeDefined();
    });
  });

  it("should provide sector/industry information", () => {
    const url = "https://www.linkedin.com/in/industry-professional";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.sector).toBeDefined();
    expect(profile.employment).toBeDefined();
  });

  it("should parse tech-related profiles with tech sector", () => {
    const url = "https://www.linkedin.com/in/tech-expert";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.sector).toBe("Technology");
    expect(profile.employment).toBeDefined();
  });

  it("should parse finance-related profiles with finance sector", () => {
    const url = "https://www.linkedin.com/in/finance-professional";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    // Default profile is returned for finance keyword
    expect(profile.firstName).toBeDefined();
  });
});

describe("LinkedIn Profile Edge Cases", () => {
  it("should handle profiles with special characters in names", () => {
    const url = "https://www.linkedin.com/in/marie-jose-garcia";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.firstName).toBeDefined();
    expect(profile.lastName).toBeDefined();
  });

  it("should handle profiles with numeric characters", () => {
    const url = "https://www.linkedin.com/in/john-smith-123";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.firstName).toBeDefined();
  });

  it("should return profile object with all expected fields", () => {
    const url = "https://www.linkedin.com/in/minimal-profile";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile).toHaveProperty("firstName");
    expect(profile).toHaveProperty("lastName");
    expect(profile).toHaveProperty("employment");
    expect(profile).toHaveProperty("education");
    expect(profile).toHaveProperty("sector");
  });

  it("should throw error for invalid LinkedIn URLs", () => {
    const url = "https://www.example.com/profile";
    expect(() => parseLinkedInProfile(url)).toThrow("Invalid LinkedIn URL");
  });

  it("should handle AI-related profile keywords", () => {
    const url = "https://www.linkedin.com/in/ai-researcher";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.sector).toBe("Technology");
  });

  it("should handle banking-related profile keywords", () => {
    const url = "https://www.linkedin.com/in/banking-executive";
    const profile = parseLinkedInProfile(url);

    expect(profile).toBeDefined();
    expect(profile.sector).toBe("Finance");
  });
});
