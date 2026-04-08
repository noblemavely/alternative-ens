import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, CheckCircle, Loader2, Link2 } from "lucide-react";

const emailVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  sector: z.string().optional(),
  function: z.string().optional(),
  biography: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

export default function ExpertPortal() {
  const [step, setStep] = useState<"email" | "verification" | "profile">("email");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [parsingLinkedin, setParsingLinkedin] = useState(false);

  const sendVerificationMutation = trpc.expertVerification.sendVerificationEmail.useMutation();
  const verifyEmailMutation = trpc.expertVerification.verifyEmail.useMutation();
  const parseLinkedinMutation = trpc.linkedin.parseProfile.useMutation();
  const createExpertMutation = trpc.experts.create.useMutation();

  const emailForm = useForm<EmailVerificationData>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { email: "" },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: verificationEmail,
      phone: "",
      sector: "",
      function: "",
      biography: "",
      linkedinUrl: "",
    },
  });

  const handleSendVerification = async (data: EmailVerificationData) => {
    try {
      await sendVerificationMutation.mutateAsync({ email: data.email });
      setVerificationEmail(data.email);
      setStep("verification");
      toast.success("Verification email sent! Check your inbox.");
    } catch (error) {
      toast.error("Failed to send verification email");
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationToken.trim()) {
      toast.error("Please enter the verification code");
      return;
    }
    try {
      await verifyEmailMutation.mutateAsync({ token: verificationToken });
      profileForm.setValue("email", verificationEmail);
      setStep("profile");
      toast.success("Email verified! Now complete your profile.");
    } catch (error) {
      toast.error("Invalid verification code");
    }
  };

  const handleParseLinkedin = async () => {
    if (!linkedinUrl.trim()) {
      toast.error("Please enter a LinkedIn URL");
      return;
    }
    setParsingLinkedin(true);
    try {
      const profile = await parseLinkedinMutation.mutateAsync({ url: linkedinUrl });
      profileForm.setValue("firstName", profile.firstName || "");
      profileForm.setValue("lastName", profile.lastName || "");
      profileForm.setValue("sector", profile.sector || "");
      profileForm.setValue("function", profile.headline || "");
      profileForm.setValue("biography", profile.biography || "");
      profileForm.setValue("linkedinUrl", linkedinUrl);
      toast.success("LinkedIn profile parsed successfully!");
    } catch (error) {
      toast.error("Failed to parse LinkedIn profile");
    } finally {
      setParsingLinkedin(false);
    }
  };

  const handleCompleteProfile = async (data: ProfileFormData) => {
    try {
      await createExpertMutation.mutateAsync({
        ...data,
      });
      toast.success("Profile created successfully!");
      setStep("email");
      emailForm.reset();
      profileForm.reset();
      setVerificationEmail("");
      setVerificationToken("");
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        toast.error("An expert with this email already exists");
      } else {
        toast.error("Failed to create profile");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-accent">Alternative</h1>
          <p className="text-muted mt-1">Expert Network Service</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Email Verification */}
          {step === "email" && (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail size={24} />
                  Verify Your Email
                </CardTitle>
                <CardDescription>Enter your email to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(handleSendVerification)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={sendVerificationMutation.isPending}>
                      {sendVerificationMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Email Verification Code */}
          {step === "verification" && (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={24} />
                  Verify Code
                </CardTitle>
                <CardDescription>Enter the verification code sent to {verificationEmail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="form-label">Verification Code</label>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                  />
                </div>
                <Button onClick={handleVerifyEmail} className="w-full" disabled={verifyEmailMutation.isPending}>
                  {verifyEmailMutation.isPending ? "Verifying..." : "Verify Code"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setStep("email")}>
                  Back
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Complete Profile */}
          {step === "profile" && (
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>Fill in your professional information</CardDescription>
              </CardHeader>
              <CardContent>
                {/* LinkedIn Parser */}
                <div className="bg-muted p-4 rounded-lg space-y-3 mb-6">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Link2 size={16} />
                    Parse from LinkedIn
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                    <Button
                      onClick={handleParseLinkedin}
                      variant="outline"
                      disabled={parsingLinkedin}
                      className="gap-2"
                    >
                      {parsingLinkedin ? <Loader2 size={16} className="animate-spin" /> : "Parse"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted">Enter your LinkedIn URL to auto-populate fields</p>
                </div>

                {/* Profile Form */}
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleCompleteProfile)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="sector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sector</FormLabel>
                            <FormControl>
                              <Input placeholder="Technology" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="function"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Function</FormLabel>
                            <FormControl>
                              <Input placeholder="Product Manager" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="biography"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your professional background and expertise..."
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createExpertMutation.isPending}>
                      {createExpertMutation.isPending ? "Creating Profile..." : "Complete Profile"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
