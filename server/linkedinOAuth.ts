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
  profileUrl?: string;
}

/**
 * Generate LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(redirectUri: string, state: string): string {
  // Use LinkedIn Sign In with LinkedIn OpenID Connect scopes (approved)
  // openid: Required for OpenID Connect
  // profile: Access to basic profile info (name, email, picture)
  // email: Access to email address
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
 * Fetch basic LinkedIn profile data using access token
 * Only fetches basic profile info (name, email, picture, profile URL)
 * Employment, education, and skills require LinkedIn API Partner Program approval
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

    // Build LinkedIn profile URL from ID
    let profileUrl = undefined;
    if (profileData.id) {
      profileUrl = `https://www.linkedin.com/in/${profileData.id}`;
    }

    return {
      firstName: profileData.localizedFirstName || "",
      lastName: profileData.localizedLastName || "",
      headline: profileData.headline?.localizedString || profileData.headline || undefined,
      profilePicture: profileData.profilePicture?.displayImage || undefined,
      email,
      profileUrl,
    };
  } catch (error) {
    console.error("[LinkedIn] Profile fetch failed:", error);
    throw error;
  }
}
