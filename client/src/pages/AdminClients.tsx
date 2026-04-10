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
import { Plus, Trash2, Edit2 } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  companyWebsite: z.string().optional(),
  contactPerson: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function AdminClients() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || "");
  const [companyFilter, setCompanyFilter] = useState<string>(urlParams.get('company') || "");
  
  const updateUrl = (search: string, company: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (company && company !== "all") params.set('company', company);
    const queryString = params.toString();
    navigate(`/admin/clients${queryString ? '?' + queryString : ''}`);
  };

  const clientsQuery = trpc.clients.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();
  const createMutation = trpc.clients.create.useMutation();
  
  const filteredClients = clientsQuery.data?.filter(client => 
    (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!companyFilter || companyFilter === "all" || client.companyName === companyFilter)
  ) || [];
  const updateMutation = trpc.clients.update.useMutation();
  const deleteMutation = trpc.clients.delete.useMutation();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      companyName: "",
      companyWebsite: "",
      contactPerson: "",
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
    } catch (error) {
      toast.error("Failed to save client");
    }
  };

  const handleEdit = (client: any) => {
    form.reset(client);
    setEditingId(client.id);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this client?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Client deleted successfully");
        clientsQuery.refetch();
      } catch (error) {
        toast.error("Failed to delete client");
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-2">Manage your client network</p>
          </div>
        </div>

        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateUrl(e.target.value, companyFilter);
              }}
              className="flex-1 min-w-0"
            />
            <Select value={companyFilter} onValueChange={(value) => {
              setCompanyFilter(value);
              updateUrl(searchTerm, value);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {Array.from(new Set((clientsQuery.data?.map(c => c.companyName).filter(Boolean) || []) as string[])).map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { form.reset(); setEditingId(null); }} className="gap-2 whitespace-nowrap">
                <Plus size={18} />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Client" : "Add New Client"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update client information" : "Create a new client in your network"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update Client" : "Create Client"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Clients Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>Complete list of clients in your network</CardDescription>
          </CardHeader>
          <CardContent>
            {clientsQuery.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
            ) : filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Company</th>
                      <th className="text-left py-3 px-4 font-semibold">Phone</th>
                      <th className="text-center py-3 px-4 font-semibold">Projects</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/clients/${client.id}`)}>
                        <td className="py-3 px-4 font-medium">{client.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{client.email}</td>
                        <td className="py-3 px-4 text-muted-foreground">{client.companyName || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{client.phone || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/projects?client=${client.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                          >
                            {projectsQuery.data?.filter(p => p.clientId === client.id).length || 0}
                          </Button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            className="gap-1"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">{searchTerm ? "No clients match your search" : "No clients yet"}</p>
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <Plus size={18} />
                  Add First Client
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
