import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email:    z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginFormData = z.infer<typeof loginSchema>;

const FEATURES = [
  "Expert profile management & onboarding",
  "Client project tracking & shortlisting",
  "13-stage pipeline workflow",
  "CV parsing & LinkedIn enrichment",
];

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = trpc.adminAuth.login.useMutation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginMutation.mutateAsync({ email: data.email, password: data.password });
      if (result.success) {
        toast.success("Welcome back!");
        localStorage.setItem("adminToken", result.token);
        localStorage.setItem("adminUser", JSON.stringify(result.admin));
        navigate("/admin");
      } else {
        toast.error("Login failed");
      }
    } catch (error: any) {
      const msg = error?.data?.zodError ? "Invalid credentials" : error?.message || "Failed to login";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F8FAFC" }}>

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[400px] xl:w-[480px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "#0F172A" }}
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "#2563EB", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl"
          style={{ background: "#7C3AED", transform: "translate(-30%, 30%)" }}
        />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8l4 4-4 4" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-none tracking-tight">AlterNatives</p>
              <p className="text-white/40 text-[10px] font-semibold tracking-widest mt-0.5">EXPERT NETWORK</p>
            </div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative space-y-5">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
              The modern platform for<br />expert networks
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mt-3">
              Connect the right experts to the right opportunities — at scale.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/60 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-white/25 text-xs">
            © {new Date().getFullYear()} AlterNatives · All rights reserved
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8M12 8l4 4-4 4" />
              </svg>
            </div>
            <p className="font-bold text-foreground">AlterNatives</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Admin portal — authorised users only
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[12px] font-semibold text-foreground/80 uppercase tracking-wide">
                      Email address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@example.com"
                        {...field}
                        className="h-10 rounded-lg border-border bg-white text-sm focus-visible:ring-primary/30 focus-visible:border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[12px] font-semibold text-foreground/80 uppercase tracking-wide">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          className="h-10 rounded-lg border-border bg-white text-sm pr-10 focus-visible:ring-primary/30 focus-visible:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 rounded-lg text-sm font-semibold mt-2 gap-2"
                style={{ background: "#2563EB" }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="animate-spin" size={15} /> Signing in…</>
                ) : (
                  <>Sign in <ArrowRight size={14} /></>
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} AlterNatives · Expert Network Platform
          </p>
        </div>
      </div>
    </div>
  );
}
