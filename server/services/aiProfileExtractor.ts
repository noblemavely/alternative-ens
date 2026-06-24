/**
 * AI Profile Extractor Service (OpenAPI Setup)
 * Configurable AI model for extracting profile data from LinkedIn URLs or resumes
 * Current: Claude API | Future: Easily swap to other models
 */

import { ENV } from "../_core/env";

export interface ProfileData {
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

export interface AIProvider {
  name: string;
  extractFromURL(url: string): Promise<ProfileData | null>;
  extractFromText(text: string): Promise<ProfileData | null>;
}

/**
 * Claude AI Provider Implementation
 */
class ClaudeProvider implements AIProvider {
  name = "claude";
  private apiKey: string;
  private model: string = "claude-3-5-sonnet-20241022";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setModel(model: string) {
    this.model = model;
  }

  async extractFromURL(url: string): Promise<ProfileData | null> {
    try {
      console.log(`[Claude] Extracting profile from URL: ${url}`);

      // Fetch LinkedIn profile HTML
      const html = await this.fetchLinkedInProfile(url);
      if (!html) {
        console.error("[Claude] Failed to fetch LinkedIn profile");
        return null;
      }

      return await this.parseProfileHTML(html);
    } catch (error) {
      console.error("[Claude] Error extracting from URL:", error);
      return null;
    }
  }

  async extractFromText(text: string): Promise<ProfileData | null> {
    try {
      console.log("[Claude] Extracting profile from text (resume)");
      return await this.parseProfileText(text);
    } catch (error) {
      console.error("[Claude] Error extracting from text:", error);
      return null;
    }
  }

  private async fetchLinkedInProfile(url: string): Promise<string | null> {
    try {
      // LinkedIn requires authentication and blocks scraping
      // For now, return null - this would need to be implemented with:
      // 1. Puppeteer/Playwright with authentication
      // 2. LinkedIn Data Export from user
      // 3. Screenshot + OCR approach

      console.warn("[Claude] LinkedIn scraping not implemented. Using fallback.");
      // TODO: Implement LinkedIn scraping with proper auth
      return null;
    } catch (error) {
      console.error("[Claude] Error fetching LinkedIn profile:", error);
      return null;
    }
  }

  private async parseProfileHTML(html: string): Promise<ProfileData | null> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `Extract professional profile information from this LinkedIn HTML and return ONLY valid JSON (no markdown, no explanation):

{
  "firstName": "string or null",
  "lastName": "string or null",
  "headline": "string or null",
  "sector": "string or null",
  "biography": "string or null",
  "skills": ["string"],
  "employment": [{
    "companyName": "string",
    "position": "string",
    "startDate": "YYYY-MM or null",
    "endDate": "YYYY-MM or null",
    "isCurrent": boolean,
    "description": "string or null"
  }],
  "education": [{
    "schoolName": "string",
    "degree": "string or null",
    "fieldOfStudy": "string or null",
    "startDate": "YYYY-MM or null",
    "endDate": "YYYY-MM or null"
  }]
}

HTML Content:
${html}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
      }

      const data = (await response.json()) as any;
      const content = data.content?.[0]?.text;

      if (!content) {
        console.error("[Claude] No content in response");
        return null;
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[Claude] Could not find JSON in response");
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]) as ProfileData;
      console.log("[Claude] Successfully parsed profile from HTML");
      return parsed;
    } catch (error) {
      console.error("[Claude] Error parsing profile HTML:", error);
      return null;
    }
  }

  private async parseProfileText(text: string): Promise<ProfileData | null> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `Extract professional profile information from this resume/CV text and return ONLY valid JSON (no markdown, no explanation):

{
  "firstName": "string or null",
  "lastName": "string or null",
  "headline": "string or null",
  "sector": "string or null",
  "biography": "string or null",
  "skills": ["string"],
  "employment": [{
    "companyName": "string",
    "position": "string",
    "startDate": "YYYY-MM or null",
    "endDate": "YYYY-MM or null",
    "isCurrent": boolean,
    "description": "string or null"
  }],
  "education": [{
    "schoolName": "string",
    "degree": "string or null",
    "fieldOfStudy": "string or null",
    "startDate": "YYYY-MM or null",
    "endDate": "YYYY-MM or null"
  }]
}

Resume Content:
${text}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${error}`);
      }

      const data = (await response.json()) as any;
      const content = data.content?.[0]?.text;

      if (!content) {
        console.error("[Claude] No content in response");
        return null;
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[Claude] Could not find JSON in response");
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]) as ProfileData;
      console.log("[Claude] Successfully parsed profile from text");
      return parsed;
    } catch (error) {
      console.error("[Claude] Error parsing profile text:", error);
      return null;
    }
  }
}

/**
 * AI Profile Extractor Factory
 * Currently supports: Claude
 * Easy to extend with other providers
 */
export class AIProfileExtractor {
  private provider: AIProvider;

  constructor(providerName: string = "claude") {
    if (providerName === "claude") {
      if (!ENV.claudeApiKey) {
        throw new Error("CLAUDE_API_KEY environment variable not set");
      }
      this.provider = new ClaudeProvider(ENV.claudeApiKey);
    } else {
      throw new Error(`Unsupported AI provider: ${providerName}`);
    }
  }

  setModel(model: string) {
    if (this.provider instanceof ClaudeProvider) {
      this.provider.setModel(model);
    }
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  async extractFromURL(url: string): Promise<ProfileData | null> {
    return this.provider.extractFromURL(url);
  }

  async extractFromText(text: string): Promise<ProfileData | null> {
    return this.provider.extractFromText(text);
  }
}

// Export singleton instance
export function getProfileExtractor(providerName: string = "claude"): AIProfileExtractor {
  return new AIProfileExtractor(providerName);
}
