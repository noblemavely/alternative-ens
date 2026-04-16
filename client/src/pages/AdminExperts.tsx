import { useLocation } from "wouter";
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
import { Plus, Trash2, Edit2, Upload, Loader2, Link2, Users } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ButtonWithTooltip } from "@/components/ButtonWithTooltip";

const expertSchema = z.object({
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  sector: z.string().optional(),
  function: z.string().optional(),
  biography: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

type ExpertFormData = z.infer<typeof expertSchema>;

export default function AdminExperts() {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [parsingLinkedin, setParsingLinkedin] = useState(false);
  
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const [searchTerm, setSearchTerm] = useState(urlParams.get('search') || "");
  const [sectorFilter, setSectorFilter] = useState<string>(urlParams.get('sector') || "");
  const [functionFilter, setFunctionFilter] = useState<string>(urlParams.get('function') || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expertToDelete, setExpertToDelete] = useState<{ id: number; name: string } | null>(null);

  const updateUrl = (search: string, sector: string, func: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (sector && sector !== "all") params.set('sector', sector);
    if (func && func !== "all") params.set('function', func);
    const queryString = params.toString();
    navigate(`/admin/experts${queryString ? '?' + queryString : ''}`);
  };

  const expertsQuery = trpc.experts.list.useQuery();
  const sectorsQuery = trpc.sectors.list.useQuery();
  const functionsQuery = trpc.functions.list.useQuery();
  
  const filteredExperts = expertsQuery.data?.filter(expert => 
    (((expert.firstName || "") + " " + (expert.lastName || "")).toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.function?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expert.biography?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!sectorFilter || sectorFilter === "all" || expert.sector === sectorFilter) &&
    (!functionFilter || functionFilter === "all" || expert.function === functionFilter)
  ) || [];
  const createMutation = trpc.experts.create.useMutation();
  const updateMutation = trpc.experts.update.useMutation();
  const deleteMutation = trpc.experts.delete.useMutation();
  const parseLinkedinMutation = trpc.linkedin.parseProfile.useMutation();

  const form = useForm<ExpertFormData>({
    resolver: zodResolver(expertSchema),
    defaultValues: {
      email: "",
      phone: "",
      firstName: "",
      lastName: "",
      sector: "",
      function: "",
      biography: "",
      linkedinUrl: "",
    },
  });

  const handleParseLinkedin = async () => {
    if (!linkedinUrl.trim()) {
      toast.error("Please enter a LinkedIn URL");
      return;
    }

    setParsingLinkedin(true);
    try {
      const profile = await parseLinkedinMutation.mutateAsync({ url: linkedinUrl });
      form.setValue("firstName", profile.firstName || "");
      form.setValue("lastName", profile.lastName || "");
      form.setValue("sector", profile.sector || "");
      form.setValue("function", profile.headline || "");
      form.setValue("biography", profile.biography || "");
      form.setValue("linkedinUrl", linkedinUrl);
      toast.success("LinkedIn profile parsed successfully!");
    } catch (error) {
      toast.error("Failed to parse LinkedIn profile");
    } finally {
      setParsingLinkedin(false);
    }
  };

  const onSubmit = async (data: ExpertFormData) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success("Expert updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Expert created successfully");
      }
      form.reset();
      setOpen(false);
      setEditingId(null);
      setLinkedinUrl("");
      expertsQuery.refetch();
    } catch (error) {
      toast.error("Failed to save expert");
    }
  };

  const handleEdit = (expert: any) => {
    form.reset(expert);
    setEditingId(expert.id);
    setOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    setExpertToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!expertToDelete) return;
    try {
      await deleteMutation.mutateAsync({ id: expertToDelete.id });
      toast.success("Expert deleted successfully");
      expertsQuery.refetch();
      setDeleteDialogOpen(false);
      setExpertToDelete(null);
    } catch (error) {
      toast.error("Failed to delete expert");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Experts</h1>
            <p className="text-muted-foreground mt-2">Manage your expert network</p>
          </div>
        </div>

        {/* Search and Add Button Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              placeholder="Search by name, email, sector, or function..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateUrl(e.target.value, sectorFilter, functionFilter);
              }}
              className="flex-1 min-w-0"
            />
            <Select value={sectorFilter} onValueChange={(value) => {
              setSectorFilter(value);
              updateUrl(searchTerm, value, functionFilter);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectorsQuery.data?.map(sector => (
                  <SelectItem key={sector.id} value={sector.name}>{sector.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={functionFilter} onValueChange={(value) => {
              setFunctionFilter(value);
              updateUrl(searchTerm, sectorFilter, value);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Functions</SelectItem>
                {functionsQuery.data?.map(func => (
                  <SelectItem key={func.id} value={func.name}>{func.name}</SelectItem>
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
                  setLinkedinUrl("");
                }}
                className="gap-2 whitespace-nowrap"
              >
                <Plus size={18} />
                Add Expert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Expert" : "Add New Expert"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update expert information" : "Create a new expert in your network"}
                </DialogDescription>
              </DialogHeader>

              {/* LinkedIn Parser Section */}
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Link2 size={16} />
                  Parse from LinkedIn
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                  <Button
                    onClick={handleParseLinkedin}
                    variant="outline"
                    disabled={parsingLinkedin}
                    className="gap-2"
                  >
                    {parsingLinkedin ? <Loader2 size={16} className="animate-spin" /> : "Parse"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Enter a LinkedIn URL to auto-populate profile fields</p>
              </div>

              {/* Expert Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sector</FormLabel>
                          <FormControl>
                            <Input placeholder="Technology" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="function"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Function</FormLabel>
                          <FormControl>
                            <Input placeholder="Product Manager" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="biography"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biography</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Professional background and expertise..." {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Update Expert" : "Create Expert"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Experts Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>All Experts</CardTitle>
            <CardDescription>Complete list of experts in your network</CardDescription>
          </CardHeader>
          <CardContent>
            {expertsQuery.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading experts...</div>
            ) : filteredExperts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Sector</th>
                      <th className="text-left py-3 px-4 font-semibold">Function</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExperts.map((expert) => (
                      <tr
                        key={expert.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={(e) => {
                          // Only navigate if clicking on data cells, not action buttons
                          if (e.target instanceof HTMLElement) {
                            if (e.target.closest('td:last-child')) return; // Don't navigate when clicking action buttons
                          }
                          navigate(`/admin/experts/${expert.id}`);
                        }}
                      >
                        <td className="py-3 px-4 font-medium">
                          {expert.firstName} {expert.lastName}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{expert.email}</td>
                        <td className="py-3 px-4 text-muted-foreground">{expert.sector || "-"}</td>
                        <td className="py-3 px-4 text-muted-foreground">{expert.function || "-"}</td>
                        <td className="py-3 px-4 text-right space-x-2 flex justify-end">
                          <ButtonWithTooltip variant="ghost" size="sm" tooltip="Edit this expert" onClick={(e) => { e.stopPropagation(); handleEdit(expert); }} className="gap-1">
                            <Edit2 size={16} />
                          </ButtonWithTooltip>
                          <ButtonWithTooltip
                            variant="ghost"
                            size="sm"
                            tooltip="Delete this expert"
                            onClick={(e) => { e.stopPropagation(); handleDelete(expert.id, `${expert.firstName} ${expert.lastName}`); }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </ButtonWithTooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No experts yet"
                description={searchTerm || sectorFilter || functionFilter ? "No experts match your filters. Try adjusting your search or filters." : "Add your first expert to get started"}
                actionLabel={!searchTerm && !sectorFilter && !functionFilter ? "Add Expert" : undefined}
                onAction={!searchTerm && !sectorFilter && !functionFilter ? () => setOpen(true) : undefined}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete expert"
        description="Are you sure you want to delete this expert?"
        itemName={expertToDelete?.name || ""}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </AdminLayout>
  );
}
