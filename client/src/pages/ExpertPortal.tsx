import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [step, setStep] = useState<"email" | "verification" | "profile" | "preview">("email");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [parsingLinkedin, setParsingLinkedin] = useState(false);
  const [employmentHistory, setEmploymentHistory] = useState<any[]>([]);
  const [educationHistory, setEducationHistory] = useState<any[]>([]);
  const [createdExpertId, setCreatedExpertId] = useState<number | null>(null);
  const [createdExpertData, setCreatedExpertData] = useState<any>(null);

  const utils = trpc.useUtils();
  const sectorsQuery = trpc.sectors.list.useQuery();
  const sendVerificationMutation = trpc.expertVerification.sendVerificationEmail.useMutation();
  const verifyEmailMutation = trpc.expertVerification.verifyEmail.useMutation();
  const parseLinkedinMutation = trpc.linkedin.parseProfile.useMutation();
  const linkedinCallbackMutation = trpc.linkedinOAuth.handleCallback.useMutation();
  const createExpertMutation = trpc.experts.submitProfile.useMutation({
    onSuccess: () => {
      utils.experts.list.invalidate();
    },
  });

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

  // Handle LinkedIn OAuth callback from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedinProfile = params.get("linkedin_profile");
    const linkedinError = params.get("linkedin_error");

    if (linkedinError) {
      const errorDesc = params.get("error_description") || linkedinError;
      toast.error(`LinkedIn connection failed: ${errorDesc}`);
      // Clean up URL
      window.history.replaceState({}, document.title, "/expert/register");
      return;
    }

    if (linkedinProfile) {
      try {
        const profile = JSON.parse(decodeURIComponent(linkedinProfile));
        
        // Auto-populate form fields with LinkedIn data
        profileForm.setValue("firstName", profile.firstName || "");
        profileForm.setValue("lastName", profile.lastName || "");
        if (profile.email) profileForm.setValue("email", profile.email);
        if (profile.headline) profileForm.setValue("sector", profile.headline);
        if (profile.skills && profile.skills.length > 0) {
          profileForm.setValue("function", profile.skills[0]);
        }
        
        // Store employment and education history
        if (profile.employmentHistory) {
          setEmploymentHistory(
            profile.employmentHistory.map((emp: any) => ({
              companyName: emp.company || "",
              position: emp.position || "",
              startDate: emp.startDate || "",
              endDate: emp.endDate || "",
              isCurrent: emp.current || false,
              description: emp.description || "",
            }))
          );
        }
        
        if (profile.educationHistory) {
          setEducationHistory(
            profile.educationHistory.map((edu: any) => ({
              schoolName: edu.school || "",
              degree: edu.degree || "",
              fieldOfStudy: edu.fieldOfStudy || "",
              startDate: edu.startDate || "",
              endDate: edu.endDate || "",
            }))
          );
        }
        
        toast.success("LinkedIn profile loaded successfully!");
        
        // Clean up URL
        window.history.replaceState({}, document.title, "/expert/register");
      } catch (error) {
        console.error("Failed to parse LinkedIn profile from URL:", error);
        toast.error("Failed to parse LinkedIn profile");
        window.history.replaceState({}, document.title, "/expert/register");
      }
    }
  }, [profileForm]);

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
      
      // Populate employment history from simulated parser
      if (profile.employment && profile.employment.length > 0) {
        setEmploymentHistory(
          profile.employment.map((emp: any) => ({
            id: `emp-${Date.now()}-${Math.random()}`,
            company: emp.companyName || "",
            position: emp.position || "",
            startDate: emp.startDate || "",
            endDate: emp.endDate || "",
            currentlyWorking: emp.isCurrent || false,
            description: emp.description || "",
          }))
        );
      }
      
      // Populate education history from simulated parser
      if (profile.education && profile.education.length > 0) {
        setEducationHistory(
          profile.education.map((edu: any) => ({
            id: `edu-${Date.now()}-${Math.random()}`,
            school: edu.schoolName || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.fieldOfStudy || "",
            startDate: edu.startDate || "",
            endDate: edu.endDate || "",
          }))
        );
      }
      
      toast.success("LinkedIn profile parsed successfully with employment and education history!");
    } catch (error) {
      toast.error("Failed to parse LinkedIn profile");
    } finally {
      setParsingLinkedin(false);
    }
  };

  const handleCompleteProfile = async (data: ProfileFormData) => {
    try {
      // Handle CV upload if file is selected
      let cvUrl = "";
      let cvKey = "";
      const cvInput = document.getElementById("cv-upload") as HTMLInputElement;

      if (cvInput?.files?.[0]) {
        const file = cvInput.files[0];
        try {
          // Show uploading toast
          toast.loading("Uploading CV file...");

          // Read file as base64
          const fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              // Extract just the base64 part (remove data:application/pdf;base64, prefix)
              resolve(base64.split(",")[1] || base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Upload via tRPC endpoint
          const uploadResult = await trpc.upload.uploadCV.mutateAsync({
            fileName: file.name,
            fileData,
            contentType: file.type || "application/pdf",
          });

          cvUrl = uploadResult.url;
          cvKey = uploadResult.key;
          console.log("CV uploaded successfully:", { url: cvUrl, key: cvKey });
          toast.dismiss();
          toast.success("CV uploaded successfully!");
        } catch (error) {
          console.error("Error uploading CV:", error);
          toast.dismiss();
          toast.error("Failed to upload CV file");
          throw error;
        }
      }

      await createExpertMutation.mutateAsync({
        ...data,
        cvUrl: cvUrl || "",
        cvKey: cvKey || "",
      });
      toast.success("Profile created successfully!");

      // Store created expert data and redirect to preview
      setCreatedExpertData(data);
      setStep("preview");
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

  const handleLinkedInConnect = async () => {
    try {
      // Get the auth URL from backend (which has correct scopes)
      const redirectUri = `${window.location.origin}/api/linkedin/callback`;
      const utils = trpc.useUtils();
      const result = await utils.linkedinOAuth.getAuthUrl.fetch({ redirectUri });
      if (result.authUrl) {
        window.location.href = result.authUrl;
      }
    } catch (error) {
      toast.error("Failed to connect with LinkedIn");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663387762142/GGrdr6YE4DiKCgcDQKRagu/Alternative_Logo_White_Background-removebg-preview_9d4821e4.png" 
              alt="AlterNatives" 
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">Expert Network Service</p>
            <span className="text-xs text-muted-foreground">Powered by Native</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step 1: Email Verification */}
        {step === "email" && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Mail size={24} className="text-primary" />
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
                        <FormLabel className="text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            {...field}
                            className="border-border"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={sendVerificationMutation.isPending}
                  >
                    {sendVerificationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
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
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle size={24} className="text-green-600" />
                Enter Verification Code
              </CardTitle>
              <CardDescription>We sent a code to {verificationEmail}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayCode && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Testing Code:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold text-foreground">{displayCode}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="border-blue-300"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter the code"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="mt-2 border-border"
                />
              </div>
              <Button 
                onClick={handleVerifyEmail}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={verifyEmailMutation.isPending}
              >
                {verifyEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete Profile */}
        {step === "profile" && (
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Complete Your Profile</CardTitle>
              <CardDescription>Add your professional information</CardDescription>
            </CardHeader>
            <CardContent>
              {/* LinkedIn Connect Button */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3 mb-6">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Linkedin size={16} className="text-blue-600" />
                  Connect with LinkedIn (Optional)
                </label>
                <Button
                  onClick={handleLinkedInConnect}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Linkedin size={16} />
                  Connect with LinkedIn
                </Button>
                <p className="text-xs text-muted-foreground">Auto-populate your profile with LinkedIn data</p>
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
                          <FormLabel className="text-foreground">First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} className="border-border" />
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
                          <FormLabel className="text-foreground">Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Smith" {...field} className="border-border" />
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
                        <FormLabel className="text-foreground">Email *</FormLabel>
                        <FormControl>
                          <Input type="email" disabled {...field} className="border-border bg-secondary" />
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
                        <FormLabel className="text-foreground">Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} className="border-border" />
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
                        <FormLabel className="text-foreground">Sector / Industry</FormLabel>
                        <FormControl>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger className="border-border">
                              <SelectValue placeholder="Select your sector" />
                            </SelectTrigger>
                            <SelectContent>
                              {sectorsQuery.isLoading ? (
                                <SelectItem value="loading" disabled>Loading sectors...</SelectItem>
                              ) : sectorsQuery.data && sectorsQuery.data.length > 0 ? (
                                sectorsQuery.data.map((sector: any) => (
                                  <SelectItem key={sector.id} value={sector.name}>
                                    {sector.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>No sectors available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
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
                        <FormLabel className="text-foreground">Function / Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., VP of Product, Senior Engineer" {...field} className="border-border" />
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
                        <FormLabel className="text-foreground">Biography</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about yourself..." {...field} className="border-border min-h-24" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Manual LinkedIn URL Parsing */}
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Link2 size={16} className="text-amber-600" />
                      Parse LinkedIn Profile (Optional)
                    </label>
                    <p className="text-xs text-muted-foreground">Enter your LinkedIn URL to auto-populate employment and education history</p>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="border-amber-300 flex-1"
                      />
                      <Button
                        onClick={handleParseLinkedin}
                        disabled={parsingLinkedin}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {parsingLinkedin ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            Parsing...
                          </>
                        ) : (
                          "Parse"
                        )}
                      </Button>
                    </div>
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">LinkedIn URL (Auto-filled)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/yourprofile" {...field} className="border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Employment History */}
                  <div className="border-t border-border pt-4">
                    <EmploymentHistoryForm 
                      entries={employmentHistory}
                      onAdd={(entry) => setEmploymentHistory([...employmentHistory, entry])}
                      onUpdate={(entry) => setEmploymentHistory(employmentHistory.map(e => e.id === entry.id ? entry : e))}
                      onDelete={(id) => setEmploymentHistory(employmentHistory.filter(e => e.id !== id))}
                    />
                  </div>

                  {/* Education History */}
                  <div className="border-t border-border pt-4">
                    <EducationHistoryForm 
                      entries={educationHistory}
                      onAdd={(entry) => setEducationHistory([...educationHistory, entry])}
                      onUpdate={(entry) => setEducationHistory(educationHistory.map(e => e.id === entry.id ? entry : e))}
                      onDelete={(id) => setEducationHistory(educationHistory.filter(e => e.id !== id))}
                    />
                  </div>

                  {/* CV Upload */}
                  <div className="border-t border-border pt-4">
                    <label className="text-sm font-medium text-foreground block mb-2">Upload CV (Optional)</label>
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-foreground hover:file:bg-secondary/80"
                    />
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX (max 10MB)</p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={createExpertMutation.isPending}
                  >
                    {createExpertMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Creating Profile...
                      </>
                    ) : (
                      "Complete Profile"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === "preview" && createdExpertData && (
          <Card className="w-full max-w-2xl mx-auto border-border">
            <CardHeader className="bg-primary/5 border-b border-border">
              <CardTitle className="text-foreground">Profile Preview</CardTitle>
              <CardDescription>Your expert profile has been created successfully!</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="text-lg font-semibold text-foreground">{createdExpertData.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="text-lg font-semibold text-foreground">{createdExpertData.lastName}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-lg font-semibold text-foreground">{createdExpertData.email}</p>
                </div>

                {createdExpertData.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-lg font-semibold text-foreground">{createdExpertData.phone}</p>
                  </div>
                )}

                {createdExpertData.sector && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <p className="text-lg font-semibold text-foreground">{createdExpertData.sector}</p>
                  </div>
                )}

                {createdExpertData.function && (
                  <div>
                    <p className="text-sm text-muted-foreground">Function</p>
                    <p className="text-lg font-semibold text-foreground">{createdExpertData.function}</p>
                  </div>
                )}

                {createdExpertData.biography && (
                  <div>
                    <p className="text-sm text-muted-foreground">Biography</p>
                    <p className="text-foreground whitespace-pre-wrap">{createdExpertData.biography}</p>
                  </div>
                )}

                {createdExpertData.linkedinUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground">LinkedIn Profile</p>
                    <a href={createdExpertData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {createdExpertData.linkedinUrl}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <Button 
                  onClick={() => window.location.href = "/"}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
