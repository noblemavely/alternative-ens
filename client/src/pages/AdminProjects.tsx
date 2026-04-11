import { useState } from "react";
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
  clientContactId: z.number(),
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

  const updateUrl = (search: string, type: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type && type !== "all") params.set('type', type);
    const queryString = params.toString();
    navigate(`/admin/projects${queryString ? '?' + queryString : ''}`);
  };

  const projectsQuery = trpc.projects.list.useQuery();
  const clientsQuery = trpc.clients.list.useQuery();
  const contactsQuery = trpc.clientContacts.list.useQuery();
  const shortlistsQuery = trpc.shortlists.list.useQuery();
  
  const filteredProjects = projectsQuery.data?.filter((project: any) => 
    (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!projectTypeFilter || projectTypeFilter === "all" || project.projectType === projectTypeFilter)
  ) || [];
  
  const createMutation = trpc.projects.create.useMutation();
  const updateMutation = trpc.projects.update.useMutation();
  const deleteMutation = trpc.projects.delete.useMutation();
  const createQuestionMutation = trpc.screeningQuestions.add.useMutation();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientContactId: 0,
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
        const result = await createMutation.mutateAsync(data);
        projectId = (result as any).insertId || (result as any).id || data.clientContactId;
        toast.success("Project created successfully");
      }

      // Create screening questions if any
      for (const question of screeningQuestions) {
        if (question.trim()) {
          await createQuestionMutation.mutateAsync({
            projectId,
            question: question.trim(),
            order: screeningQuestions.indexOf(question),
          });
        }
      }

      setScreeningQuestions([]);
      form.reset();
      setOpen(false);
      setEditingId(null);
      projectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const handleEdit = (project: any) => {
    form.reset({
      clientContactId: project.clientContactId,
      name: project.name,
      description: project.description || "",
      projectType: project.projectType,
      targetCompanies: project.targetCompanies || "",
      targetPersona: project.targetPersona || "",
      hourlyRate: project.hourlyRate ? parseFloat(project.hourlyRate) : undefined,
    });
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

  const getClientContactName = (contactId: number) => {
    const contact = contactsQuery.data?.find((c: any) => c.id === contactId);
    if (!contact) return "Unknown";
    const client = clientsQuery.data?.find((c: any) => c.id === contact.clientId);
    return `${client?.name} - ${contact.contactName}`;
  };

  const getExpertCountForProject = (projectId: number) => {
    return shortlistsQuery.data?.filter((s: any) => s.projectId === projectId).length || 0;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Project" : "Create New Project"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update project details" : "Create a new project and define requirements"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientContactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Contact *</FormLabel>
                        <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedClientContacts.map((contact: any) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                {getClientContactName(contact.id)}
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
                        <Select value={field.value} onValueChange={field.onChange}>
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
                          <Textarea placeholder="Project details and scope..." {...field} />
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
                          <Input type="number" placeholder="250" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Screening Questions</FormLabel>
                    {screeningQuestions.map((q, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={q} onChange={(e) => {
                          const updated = [...screeningQuestions];
                          updated[idx] = e.target.value;
                          setScreeningQuestions(updated);
                        }} placeholder={`Question ${idx + 1}`} />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setScreeningQuestions(screeningQuestions.filter((_, i) => i !== idx))}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => setScreeningQuestions([...screeningQuestions, ""])}>
                      Add Question
                    </Button>
                  </div>

                  <Button type="submit" className="w-full">
                    {editingId ? "Update Project" : "Create Project"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>Active and archived projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Search by project name or description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    updateUrl(e.target.value, projectTypeFilter);
                  }}
                  className="flex-1"
                />
                <Select value={projectTypeFilter} onValueChange={(value) => {
                  setProjectTypeFilter(value);
                  updateUrl(searchTerm, value);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Advisory">Advisory</SelectItem>
                    <SelectItem value="ID">ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Project Name</th>
                      <th className="text-left py-2 px-4">Client Contact</th>
                      <th className="text-left py-2 px-4">Type</th>
                      <th className="text-left py-2 px-4">Rate</th>
                      <th className="text-left py-2 px-4">Experts</th>
                      <th className="text-left py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project: any) => (
                      <tr key={project.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">{project.name}</td>
                        <td className="py-2 px-4">{getClientContactName(project.clientContactId)}</td>
                        <td className="py-2 px-4">{project.projectType}</td>
                        <td className="py-2 px-4">${project.hourlyRate || "-"}</td>
                        <td className="py-2 px-4">
                          <button onClick={() => navigate(`/admin/projects/${project.id}`)} className="text-blue-600 hover:underline">
                            {getExpertCountForProject(project.id)}
                          </button>
                        </td>
                        <td className="py-2 px-4 space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/projects/${project.id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(project)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
