import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ParsedData {
  employment: Array<{
    companyName: string;
    position: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
  }>;
  education: Array<{
    schoolName: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    description?: string;
  }>;
}

interface ResumeParserFormProps {
  onParsed: (data: ParsedData, file?: File) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export default function ResumeParserForm({ onParsed, onSkip, isLoading = false }: ResumeParserFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseResumeMutation = trpc.upload.parseResume.useMutation();

  const handleFileSelect = async (selectedFile: File | null) => {
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

    setFile(selectedFile);
    await parseFile(selectedFile);
  };

  const parseFile = async (fileToParse: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const fileData = base64.split(",")[1] || base64;

        try {
          toast.loading("Parsing resume...");
          const result = await parseResumeMutation.mutateAsync({ fileData });
          toast.dismiss();

          if (result.employment.length > 0 || result.education.length > 0) {
            setParsedData(result as ParsedData);
            toast.success("Resume parsed successfully!");
          } else {
            toast.warning(
              "No employment or education data found. You can still fill in details manually."
            );
          }
        } catch (error) {
          toast.dismiss();
          toast.error("Failed to parse resume. Please try again or fill manually.");
        }
      };
      reader.readAsDataURL(fileToParse);
    } catch (error) {
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
      handleFileSelect(files[0]);
    }
  };

  const handleApplyParsedData = () => {
    if (parsedData) {
      onParsed(parsedData, file || undefined);
      toast.success("Resume data applied to your profile!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!file ? (
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardContent className="pt-6">
            <div className="text-center space-y-4 py-8">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium text-foreground">Upload your resume</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop your PDF here or click to browse
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={parseResumeMutation.isPending || isLoading}
              >
                {parseResumeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">PDF files up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* File Selected */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Parsed Data Preview */}
          {parsedData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Extracted Information</CardTitle>
                <CardDescription>
                  We found {parsedData.employment.length} work experience and{" "}
                  {parsedData.education.length} education entries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Employment */}
                {parsedData.employment.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Work Experience</h4>
                    <div className="space-y-2">
                      {parsedData.employment.map((emp, idx) => (
                        <Alert key={idx} className="bg-blue-50 border-blue-200">
                          <AlertDescription className="text-sm">
                            <p className="font-medium text-foreground">
                              {emp.position} at {emp.companyName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {emp.startDate} {emp.endDate ? `- ${emp.endDate}` : "- Present"}
                            </p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsedData.education.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Education</h4>
                    <div className="space-y-2">
                      {parsedData.education.map((edu, idx) => (
                        <Alert key={idx} className="bg-purple-50 border-purple-200">
                          <AlertDescription className="text-sm">
                            <p className="font-medium text-foreground">
                              {edu.degree} in {edu.fieldOfStudy}
                            </p>
                            <p className="text-xs text-muted-foreground">{edu.schoolName}</p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {parsedData.employment.length === 0 && parsedData.education.length === 0 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm text-amber-800">
                      No employment or education data was extracted. You can still fill in details
                      manually.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleApplyParsedData}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    Apply Data
                  </Button>
                  {onSkip && (
                    <Button
                      onClick={onSkip}
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Continue
                    </Button>
                  )}
                </div>

                <Button
                  onClick={() => {
                    setFile(null);
                    setParsedData(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Choose Different File
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
