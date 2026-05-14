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

const LINKFINDER_API_KEY = "72Z4cZ5fZ71Z55Z7bZ6dZ3bZ6dZ3aZ55Z37Z60Z68Z7eZ54";
const LINKFINDER_API_URL = "https://api.linkfinderai.com";

/**
 * Enrich LinkedIn profile using LinkFinderAI API
 * Docs: https://linkfinderai.com/api-documentation
 */
export async function enrichLinkedInProfile(
  linkedinUrl: string
): Promise<LinkedInEnrichmentResult> {
  try {
    // Validate LinkedIn URL format
    const urlMatch = linkedinUrl.match(/linkedin\.com\/in\/([a-z0-9\-]+)\/?/i);
    if (!urlMatch) {
      return {
        success: false,
        message: "Invalid LinkedIn URL format. Please provide a valid LinkedIn profile URL.",
      };
    }

    console.log("[LinkedIn Enrichment] Fetching profile via LinkFinderAI:", linkedinUrl);

    const response = await fetch(LINKFINDER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINKFINDER_API_KEY}`,
      },
      body: JSON.stringify({
        type: "linkedin_profile_to_linkedin_info",
        input_data: linkedinUrl,
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[LinkedIn Enrichment] LinkFinderAI error ${response.status}: ${errorText}`);
      return {
        success: false,
        message: `Could not fetch LinkedIn profile. Please fill in details manually.`,
      };
    }

    const data = await response.json() as any;
    console.log("[LinkedIn Enrichment] Response received, status:", data.status);

    if (data.error || data.status === "error") {
      return {
        success: false,
        message: data.message || "Profile not found. Please fill in details manually.",
      };
    }

    // Parse full name into first/last
    const fullName = data.name || "";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Parse experiences array
    const employment = (data.experiences || [])
      .filter((exp: any) => exp.title || exp.companyName)
      .map((exp: any) => ({
        companyName: exp.companyName || "",
        position: exp.title || "",
        startDate: exp.jobStartedOn ? formatDate(exp.jobStartedOn) : "",
        endDate: exp.jobStillWorking ? "" : (exp.jobEndedOn && exp.jobEndedOn !== "Present" ? formatDate(exp.jobEndedOn) : ""),
        isCurrent: exp.jobStillWorking === true || exp.jobEndedOn === "Present",
        description: exp.jobDescription || "",
      }));

    // Parse education if available
    const education = (data.education || data.educations || [])
      .filter((edu: any) => edu.schoolName || edu.school)
      .map((edu: any) => ({
        schoolName: edu.schoolName || edu.school || "",
        degree: edu.degree || edu.degreeName || "",
        fieldOfStudy: edu.fieldOfStudy || edu.field || "",
        startDate: edu.startDate ? formatDate(edu.startDate) : "",
        endDate: edu.endDate ? formatDate(edu.endDate) : "",
      }));

    return {
      success: true,
      firstName,
      lastName,
      email: data.email || undefined,
      headline: data.headline || data.jobTitle || undefined,
      profileUrl: linkedinUrl,
      employment: employment.length > 0 ? employment : undefined,
      education: education.length > 0 ? education : undefined,
    };
  } catch (error: any) {
    // Handle timeout specifically
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      console.error("[LinkedIn Enrichment] Request timed out");
      return {
        success: false,
        message: "LinkedIn profile fetch timed out. Please try again.",
      };
    }
    console.error("[LinkedIn Enrichment] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Format date — handles year-only strings like "2000" or "2015"
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr || dateStr === "Present") return "";
  try {
    // Already YYYY-MM
    if (/^\d{4}-\d{2}/.test(dateStr)) return dateStr.substring(0, 7);
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 7);
    // Just a year: "2000"
    if (/^\d{4}$/.test(dateStr)) return dateStr;
    // Try parsing as a full date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
  } catch (e) {
    // ignore
  }
  return dateStr;
}
