/**
 * LinkedIn Profile Data API Integration
 * Uses Manus Data API to fetch real LinkedIn profile information
 * Replaces dummy data with actual profile data from LinkedIn
 */

import { callDataApi } from "./_core/dataApi";

export interface LinkedInProfileData {
  firstName?: string;
  lastName?: string;
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
 * Extract LinkedIn username from LinkedIn URL
 * Handles various LinkedIn URL formats:
 * - https://www.linkedin.com/in/username
 * - https://linkedin.com/in/username/
 * - linkedin.com/in/username
 */
export function extractLinkedInUsername(url: string): string | null {
  try {
    // Remove protocol if present
    let cleanUrl = url.replace(/^https?:\/\/(www\.)?/, "");

    // Extract username from /in/username pattern
    const match = cleanUrl.match(/\/in\/([a-zA-Z0-9\-]+)/);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error("Error extracting LinkedIn username:", error);
    return null;
  }
}

/**
 * Fetch real LinkedIn profile data using Manus Data API
 * Returns comprehensive profile information including employment, education, and skills
 */
export async function fetchLinkedInProfileData(
  url: string
): Promise<LinkedInProfileData | null> {
  try {
    // Extract username from URL
    const username = extractLinkedInUsername(url);
    if (!username) {
      console.error("Could not extract username from LinkedIn URL");
      return null;
    }

    console.log(`Fetching LinkedIn profile for username: ${username}`);

    // Call Manus Data API to get LinkedIn profile
    const response = await callDataApi("LinkedIn/get_user_profile_by_username", {
      query: { username },
    });

    if (!response || (response as any).error) {
      console.error("LinkedIn API error:", (response as any)?.error || "Unknown error");
      return null;
    }

    // Parse the response and extract relevant fields
    const profileData = response as any;

    // Extract employment history
    const employment = (profileData.position || []).map((pos: any) => ({
      companyName: pos.companyName || pos.company || "",
      position: pos.title || "",
      startDate: pos.start?.year ? `${pos.start.year}-${String(pos.start.month || 1).padStart(2, "0")}` : undefined,
      endDate: pos.end?.year ? `${pos.end.year}-${String(pos.end.month || 1).padStart(2, "0")}` : undefined,
      isCurrent: pos.end?.year === 0 || !pos.end,
      description: pos.description || "",
    }));

    // Extract education history
    const education = (profileData.educations || []).map((edu: any) => ({
      schoolName: edu.schoolName || edu.school || "",
      degree: edu.degree || "",
      fieldOfStudy: edu.fieldOfStudy || "",
      startDate: edu.start?.year ? `${edu.start.year}-${String(edu.start.month || 1).padStart(2, "0")}` : undefined,
      endDate: edu.end?.year ? `${edu.end.year}-${String(edu.end.month || 1).padStart(2, "0")}` : undefined,
    }));

    // Extract skills
    const skills = (profileData.skills || []).map((skill: any) => skill.name || skill);

    // Build the parsed profile data
    const parsedProfile: LinkedInProfileData = {
      firstName: profileData.firstName || profileData.localizedFirstName || "",
      lastName: profileData.lastName || profileData.localizedLastName || "",
      headline: profileData.headline || "",
      sector: profileData.headline || "", // Use headline as sector
      biography: profileData.summary || "",
      skills: skills.slice(0, 10), // Top 10 skills
      employment: employment,
      education: education,
    };

    return parsedProfile;
  } catch (error) {
    console.error("Error fetching LinkedIn profile data:", error);
    return null;
  }
}

/**
 * Search for LinkedIn profiles by criteria
 * Can search by keywords, company, title, school, etc.
 */
export async function searchLinkedInProfiles(criteria: {
  keywords?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  school?: string;
}): Promise<any[]> {
  try {
    const response = await callDataApi("LinkedIn/search_people", {
      query: criteria,
    });

    if (!response || (response as any).error) {
      console.error("LinkedIn search error:", (response as any)?.error || "Unknown error");
      return [];
    }

    // Extract people from response
    const people = (response as any).data?.items || (response as any).items || [];
    return people;
  } catch (error) {
    console.error("Error searching LinkedIn profiles:", error);
    return [];
  }
}
