import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createQuestionnaire,
  getQuestionnaireByProject,
  getQuestionnaireByToken,
  addQuestionnaireQuestion,
  deleteQuestionnaireQuestion,
  submitQuestionnaireResponse,
  getQuestionnaireSubmissions,
  deleteQuestionnaire,
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

  responses: adminProcedure
    .input(z.object({ questionnaireId: z.number() }))
    .query(async ({ input }) => {
      return getQuestionnaireSubmissions(input.questionnaireId);
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

      // Notify admin
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
