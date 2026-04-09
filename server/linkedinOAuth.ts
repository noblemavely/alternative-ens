import { ENV } from "./_core/env";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

export interface LinkedInProfile {
  firstName: string;
  lastName: string;
  headline?: string;
  profilePicture?: string;
  email?: string;
  employmentHistory: LinkedInEmployment[];
  educationHistory: LinkedInEducation[];
  skills?: string[];
}

export interface LinkedInEmployment {
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  current?: boolean;
}

export interface LinkedInEducation {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Generate LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.linkedinClientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile email",
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: ENV.linkedinClientId,
    client_secret: ENV.linkedinClientSecret,
    redirect_uri: redirectUri,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.statusText}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

/**
 * Fetch LinkedIn profile data using access token
 * Note: With current scopes (openid profile email), only basic profile data is available.
 * Employment, education, and skills require LinkedIn API Partner Program approval.
 */
export async function fetchLinkedInProfile(
  accessToken: string
): Promise<LinkedInProfile> {
  try {
    // Fetch basic profile info
    const profileResponse = await fetch(
      `${LINKEDIN_API_BASE}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage),headline)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202401",
        },
      }
    );

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch LinkedIn profile: ${profileResponse.statusText}`);
    }

    const profileData = await profileResponse.json() as any;

    // Fetch email
    let email = "";
    try {
      const emailResponse = await fetch(`${LINKEDIN_API_BASE}/emailAddress?q=members&projection=(elements*(handle~))`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202401",
        },
      });

      if (emailResponse.ok) {
        const emailData = await emailResponse.json() as any;
        if (emailData.elements && emailData.elements[0]?.["handle~"]?.emailAddress) {
          email = emailData.elements[0]["handle~"].emailAddress;
        }
      }
    } catch (error) {
      console.warn("[LinkedIn] Failed to fetch email:", error);
    }

    // Fetch employment history (may fail with 403 if scopes not approved)
    let employmentHistory: LinkedInEmployment[] = [];
    try {
      const employmentResponse = await fetch(
        `${LINKEDIN_API_BASE}/me/positions?q=orderBy&orderBy.sort=DESC`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "LinkedIn-Version": "202401",
          },
        }
      );

      if (employmentResponse.ok) {
        const employmentData = await employmentResponse.json() as any;
        employmentHistory = (employmentData.elements || []).map((emp: any) => ({
          company: emp.company?.localizedName || "",
          position: emp.title?.localizedString || emp.title || "",
          startDate: emp.startDate ? formatDate(emp.startDate) : undefined,
          endDate: emp.endDate ? formatDate(emp.endDate) : undefined,
          description: emp.description || undefined,
          current: !emp.endDate,
        }));
      }
    } catch (error) {
      console.warn("[LinkedIn] Failed to fetch employment history (requires Partner Program approval):", error);
    }

    // Fetch education history (may fail with 403 if scopes not approved)
    let educationHistory: LinkedInEducation[] = [];
    try {
      const educationResponse = await fetch(
        `${LINKEDIN_API_BASE}/me/educations`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "LinkedIn-Version": "202401",
          },
        }
      );

      if (educationResponse.ok) {
        const educationData = await educationResponse.json() as any;
        educationHistory = (educationData.elements || []).map((edu: any) => ({
          school: edu.schoolName || "",
          degree: edu.degreeName || undefined,
          fieldOfStudy: edu.fieldOfStudy || undefined,
          startDate: edu.startDate ? formatDate(edu.startDate) : undefined,
          endDate: edu.endDate ? formatDate(edu.endDate) : undefined,
        }));
      }
    } catch (error) {
      console.warn("[LinkedIn] Failed to fetch education history (requires Partner Program approval):", error);
    }

    // Fetch skills (may fail with 403 if scopes not approved)
    let skills: string[] = [];
    try {
      const skillsResponse = await fetch(
        `${LINKEDIN_API_BASE}/me/skills`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "LinkedIn-Version": "202401",
          },
        }
      );

      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json() as any;
        skills = (skillsData.elements || []).map((skill: any) => skill.name || "");
      }
    } catch (error) {
      console.warn("[LinkedIn] Failed to fetch skills (requires Partner Program approval):", error);
    }

    return {
      firstName: profileData.localizedFirstName || "",
      lastName: profileData.localizedLastName || "",
      headline: profileData.headline?.localizedString || profileData.headline || undefined,
      profilePicture: profileData.profilePicture?.displayImage || undefined,
      email,
      employmentHistory,
      educationHistory,
      skills: skills.length > 0 ? skills : undefined,
    };
  } catch (error) {
    console.error("[LinkedIn] Profile fetch failed:", error);
    throw error;
  }
}

/**
 * Format LinkedIn date object to YYYY-MM-DD string
 */
function formatDate(dateObj: { year?: number; month?: number; day?: number }): string {
  if (!dateObj) return "";
  const year = dateObj.year || new Date().getFullYear();
  const month = String(dateObj.month || 1).padStart(2, "0");
  const day = String(dateObj.day || 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
