/**
 * Apollo.io LinkedIn Profile Extractor
 * Extracts professional information from LinkedIn profiles using Apollo.io API
 */

import { ENV } from "../_core/env";

export interface ApolloProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  sector?: string;
  biography?: string;
  skills?: string[];
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
}

/**
 * Extract LinkedIn username from various LinkedIn URL formats
 */
function extractLinkedInUsername(url: string): string | null {
  try {
    // Remove protocol and www
    let cleanUrl = url.replace(/^https?:\/\/(www\.)?/, "");

    // Extract username from /in/username pattern
    const match = cleanUrl.match(/\/in\/([a-zA-Z0-9\-]+)/);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error("[Apollo] Error extracting LinkedIn username:", error);
    return null;
  }
}

/**
 * Get Apollo.io access token using OAuth credentials
 */
async function getApolloAccessToken(): Promise<string | null> {
  try {
    if (!ENV.apolloClientId || !ENV.apolloClientSecret) {
      console.error("[Apollo] Missing OAuth credentials");
      return null;
    }

    // Apollo.io OAuth token endpoint
    const tokenResponse = await fetch("https://api.apollo.io/v1/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: ENV.apolloClientId,
        client_secret: ENV.apolloClientSecret,
        grant_type: "client_credentials",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(
        `[Apollo] Token exchange failed: ${tokenResponse.status} - ${errorText}`
      );
      return null;
    }

    const tokenData = (await tokenResponse.json()) as any;
    return tokenData.access_token || null;
  } catch (error) {
    console.error("[Apollo] Error getting access token:", error);
    return null;
  }
}

/**
 * Search for a person on Apollo.io by LinkedIn profile URL
 */
export async function searchApolloByLinkedInUrl(
  linkedinUrl: string
): Promise<ApolloProfileData | null> {
  try {
    // Extract LinkedIn username
    const username = extractLinkedInUsername(linkedinUrl);
    if (!username) {
      console.error(
        `[Apollo] Could not extract username from LinkedIn URL: ${linkedinUrl}`
      );
      return null;
    }

    console.log(`[Apollo] Searching for LinkedIn user: ${username}`);

    // Try direct API key first (if configured)
    if (ENV.apolloApiKey && ENV.apolloApiKey !== "your-apollo-key-here") {
      console.log("[Apollo] Using direct API key authentication");
      return await searchWithApiKey(linkedinUrl, ENV.apolloApiKey);
    }

    // Fall back to OAuth token if direct key not available
    console.log("[Apollo] Using OAuth token authentication");
    const accessToken = await getApolloAccessToken();
    if (!accessToken) {
      console.warn("[Apollo] Could not obtain access token, returning null");
      return null;
    }

    return await searchWithAccessToken(linkedinUrl, accessToken);
  } catch (error) {
    console.error("[Apollo] Error searching LinkedIn profile:", error);
    return null;
  }
}

/**
 * Search Apollo.io using API Key
 */
async function searchWithApiKey(
  linkedinUrl: string,
  apiKey: string
): Promise<ApolloProfileData | null> {
  const username = extractLinkedInUsername(linkedinUrl);

  const response = await fetch("https://api.apollo.io/v1/people/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      linkedin_url: linkedinUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Apollo] API error: ${response.status} - ${errorText}`);
    return null;
  }

  const data = (await response.json()) as any;
  return extractProfileFromResponse(data, username);
}

/**
 * Search Apollo.io using OAuth Access Token
 */
async function searchWithAccessToken(
  linkedinUrl: string,
  accessToken: string
): Promise<ApolloProfileData | null> {
  const username = extractLinkedInUsername(linkedinUrl);

  const response = await fetch("https://api.apollo.io/v1/people/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      linkedin_url: linkedinUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Apollo] API error: ${response.status} - ${errorText}`);
    return null;
  }

  const data = (await response.json()) as any;
  return extractProfileFromResponse(data, username);
}

/**
 * Extract profile data from Apollo.io API response
 */
function extractProfileFromResponse(
  data: any,
  username: string
): ApolloProfileData | null {
  if (!data.person) {
    console.warn(`[Apollo] No person found for LinkedIn username: ${username}`);
    return null;
  }

  const person = data.person;

  console.log(`[Apollo] Successfully found profile for ${username}`);

  // Map Apollo data to our ProfileData format
  const profileData: ApolloProfileData = {
    firstName: person.first_name || "",
    lastName: person.last_name || "",
    email: person.email || person.emails?.[0] || "",
    phone: person.phone_number || "",
    headline: person.title || "",
    sector: person.industry || "",
    biography: person.headline || "",
    skills: person.skills?.slice(0, 10) || [],
    employment: mapEmploymentHistory(person.employment_history),
    education: mapEducationHistory(person.education),
  };

  return profileData;
}

/**
 * Map Apollo employment history to our format
 */
function mapEmploymentHistory(
  employmentHistory: any[]
): ApolloProfileData["employment"] {
  if (!employmentHistory || !Array.isArray(employmentHistory)) {
    return [];
  }

  return employmentHistory.map((emp) => ({
    companyName: emp.company_name || "",
    position: emp.title || "",
    startDate: emp.start_date ? formatDate(emp.start_date) : undefined,
    endDate: emp.end_date ? formatDate(emp.end_date) : undefined,
    isCurrent: !emp.end_date, // If no end date, assume current
    description: emp.description || "",
  }));
}

/**
 * Map Apollo education to our format
 */
function mapEducationHistory(
  education: any[]
): ApolloProfileData["education"] {
  if (!education || !Array.isArray(education)) {
    return [];
  }

  return education.map((edu) => ({
    schoolName: edu.school_name || "",
    degree: edu.degree || "",
    fieldOfStudy: edu.field_of_study || "",
    startDate: edu.start_date ? formatDate(edu.start_date) : undefined,
    endDate: edu.end_date ? formatDate(edu.end_date) : undefined,
  }));
}

/**
 * Format date from Apollo format (YYYY-MM-DD) to our format (YYYY-MM)
 */
function formatDate(dateString: string): string | undefined {
  if (!dateString) return undefined;

  try {
    // Apollo returns dates in format like "2020-01" or "2020-01-15"
    // We want "YYYY-MM" format
    const parts = dateString.split("-");
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }
    return undefined;
  } catch (error) {
    console.error("[Apollo] Error formatting date:", error);
    return undefined;
  }
}

/**
 * Get Apollo.io status - check if API credentials are configured
 */
export function isApolloConfigured(): boolean {
  return !!(ENV.apolloClientId && ENV.apolloClientSecret);
}
