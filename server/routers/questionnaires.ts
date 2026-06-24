import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createQuestionnaire,
  getQuestionnaireByProject,
  getQuestionnaireByToken,
  addQuestionnaireQuestion,
  deleteQuestionnaireQuestion,
  updateQuestionnaireQuestion,
  submitQuestionnaireResponse,
  getQuestionnaireSubmissions,
  deleteQuestionnaire,
  publishQuestionnaire,
  createOrGetInvitation,
  getInvitationByToken,
  submitInvitationResponse,
  updateShortlistStatus,
  getShortlistById,
  getAdminUserById,
} from "../db";
import { sendEmail } from "../email";
import { ENV } from "../_core/env";

const ADMIN_EMAIL = "alternatives@nativeworld.com";

export const questionnairesRouter = router({
  // ── Admin: get or create questionnaire for a project ──────────────────────
  getByProject: adminProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return getQuestionnaireByProject(input.projectId);
    }),

  create: adminProcedure
    .input(z.object({
      projectId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createQuestionnaire(input);
    }),

  addQuestion: adminProcedure
    .input(z.object({
      questionnaireId: z.number(),
      questionText: z.string().min(1),
      questionType: z.enum(["long_text", "yes_no", "dropdown", "multi_select"]),
      options: z.array(z.string()).optional(),
      order: z.number().optional(),
      isRequired: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await addQuestionnaireQuestion(input);
      return { success: true };
    }),

  deleteQuestion: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteQuestionnaireQuestion(input.id);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteQuestionnaire(input.id);
      return { success: true };
    }),

  publish: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await publishQuestionnaire(input.id);
      return { success: true };
    }),

  updateQuestion: adminProcedure
    .input(z.object({
      id: z.number(),
      questionText: z.string().min(1).optional(),
      questionType: z.enum(["long_text", "yes_no", "dropdown", "multi_select"]).optional(),
      options: z.array(z.string()).optional(),
      isRequired: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateQuestionnaireQuestion(input.id, input);
      return { success: true };
    }),

  createInvitation: adminProcedure
    .input(z.object({
      questionnaireId: z.number(),
      expertId: z.number(),
      shortlistId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const inv = await createOrGetInvitation(input);
      return inv;
    }),

  responses: adminProcedure
    .input(z.object({ questionnaireId: z.number() }))
    .query(async ({ input }) => {
      return getQuestionnaireSubmissions(input.questionnaireId);
    }),

  // ── Public: fetch questionnaire via per-expert invitation token ───────────
  getByInvitationToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        console.log(`[Questionnaire] Fetching invitation by token: ${input.token}`);
        const result = await getInvitationByToken(input.token);

        if (!result) {
          console.error(`[Questionnaire] ❌ Invitation not found for token: ${input.token}`);
          return null;
        }

        console.log(`[Questionnaire] ✓ Invitation found: ${JSON.stringify({
          invId: result.invitation?.id,
          qId: result.questionnaire?.id,
          expertId: result.expert?.id
        })}`);

        if (!result.questionnaire) {
          console.error(`[Questionnaire] ❌ Questionnaire not found (null) for invitation token: ${input.token}`);
          return null;
        }

        console.log(`[Questionnaire] ✓ Questionnaire found: id=${result.questionnaire.id}, isPublished=${result.questionnaire.isPublished}`);

        if (!result.questionnaire.isPublished) {
          console.error(`[Questionnaire] ❌ Questionnaire is NOT PUBLISHED (isPublished=false) for token: ${input.token}, questionnaire: ${result.questionnaire.title}`);
          return null;
        }

        console.log(`[Questionnaire] ✓ Questionnaire is active, returning result`);
        return result;
      } catch (error) {
        console.error(`[Questionnaire] ❌ Error fetching invitation by token: ${input.token}`, error);
        return null;
      }
    }),

  submitInvitation: publicProcedure
    .input(z.object({
      token: z.string(),
      answers: z.record(z.string(), z.any()),
      respondentName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await getInvitationByToken(input.token);
      if (!result) throw new Error("Invitation not found");

      await submitInvitationResponse(input);

      // Update shortlist status to "questionnaire_responded"
      if (result.invitation?.shortlistId) {
        try {
          await updateShortlistStatus(result.invitation.shortlistId, "questionnaire_responded");
          console.log(`[Questionnaire] Updated shortlist ${result.invitation.shortlistId} status to questionnaire_responded`);
        } catch (err) {
          console.warn(`[Questionnaire] Failed to update shortlist status:`, err);
        }
      }

      // Notify admin and consultant
      try {
        const appUrl = (ENV as any).appUrl || "https://alternatives.nativeworld.com";
        const { questionnaire: q, expert, project } = result;
        const answerRows = q.questions
          .map((qs: any) => {
            const ans = input.answers[String(qs.id)];
            const display = Array.isArray(ans) ? ans.join(", ") : (ans ?? "—");
            return `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">${qs.questionText}</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${display}</td></tr>`;
          })
          .join("");

        const emailBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0F172A;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="color:#fff;margin:0;font-size:18px">Questionnaire Response Received</h2>
            </div>
            <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
              <p style="color:#555">A questionnaire response has been submitted for <strong>${q.title}</strong>.</p>
              <p style="color:#555"><strong>Expert:</strong> ${expert?.firstName ?? ""} ${expert?.lastName ?? ""} &lt;${expert?.email ?? ""}&gt;</p>
              <p style="color:#555"><strong>Project:</strong> ${project?.name ?? ""}</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px">
                <tr><td style="padding:8px;background:#f8fafc;font-weight:700;color:#333;border-bottom:2px solid #e2e8f0">Question</td><td style="padding:8px;background:#f8fafc;font-weight:700;color:#333;border-bottom:2px solid #e2e8f0">Answer</td></tr>
                ${answerRows}
              </table>
              <div style="margin-top:20px">
                <a href="${appUrl}/admin/projects/${project?.id}" style="display:inline-block;padding:10px 20px;background:#2563EB;color:#fff;text-decoration:none;border-radius:6px;font-size:13px">View Project</a>
              </div>
            </div>
          </div>`;

        // Send to admin
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `Questionnaire Response — ${q.title}`,
          html: emailBody,
        });

        // Send to consultant in charge
        if (result.invitation?.shortlistId) {
          const shortlist = await getShortlistById(result.invitation.shortlistId);
          if (shortlist?.consultantInChargeId) {
            const consultant = await getAdminUserById(shortlist.consultantInChargeId);
            if (consultant?.email) {
              await sendEmail({
                to: consultant.email,
                subject: `Questionnaire Response Received — ${expert?.firstName} ${expert?.lastName}`,
                html: emailBody,
              });
              console.log(`[Questionnaire] Notification sent to consultant ${consultant.email}`);
            }
          }
        }
      } catch (e) {
        console.warn("[Questionnaire] Email notification failed:", e);
      }

      return { success: true };
    }),

  // ── Public: fetch questionnaire form by token ──────────────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const q = await getQuestionnaireByToken(input.token);
      if (!q || !q.isActive) return null;
      return q;
    }),

  // ── Public: submit response ────────────────────────────────────────────────
  submit: publicProcedure
    .input(z.object({
      token: z.string(),
      respondentEmail: z.string().email(),
      respondentName: z.string().optional(),
      answers: z.record(z.string(), z.any()),
    }))
    .mutation(async ({ input }) => {
      const q = await getQuestionnaireByToken(input.token);
      if (!q || !q.isActive) throw new Error("Questionnaire not found or inactive");

      await submitQuestionnaireResponse({
        questionnaireId: q.id,
        respondentEmail: input.respondentEmail,
        respondentName: input.respondentName,
        answers: input.answers,
      });

      // Update shortlist status to "questionnaire_responded" and email consultant
      try {
        const { updateShortlist, getShortlistsByProject } = await import("../db");
        const shortlists = await getShortlistsByProject(q.projectId);
        const shortlist = shortlists.find((s: any) => s.expert?.email === input.respondentEmail);

        if (shortlist && shortlist.consultantInChargeId) {
          await updateShortlist(shortlist.id, { status: "questionnaire_responded" });

          // Get consultant details and send email
          const pool = (await import("../db").then(m => m.getDb()))?.$client;
          const [adminRows]: any = await pool.execute(
            "SELECT email, name FROM admin_users WHERE id = ? LIMIT 1",
            [shortlist.consultantInChargeId]
          );
          const admin = adminRows?.[0];

          if (admin?.email) {
            const answerRows = q.questions
              .map((qs: any) => {
                const ans = input.answers[String(qs.id)];
                const display = Array.isArray(ans) ? ans.join(", ") : (ans ?? "—");
                return `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">${qs.questionText}</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${display}</td></tr>`;
              })
              .join("");

            await sendEmail({
              to: admin.email,
              subject: `Questionnaire Response from ${input.respondentName || input.respondentEmail}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <div style="background:#0F172A;padding:20px 24px;border-radius:8px 8px 0 0">
                    <h2 style="color:#fff;margin:0;font-size:18px">Questionnaire Response Received</h2>
                  </div>
                  <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                    <p>Hi ${admin.name},</p>
                    <p><strong>${input.respondentName || input.respondentEmail}</strong> has completed the questionnaire for your project.</p>
                    <table style="width:100%;border-collapse:collapse;margin-top:16px">
                      <tr><td style="padding:8px;background:#f8fafc;font-weight:700;color:#333;border-bottom:2px solid #e2e8f0">Question</td><td style="padding:8px;background:#f8fafc;font-weight:700;color:#333;border-bottom:2px solid #e2e8f0">Answer</td></tr>
                      ${answerRows}
                    </table>
                    <p style="color:#888;font-size:12px;margin-top:24px">© ${new Date().getFullYear()} AlterNatives</p>
                  </div>
                </div>`,
            });
          }
        }
      } catch (e) {
        console.warn("[Questionnaire] Failed to update shortlist or email consultant:", e);
      }

      // Notify admin (original behavior)
      try {
        const appUrl = (ENV as any).appUrl || "https://alternatives.nativeworld.com";
        const answerRows = q.questions
          .map((qs: any) => {
            const ans = input.answers[String(qs.id)];
            const display = Array.isArray(ans) ? ans.join(", ") : (ans ?? "—");
            return `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">${qs.questionText}</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">${display}</td></tr>`;
          })
          .join("");

        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `Questionnaire Response — ${q.title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#0F172A;padding:20px 24px;border-radius:8px 8px 0 0">
                <h2 style="color:#fff;margin:0;font-size:18px">New Questionnaire Response</h2>
              </div>
              <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                <p style="color:#555">A response has been submitted for <strong>${q.title}</strong>.</p>
                <table style="width:100%;border-collapse:collapse;margin-top:16px">
                  <tr><td style="padding:8px;background:#f8fafc;font-weight:700;color:#333;border-bottom:2px solid #e2e8f0">Question</td><td style="padding:8px;background:#f8fafc;font-weight:700;color:#333;border-bottom:2px solid #e2e8f0">Answer</td></tr>
                  ${answerRows}
                </table>
                <div style="margin-top:20px;padding:16px;background:#f8fafc;border-radius:6px;font-size:13px;color:#666">
                  <strong>Respondent:</strong> ${input.respondentName || "—"} &lt;${input.respondentEmail}&gt;
                </div>
              </div>
            </div>`,
        });
      } catch (e) {
        console.warn("[Questionnaire] Admin email failed:", e);
      }

      return { success: true };
    }),
});
