import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createLead, listLeads } from "../db";
import { sendEmail } from "../email";
import { TRPCError } from "@trpc/server";

const QUERY_TYPE_LABELS: Record<string, string> = {
  client: "Become an AlterNatives Client",
  advisor: "Become an Advisor on AlterNatives",
  other: "Other",
};

export const leadsRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        organization: z.string().optional(),
        email: z.string().email("Valid email required"),
        queryType: z.enum(["client", "advisor", "other"]),
        otherQuery: z.string().optional(),
        utmSource:   z.string().optional(),
        utmMedium:   z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent:  z.string().optional(),
        utmTerm:     z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Save to DB
      const leadId = await createLead({
        name: input.name,
        organization: input.organization || null,
        email: input.email,
        queryType: input.queryType,
        otherQuery: input.otherQuery || null,
        utmSource:   input.utmSource   || null,
        utmMedium:   input.utmMedium   || null,
        utmCampaign: input.utmCampaign || null,
        utmContent:  input.utmContent  || null,
        utmTerm:     input.utmTerm     || null,
      });

      // Send notification email
      const queryLabel = QUERY_TYPE_LABELS[input.queryType];
      const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8FAFC; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: #0F172A; padding: 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.5); margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #EFF6FF; color: #1D4ED8; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 99px; margin-bottom: 24px; }
    .field { margin-bottom: 20px; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B; margin-bottom: 4px; }
    .value { font-size: 15px; color: #1E293B; font-weight: 500; }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 24px 0; }
    .other-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; }
    .footer { padding: 20px 32px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Lead — AlterNatives</h1>
      <p>Submitted ${submittedAt} IST</p>
    </div>
    <div class="body">
      <div class="badge">Lead #${leadId}</div>

      <div class="field">
        <div class="label">Name</div>
        <div class="value">${input.name}</div>
      </div>

      <div class="field">
        <div class="label">Organization</div>
        <div class="value">${input.organization || "—"}</div>
      </div>

      <div class="field">
        <div class="label">Email Address</div>
        <div class="value"><a href="mailto:${input.email}" style="color:#2563EB">${input.email}</a></div>
      </div>

      <hr class="divider">

      <div class="field">
        <div class="label">Type of Query</div>
        <div class="value">${queryLabel}</div>
      </div>

      ${input.queryType === "other" && input.otherQuery ? `
      <div class="field">
        <div class="label">Query Details</div>
        <div class="other-box">${input.otherQuery}</div>
      </div>
      ` : ""}

      ${(input.utmSource || input.utmMedium || input.utmCampaign || input.utmContent || input.utmTerm) ? `
      <hr class="divider">
      <div class="label" style="margin-bottom:12px">UTM Attribution</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        ${input.utmSource   ? `<tr><td style="color:#64748B;padding:4px 0;width:120px">utm_source</td><td style="color:#1E293B;font-weight:500">${input.utmSource}</td></tr>`   : ""}
        ${input.utmMedium   ? `<tr><td style="color:#64748B;padding:4px 0">utm_medium</td><td style="color:#1E293B;font-weight:500">${input.utmMedium}</td></tr>`   : ""}
        ${input.utmCampaign ? `<tr><td style="color:#64748B;padding:4px 0">utm_campaign</td><td style="color:#1E293B;font-weight:500">${input.utmCampaign}</td></tr>` : ""}
        ${input.utmContent  ? `<tr><td style="color:#64748B;padding:4px 0">utm_content</td><td style="color:#1E293B;font-weight:500">${input.utmContent}</td></tr>`  : ""}
        ${input.utmTerm     ? `<tr><td style="color:#64748B;padding:4px 0">utm_term</td><td style="color:#1E293B;font-weight:500">${input.utmTerm}</td></tr>`     : ""}
      </table>
      ` : ""}
    </div>
    <div class="footer">
      This is an automated notification from alternatives.nativeworld.com/connect
    </div>
  </div>
</body>
</html>`;

      try {
        await sendEmail({
          to: "alternatives@nativeworld.com",
          subject: `New Lead: ${input.name} — ${queryLabel}`,
          html,
          text: `New lead from ${input.name} (${input.email})\nOrg: ${input.organization || "N/A"}\nQuery: ${queryLabel}\n${input.otherQuery ? `Details: ${input.otherQuery}` : ""}`,
        });
      } catch (e) {
        // Don't fail the submission if email fails — lead is already saved
        console.error("[Leads] Email notification failed:", e);
      }

      return { success: true, leadId };
    }),

  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        queryType: z.string().optional(),
        limit: z.number().optional().default(20),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const rows = await listLeads();
      let filtered = rows.map((r) => ({
        ...r,
        queryTypeLabel: QUERY_TYPE_LABELS[r.queryType] ?? r.queryType,
      }));

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(lead =>
          (lead.name?.toLowerCase().includes(searchLower) || false) ||
          (lead.email?.toLowerCase().includes(searchLower) || false) ||
          (lead.organization?.toLowerCase().includes(searchLower) || false)
        );
      }

      if (input.queryType) {
        filtered = filtered.filter(lead => lead.queryType === input.queryType);
      }

      const total = filtered.length;
      const items = filtered.slice(input.offset, input.offset + input.limit);

      return {
        items,
        total,
        offset: input.offset,
        limit: input.limit,
        hasMore: input.offset + input.limit < total,
      };
    }),
});
