import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ClipboardList } from "lucide-react";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png";

export default function QuestionnaireForm() {
  const [, params] = useRoute("/questionnaire/:token");
  const token = params?.token ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const qQuery = trpc.questionnaires.getByToken.useQuery({ token }, { enabled: !!token });
  const submitMutation = trpc.questionnaires.submit.useMutation();

  const q = qQuery.data;

  const setAnswer = (questionId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [String(questionId)]: value }));
  };

  const toggleMulti = (questionId: number, option: string) => {
    setAnswers(prev => {
      const current: string[] = prev[String(questionId)] ?? [];
      return {
        ...prev,
        [String(questionId)]: current.includes(option)
          ? current.filter(o => o !== option)
          : [...current, option],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Email is required"); return; }
    if (!q) return;

    // Validate required questions
    for (const question of q.questions) {
      if (question.isRequired) {
        const ans = answers[String(question.id)];
        const empty = ans === undefined || ans === null || ans === "" || (Array.isArray(ans) && ans.length === 0);
        if (empty) { toast.error(`Please answer: "${question.questionText}"`); return; }
      }
    }

    try {
      await submitMutation.mutateAsync({ token, respondentEmail: email, respondentName: name, answers });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
    }
  };

  if (qQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ClipboardList size={40} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Questionnaire Not Found</h1>
          <p className="text-muted-foreground text-sm">This link may be invalid or the questionnaire has been closed.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#F8FAFC" }}>
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <img src={LOGO} alt="AlterNatives" className="h-8 w-auto object-contain" />
          </div>
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Response Submitted</h1>
          <p className="text-muted-foreground text-sm">Thank you for completing the questionnaire. The AlterNatives team will be in touch.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <img src={LOGO} alt="AlterNatives" className="h-7 w-auto object-contain" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Questionnaire</span>
          <h1 className="text-2xl font-bold text-foreground mt-1 mb-2">{q.title}</h1>
          {q.description && <p className="text-muted-foreground text-sm">{q.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Respondent info */}
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Full Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="h-9 rounded-lg" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Email <span className="text-red-400">*</span></label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="h-9 rounded-lg" required />
              </div>
            </div>
          </div>

          {/* Questions */}
          {q.questions.map((question: any, idx: number) => {
            const opts: string[] = (() => { try { return JSON.parse(question.options || "[]"); } catch { return []; } })();
            const ans = answers[String(question.id)];

            return (
              <div key={question.id} className="bg-white rounded-xl border border-border p-6">
                <p className="text-sm font-semibold text-foreground mb-4">
                  <span className="text-muted-foreground font-normal mr-2">{idx + 1}.</span>
                  {question.questionText}
                  {question.isRequired && <span className="text-red-400 ml-1">*</span>}
                </p>

                {question.questionType === "long_text" && (
                  <Textarea
                    rows={4}
                    placeholder="Your answer…"
                    value={ans ?? ""}
                    onChange={e => setAnswer(question.id, e.target.value)}
                    className="rounded-lg resize-none"
                  />
                )}

                {question.questionType === "yes_no" && (
                  <div className="flex gap-3">
                    {["Yes", "No"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(question.id, opt)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                          ans === opt
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {question.questionType === "dropdown" && (
                  <div className="space-y-2">
                    {opts.map(opt => (
                      <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        ans === opt ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}>
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={opt}
                          checked={ans === opt}
                          onChange={() => setAnswer(question.id, opt)}
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.questionType === "multi_select" && (
                  <div className="space-y-2">
                    {opts.map(opt => {
                      const selected: string[] = ans ?? [];
                      const checked = selected.includes(opt);
                      return (
                        <label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMulti(question.id, opt)}
                            className="accent-primary"
                          />
                          <span className="text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full h-11 rounded-xl font-semibold gap-2"
            style={{ background: "#2563EB" }}
          >
            {submitMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Responses"}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground pb-6">
            © {new Date().getFullYear()} AlterNatives · nativeworld.com
          </p>
        </form>
      </main>
    </div>
  );
}
