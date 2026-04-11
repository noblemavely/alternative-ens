import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminProjects() {
  const [location, navigate] = useLocation();

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

  const deleteMutation = trpc.projects.delete.useMutation();

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
          <Button className="gap-2" onClick={() => navigate("/admin/add-project")}>
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Project Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Client Contact</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Rate</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Experts</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project: any) => (
                      <tr
                        key={project.id}
                        className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                      >
                        <td className="py-3 px-4 font-medium">{project.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{getClientContactName(project.clientContactId)}</td>
                        <td className="py-3 px-4 text-muted-foreground">{project.projectType}</td>
                        <td className="py-3 px-4 text-muted-foreground">${project.hourlyRate || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{getExpertCountForProject(project.id)}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/projects/${project.id}`);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project.id);
                            }}
                          >
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
