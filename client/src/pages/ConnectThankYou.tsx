import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png";

declare function gtag(...args: any[]): void;

export default function ConnectThankYou() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Fire GA4 conversion event on page load
    if (typeof gtag !== "undefined") {
      gtag("event", "generate_lead", {
        event_category: "Lead Generation",
        event_label: "Connect Form Submission",
        value: 1,
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: "#F8FAFC" }}>
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <img src={LOGO} alt="AlterNatives" className="h-8 w-auto object-contain" />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>

        {/* Copy */}
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
          We'll be in touch soon
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
          Thanks for reaching out. Our team reviews every submission and typically responds within one business day.
        </p>

        {/* Response time */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border text-xs text-muted-foreground">
          <Clock size={12} />
          Usually within 24 hours
        </div>

        {/* Back link */}
        <div className="mt-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/connect")}
            className="gap-1.5 text-xs rounded-lg"
          >
            <ArrowRight size={12} className="rotate-180" />
            Back to form
          </Button>
        </div>

        <p className="mt-10 text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} AlterNatives · nativeworld.com
        </p>
      </div>
    </div>
  );
}
