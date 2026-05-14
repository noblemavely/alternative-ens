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

const BRIGHTDATA_API_KEY = "15337476-ed0a-4b1d-aa7c-acb35a5622b7";
const BRIGHTDATA_DATASET_ID = "gd_l1viktl72bvl7bjuj0";
const BRIGHTDATA_BASE_URL = "https://api.brightdata.com/datasets/v3";
const POLL_MAX_RETRIES = 20;
const POLL_INTERVAL_MS = 3000;

/**
 * Enrich LinkedIn profile using BrightData API (async trigger + poll).
 */
export async function enrichLinkedInProfile(
  linkedinUrl: string
): Promise<LinkedInEnrichmentResult> {
  try {
    // Validate LinkedIn URL format
    const urlMatch = linkedinUrl.match(/linkedin\.com\/in\/([a-z0-9\-_%]+)\/?/i);
    if (!urlMatch) {
      return {
        success: false,
        message: "Invalid LinkedIn URL format. Please provide a valid LinkedIn profile URL.",
      };
    }

    console.log("[LinkedIn Enrichment] Triggering BrightData snapshot for:", linkedinUrl);

    // Step 1: Trigger the dataset collection
    const triggerRes = await fetch(
      `${BRIGHTDATA_BASE_URL}/trigger?dataset_id=${BRIGHTDATA_DATASET_ID}&include_errors=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${BRIGHTDATA_API_KEY}`,
        },
        body: JSON.stringify([{ url: linkedinUrl }]),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!triggerRes.ok) {
      const errText = await triggerRes.text().catch(() => "");
      console.warn(`[LinkedIn Enrichment] BrightData trigger error ${triggerRes.status}: ${errText}`);
      return {
        success: false,
        message: "Could not initiate LinkedIn profile fetch. Please fill in details manually.",
      };
    }

    const triggerData = await triggerRes.json() as any;
    const snapshotId = triggerData?.snapshot_id;

    if (!snapshotId) {
      console.warn("[LinkedIn Enrichment] No snapshot_id returned:", triggerData);
      return {
        success: false,
        message: "LinkedIn profile fetch failed. Please fill in details manually.",
      };
    }

    console.log("[LinkedIn Enrichment] Snapshot triggered:", snapshotId, "— polling for results…");

    // Step 2: Poll until snapshot is ready (200) or give up
    let profileData: any = null;
    for (let attempt = 0; attempt < POLL_MAX_RETRIES; attempt++) {
      // Wait before polling (even on first attempt — BrightData needs a moment to start)
      await sleep(POLL_INTERVAL_MS);

      const pollRes = await fetch(
        `${BRIGHTDATA_BASE_URL}/snapshot/${snapshotId}?format=json`,
        {
          headers: {
            "Authorization": `Bearer ${BRIGHTDATA_API_KEY}`,
          },
          signal: AbortSignal.timeout(30000),
        }
      );

      if (pollRes.status === 200) {
        const rows = await pollRes.json() as any[];
        if (Array.isArray(rows) && rows.length > 0) {
          profileData = rows[0];
          console.log("[LinkedIn Enrichment] Snapshot ready after", attempt + 1, "poll(s)");
          break;
        }
      } else if (pollRes.status === 202) {
        // Still processing
        console.log(`[LinkedIn Enrichment] Still processing (attempt ${attempt + 1}/${POLL_MAX_RETRIES})…`);
        continue;
      } else {
        const errText = await pollRes.text().catch(() => "");
        console.warn(`[LinkedIn Enrichment] Poll error ${pollRes.status}: ${errText}`);
        return {
          success: false,
          message: "LinkedIn profile fetch failed. Please fill in details manually.",
        };
      }
    }

    if (!profileData) {
      console.warn("[LinkedIn Enrichment] Snapshot timed out after max retries");
      return {
        success: false,
        message: "LinkedIn profile fetch timed out. Please fill in details manually.",
      };
    }

    // Parse full name
    const fullName = profileData.name || "";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Map experience[] → employment
    const employment = (profileData.experience || [])
      .filter((exp: any) => exp.company || exp.title)
      .map((exp: any) => {
        const isCurrent = !exp.end_date || exp.end_date === "Present";
        return {
          companyName: exp.company || "",
          position: exp.title || "",
          startDate: exp.start_date ? parseBrightDataDate(exp.start_date) : "",
          endDate: isCurrent ? "" : (exp.end_date ? parseBrightDataDate(exp.end_date) : ""),
          isCurrent,
          description: exp.description || "",
        };
      });

    // Map education[] → education
    const education = (profileData.education || [])
      .filter((edu: any) => edu.title || edu.degree)
      .map((edu: any) => ({
        schoolName: edu.title || "",   // BrightData: "title" = school name
        degree: edu.degree || "",
        fieldOfStudy: edu.field || "",
        startDate: edu.start_year ? String(edu.start_year) : "",
        endDate: edu.end_year ? String(edu.end_year) : "",
      }));

    return {
      success: true,
      firstName,
      lastName,
      email: profileData.email || undefined,
      headline: profileData.headline || profileData.position || undefined,
      profileUrl: linkedinUrl,
      employment: employment.length > 0 ? employment : undefined,
      education: education.length > 0 ? education : undefined,
    };
  } catch (error: any) {
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
 * Parse BrightData date strings like "Jul 2022", "2022-07", "2022", or year numbers.
 */
function parseBrightDataDate(dateStr: string | number | null): string {
  if (!dateStr || dateStr === "Present") return "";
  const s = String(dateStr).trim();

  // Year only: "2022" or 2022
  if (/^\d{4}$/.test(s)) return s;

  // YYYY-MM or YYYY-MM-DD
  if (/^\d{4}-\d{2}/.test(s)) return s.substring(0, 7);

  // "Jul 2022" / "January 2022" etc.
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
  } catch (_) { /* ignore */ }

  return s;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
