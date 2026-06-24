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
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { EmploymentHistoryForm } from "@/components/EmploymentHistoryForm";
import { EducationHistoryForm } from "@/components/EducationHistoryForm";
import LinkedinResumeExtractor, { ExtractedProfileData } from "@/components/LinkedinResumeExtractor";
import AdminLayout from "@/components/AdminLayout";

const expertSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  sector: z.string().optional(),
  function: z.string().optional(),
  biography: z.string().optional(),
});

type ExpertFormData = z.infer<typeof expertSchema>;

interface EmploymentEntry {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
}

interface EducationEntry {
  id?: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

type FormStep = "linkedin-resume" | "basic-info" | "experience" | "confirm";

const STEPS: FormStep[] = ["linkedin-resume", "basic-info", "experience", "confirm"];

export default function AddExpert() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<FormStep>("linkedin-resume");
  const [employmentHistory, setEmploymentHistory] = useState<EmploymentEntry[]>([]);
  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedProfileData | null>(null);

  const createMutation = trpc.experts.create.useMutation();
  const sectorsQuery = trpc.sectors.list.useQuery();
  const functionsQuery = trpc.functions.list.useQuery();

  const form = useForm<ExpertFormData>({
    resolver: zodResolver(expertSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      sector: "",
      function: "",
      biography: "",
    },
  });

  // Handle extracted profile data
  const handleProfileExtracted = (data: ExtractedProfileData, source: "linkedin" | "resume") => {
    console.log(`[AddExpert] Profile extracted from ${source}:`, data);

    setExtractedData(data);

    // Auto-fill basic info
    if (data.firstName) form.setValue("firstName", data.firstName);
    if (data.lastName) form.setValue("lastName", data.lastName);
    if (data.sector) form.setValue("sector", data.sector);
    if (data.headline) form.setValue("function", data.headline);
    if (data.biography) form.setValue("biography", data.biography);

    // Auto-fill employment history
    if (data.employment && data.employment.length > 0) {
      const mappedEmployment = data.employment.map((emp, idx) => ({
        id: `emp-${idx}`,
        company: emp.companyName,
        position: emp.position,
        startDate: emp.startDate || "",
        endDate: emp.endDate,
        currentlyWorking: emp.isCurrent || false,
        description: emp.description,
      }));
      setEmploymentHistory(mappedEmployment);
    }

    // Auto-fill education history
    if (data.education && data.education.length > 0) {
      const mappedEducation = data.education.map((edu, idx) => ({
        id: `edu-${idx}`,
        school: edu.schoolName,
        degree: edu.degree || "",
        field: edu.fieldOfStudy || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate,
      }));
      setEducationHistory(mappedEducation);
    }

    // Move to next step (basic info)
    setCurrentStep("basic-info");
    toast.success(`Profile extracted from ${source}! Review and update the details.`);
  };

  const goToStep = (step: FormStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const onSubmit = async (data: ExpertFormData) => {
    try {
      await createMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        linkedinUrl: data.linkedinUrl,
        sector: data.sector,
        function: data.function,
        biography: data.biography,
      });
      toast.success("Expert created successfully");
      navigate("/admin/experts");
    } catch (error: any) {
      toast.error(error.message || "Failed to create expert");
    }
  };

  const getStepProgress = () => {
    return ((STEPS.indexOf(currentStep) + 1) / STEPS.length) * 100;
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/experts")}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Add New Expert</h1>
              <p className="text-slate-600 mt-1">Create a new expert profile</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">
                Step {STEPS.indexOf(currentStep) + 1} of {STEPS.length}
              </span>
              <span className="text-sm text-slate-500">
                {currentStep === "linkedin-resume"
                  ? "LinkedIn / Resume"
                  : currentStep === "basic-info"
                  ? "Basic Information"
                  : currentStep === "experience"
                  ? "Experience & Education"
                  : "Review & Confirm"}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Step: LinkedIn / Resume */}
          {currentStep === "linkedin-resume" && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="pt-6">
                <LinkedinResumeExtractor
                  onExtracted={handleProfileExtracted}
                  onSkip={() => setCurrentStep("basic-info")}
                />

                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/experts")}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Basic Info */}
          {currentStep === "basic-info" && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  {extractedData
                    ? "Review and update the auto-filled information"
                    : "Enter the expert's basic information"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
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
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn Profile URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sector</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select sector" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All Sectors</SelectItem>
                                {sectorsQuery.data?.map((sector) => (
                                  <SelectItem key={sector.id} value={sector.name}>
                                    {sector.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="function"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Function</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select function" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All Functions</SelectItem>
                                {functionsQuery.data?.map((func) => (
                                  <SelectItem key={func.id} value={func.name}>
                                    {func.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="biography"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biography</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Expert background and experience..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>

                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep} style={{ background: "#2563EB" }}>
                    Next: Experience & Education
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/experts")}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Experience & Education */}
          {currentStep === "experience" && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Experience & Education</CardTitle>
                <CardDescription>
                  {employmentHistory.length > 0 || educationHistory.length > 0
                    ? "Update or add more experience and education details"
                    : "Add employment and education history"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Employment History</h3>
                  <EmploymentHistoryForm
                    entries={employmentHistory}
                    onAdd={(entry) => setEmploymentHistory([...employmentHistory, entry])}
                    onUpdate={(entry) =>
                      setEmploymentHistory(employmentHistory.map((e) => (e.id === entry.id ? entry : e)))
                    }
                    onDelete={(id) => setEmploymentHistory(employmentHistory.filter((e) => e.id !== id))}
                  />
                </div>

                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Education History</h3>
                  <EducationHistoryForm
                    entries={educationHistory}
                    onAdd={(entry) => setEducationHistory([...educationHistory, entry])}
                    onUpdate={(entry) =>
                      setEducationHistory(educationHistory.map((e) => (e.id === entry.id ? entry : e)))
                    }
                    onDelete={(id) => setEducationHistory(educationHistory.filter((e) => e.id !== id))}
                  />
                </div>

                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button onClick={nextStep} style={{ background: "#2563EB" }}>
                    Next: Review & Confirm
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/experts")}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Review & Confirm */}
          {currentStep === "confirm" && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Review & Confirm</CardTitle>
                <CardDescription>Review all information before creating the expert profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Personal Information</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {form.getValues("firstName")} {form.getValues("lastName")} ({form.getValues("email")})
                    </p>
                  </div>
                  {form.getValues("phone") && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Phone</h4>
                      <p className="text-sm text-slate-600 mt-1">{form.getValues("phone")}</p>
                    </div>
                  )}
                  {form.getValues("sector") && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Sector</h4>
                      <p className="text-sm text-slate-600 mt-1">{form.getValues("sector")}</p>
                    </div>
                  )}
                  {form.getValues("function") && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Function</h4>
                      <p className="text-sm text-slate-600 mt-1">{form.getValues("function")}</p>
                    </div>
                  )}
                </div>

                {employmentHistory.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Employment ({employmentHistory.length})</h4>
                    <div className="space-y-2">
                      {employmentHistory.map((emp, idx) => (
                        <p key={idx} className="text-sm text-slate-600">
                          {emp.position} at {emp.company}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {educationHistory.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Education ({educationHistory.length})</h4>
                    <div className="space-y-2">
                      {educationHistory.map((edu, idx) => (
                        <p key={idx} className="text-sm text-slate-600">
                          {edu.degree} in {edu.field} from {edu.school}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6 border-t border-slate-200">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={createMutation.isPending}
                    className="gap-2"
                    style={{ background: "#16a34a" }}
                  >
                    <CheckCircle2 size={18} />
                    {createMutation.isPending ? "Creating..." : "Create Expert"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/experts")}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
