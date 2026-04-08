/**
 * LinkedIn Profile Simulation Parser
 * Simulates parsing a LinkedIn profile URL and extracting profile information
 * In production, this would integrate with LinkedIn API
 */

export interface ParsedLinkedInProfile {
  firstName?: string;
  lastName?: string;
  headline?: string;
  sector?: string;
  biography?: string;
  employment?: Array<{
    companyName: string;
    position: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  education?: Array<{
    schoolName: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

/**
 * Simulates parsing a LinkedIn profile URL
 * In a real implementation, this would:
 * 1. Validate the LinkedIn URL format
 * 2. Call LinkedIn API or scrape the profile
 * 3. Extract and structure the profile data
 */
export function parseLinkedInProfile(url: string): ParsedLinkedInProfile {
  // Validate URL format
  if (!url.includes("linkedin.com")) {
    throw new Error("Invalid LinkedIn URL");
  }

  // Simulate parsing - in production, this would call LinkedIn API
  // For demo purposes, we generate realistic sample data based on the URL
  const urlParts = url.split("/").filter((p) => p.length > 0);
  const profileIdentifier = urlParts[urlParts.length - 1] || "user";

  // Generate deterministic but varied sample data based on the URL
  const sampleProfiles: Record<string, ParsedLinkedInProfile> = {
    default: {
      firstName: "John",
      lastName: "Smith",
      headline: "Senior Strategy Consultant",
      sector: "Management Consulting",
      biography:
        "Experienced strategy consultant with 10+ years in digital transformation and business optimization. Passionate about helping companies navigate complex market challenges.",
      employment: [
        {
          companyName: "McKinsey & Company",
          position: "Senior Associate",
          startDate: "2019-01",
          isCurrent: true,
          description: "Leading digital transformation initiatives for Fortune 500 companies",
        },
        {
          companyName: "Boston Consulting Group",
          position: "Consultant",
          startDate: "2016-06",
          endDate: "2018-12",
          description: "Advised C-suite executives on market entry strategies",
        },
      ],
      education: [
        {
          schoolName: "Harvard Business School",
          degree: "MBA",
          fieldOfStudy: "Business Administration",
          startDate: "2014-09",
          endDate: "2016-05",
        },
        {
          schoolName: "Stanford University",
          degree: "BS",
          fieldOfStudy: "Economics",
          startDate: "2010-09",
          endDate: "2014-05",
        },
      ],
    },
    tech: {
      firstName: "Sarah",
      lastName: "Johnson",
      headline: "VP of Product at Tech Startup",
      sector: "Technology",
      biography:
        "Product leader with expertise in SaaS, AI/ML, and data analytics. Track record of building and scaling products from 0 to $100M+ ARR.",
      employment: [
        {
          companyName: "TechCorp AI",
          position: "VP of Product",
          startDate: "2021-03",
          isCurrent: true,
          description: "Leading product strategy for AI-powered analytics platform",
        },
        {
          companyName: "DataFlow Systems",
          position: "Senior Product Manager",
          startDate: "2018-07",
          endDate: "2021-02",
          description: "Managed product roadmap and go-to-market strategy",
        },
      ],
      education: [
        {
          schoolName: "MIT",
          degree: "MS",
          fieldOfStudy: "Computer Science",
          startDate: "2015-09",
          endDate: "2017-05",
        },
        {
          schoolName: "UC Berkeley",
          degree: "BS",
          fieldOfStudy: "Computer Science",
          startDate: "2011-09",
          endDate: "2015-05",
        },
      ],
    },
    finance: {
      firstName: "Michael",
      lastName: "Chen",
      headline: "Managing Director, Investment Banking",
      sector: "Finance",
      biography:
        "Investment banking professional with 15+ years of experience in M&A, capital markets, and corporate finance. Specialized in technology and healthcare sectors.",
      employment: [
        {
          companyName: "Goldman Sachs",
          position: "Managing Director",
          startDate: "2018-01",
          isCurrent: true,
          description: "Leading tech sector M&A transactions",
        },
        {
          companyName: "Morgan Stanley",
          position: "Vice President",
          startDate: "2014-06",
          endDate: "2017-12",
          description: "Advised on capital markets transactions",
        },
      ],
      education: [
        {
          schoolName: "Wharton School of Business",
          degree: "MBA",
          fieldOfStudy: "Finance",
          startDate: "2012-09",
          endDate: "2014-05",
        },
        {
          schoolName: "University of Pennsylvania",
          degree: "BS",
          fieldOfStudy: "Finance",
          startDate: "2008-09",
          endDate: "2012-05",
        },
      ],
    },
  };

  // Select profile based on URL content
  let selectedProfile = sampleProfiles.default;
  if (url.toLowerCase().includes("tech") || url.toLowerCase().includes("ai")) {
    selectedProfile = sampleProfiles.tech;
  } else if (url.toLowerCase().includes("finance") || url.toLowerCase().includes("banking")) {
    selectedProfile = sampleProfiles.finance;
  }

  return selectedProfile;
}

/**
 * Validates a LinkedIn URL format
 */
export function isValidLinkedInUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes("linkedin.com");
  } catch {
    return false;
  }
}
