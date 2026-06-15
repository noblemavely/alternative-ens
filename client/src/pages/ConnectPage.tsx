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
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

declare function gtag(...args: any[]): void;

const schema = z.object({
  name:         z.string().min(1, "Name is required"),
  organization: z.string().optional(),
  email:        z.string().email("Please enter a valid email"),
  queryType:    z.enum(["client", "advisor", "other"]),
  otherQuery:   z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png";

const STATS = [
  { value: "24h",   label: "First expert call" },
  { value: "500+",  label: "Vetted experts" },
  { value: "96%",   label: "Match satisfaction" },
  { value: "12+",   label: "Consumer categories" },
];

const FEATURES = [
  "24-hour turnaround from brief to call",
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
  const [, navigate] = useLocation();
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
      // Fire GA4 conversion event
      if (typeof gtag !== "undefined") {
        gtag("event", "generate_lead", {
          event_category: "Lead Generation",
          event_label: "Connect Form Submission",
          value: 1,
        });
      }
      // Navigate to dedicated thank-you URL for GA conversion tracking
      navigate("/connect/thank-you");
    } catch (e: any) {
      toast.error(e.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left: Form panel ── */}
      <div className="flex-1 flex flex-col bg-white px-8 py-8 lg:px-12 lg:py-10 overflow-y-auto">

        {/* Logo */}
        <div className="mb-8">
          <img
            src={LOGO}
            alt="AlterNatives"
            className="h-9 w-auto object-contain"
          />
        </div>

        <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Connect with us</h1>
              <p className="text-sm text-muted-foreground">Tell us a bit about yourself and what you're looking for.</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Full Name <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Priya Sharma" {...field} className="h-9 rounded-lg" />
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
                          <Input placeholder="Reliance Industries" {...field} className="h-9 rounded-lg" />
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
                        <Input type="email" placeholder="priya@relianceindustries.com" {...field} className="h-9 rounded-lg" />
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
                          <SelectTrigger className="h-9 rounded-lg w-full min-w-0">
                            <SelectValue placeholder="Select an option…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="client">Engage with an Advisor via AlterNatives</SelectItem>
                          <SelectItem value="advisor">Become an Advisor on AlterNatives</SelectItem>
                          <SelectItem value="other">Any other query</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchQueryType === "other" && (
                  <FormField
                    control={form.control}
                    name="otherQuery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Describe your query <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us more about what you're looking for…"
                            rows={3}
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
                  className="w-full h-10 rounded-xl text-sm font-semibold gap-2"
                  style={{ background: "#2563EB" }}
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="animate-spin" size={14} /> Submitting…</>
                  ) : (
                    <>Submit <ArrowRight size={13} /></>
                  )}
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  By submitting, you agree to be contacted by the AlterNatives team.
                </p>
              </form>
            </Form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} AlterNatives · nativeworld.com
        </p>
      </div>

      {/* ── Right: Brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-shrink-0 flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "#0A0E27" }}
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.15] blur-3xl pointer-events-none" style={{ background: "#4F46E5", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-[0.08] blur-2xl pointer-events-none" style={{ background: "#818CF8", transform: "translate(-20%, 20%)" }} />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />

        <div />

        {/* Main copy */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-white font-extrabold leading-tight tracking-tight mb-3" style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)" }}>
              Insight at the<br />right moment.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed italic">
              The experts who've run your exact category challenge already exist. The question is how quickly you can reach them.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <CheckCircle2 size={13} className="text-indigo-400 flex-shrink-0" />
                <span className="text-white/60 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          {/* 48h vs 6-8 weeks */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="grid grid-cols-2">
              <div className="p-4" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-1.5">With AlterNatives</p>
                <p className="text-white font-bold text-3xl tracking-tight">24h</p>
                <p className="text-white/40 text-xs mt-1 leading-tight">First message to expert call</p>
              </div>
              <div className="p-4">
                <p className="text-white/40 text-[9px] font-bold tracking-widest uppercase mb-1.5">Personal network</p>
                <p className="font-bold text-3xl tracking-tight" style={{ color: "#EF4444" }}>6–8w</p>
                <p className="text-white/40 text-xs mt-1 leading-tight">Brief closed before you find anyone</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-white font-bold text-lg tracking-tight italic">{s.value}</p>
                <p className="text-white/40 text-[11px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="relative mt-4">
          <p className="text-white/30 text-xs italic leading-relaxed border-l-2 border-white/10 pl-3">
            "The right people are out there. The problem is — by the time you find them, the moment has passed."
          </p>
        </div>
      </div>
    </div>
  );
}
