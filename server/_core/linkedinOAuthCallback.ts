import type { Express, Request, Response } from "express";
import { exchangeCodeForToken, fetchLinkedInProfile } from "../linkedinOAuth";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Register LinkedIn OAuth callback route
 * This handles the redirect from LinkedIn after user authorizes the app
 * The callback stores the authorization code and profile data in the session/URL
 * so the frontend can retrieve it and auto-populate the expert profile form
 */
export function registerLinkedInOAuthRoutes(app: Express) {
  app.get("/api/linkedin/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");
    const errorDescription = getQueryParam(req, "error_description");

    // Handle LinkedIn OAuth errors
    if (error) {
      console.error("[LinkedIn OAuth] Error from LinkedIn:", error, errorDescription);
      return res.redirect(
        `/expert/register?linkedin_error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || "")}`
      );
    }

    if (!code) {
      console.error("[LinkedIn OAuth] Missing authorization code");
      return res.redirect("/expert/register?linkedin_error=missing_code");
    }

    try {
      // Exchange authorization code for access token
      const redirectUri = `${req.protocol}://${req.get("host")}/api/linkedin/callback`;
      const accessToken = await exchangeCodeForToken(code, redirectUri);

      // Fetch LinkedIn profile data
      const profile = await fetchLinkedInProfile(accessToken);

      // Redirect back to expert registration with profile data encoded in URL
      // The frontend will parse this and auto-populate the form
      const profileJson = encodeURIComponent(JSON.stringify(profile));
      res.redirect(`/expert/register?linkedin_profile=${profileJson}`);
    } catch (error) {
      console.error("[LinkedIn OAuth] Callback failed:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      res.redirect(`/expert/register?linkedin_error=callback_failed&error_description=${encodeURIComponent(errorMsg)}`);
    }
  });
}
