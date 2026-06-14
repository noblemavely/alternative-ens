import { useLocation } from "wouter";
import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Users } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ButtonWithTooltip } from "@/components/ButtonWithTooltip";
import { TableRowSkeleton } from "@/components/TableRowSkeleton";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  companyWebsite: z.string().optional(),
  contactPerson: z.string().optional(),
  sector: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function AdminClients() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || "");
  const [sectorFilter, setSectorFilter] = useState<string>(urlParams.get('sector') || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null);
  
  const updateUrl = (search: string, sector: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sector && sector !== "all") params.set('sector', sector);
    const queryString = params.toString();
    navigate(`/admin/clients${queryString ? '?' + queryString : ''}`);
  };

  const clientsQuery = trpc.clients.list.useQuery();
  const sectorsQuery = trpc.sectors.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();
  const contactsQuery = trpc.clientContacts.list.useQuery();
  const createMutation = trpc.clients.create.useMutation();
  
  const filteredClients = clientsQuery.data?.filter(client =>
    (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!sectorFilter || sectorFilter === "all" || client.sector === sectorFilter)
  ) || [];
  
  const updateMutation = trpc.clients.update.useMutation();
  const deleteMutation = trpc.clients.delete.useMutation();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      companyName: "",
      companyWebsite: "",
      contactPerson: "",
      sector: "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success("Client updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Client created successfully");
      }
      form.reset();
      setOpen(false);
      setEditingId(null);
      clientsQuery.refetch();
      // Also refetch contacts and projects to update project counts
      contactsQuery.refetch();
      projectsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save client");
    }
  };

  const handleEdit = (client: any) => {
    form.reset(client);
    setEditingId(client.id);
    setOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    setClientToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: clientToDelete.id });
      toast.success("Client deleted successfully");
      clientsQuery.refetch();
      // Also refetch contacts and projects to update project counts
      contactsQuery.refetch();
      projectsQuery.refetch();
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error) {
      toast.error("Failed to delete client");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your client network</p>
          </div>
        </div>

        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder="Search by name or company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateUrl(e.target.value, sectorFilter);
              }}
              className="flex-1 min-w-0"
            />
            <Select value={sectorFilter} onValueChange={(value) => {
              setSectorFilter(value);
              updateUrl(searchTerm, value);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectorsQuery.data?.map(sector => (
                  <SelectItem key={sector.id} value={sector.name}>{sector.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate("/admin/add-client")} className="gap-2 whitespace-nowrap">
            <Plus size={18} />
            Add Client
          </Button>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded border border-border overflow-hidden" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">All Clients</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>
          {filteredClients.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                icon={Users}
                title="No clients yet"
                description={searchTerm || sectorFilter ? "No clients match your filters. Try adjusting your search or filters." : "Add your first client to get started"}
                actionLabel={!searchTerm && !sectorFilter ? "Add Client" : undefined}
                onAction={!searchTerm && !sectorFilter ? () => setOpen(true) : undefined}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Sector</th>
                    <th>Projects</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contactsQuery.isLoading || projectsQuery.isLoading ? (
                    <>
                      <TableRowSkeleton columns={4} />
                      <TableRowSkeleton columns={4} />
                      <TableRowSkeleton columns={4} />
                    </>
                  ) : (
                    filteredClients.map((client: any) => {
                      const clientContactIds = contactsQuery.data?.filter((c: any) => c.clientId === client.id).map((c: any) => c.id) || [];
                      const projectCount = projectsQuery.data?.filter((p: any) => clientContactIds.includes(p.clientContactId)).length || 0;
                      return (
                        <tr
                          key={client.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/admin/clients/${client.id}`)}
                        >
                          <td className="font-medium text-primary hover:underline">{client.name}</td>
                          <td className="muted">{client.sector || "—"}</td>
                          <td className="muted">{projectCount}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ButtonWithTooltip
                                size="sm"
                                variant="ghost"
                                tooltip="Edit this client"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/clients/${client.id}`);
                                }}
                              >
                                <Edit2 size={14} />
                              </ButtonWithTooltip>
                              <ButtonWithTooltip
                                size="sm"
                                variant="ghost"
                                tooltip="Delete this client"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(client.id, client.name);
                                }}
                              >
                                <Trash2 size={14} className="text-destructive" />
                              </ButtonWithTooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete client"
        description="Are you sure you want to delete this client?"
        itemName={clientToDelete?.name || ""}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  );
}
