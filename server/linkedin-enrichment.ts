import { ENV } from "./_core/env";

export interface LinkedInEnrichmentResult {
  success: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  headline?: string;
  profileUrl?: string;
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
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  }>;
  message?: string;
}

/**
 * Enrich LinkedIn profile using Apollo.io API
 * Apollo.io provides access to LinkedIn data without requiring Partner Program approval
 *
 * Free tier: ~50 API calls/month
 * Paid: $49+/month
 */
export async function enrichLinkedInProfile(
  linkedinUrl: string
): Promise<LinkedInEnrichmentResult> {
  try {
    // Validate LinkedIn URL format first
    const urlMatch = linkedinUrl.match(
      /linkedin\.com\/in\/([a-z0-9\-]+)\/?/i
    );
    if (!urlMatch) {
      return {
        success: false,
        message: "Invalid LinkedIn URL format. Please provide a valid LinkedIn profile URL.",
      };
    }

    // Try Apollo.io enrichment first (if configured)
    if (ENV.apolloApiKey) {
      console.log("[LinkedIn Enrichment] Attempting Apollo.io enrichment");
      const apolloResult = await tryApolloEnrichment(linkedinUrl);
      if (apolloResult.success) {
        return apolloResult;
      }
      console.warn("[LinkedIn Enrichment] Apollo.io enrichment failed:", apolloResult.message);
    } else {
      console.warn("[LinkedIn Enrichment] Apollo API key not configured");
    }

    // Fallback: Return basic success with profile URL extracted from LinkedIn
    // In production, this could fall back to LinkedIn OAuth or other enrichment services
    console.log("[LinkedIn Enrichment] Using fallback: basic profile parsing");
    return {
      success: true,
      profileUrl: linkedinUrl,
      message: "Profile URL accepted. Please fill in additional details manually.",
    };
  } catch (error) {
    console.error("[LinkedIn Enrichment] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while fetching your LinkedIn profile. Please try again.",
    };
  }
}

/**
 * Try to enrich using Apollo.io API
 */
async function tryApolloEnrichment(
  linkedinUrl: string
): Promise<LinkedInEnrichmentResult> {
  try {
    // Call Apollo.io API
    // Documentation: https://apolloio.com/api
    const response = await fetch("https://api.apollo.io/v1/people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": ENV.apolloApiKey || "",
      },
      body: JSON.stringify({
        linkedin_url: linkedinUrl,
        reveal_personal_emails: true,
      }),
    });

    if (!response.ok) {
      console.warn(
        `[LinkedIn Enrichment] Apollo.io API error: ${response.status} ${response.statusText}`
      );
      return {
        success: false,
        message: `Apollo.io API error: ${response.statusText}`,
      };
    }

    const data = await response.json() as any;

    // Apollo.io returns data in 'person' field or 'people' array
    const person = data.person || (data.people && data.people[0]);

    if (!person) {
      return {
        success: false,
        message: "Profile not found in Apollo.io database",
      };
    }

    // Parse employment history
    const employment = (person.employment_history || [])
      .filter((emp: any) => emp.title && emp.company)
      .map((emp: any) => ({
        companyName: emp.company || "",
        position: emp.title || "",
        startDate: emp.start_date ? formatDate(emp.start_date) : "",
        endDate: emp.end_date ? formatDate(emp.end_date) : "",
        isCurrent: !emp.end_date,
        description: emp.description || "",
      }));

    // Parse education history
    const education = (person.education || [])
      .filter((edu: any) => edu.school_name)
      .map((edu: any) => ({
        schoolName: edu.school_name || "",
        degree: edu.degree || "",
        fieldOfStudy: edu.field_of_study || "",
        startDate: edu.start_date ? formatDate(edu.start_date) : "",
        endDate: edu.end_date ? formatDate(edu.end_date) : "",
      }));

    return {
      success: true,
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email,
      headline: person.headline,
      profileUrl: linkedinUrl,
      employment:
        employment.length > 0
          ? employment
          : undefined,
      education:
        education.length > 0
          ? education
          : undefined,
    };
  } catch (error) {
    console.error("[LinkedIn Enrichment] Apollo.io error:", error);
    return {
      success: false,
      message: "Failed to fetch from Apollo.io",
    };
  }
}

/**
 * Format date from various formats to YYYY-MM
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";

  // Try to parse the date
  try {
    // If it's already in YYYY-MM format, return as-is
    if (/^\d{4}-\d{2}/.test(dateStr)) {
      return dateStr.substring(0, 7);
    }

    // If it's YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.substring(0, 7);
    }

    // Try parsing as Date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    }

    // If it's just a year
    if (/^\d{4}$/.test(dateStr)) {
      return dateStr;
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return dateStr;
}
