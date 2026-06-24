import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Briefcase } from "lucide-react";
import { useLocation } from "wouter";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ButtonWithTooltip } from "@/components/ButtonWithTooltip";
import { formatCurrency } from "@/shared/currencies";

export default function AdminProjects() {
  const [location, navigate] = useLocation();

  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || "");
  const [statusFilter, setStatusFilter] = useState<string>(urlParams.get('status') || "");
  const [currentPage, setCurrentPage] = useState(parseInt(urlParams.get('page') || '0'));
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: number; name: string } | null>(null);

  const pageSize = 20;
  const updateUrl = (search: string, status: string, page: number = 0) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status && status !== "all") params.set('status', status);
    if (page > 0) params.set('page', String(page));
    const queryString = params.toString();
    navigate(`/admin/projects${queryString ? '?' + queryString : ''}`);
  };

  const projectsQuery = trpc.projects.list.useQuery({
    search: searchTerm,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    limit: pageSize,
    offset: currentPage * pageSize,
  });
  const clientsQuery = trpc.clients.list.useQuery();
  const contactsQuery = trpc.clientContacts.list.useQuery();
  const shortlistsQuery = trpc.shortlists.list.useQuery();

  const filteredProjects = projectsQuery.data?.items || [];

  const deleteMutation = trpc.projects.delete.useMutation();

  const handleDelete = async (id: number, name: string) => {
    setProjectToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: projectToDelete.id });
      toast.success("Project deleted successfully");
      projectsQuery.refetch();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project");
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":   return "badge-success";
      case "On Hold":  return "badge-warning";
      case "Closed":   return "badge-error";
      default:         return "badge-neutral";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Active and archived projects</p>
          </div>
          <Button className="gap-2 h-8 text-sm" onClick={() => navigate("/admin/add-project")}>
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Input
            placeholder="Search by project name or description…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
              updateUrl(e.target.value, statusFilter, 0);
            }}
            className="flex-1 h-8 text-sm"
          />
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(0);
            updateUrl(searchTerm, value, 0);
          }}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded border border-border overflow-hidden" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">All Projects</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {projectsQuery.data?.total || 0} project{(projectsQuery.data?.total || 0) !== 1 ? "s" : ""} found
                {filteredProjects.length > 0 && (
                  <span> • Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, projectsQuery.data?.total || 0)}</span>
                )}
              </p>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                icon={Briefcase}
                title="No projects yet"
                description={searchTerm || projectTypeFilter !== "all" ? "No projects match your filters." : "Add your first project to get started"}
                actionLabel={!searchTerm && projectTypeFilter === "all" ? "Add Project" : undefined}
                onAction={!searchTerm && projectTypeFilter === "all" ? () => navigate("/admin/add-project") : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Client Contact</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Rate</th>
                    <th>Experts</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project: any) => (
                    <tr
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                    >
                      <td className="font-medium text-primary hover:underline">{project.name}</td>
                      <td className="muted">{getClientContactName(project.clientContactId)}</td>
                      <td className="muted">{project.projectType}</td>
                      <td>
                        <span className={getStatusBadgeClass(project.status || "Active")}>
                          {project.status || "Active"}
                        </span>
                      </td>
                      <td className="muted">
                        {project.rate ? formatCurrency(project.rate, project.currency || "USD") : "—"}
                      </td>
                      <td className="muted">{getExpertCountForProject(project.id)}</td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <ButtonWithTooltip
                            variant="ghost"
                            size="sm"
                            tooltip="Edit this project"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); navigate(`/admin/projects/${project.id}`); }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </ButtonWithTooltip>
                          <ButtonWithTooltip
                            variant="ghost"
                            size="sm"
                            tooltip="Delete this project"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleDelete(project.id, project.name); }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </ButtonWithTooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {projectsQuery.data && projectsQuery.data.total > pageSize && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {Math.ceil(projectsQuery.data.total / pageSize)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                        updateUrl(searchTerm, statusFilter, currentPage - 1);
                      }}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                        updateUrl(searchTerm, statusFilter, currentPage + 1);
                      }}
                      disabled={!projectsQuery.data.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete project"
        description="Are you sure you want to delete this project?"
        itemName={projectToDelete?.name || ""}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  );
}
