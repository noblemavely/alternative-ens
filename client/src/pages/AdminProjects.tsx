import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Eye } from "lucide-react";
import { useLocation } from "wouter";

const projectSchema = z.object({
  clientId: z.number(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  projectType: z.enum(["Call", "Advisory", "ID"]),
  targetCompanies: z.string().optional(),
  targetPersona: z.string().optional(),
  hourlyRate: z.number().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function AdminProjects() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || "");
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>(urlParams.get('type') || "");
  const [clientFilter, setClientFilter] = useState<string>(urlParams.get('client') || "");

  
  const updateUrl = (search: string, type: string, clientFilter?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type && type !== "all") params.set('type', type);
    if (clientFilter && clientFilter !== "all") params.set('client', clientFilter);
    const queryString = params.toString();
    navigate(`/admin/projects${queryString ? '?' + queryString : ''}`);
  };

  const clientsQuery = trpc.clients.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const contactsQuery = selectedClientId ? trpc.clientContacts.listByClient.useQuery({ clientId: selectedClientId }) : { data: [] };
  
  const filteredProjects = projectsQuery.data?.filter(project => 
    (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!projectTypeFilter || projectTypeFilter === "all" || project.projectType === projectTypeFilter) &&
    (!clientFilter || clientFilter === "all" || project.clientId === parseInt(clientFilter))
  ) || [];
  
  const createMutation = trpc.projects.create.useMutation();
  const updateMutation = trpc.projects.update.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation();
  const createQuestionMutation = trpc.screeningQuestions.add.useMutation();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: 0,
      name: "",
      description: "",
      projectType: "Call",
      targetCompanies: "",
      targetPersona: "",
      hourlyRate: undefined,
    },
  });

  const selectedClientContacts = contactsQuery.data || [];

  const onSubmit = async (data: ProjectFormData) => {
    try {
      let projectId: number;

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        projectId = editingId;
        toast.success("Project updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        // For new projects, we'll fetch the list to get the ID
        projectId = 0;
        toast.success("Project created successfully");
      }

      // Create screening questions if any
      for (const question of screeningQuestions) {
        if (question.trim()) {
          await createQuestionMutation.mutateAsync({
            projectId,
            question: question.trim(),
          });
        }
      }

      form.reset();
      setOpen(false);
      setEditingId(null);
      setScreeningQuestions([]);
      projectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const handleEdit = (project: any) => {
    form.reset(project);
    setEditingId(project.id);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Project deleted successfully");
        projectsQuery.refetch();
      } catch (error) {
        toast.error("Failed to delete project");
      }
    }
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setScreeningQuestions([...screeningQuestions, newQuestion]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-2">Manage client projects and requirements</p>
          </div>
        </div>

        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder="Search by project name or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateUrl(e.target.value, projectTypeFilter);
              }}
              className="flex-1 min-w-0"
            />
            <Select value={projectTypeFilter} onValueChange={(value) => {
              setProjectTypeFilter(value);
              updateUrl(searchTerm, value);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="Advisory">Advisory</SelectItem>
                <SelectItem value="ID">ID</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={(value) => {
              setClientFilter(value);
              updateUrl(searchTerm, projectTypeFilter, value);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clientsQuery.data?.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  form.reset();
                  setEditingId(null);
                  setScreeningQuestions([]);
                }}
                className="gap-2 whitespace-nowrap"
              >
                <Plus size={18} />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Project" : "Create New Project"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update project information" : "Create a new project and define requirements"}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <Select onValueChange={(v) => {
                          const clientId = Number(v);
                          field.onChange(clientId);
                          setSelectedClientId(clientId);
                        }} value={String(field.value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientsQuery.data?.map((client) => (
                              <SelectItem key={client.id} value={String(client.id)}>
                                {client.name}
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Market Research Initiative" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Call">Call</SelectItem>
                            <SelectItem value="Advisory">Advisory</SelectItem>
                            <SelectItem value="ID">ID</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description / Scope</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Project details and scope..." {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetCompanies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Companies</FormLabel>
                        <FormControl>
                          <Input placeholder="Company A, Company B, Company C" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetPersona"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Persona</FormLabel>
                        <FormControl>
                          <Input placeholder="VP of Marketing, 10+ years experience" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="250" {...field} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Screening Questions */}
                  <div className="space-y-3">
                    <FormLabel>Screening Questions</FormLabel>
                    <div className="space-y-2">
                      {screeningQuestions.map((q, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <span className="text-sm flex-1">{q}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(i)}
                            className="text-destructive"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a screening question..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addQuestion())}
                      />
                      <Button type="button" variant="outline" onClick={addQuestion}>
                        Add
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update Project" : "Create Project"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>Active and archived projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsQuery.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
            ) : filteredProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Project Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Client</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Target Persona</th>
                      <th className="text-left py-3 px-4 font-semibold">Rate</th>
                      <th className="text-center py-3 px-4 font-semibold">Experts</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => {
                      const client = clientsQuery.data?.find(c => c.id === project.clientId);
                      const expertCount = projectsQuery.data?.filter(p => p.id === project.id).length || 0;
                      return (
                      <tr key={project.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{project.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{client?.name || "-"}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded">{project.projectType}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{project.targetPersona || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">${project.hourlyRate || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(`/admin/projects/${project.id}`)}
                            className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                          >
                            {expertCount}
                          </Button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 flex justify-end">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/projects/${project.id}`)} className="gap-1" title="View Shortlisted Experts">
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(project)} className="gap-1">
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(project.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">{searchTerm ? "No projects match your search" : "No projects yet"}</p>
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Create First Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
