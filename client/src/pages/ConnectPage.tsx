import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowRight, Loader2, Clock, Users, Zap, TrendingUp } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  organization: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  queryType: z.enum(["client", "advisor", "other"], { required_error: "Please select a query type" }),
  otherQuery: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const STATS = [
  { value: "48h", label: "Avg. time to first expert call" },
  { value: "500+", label: "Vetted experts across verticals" },
  { value: "96%", label: "Match satisfaction rate" },
  { value: "12+", label: "Consumer categories covered" },
];

const FEATURES = [
  "Expert profile management & vetting",
  "48-hour turnaround from brief to call",
  "Consumer, FMCG & B2B specialists",
  "Confidential, project-based engagements",
];

function useUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource:   params.get("utm_source")   || undefined,
    utmMedium:   params.get("utm_medium")   || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent:  params.get("utm_content")  || undefined,
    utmTerm:     params.get("utm_term")     || undefined,
  };
}

export default function ConnectPage() {
  const [submitted, setSubmitted] = useState(false);
  const submitMutation = trpc.leads.submit.useMutation();
  const utm = useUtmParams();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", organization: "", email: "", queryType: undefined, otherQuery: "" },
  });

  const watchQueryType = form.watch("queryType");

  const onSubmit = async (data: FormData) => {
    try {
      await submitMutation.mutateAsync({
        name: data.name,
        organization: data.organization || undefined,
        email: data.email,
        queryType: data.queryType,
        otherQuery: data.queryType === "other" ? data.otherQuery : undefined,
        ...utm,
      });
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#0A0E27" }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-[0.12] blur-3xl" style={{ background: "#4F46E5", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 right-16 w-48 h-48 rounded-full opacity-[0.08]" style={{ background: "#6366F1" }} />
        <div className="absolute top-12 right-1/3 w-24 h-24 rounded-full opacity-[0.06]" style={{ background: "#818CF8" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              {/* Brand */}
              <div className="flex items-center gap-2 mb-8">
                <span className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase">AlterNatives</span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase">nativeworld.com</span>
              </div>

              <h1 className="text-white leading-[1.05] tracking-tight mb-6" style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 800 }}>
                Insight at the<br />right moment.
              </h1>

              <p className="text-white/50 text-lg leading-relaxed mb-8 max-w-md" style={{ fontStyle: "italic" }}>
                The experts who've run your exact category challenge already exist. The question is how quickly you can reach them — before the window shifts.
              </p>

              <ul className="space-y-3 mb-10">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <CheckCircle2 size={15} className="text-indigo-400 flex-shrink-0" />
                    <span className="text-white/60 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-white font-bold text-xl tracking-tight" style={{ fontStyle: "italic" }}>{s.value}</p>
                    <p className="text-white/40 text-xs mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — comparison card */}
            <div className="hidden lg:block">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
              >
                <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-white/40 text-xs font-bold tracking-widest uppercase mb-1">The window</p>
                  <p className="text-white text-sm font-medium">By the time most teams find the right expert, ⅔ of the decision window is already gone.</p>
                </div>
                <div className="grid grid-cols-2">
                  <div className="p-6" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-2">With AlterNatives</p>
                    <p className="text-white font-bold text-4xl tracking-tight">48h</p>
                    <p className="text-white/50 text-xs mt-2 leading-relaxed">From first message to first expert call — before the decision is made</p>
                  </div>
                  <div className="p-6">
                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-2">Personal network</p>
                    <p className="font-bold text-4xl tracking-tight" style={{ color: "#EF4444" }}>6–8<br/>weeks</p>
                    <p className="text-white/50 text-xs mt-2 leading-relaxed">By then the brief is closed, the budget is gone, and the decision is done</p>
                  </div>
                </div>
                <div className="p-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-white/40 text-xs italic leading-relaxed">
                    "The right people are out there. The problem is — by the time you find them, the moment has passed."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Form section ── */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        {submitted ? (
          /* Success state */
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">We'll be in touch soon</h2>
            <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
              Thanks for reaching out. Our team typically responds within one business day.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} />
              <span>Usually within 24 hours</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Connect with us</h2>
              <p className="text-muted-foreground">Tell us a bit about yourself and what you're looking for.</p>
            </div>

            <div
              className="rounded-2xl p-8"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }}
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Full Name <span className="text-red-400">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Smith" {...field} className="h-10 rounded-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="organization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Organization
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corp" {...field} className="h-10 rounded-lg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Email Address <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@company.com" {...field} className="h-10 rounded-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="queryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Type of Query <span className="text-red-400">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg">
                              <SelectValue placeholder="Select an option…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="client">Become an AlterNatives Client</SelectItem>
                            <SelectItem value="advisor">Become an Advisor on AlterNatives</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Conditional textarea for "Other" */}
                  {watchQueryType === "other" && (
                    <FormField
                      control={form.control}
                      name="otherQuery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Please describe your query <span className="text-red-400">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us more about what you're looking for…"
                              rows={4}
                              {...field}
                              className="rounded-lg resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full h-11 rounded-xl text-sm font-semibold gap-2 mt-2"
                    style={{ background: "#2563EB" }}
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="animate-spin" size={15} /> Submitting…</>
                    ) : (
                      <>Submit <ArrowRight size={14} /></>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    By submitting, you agree to be contacted by the AlterNatives team.
                  </p>
                </form>
              </Form>
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground">
            AlterNatives · nativeworld.com
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AlterNatives</p>
        </div>
      </footer>
    </div>
  );
}
