import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Phone, Briefcase, BookOpen, FileText, Linkedin, Download } from "lucide-react";
import type { ExpertEmployment, ExpertEducation } from "@shared/types";

export default function ExpertProfileView() {
  const [, params] = useRoute("/expert/profile/:id");
  const expertId = params?.id ? parseInt(params.id) : null;

  const expertQuery = trpc.experts.getById.useQuery(
    { id: expertId || 0 },
    { enabled: !!expertId }
  );

  const employmentQuery = trpc.expertEmployment.getByExpert.useQuery(
    { expertId: expertId || 0 },
    { enabled: !!expertId }
  );

  const educationQuery = trpc.expertEducation.getByExpert.useQuery(
    { expertId: expertId || 0 },
    { enabled: !!expertId }
  );

  if (!expertId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600">Expert not found</p>
              <Button onClick={() => window.location.href = "/admin/experts"} className="mt-4">
                Back to Experts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (expertQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  const expert = expertQuery.data;

  if (!expert) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600">Expert profile not found</p>
              <Button onClick={() => window.location.href = "/admin/experts"} className="mt-4">
                Back to Experts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if expert is verified
  if (!expert.isVerified) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-slate-600">This expert profile is not yet verified</p>
              <Button onClick={() => window.location.href = "/admin/experts"} className="mt-4">
                Back to Experts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {expert.firstName} {expert.lastName}
            </h1>
            <p className="text-slate-600 mt-1">{expert.sector}</p>
          </div>
          <Button onClick={() => window.location.href = "/admin/experts"} variant="outline">
            Back
          </Button>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-slate-600" />
              <span className="text-slate-900">{expert.email}</span>
            </div>
            {expert.phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-600" />
                <span className="text-slate-900">{expert.phone}</span>
              </div>
            )}
            {expert.linkedinUrl && (
              <div className="flex items-center gap-3">
                <Linkedin size={18} className="text-blue-600" />
                <a href={expert.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  LinkedIn Profile
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Function / Role</label>
              <p className="text-slate-900 mt-1">{expert.function || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Biography</label>
              <p className="text-slate-900 mt-1 whitespace-pre-wrap">{expert.biography || "Not provided"}</p>
            </div>
          </CardContent>
        </Card>

        {/* CV Section */}
        {expert.cvUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={20} />
                Resume / CV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-slate-600" size={32} />
                  <div>
                    <p className="font-medium text-slate-900">Resume/CV</p>
                    <p className="text-sm text-slate-600">PDF Document</p>
                  </div>
                </div>
                <Button
                  onClick={() => expert.cvUrl && window.open(expert.cvUrl, "_blank")}
                  className="gap-2"
                  variant="default"
                >
                  <Download size={16} />
                  View CV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employment History */}
        {employmentQuery.data && employmentQuery.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase size={20} />
                Employment History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employmentQuery.data.map((emp: ExpertEmployment, idx: number) => (
                <div key={idx} className="border-l-2 border-slate-300 pl-4">
                  <h3 className="font-semibold text-slate-900">{emp.position}</h3>
                  <p className="text-slate-600">{emp.companyName}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {emp.startDate} {emp.endDate ? `- ${emp.endDate}` : "- Present"}
                  </p>
                  {emp.description && (
                    <p className="text-slate-700 mt-2 text-sm">{emp.description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Education History */}
        {educationQuery.data && educationQuery.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen size={20} />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {educationQuery.data.map((edu: ExpertEducation, idx: number) => (
                <div key={idx} className="border-l-2 border-slate-300 pl-4">
                  <h3 className="font-semibold text-slate-900">{edu.schoolName}</h3>
                  {edu.degree && (
                    <p className="text-slate-600">
                      {edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}
                    </p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">
                    {edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* CV */}
        {expert.cvUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={20} />
                CV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={expert.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
              >
                <FileText size={16} />
                Download CV
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
