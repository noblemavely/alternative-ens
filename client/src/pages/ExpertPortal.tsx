import { useState } from "react";
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
import { Mail, CheckCircle, Loader2, Link2, Copy, Linkedin } from "lucide-react";
import { EmploymentHistoryForm } from "@/components/EmploymentHistoryForm";
import { EducationHistoryForm } from "@/components/EducationHistoryForm";

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
  const [displayCode, setDisplayCode] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [parsingLinkedin, setParsingLinkedin] = useState(false);
  const [employmentHistory, setEmploymentHistory] = useState<any[]>([]);
  const [educationHistory, setEducationHistory] = useState<any[]>([]);

  const sendVerificationMutation = trpc.expertVerification.sendVerificationEmail.useMutation();
  const verifyEmailMutation = trpc.expertVerification.verifyEmail.useMutation();
  const parseLinkedinMutation = trpc.linkedin.parseProfile.useMutation();
  const linkedinCallbackMutation = trpc.linkedinOAuth.handleCallback.useMutation();
  const createExpertMutation = trpc.experts.create.useMutation();

  const handleLinkedInCallback = async (code: string) => {
    try {
      const result = await linkedinCallbackMutation.mutateAsync({
        code,
        redirectUri: window.location.origin + "/expert/register",
      });
      if (result.profile) {
        profileForm.setValue("firstName", result.profile.firstName);
        profileForm.setValue("lastName", result.profile.lastName);
        if (result.profile.email) profileForm.setValue("email", result.profile.email);
        if (result.profile.headline) profileForm.setValue("sector", result.profile.headline);
        if (result.profile.skills && result.profile.skills.length > 0) {
          profileForm.setValue("function", result.profile.skills[0]);
        }
        setEmploymentHistory(result.profile.employmentHistory);
        setEducationHistory(result.profile.educationHistory);
        toast.success("LinkedIn profile loaded successfully!");
      }
    } catch (error) {
      toast.error("Failed to load LinkedIn profile");
    }
  };

  // Handle LinkedIn OAuth callback - will be implemented in next phase

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
      const result = await sendVerificationMutation.mutateAsync({ email: data.email });
      setVerificationEmail(data.email);
      setDisplayCode("123456");
      setStep("verification");
      toast.success("Verification code sent! Check below for testing.");
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
      
      // Log employment and education history for backend integration
      if (employmentHistory.length > 0) {
        console.log("Employment history to save:", employmentHistory);
      }
      if (educationHistory.length > 0) {
        console.log("Education history to save:", educationHistory);
      }
      setStep("email");
      emailForm.reset();
      profileForm.reset();
      setVerificationEmail("");
      setVerificationToken("");
      setDisplayCode("");
      setEmploymentHistory([]);
      setEducationHistory([]);
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        toast.error("An expert with this email already exists");
      } else {
        toast.error("Failed to create profile");
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayCode);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Alternative</h1>
          <p className="text-sm text-slate-600">Expert Network Service</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step 1: Email Verification */}
        {step === "email" && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Mail size={24} className="text-slate-700" />
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
                        <FormLabel className="text-slate-900">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            {...field}
                            className="border-slate-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-slate-800" 
                    disabled={sendVerificationMutation.isPending}
                  >
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
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <CheckCircle size={24} className="text-green-600" />
                Enter Verification Code
              </CardTitle>
              <CardDescription>Enter the verification code sent to {verificationEmail}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Display Code for Testing */}
              {displayCode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Test Verification Code:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-blue-300 rounded px-3 py-2 font-mono text-sm text-slate-900 break-all">
                      {displayCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="flex-shrink-0"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">Copy and paste this code below to verify your email</p>
                </div>
              )}

              {/* Verification Code Input */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Verification Code</label>
                <Input
                  placeholder="Paste the code here"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="border-slate-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={handleVerifyEmail} 
                  className="w-full bg-slate-900 hover:bg-slate-800" 
                  disabled={verifyEmailMutation.isPending}
                >
                  {verifyEmailMutation.isPending ? "Verifying..." : "Verify Code"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-300" 
                  onClick={() => {
                    setStep("email");
                    setDisplayCode("");
      setEmploymentHistory([]);
      setEducationHistory([]);
                    setVerificationToken("");
                  }}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete Profile */}
        {step === "profile" && (
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Complete Your Profile</CardTitle>
              <CardDescription>Fill in your professional information</CardDescription>
            </CardHeader>
            <CardContent>
              {/* LinkedIn Parser */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-3 mb-6">
                <label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <Link2 size={16} />
                  Parse from LinkedIn (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="border-slate-300"
                  />
                  <Button
                    onClick={handleParseLinkedin}
                    variant="outline"
                    disabled={parsingLinkedin}
                    className="gap-2 border-slate-300"
                  >
                    {parsingLinkedin ? <Loader2 size={16} className="animate-spin" /> : "Parse"}
                  </Button>
                </div>
                <p className="text-xs text-slate-600">Enter your LinkedIn URL to auto-populate fields</p>
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
                          <FormLabel className="text-slate-900">First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} className="border-slate-300" />
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
                          <FormLabel className="text-slate-900">Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} className="border-slate-300" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900">Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled className="border-slate-300 bg-slate-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900">Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} className="border-slate-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900">Sector</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Technology, Finance, Healthcare" {...field} className="border-slate-300" />
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
                        <FormLabel className="text-slate-900">Function / Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Product Manager, Data Scientist" {...field} className="border-slate-300" />
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
                        <FormLabel className="text-slate-900">LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/username" {...field} className="border-slate-300" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="biography"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-900">Biography</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your professional background and expertise..." 
                            {...field} 
                            className="border-slate-300 resize-none"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-slate-900 hover:bg-slate-800" 
                    disabled={createExpertMutation.isPending}
                  >
                    {createExpertMutation.isPending ? "Creating Profile..." : "Complete Profile"}
                  </Button>
                </form>
              </Form>

              {/* Employment History */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <EmploymentHistoryForm
                  entries={employmentHistory}
                  onAdd={(entry) => setEmploymentHistory([...employmentHistory, { ...entry, id: Date.now().toString() }])}
                  onUpdate={(entry) => setEmploymentHistory(employmentHistory.map(e => e.id === entry.id ? entry : e))}
                  onDelete={(id) => setEmploymentHistory(employmentHistory.filter(e => e.id !== id))}
                />
              </div>

              {/* Education History */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <EducationHistoryForm
                  entries={educationHistory}
                  onAdd={(entry) => setEducationHistory([...educationHistory, { ...entry, id: Date.now().toString() }])}
                  onUpdate={(entry) => setEducationHistory(educationHistory.map(e => e.id === entry.id ? entry : e))}
                  onDelete={(id) => setEducationHistory(educationHistory.filter(e => e.id !== id))}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
