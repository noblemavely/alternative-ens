import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Edit2, Save, Trash2, Plus, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ActivityTimeline from "@/components/ActivityTimeline";
import DocumentViewer from "@/components/DocumentViewer";
import { EmploymentHistoryForm } from "@/components/EmploymentHistoryForm";
import { EducationHistoryForm } from "@/components/EducationHistoryForm";

export default function AdminExpertDetail() {
  const [, params] = useRoute("/admin/experts/:id");
  const [, navigate] = useLocation();
  const expertId = params?.id ? parseInt(params.id) : null;
  const [location, setLocation] = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [mappingStatus, setMappingStatus] = useState("shortlisted");

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [shortlistNotes, setShortlistNotes] = useState("");
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedCVFile, setSelectedCVFile] = useState<File | null>(null);
  const [editingShortlistId, setEditingShortlistId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>("");

  // Employment and education state
  const [employmentHistory, setEmploymentHistory] = useState<any[]>([]);
  const [educationHistory, setEducationHistory] = useState<any[]>([]);

  // Fetch expert details
  const expertQuery = trpc.experts.getById.useQuery(
    { id: expertId! },
    { enabled: !!expertId }
  );

  // Fetch projects
  const projectsQuery = trpc.projects.list.useQuery();

  // Fetch shortlisted projects for this expert
  const shortlistedProjectsQuery = trpc.shortlists.getByExpert.useQuery(
    { expertId: expertId! },
    { enabled: !!expertId }
  );

  // Fetch clients
  const clientsQuery = trpc.clients.list.useQuery();

  // Fetch client contacts
  const contactsQuery = trpc.clientContacts.list.useQuery();

  // Fetch sectors and functions picklists
  const sectorsQuery = trpc.sectors.list.useQuery();
  const functionsQuery = trpc.functions.list.useQuery();

  // Fetch projects for this expert (where expert is shortlisted)
  const expertProjectsQuery = trpc.experts.getProjectsForExpert.useQuery(
    { expertId: expertId! },
    { enabled: !!expertId }
  );

  // Fetch activity timeline for expert
  const activityTimelineQuery = trpc.experts.getActivityTimeline.useQuery(
    { expertId: expertId! },
    { enabled: !!expertId }
  );

  // Fetch project-specific activity timeline
  const projectActivityQuery = trpc.experts.getProjectActivityTimeline.useQuery(
    { expertId: expertId!, projectId: selectedProjectId || 0 },
    { enabled: !!expertId && !!selectedProjectId }
  );

  // Fetch employment and education history
  const employmentQuery = trpc.expertEmployment.getByExpert.useQuery(
    { expertId: expertId! },
    { enabled: !!expertId }
  );

  const educationQuery = trpc.expertEducation.getByExpert.useQuery(
    { expertId: expertId! },
    { enabled: !!expertId }
  );

  // Fetch expert mappings
  // TODO: Implement expert-client mappings
  // const mappingsQuery = trpc.expertClientMapping.listByExpert.useQuery(
  //   { expertId: expertId! },
  //   { enabled: !!expertId }
  // );

  // Upload CV mutation
  const uploadCVMutation = trpc.upload.uploadCV.useMutation({
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload CV");
    },
  });

  // Update expert mutation
  const updateExpertMutation = trpc.experts.update.useMutation({
    onSuccess: () => {
      toast.success("Expert updated successfully");
      setIsEditing(false);
      setSelectedCVFile(null);
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
      setShowShortlistModal(false);
      shortlistedProjectsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to shortlist expert");
    },
  });

  // Update shortlist status mutation
  const updateShortlistMutation = trpc.shortlists.update.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      setEditingShortlistId(null);
      setEditingStatus("");
      shortlistedProjectsQuery.refetch();
      projectActivityQuery.refetch(); // Refresh activity timeline
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Employment mutations
  const addEmploymentMutation = trpc.expertEmployment.add.useMutation({
    onSuccess: () => {
      toast.success("Employment added successfully");
      employmentQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add employment");
    },
  });

  const updateEmploymentMutation = trpc.expertEmployment.update.useMutation({
    onSuccess: () => {
      toast.success("Employment updated successfully");
      employmentQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update employment");
    },
  });

  const deleteEmploymentMutation = trpc.expertEmployment.delete.useMutation({
    onSuccess: () => {
      toast.success("Employment deleted successfully");
      employmentQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete employment");
    },
  });

  // Education mutations
  const addEducationMutation = trpc.expertEducation.add.useMutation({
    onSuccess: () => {
      toast.success("Education added successfully");
      educationQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add education");
    },
  });

  const updateEducationMutation = trpc.expertEducation.update.useMutation({
    onSuccess: () => {
      toast.success("Education updated successfully");
      educationQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update education");
    },
  });

  const deleteEducationMutation = trpc.expertEducation.delete.useMutation({
    onSuccess: () => {
      toast.success("Education deleted successfully");
      educationQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete education");
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

  // Initialize employment and education history
  useEffect(() => {
    if (employmentQuery.data) {
      setEmploymentHistory(employmentQuery.data);
    }
  }, [employmentQuery.data]);

  useEffect(() => {
    if (educationQuery.data) {
      setEducationHistory(educationQuery.data);
    }
  }, [educationQuery.data]);

  // Auto-select first project if available
  useEffect(() => {
    if (expertProjectsQuery.data && expertProjectsQuery.data.length > 0 && !selectedProjectId) {
      setSelectedProjectId(expertProjectsQuery.data[0].id);
    }
  }, [expertProjectsQuery.data, selectedProjectId]);

  const handleSaveExpert = async () => {
    if (!expertId) return;

    let cvUrl = formData.cvUrl;

    // Upload CV if a file was selected
    if (selectedCVFile) {
      try {
        // Wrap FileReader in a Promise to properly await it
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = (e.target?.result as string).split(",")[1];
            resolve(result);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(selectedCVFile);
        });

        // Upload the CV file
        const uploadResult = await uploadCVMutation.mutateAsync({
          fileName: selectedCVFile.name,
          fileData: base64Data,
          contentType: selectedCVFile.type || "application/pdf",
        });
        cvUrl = uploadResult.url;

        // Now update the expert with the new CV URL
        await updateExpertMutation.mutateAsync({
          id: expertId,
          ...formData,
          cvUrl,
        });
      } catch (error) {
        console.error("Error uploading CV:", error);
        toast.error("Failed to upload CV file");
        return;
      }
    } else {
      // No CV upload, just update expert info
      await updateExpertMutation.mutateAsync({
        id: expertId,
        ...formData,
      });
    }
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

  const handleStatusChange = (shortlistId: number, newStatus: string) => {
    updateShortlistMutation.mutate({
      id: shortlistId,
      status: newStatus as any,
    });
  };

  // Employment handlers
  const handleAddEmployment = (entry: any) => {
    addEmploymentMutation.mutate({
      expertId: expertId!,
      companyName: entry.company,
      position: entry.position,
      startDate: entry.startDate,
      endDate: entry.endDate || undefined,
      isCurrent: entry.currentlyWorking,
      description: entry.description || undefined,
    });
  };

  const handleUpdateEmployment = (entry: any) => {
    if (!entry.id) return;
    updateEmploymentMutation.mutate({
      id: entry.id,
      company: entry.company,
      position: entry.position,
      startDate: entry.startDate,
      endDate: entry.endDate,
      currentlyWorking: entry.currentlyWorking,
      description: entry.description,
    });
  };

  const handleDeleteEmployment = (id: string) => {
    deleteEmploymentMutation.mutate({
      id: parseInt(id),
    });
  };

  // Education handlers
  const handleAddEducation = (entry: any) => {
    addEducationMutation.mutate({
      expertId: expertId!,
      schoolName: entry.school,
      degree: entry.degree,
      fieldOfStudy: entry.field,
      startDate: entry.startDate,
      endDate: entry.endDate || undefined,
      description: entry.description || undefined,
    });
  };

  const handleUpdateEducation = (entry: any) => {
    if (!entry.id) return;
    updateEducationMutation.mutate({
      id: entry.id,
      school: entry.school,
      degree: entry.degree,
      fieldOfStudy: entry.field,
      startDate: entry.startDate,
      endDate: entry.endDate,
    });
  };

  const handleDeleteEducation = (id: string) => {
    deleteEducationMutation.mutate({
      id: parseInt(id),
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

        <div className="grid grid-cols-1 gap-6">
          {/* Main Content */}
          <div className="space-y-6">
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
                    {isEditing ? (
                      <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                        <SelectTrigger className="text-slate-900">
                          <SelectValue placeholder="Select a sector..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sectorsQuery.data?.map((sector: any) => (
                            <SelectItem key={sector.id} value={sector.name}>
                              {sector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.sector}
                        disabled={true}
                        className="text-slate-900"
                      />
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Function</Label>
                    {isEditing ? (
                      <Select value={formData.function} onValueChange={(value) => setFormData({ ...formData, function: value })}>
                        <SelectTrigger className="text-slate-900">
                          <SelectValue placeholder="Select a function..." />
                        </SelectTrigger>
                        <SelectContent>
                          {functionsQuery.data?.map((func: any) => (
                            <SelectItem key={func.id} value={func.name}>
                              {func.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData.function}
                        disabled={true}
                        className="text-slate-900"
                      />
                    )}
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

                {isEditing && (
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Upload CV/Resume</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setSelectedCVFile(e.target.files?.[0] || null)}
                        className="text-slate-900"
                      />
                      {selectedCVFile && (
                        <span className="text-sm text-green-600 font-medium">
                          ✓ {selectedCVFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Supported formats: PDF, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment History Section */}
            {isEditing && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Employment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmploymentHistoryForm
                    entries={employmentHistory.map((emp: any) => ({
                      id: emp.id?.toString(),
                      company: emp.companyName,
                      position: emp.position,
                      startDate: emp.startDate,
                      endDate: emp.endDate,
                      currentlyWorking: emp.isCurrent,
                      description: emp.description,
                    }))}
                    onAdd={handleAddEmployment}
                    onUpdate={handleUpdateEmployment}
                    onDelete={handleDeleteEmployment}
                  />
                </CardContent>
              </Card>
            )}

            {/* Education History Section */}
            {isEditing && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Education History</CardTitle>
                </CardHeader>
                <CardContent>
                  <EducationHistoryForm
                    entries={educationHistory.map((edu: any) => ({
                      id: edu.id?.toString(),
                      school: edu.schoolName,
                      degree: edu.degree,
                      field: edu.fieldOfStudy,
                      startDate: edu.startDate,
                      endDate: edu.endDate,
                      description: edu.description,
                    }))}
                    onAdd={handleAddEducation}
                    onUpdate={handleUpdateEducation}
                    onDelete={handleDeleteEducation}
                  />
                </CardContent>
              </Card>
            )}

            {/* CV Section */}
            {expertQuery.data?.cvUrl && (
              <>
                <Card className="border-slate-200 shadow-sm">
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
                        onClick={() => setDocumentViewerOpen(true)}
                        className="gap-2"
                        variant="default"
                      >
                        <FileText size={16} />
                        View CV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <DocumentViewer
                  open={documentViewerOpen}
                  onOpenChange={setDocumentViewerOpen}
                  documentUrl={expertQuery.data.cvUrl}
                  documentTitle={`${expertQuery.data.firstName} ${expertQuery.data.lastName} - Resume`}
                />
              </>
            )}

            {/* Display Employment History (read-only when not editing) */}
            {!isEditing && employmentHistory.length > 0 && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Employment History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employmentHistory.map((emp: any) => (
                    <div key={emp.id} className="pb-3 border-b last:border-b-0 last:pb-0">
                      <h4 className="font-semibold text-slate-900">{emp.position}</h4>
                      <p className="text-sm text-slate-600">{emp.companyName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {emp.startDate} {emp.endDate && `- ${emp.endDate}`}
                        {emp.isCurrent && " (Current)"}
                      </p>
                      {emp.description && (
                        <p className="text-sm text-slate-700 mt-2">{emp.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Display Education History (read-only when not editing) */}
            {!isEditing && educationHistory.length > 0 && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Education History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {educationHistory.map((edu: any) => (
                    <div key={edu.id} className="pb-3 border-b last:border-b-0 last:pb-0">
                      <h4 className="font-semibold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</h4>
                      <p className="text-sm text-slate-600">{edu.schoolName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {edu.startDate} {edu.endDate && `- ${edu.endDate}`}
                      </p>
                      {edu.description && (
                        <p className="text-sm text-slate-700 mt-2">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Projects & Shortlisting Section */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Projects & Shortlisting</CardTitle>
                  <CardDescription>
                    {shortlistedProjectsQuery.data?.length || 0} project{(shortlistedProjectsQuery.data?.length || 0) !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Dialog open={showShortlistModal} onOpenChange={setShowShortlistModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus size={16} className="mr-1" />
                      Add to Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Expert to Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="project" className="text-sm font-medium">
                          Select Project *
                        </Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger>
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
                        <Label htmlFor="notes" className="text-sm font-medium">
                          Notes (Optional)
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any notes about this expert for this project..."
                          value={shortlistNotes}
                          onChange={(e) => setShortlistNotes(e.target.value)}
                          className="resize-none"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleShortlist}
                        disabled={shortlistMutation.isPending || !selectedProject}
                        className="w-full"
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
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {!shortlistedProjectsQuery.data || shortlistedProjectsQuery.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No projects assigned yet</p>
                ) : (
                  <div className="space-y-3">
                    {shortlistedProjectsQuery.data.map((shortlist: any) => {
                      const project = projectsQuery.data?.find((p: any) => p.id === shortlist.projectId);
                      const contact = contactsQuery.data?.find((c: any) => c.id === project?.clientContactId);
                      const client = clientsQuery.data?.find((c: any) => c.id === contact?.clientId);
                      const isEditing = editingShortlistId === shortlist.id;

                      return (
                        <div key={shortlist.id} className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <button
                                onClick={() => setLocation(`/admin/projects/${project?.id}`)}
                                className="font-semibold text-sm text-blue-600 hover:underline cursor-pointer"
                              >
                                {project?.name}
                              </button>
                              <p className="text-xs text-slate-600 mt-1">Client: {client?.name || 'Unknown'}</p>

                              {/* Status with edit capability */}
                              <div className="mt-2 flex items-center gap-2">
                                {isEditing ? (
                                  <Select value={editingStatus} onValueChange={(value) => setEditingStatus(value)}>
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="contacted">Contacted</SelectItem>
                                      <SelectItem value="attempting_contact">Attempting Contact</SelectItem>
                                      <SelectItem value="engaged">Engaged</SelectItem>
                                      <SelectItem value="qualified">Qualified</SelectItem>
                                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                                      <SelectItem value="negotiation">Negotiation</SelectItem>
                                      <SelectItem value="verbal_agreement">Verbal Agreement</SelectItem>
                                      <SelectItem value="closed_won">Closed Won</SelectItem>
                                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                                      <SelectItem value="interested">Interested</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  ) : (
                                    <span className="text-xs text-slate-600">Status: <span className="font-medium text-slate-900">{shortlist.status}</span></span>
                                  )}
                              </div>

                              {shortlist.notes && (
                                <p className="text-xs text-slate-600 mt-2 italic">Notes: {shortlist.notes}</p>
                              )}
                            </div>

                            {/* Edit/Save buttons */}
                            <div className="flex gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleStatusChange(shortlist.id, editingStatus)}
                                    disabled={updateShortlistMutation.isPending}
                                    className="whitespace-nowrap"
                                  >
                                    {updateShortlistMutation.isPending ? (
                                      <>
                                        <Loader2 size={14} className="animate-spin mr-1" />
                                        Saving...
                                      </>
                                    ) : (
                                      "Save"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingShortlistId(null);
                                      setEditingStatus("");
                                    }}
                                    className="whitespace-nowrap"
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingShortlistId(shortlist.id);
                                    setEditingStatus(shortlist.status);
                                  }}
                                  className="whitespace-nowrap"
                                >
                                  Edit Status
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            {expertProjectsQuery.data && expertProjectsQuery.data.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Project for Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedProjectId?.toString() || ""} onValueChange={(value) => setSelectedProjectId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project to view activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {expertProjectsQuery.data.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedProjectId && (
                    <ActivityTimeline
                      events={projectActivityQuery.data || []}
                      projectName={expertProjectsQuery.data.find((p: any) => p.id === selectedProjectId)?.name}
                      isLoading={projectActivityQuery.isLoading}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Generic Activity Timeline (when no projects) */}
            {(!expertProjectsQuery.data || expertProjectsQuery.data.length === 0) && (
              <ActivityTimeline
                events={activityTimelineQuery.data || []}
                isLoading={activityTimelineQuery.isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
