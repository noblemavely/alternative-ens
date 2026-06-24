import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface ExtractedProfileData {
  firstName?: string;
  lastName?: string;
  headline?: string;
  sector?: string;
  biography?: string;
  skills?: string[];
  employment?: Array<{
    companyName: string;
    position: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }>;
  education?: Array<{
    schoolName: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

interface LinkedinResumeExtractorProps {
  onExtracted: (data: ExtractedProfileData, source: "linkedin" | "resume") => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export default function LinkedinResumeExtractor({
  onExtracted,
  onSkip,
  isLoading = false,
}: LinkedinResumeExtractorProps) {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"linkedin" | "resume">("linkedin");

  const extractMutation = trpc.experts.extractProfile.useMutation();

  // ========== LinkedIn URL Handler ==========
  const handleExtractLinkedIn = async () => {
    if (!linkedinUrl.trim()) {
      toast.error("Please enter a LinkedIn profile URL");
      return;
    }

    // Validate LinkedIn URL format
    if (
      !linkedinUrl.includes("linkedin.com/in/") &&
      !linkedinUrl.includes("linkedin.com/company/")
    ) {
      toast.error(
        "Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)"
      );
      return;
    }

    try {
      toast.loading("Extracting profile data from LinkedIn...");
      const result = await extractMutation.mutateAsync({
        linkedinUrl: linkedinUrl.trim(),
      });
      toast.dismiss();

      if (result) {
        toast.success("Profile extracted successfully!");
        onExtracted(result, "linkedin");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.message || "Failed to extract LinkedIn profile. Please try again.");
    }
  };

  // ========== Resume File Handler ==========
  const handleResumeSelect = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.includes("pdf") && !selectedFile.name.endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setResumeFile(selectedFile);
    await parseResume(selectedFile);
  };

  const parseResume = async (file: File) => {
    try {
      toast.loading("Reading PDF file...");

      // Read PDF file and convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
      const base64 = btoa(binary);

      toast.loading("Parsing resume and extracting data...");

      try {
        // Send to Claude API for extraction (directly with base64)
        // The server will handle converting base64 to text
        const result = await extractMutation.mutateAsync({
          resumeText: `[PDF_BASE64]${base64}`,
        });
        toast.dismiss();

        if (result) {
          toast.success("Resume parsed successfully!");
          onExtracted(result, "resume");
        }
      } catch (error: any) {
        toast.dismiss();
        console.error("Resume parsing error:", error);
        toast.error(error?.message || "Failed to parse resume. Please try again or fill manually.");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Resume read error:", error);
      toast.error("Failed to read file");
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleResumeSelect(files[0]);
    }
  };

  const isLoading_ = isLoading || extractMutation.isPending;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap size={20} className="text-blue-600" />
          Connect to AlterNatives
        </CardTitle>
        <CardDescription>
          Connect your LinkedIn profile to your AlterNative expert profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "linkedin" | "resume")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="linkedin">LinkedIn Profile</TabsTrigger>
            <TabsTrigger value="resume">Resume/CV</TabsTrigger>
          </TabsList>

          {/* ========== LinkedIn Tab ========== */}
          <TabsContent value="linkedin" className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Paste your LinkedIn profile URL to auto-fill your details (e.g.,
                https://linkedin.com/in/yourname)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Input
                placeholder="https://linkedin.com/in/your-profile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                disabled={isLoading_}
                className="rounded-lg"
              />

              <Button
                onClick={handleExtractLinkedIn}
                disabled={isLoading_ || !linkedinUrl.trim()}
                className="w-full rounded-lg"
                style={{ background: "#2563EB" }}
              >
                {isLoading_ ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Extracting Profile...
                  </>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" />
                    Extract from LinkedIn
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg">
              <p className="font-semibold mb-1">ℹ️ How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>We use AI to extract your professional information</li>
                <li>Fields like experience, education, and skills are auto-filled</li>
                <li>You can still edit any extracted information</li>
              </ul>
            </div>
          </TabsContent>

          {/* ========== Resume Tab ========== */}
          <TabsContent value="resume" className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Upload your resume (PDF) to auto-fill your professional details
              </AlertDescription>
            </Alert>

            <div
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50"
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleResumeSelect(e.target.files?.[0] || null)}
                disabled={isLoading_}
              />

              <div className="space-y-3">
                <div className="flex justify-center">
                  {resumeFile ? (
                    <CheckCircle size={40} className="text-green-600" />
                  ) : (
                    <Upload size={40} className="text-slate-400" />
                  )}
                </div>

                {resumeFile ? (
                  <>
                    <p className="font-semibold text-slate-900">{resumeFile.name}</p>
                    <p className="text-xs text-slate-600">File selected and ready for parsing</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setResumeFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      disabled={isLoading_}
                    >
                      Choose Different File
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-900">Drop your resume here</p>
                    <p className="text-sm text-slate-600">or</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading_}
                    >
                      <FileText size={16} className="mr-2" />
                      Browse Files
                    </Button>
                    <p className="text-xs text-slate-500">PDF files only, max 10MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg">
              <p className="font-semibold mb-1">ℹ️ Supported formats:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>PDF format only</li>
                <li>Maximum file size: 10MB</li>
                <li>AI extracts experience, education, and skills</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Skip Option */}
        {onSkip && (
          <div className="pt-4 border-t border-slate-200 mt-6">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-slate-600"
              onClick={onSkip}
              disabled={isLoading_}
            >
              Skip & Fill Manually
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
