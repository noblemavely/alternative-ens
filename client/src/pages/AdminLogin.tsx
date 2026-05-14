import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
        toast.success("Login successful");
        localStorage.setItem("adminToken", result.token);
        localStorage.setItem("adminUser", JSON.stringify(result.admin));
        navigate("/admin");
      } else {
        toast.error("Login failed");
      }
    } catch (error: any) {
      const msg = error?.data?.zodError
        ? "Invalid credentials"
        : error?.message || "Failed to login";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F3F3F3" }}>
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ background: "#032D60" }}
      >
        <div>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png"
            alt="AlterNatives"
            className="h-9 w-auto object-contain brightness-0 invert"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Connect the right experts<br />to the right opportunities
          </h2>
          <p className="text-[#9FB6CD] text-sm leading-relaxed">
            The expert network management platform for modern advisory businesses.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Expert profiles", value: "Managed" },
            { label: "Client projects",  value: "Tracked"  },
            { label: "Onboarding",       value: "Automated" },
            { label: "Shortlisting",     value: "13 stages" },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.08] rounded p-3">
              <p className="text-white text-sm font-semibold">{item.value}</p>
              <p className="text-[#9FB6CD] text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png"
              alt="AlterNatives"
              className="h-9 w-auto object-contain mx-auto"
            />
          </div>

          {/* Card */}
          <div
            className="bg-white rounded border border-border p-8"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="w-10 h-10 rounded bg-[#E8F4FD] flex items-center justify-center mb-4">
                <Lock size={18} className="text-[#0176D3]" />
              </div>
              <h1 className="text-lg font-bold text-foreground">Sign in to your account</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Admin portal — authorised users only
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          {...field}
                          className="h-9 text-sm"
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
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="h-9 text-sm pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-9 text-sm font-semibold"
                  style={{ background: "#0176D3" }}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={14} />
                      Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            {/* Credentials hint */}
            <div className="mt-5 p-3 rounded bg-[#F3F3F3] border border-border">
              <p className="text-xs font-semibold text-foreground mb-1">Default credentials</p>
              <p className="text-xs text-muted-foreground">
                Email: <code className="bg-white px-1 py-0.5 rounded border border-border text-[11px]">admin@alternative.com</code>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Password: <code className="bg-white px-1 py-0.5 rounded border border-border text-[11px]">admin123</code>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} AlterNatives · Expert Network Platform
          </p>
        </div>
      </div>
    </div>
  );
}
