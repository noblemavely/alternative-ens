import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { STATUS_LABELS, STATUS_COLORS } from "@shared/statusLabels";

export default function AdminExpertDetail() {
  const [, params] = useRoute("/admin/experts/:id");
  const expertId = params?.id ? parseInt(params.id) : null;
  
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [shortlistNotes, setShortlistNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("new");

  // Fetch expert details
  const expertQuery = trpc.experts.getById.useQuery(
    { id: expertId! },
    { enabled: !!expertId }
  );

  // Fetch projects
  const projectsQuery = trpc.projects.list.useQuery();

  // Shortlist mutation
  const shortlistMutation = trpc.shortlists.add.useMutation({
    onSuccess: () => {
      toast.success("Expert shortlisted successfully");
      setSelectedProject("");
      setShortlistNotes("");
      setSelectedStatus("new");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to shortlist expert");
    },
  });

  const handleShortlist = () => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }
    shortlistMutation.mutate({
      projectId: parseInt(selectedProject),
      expertId: expertId!,
      notes: shortlistNotes || undefined,
    });
  };

  if (!expertId) return <div>Invalid expert ID</div>;
  if (expertQuery.isLoading) return <div className="p-6">Loading...</div>;
  if (!expertQuery.data) return <div className="p-6">Expert not found</div>;

  const expert = expertQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {expert.firstName} {expert.lastName}
            </h1>
            <p className="text-slate-600">{expert.sector} • {expert.function}</p>
          </div>
        </div>

        {/* Expert Details */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Email</Label>
                <p className="text-slate-900">{expert.email}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Phone</Label>
                <p className="text-slate-900">{expert.phone || "N/A"}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Sector</Label>
                <p className="text-slate-900">{expert.sector}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Function</Label>
                <p className="text-slate-900">{expert.function}</p>
              </div>
            </div>
            {expert.biography && (
              <div>
                <Label className="text-xs font-semibold text-slate-600">Biography</Label>
                <p className="text-slate-700 text-sm">{expert.biography}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shortlist Section */}
        <Card className="border-blue-200 bg-blue-50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Shortlist for Project</CardTitle>
            <CardDescription className="text-blue-700">Add this expert to a project shortlist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project" className="text-sm font-medium text-slate-900">
                Select Project
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="border-blue-300 bg-white">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projectsQuery.data?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-slate-900">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this expert for this project..."
                value={shortlistNotes}
                onChange={(e) => setShortlistNotes(e.target.value)}
                className="border-blue-300 resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={handleShortlist}
              disabled={shortlistMutation.isPending || !selectedProject}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {shortlistMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Shortlisting...
                </>
              ) : (
                "Shortlist Expert"
              )}
            </Button>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
