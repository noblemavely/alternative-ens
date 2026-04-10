import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Edit2, Save, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminExpertDetail() {
  const [, params] = useRoute("/admin/experts/:id");
  const [, navigate] = useLocation();
  const expertId = params?.id ? parseInt(params.id) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [mappingStatus, setMappingStatus] = useState("shortlisted");
  
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [shortlistNotes, setShortlistNotes] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Fetch expert details
  const expertQuery = trpc.experts.getById.useQuery(
    { id: expertId! },
    { enabled: !!expertId }
  );

  // Fetch projects
  const projectsQuery = trpc.projects.list.useQuery();

  // Fetch clients
  const clientsQuery = trpc.clients.list.useQuery();

  // Fetch client contacts
  const contactsQuery = trpc.clientContacts.list.useQuery();

  // Fetch expert mappings
  // TODO: Implement expert-client mappings
  // const mappingsQuery = trpc.expertClientMapping.listByExpert.useQuery(
  //   { expertId: expertId! },
  //   { enabled: !!expertId }
  // );

  // Update expert mutation
  const updateExpertMutation = trpc.experts.update.useMutation({
    onSuccess: () => {
      toast.success("Expert updated successfully");
      setIsEditing(false);
      expertQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update expert");
    },
  });

  // Create mapping mutation
  // const createMappingMutation = trpc.expertClientMapping.create.useMutation({
  //   onSuccess: () => {
  //     toast.success("Client mapped successfully");
  //     setSelectedClient("");
  //     setMappingStatus("shortlisted");
  //     setShowAddMapping(false);
  //     mappingsQuery.refetch();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.message || "Failed to map client");
  //   },
  // });

  // Delete mapping mutation
  // const deleteMappingMutation = trpc.expertClientMapping.delete.useMutation({
  //   onSuccess: () => {
  //     toast.success("Mapping removed");
  //     mappingsQuery.refetch();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.message || "Failed to remove mapping");
  //   },
  // });

  // Shortlist mutation
  const shortlistMutation = trpc.shortlists.add.useMutation({
    onSuccess: () => {
      toast.success("Expert shortlisted successfully");
      setSelectedProject("");
      setShortlistNotes("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to shortlist expert");
    },
  });

  // Initialize form data when expert data loads
  useEffect(() => {
    if (expertQuery.data) {
      setFormData({
        firstName: expertQuery.data.firstName || "",
        lastName: expertQuery.data.lastName || "",
        email: expertQuery.data.email || "",
        phone: expertQuery.data.phone || "",
        sector: expertQuery.data.sector || "",
        function: expertQuery.data.function || "",
        biography: expertQuery.data.biography || "",
      });
    }
  }, [expertQuery.data]);

  const handleSaveExpert = async () => {
    if (!expertId) return;
    await updateExpertMutation.mutateAsync({
      id: expertId,
      ...formData,
    });
  };

  // const handleAddMapping = () => {
  //   if (!selectedClient) {
  //     toast.error("Please select a client");
  //     return;
  //   }
  //   createMappingMutation.mutate({
  //     expertId: expertId!,
  //     clientId: parseInt(selectedClient),
  //     status: mappingStatus as any,
  //   });
  // };

  // const handleRemoveMapping = (mappingId: number) => {
  //   if (confirm("Are you sure you want to remove this mapping?")) {
  //     deleteMappingMutation.mutate({ id: mappingId });
  //   }
  // };

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

  if (!expertId) return <div className="p-6">Invalid expert ID</div>;
  if (expertQuery.isLoading) return <div className="p-6">Loading...</div>;
  if (!expertQuery.data) return <div className="p-6">Expert not found</div>;

  const statusOptions = [
    "shortlisted",
    "contacted",
    "attempting_contact",
    "engaged",
    "qualified",
    "proposal_sent",
    "negotiation",
    "verbal_agreement",
    "closed_won",
    "closed_lost",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/experts")}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {formData.firstName} {formData.lastName}
              </h1>
              <p className="text-slate-600">{formData.sector} • {formData.function}</p>
            </div>
          </div>
          <Button
            onClick={() => (isEditing ? handleSaveExpert() : setIsEditing(true))}
            disabled={updateExpertMutation.isPending}
            variant={isEditing ? "default" : "outline"}
          >
            {isEditing ? (
              <>
                <Save size={16} className="mr-2" />
                Save
              </>
            ) : (
              <>
                <Edit2 size={16} className="mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Expert Details */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className="text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className="text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Sector</Label>
                    <Input
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      disabled={!isEditing}
                      className="text-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Function</Label>
                    <Input
                      value={formData.function}
                      onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                      disabled={!isEditing}
                      className="text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Biography</Label>
                  <Textarea
                    value={formData.biography}
                    onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                    disabled={!isEditing}
                    className="text-slate-900"
                    rows={3}
                  />
                </div>
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

          {/* Sidebar - Project Carousel */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Projects</h3>
            <p className="text-sm text-slate-600 mb-4">Projects this expert is tagged to</p>
            {!projectsQuery.data || projectsQuery.data.length === 0 ? (
              <p className="text-slate-600 text-sm py-4">No projects available</p>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + projectsQuery.data.length) % projectsQuery.data.length)}
                  disabled={projectsQuery.data.length <= 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <div className="flex-1">
                  {projectsQuery.data[carouselIndex] && (() => {
                    const project = projectsQuery.data[carouselIndex];
                    const contact = contactsQuery.data?.find((c: any) => c.id === project.clientContactId);
                    const client = clientsQuery.data?.find((c: any) => c.id === contact?.clientId);
                    return (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">{project.name}</h4>
                        <p className="text-xs text-slate-600 mb-2">Client: {client?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 mb-3">Status: Shortlisted</p>
                        <p className="text-xs text-slate-400 text-center mt-4">{carouselIndex + 1} of {projectsQuery.data.length}</p>
                      </div>
                    );
                  })()}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % projectsQuery.data.length)}
                  disabled={projectsQuery.data.length <= 1}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
