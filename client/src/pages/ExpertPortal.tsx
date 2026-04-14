import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Mail, CheckCircle, Loader2, Link2, Copy } from "lucide-react";
import { EmploymentHistoryForm } from "@/components/EmploymentHistoryForm";
import { EducationHistoryForm } from "@/components/EducationHistoryForm";
import FormProgressIndicator from "@/components/FormProgressIndicator";
import ResumeParserForm from "@/components/ResumeParserForm";

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
  linkedinUrl: z.string().min(1, "LinkedIn Profile URL is required"),
});

type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

export default function ExpertPortal() {
  const [step, setStep] = useState<"email" | "verification" | "profile" | "linkedin" | "experience" | "resume" | "preview">("email");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [displayCode, setDisplayCode] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [parsingLinkedin, setParsingLinkedin] = useState(false);
  const [showResumeResetDialog, setShowResumeResetDialog] = useState(false);
  const [pendingResumeData, setPendingResumeData] = useState<any>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinProfileFetched, setLinkedinProfileFetched] = useState(false);
  const [employmentHistory, setEmploymentHistory] = useState<any[]>([]);
  const [educationHistory, setEducationHistory] = useState<any[]>([]);
  const [createdExpertId, setCreatedExpertId] = useState<number | null>(null);
  const [createdExpertData, setCreatedExpertData] = useState<any>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [formSteps, setFormSteps] = useState([
    { id: "email", label: "Email", completed: false },
    { id: "verification", label: "Verification", completed: false },
    { id: "personal", label: "Personal Info", completed: false },
    { id: "linkedin", label: "LinkedIn Profile", completed: false },
    { id: "experience", label: "Experience", completed: false },
    { id: "resume", label: "Resume (Optional)", completed: false },
    { id: "preview", label: "Preview", completed: false },
  ]);
  const [currentFormStep, setCurrentFormStep] = useState("profile");

  const utils = trpc.useUtils();
  const sectorsQuery = trpc.sectors.list.useQuery();
  const sendVerificationMutation = trpc.expertVerification.sendVerificationEmail.useMutation();
  const verifyEmailMutation = trpc.expertVerification.verifyEmail.useMutation();
  const enrichLinkedinMutation = trpc.upload.enrichLinkedInProfile.useMutation();
  const linkedinCallbackMutation = trpc.linkedinOAuth.handleCallback.useMutation();
  const uploadCVMutation = trpc.upload.uploadCV.useMutation();
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
        if (profile.profileUrl) profileForm.setValue("linkedinUrl", profile.profileUrl);

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
      setStep("verification");
      toast.success("Verification code sent to your email.");
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
      toast.success("Email verified! Now fill in your personal info.");
    } catch (error) {
      toast.error("Invalid verification code");
    }
  };

  // Watch form fields for completion tracking
  const watchedFirstName = profileForm.watch("firstName");
  const watchedLastName = profileForm.watch("lastName");
  const watchedEmail = profileForm.watch("email");
  const watchedPhone = profileForm.watch("phone");
  const watchedSector = profileForm.watch("sector");
  const watchedFunction = profileForm.watch("function");
  const watchedLinkedinUrl = profileForm.watch("linkedinUrl");

  // Calculate form completion percentage
  useEffect(() => {
    if (step !== "profile") return;

    const formData = profileForm.getValues();
    let completedFields = 0;
    const totalFields = 7;

    if (formData.firstName?.trim()) completedFields++;
    if (formData.lastName?.trim()) completedFields++;
    if (formData.email?.trim()) completedFields++;
    if (formData.phone?.trim()) completedFields++;
    if (formData.sector?.trim()) completedFields++;
    if (formData.function?.trim()) completedFields++;
    if (formData.linkedinUrl?.trim()) completedFields++;

    const percentage = Math.round((completedFields / totalFields) * 100);
    setCompletionPercentage(percentage);

    // Update step completion
    const newSteps = [...formSteps];
    if (formData.firstName?.trim() && formData.lastName?.trim() && formData.email?.trim()) {
      newSteps[2].completed = true;
    }
    if (formData.linkedinUrl?.trim()) {
      newSteps[2].completed = true;
    }
    if (employmentHistory.length > 0 || educationHistory.length > 0) {
      newSteps[3].completed = true;
    }
    setFormSteps(newSteps);
  }, [
    watchedFirstName,
    watchedLastName,
    watchedEmail,
    watchedPhone,
    watchedSector,
    watchedFunction,
    watchedLinkedinUrl,
    employmentHistory,
    educationHistory,
    step,
  ]);

  // Handle parsed resume data - show reset dialog
  const handleResumeParsed = (parsedData: any, file?: File) => {
    if (!parsedData) return;

    // Store the parsed data, file, and show reset dialog
    setPendingResumeData(parsedData);
    setResumeFile(file || null);
    setShowResumeResetDialog(true);
  };

  // Handle resume reset confirmation
  const handleResumeReset = (shouldReset: boolean) => {
    if (!pendingResumeData) return;

    if (shouldReset) {
      // Clear and repopulate with resume data
      const newEmployment = (pendingResumeData.employment || []).map((emp: any) => ({
        id: `emp-${Date.now()}-${Math.random()}`,
        company: emp.companyName || "",
        position: emp.position || "",
        startDate: emp.startDate || "",
        endDate: emp.endDate || "",
        currentlyWorking: emp.isCurrent || false,
        description: emp.description || "",
      }));

      const newEducation = (pendingResumeData.education || []).map((edu: any) => ({
        id: `edu-${Date.now()}-${Math.random()}`,
        school: edu.schoolName || "",
        degree: edu.degree || "",
        field: edu.fieldOfStudy || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
      }));

      setEmploymentHistory(newEmployment);
      setEducationHistory(newEducation);
      toast.success("Resume data has been applied to your profile");
    } else {
      toast.info("Keeping your current experience entries");
    }

    setShowResumeResetDialog(false);
    setPendingResumeData(null);
    setResumeFile(null);
    setStep("preview");
  };

  const handleFetchLinkedin = async () => {
    const url = profileForm.getValues("linkedinUrl");
    if (!url.trim()) {
      toast.error("Please enter a LinkedIn URL");
      return;
    }
    setParsingLinkedin(true);
    try {
      // Use Apollo.io enrichment endpoint for LinkedIn profiles
      const result = await enrichLinkedinMutation.mutateAsync({ linkedinUrl: url });

      if (!result.success) {
        toast.error(result.message || "Failed to fetch LinkedIn profile");
        setParsingLinkedin(false);
        return;
      }

      // Populate form fields from enriched data
      if (result.firstName) profileForm.setValue("firstName", result.firstName);
      if (result.lastName) profileForm.setValue("lastName", result.lastName);
      if (result.headline) profileForm.setValue("sector", result.headline);
      if (result.email) profileForm.setValue("email", result.email);

      // Auto-populate Function/Role from headline if available
      if (result.headline) {
        profileForm.setValue("function", result.headline);
      }

      setLinkedinProfileFetched(true);
      toast.success("LinkedIn profile fetched successfully!");

      // Auto-navigate to experience step after brief delay
      setTimeout(() => {
        setStep("experience");
      }, 1500);
    } catch (error) {
      console.error("LinkedIn enrichment error:", error);
      toast.error("Failed to fetch LinkedIn profile. Make sure the URL is valid and the API is configured.");
    } finally {
      setParsingLinkedin(false);
    }
  };

  const handleCompleteProfile = async (data: ProfileFormData) => {
    try {
      // Handle CV upload if file is selected
      let cvUrl = "";
      let cvKey = "";

      if (resumeFile) {
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
            reader.readAsDataURL(resumeFile);
          });

          // Upload via tRPC endpoint
          const uploadResult = await uploadCVMutation.mutateAsync({
            fileName: resumeFile.name,
            fileData,
            contentType: resumeFile.type || "application/pdf",
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
      console.error("[handleCompleteProfile] Error:", error);
      const errorMessage = error?.message || error?.data?.zodError || JSON.stringify(error);
      if (error.message?.includes("already exists")) {
        toast.error("An expert with this email already exists");
      } else if (errorMessage?.includes("Failed to upload")) {
        toast.error("CV upload failed. Please try again.");
      } else {
        toast.error(`Failed to create profile: ${typeof errorMessage === 'string' ? errorMessage : 'Unknown error'}`);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayCode);
    toast.success("Code copied to clipboard!");
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
                  onInput={(e) => setVerificationToken((e.target as HTMLInputElement).value)}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData?.getData('text') || '';
                    setVerificationToken(pastedText);
                    e.preventDefault();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyEmail();
                    }
                  }}
                  autoFocus
                  className="mt-2 border-border"
                />
              </div>
              <Button
                onClick={handleVerifyEmail}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={verifyEmailMutation.isPending || !verificationToken.trim()}
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


        {/* Step 3: Personal Info */}
        {step === "profile" && (
          <div className="space-y-6">
            <FormProgressIndicator
              steps={formSteps}
              currentStep="personal"
              completionPercentage={0}
            />
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Personal Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <div className="space-y-4">
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

                    <Button
                      onClick={() => {
                        const firstName = profileForm.getValues("firstName");
                        const lastName = profileForm.getValues("lastName");
                        if (!firstName?.trim() || !lastName?.trim()) {
                          toast.error("Please fill in first and last name");
                          return;
                        }
                        setStep("linkedin");
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Continue
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: LinkedIn Profile */}
        {step === "linkedin" && (
          <div className="space-y-6">
            <FormProgressIndicator
              steps={formSteps}
              currentStep="linkedin"
              completionPercentage={0}
            />
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">LinkedIn Profile</CardTitle>
                <CardDescription>Connect your LinkedIn profile to auto-populate your experience</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <div className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="linkedinUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">LinkedIn Profile URL *</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://linkedin.com/in/yourprofile"
                              {...field}
                              className="border-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      onClick={() => setStep("experience")}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Continue
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Work Experience */}
        {step === "experience" && (
          <div className="space-y-6">
            <FormProgressIndicator
              steps={formSteps}
              currentStep="experience"
              completionPercentage={0}
            />
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Work Experience & Education</CardTitle>
                <CardDescription>Add your professional history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Employment History */}
                <div>
                  <EmploymentHistoryForm
                    entries={employmentHistory}
                    onAdd={(entry) => setEmploymentHistory([...employmentHistory, entry])}
                    onUpdate={(entry) => setEmploymentHistory(employmentHistory.map(e => e.id === entry.id ? entry : e))}
                    onDelete={(id) => setEmploymentHistory(employmentHistory.filter(e => e.id !== id))}
                  />
                </div>

                {/* Education History */}
                <div className="border-t border-border pt-6">
                  <EducationHistoryForm
                    entries={educationHistory}
                    onAdd={(entry) => setEducationHistory([...educationHistory, entry])}
                    onUpdate={(entry) => setEducationHistory(educationHistory.map(e => e.id === entry.id ? entry : e))}
                    onDelete={(id) => setEducationHistory(educationHistory.filter(e => e.id !== id))}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-muted-foreground">
                  Resume upload is optional. You can skip it if you've already filled in your experience above.
                </div>

                <Button
                  onClick={() => setStep("resume")}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 6: Resume Upload (Optional) */}
        {step === "resume" && (
          <div className="space-y-6">
            <FormProgressIndicator
              steps={formSteps}
              currentStep="resume"
              completionPercentage={0}
            />
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Upload Resume (Optional)</CardTitle>
                <CardDescription>Upload your resume to auto-fill your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResumeParserForm
                  onParsed={handleResumeParsed}
                  onSkip={() => setStep("preview")}
                />
                <Button
                  onClick={() => setStep("preview")}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resume Reset Dialog */}
        {showResumeResetDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="border-border w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-foreground">Apply Resume Data?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Would you like to reset and fill your experience with the parsed resume data? This will replace your current entries with the extracted information.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleResumeReset(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Keep Current
                  </Button>
                  <Button
                    onClick={() => handleResumeReset(true)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Reset & Fill
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 7: Profile Preview (Before Submission) */}
        {step === "preview" && !createdExpertData && (
          <div className="space-y-6">
            <FormProgressIndicator
              steps={formSteps}
              currentStep="preview"
              completionPercentage={100}
            />
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Review Your Profile</CardTitle>
                <CardDescription>Please review your information before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">First Name</p>
                    <p className="text-lg font-semibold text-foreground">{profileForm.getValues("firstName")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Last Name</p>
                    <p className="text-lg font-semibold text-foreground">{profileForm.getValues("lastName")}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase">Email</p>
                  <p className="text-lg font-semibold text-foreground">{profileForm.getValues("email")}</p>
                </div>

                {profileForm.getValues("phone") && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Phone</p>
                    <p className="text-lg font-semibold text-foreground">{profileForm.getValues("phone")}</p>
                  </div>
                )}

                {profileForm.getValues("linkedinUrl") && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">LinkedIn Profile</p>
                    <a href={profileForm.getValues("linkedinUrl")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {profileForm.getValues("linkedinUrl")}
                    </a>
                  </div>
                )}

                {employmentHistory.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Employment</p>
                    <div className="space-y-2">
                      {employmentHistory.map((emp) => (
                        <div key={emp.id} className="text-sm">
                          <p className="font-semibold text-foreground">{emp.position} at {emp.company}</p>
                          <p className="text-xs text-muted-foreground">{emp.startDate} - {emp.endDate || "Present"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {educationHistory.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Education</p>
                    <div className="space-y-2">
                      {educationHistory.map((edu) => (
                        <div key={edu.id} className="text-sm">
                          <p className="font-semibold text-foreground">{edu.degree} in {edu.field}</p>
                          <p className="text-xs text-muted-foreground">{edu.school} ({edu.startDate} - {edu.endDate})</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("experience")}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => profileForm.handleSubmit(handleCompleteProfile)()}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={createExpertMutation.isPending}
                  >
                    {createExpertMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Submitting...
                      </>
                    ) : (
                      "Submit Profile"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Final Success Preview */}
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
