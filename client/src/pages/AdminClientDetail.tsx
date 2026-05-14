import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Edit2, Save, Trash2, Plus, X, Phone, Globe, User, Building2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/AdminLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

function FieldRow({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={12} />}
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function AdminClientDetail() {
  const [, params] = useRoute("/admin/clients/:id");
  const [, navigate] = useLocation();
  const clientId = params?.id ? parseInt(params.id) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "" });

  const clientQuery = trpc.clients.getById.useQuery({ id: clientId! }, { enabled: !!clientId });
  const sectorsQuery = trpc.sectors.list.useQuery();
  const contactsQuery = trpc.clientContacts.listByClient.useQuery({ clientId: clientId! }, { enabled: !!clientId });
  const projectsQuery = trpc.projects.list.useQuery();
  const allContactsQuery = trpc.clientContacts.list.useQuery();

  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => { toast.success("Client updated"); setIsEditing(false); clientQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to update client"),
  });

  const createContactMutation = trpc.clientContacts.create.useMutation({
    onSuccess: () => { toast.success("Contact added"); setContactForm({ name: "", email: "", phone: "" }); setShowAddContact(false); contactsQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to add contact"),
  });

  const deleteContactMutation = trpc.clientContacts.delete.useMutation({
    onSuccess: () => { toast.success("Contact removed"); contactsQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to remove contact"),
  });

  useEffect(() => {
    if (clientQuery.data) {
      setFormData({
        name: clientQuery.data.name || "",
        phone: clientQuery.data.phone || "",
        companyName: clientQuery.data.companyName || "",
        companyWebsite: clientQuery.data.companyWebsite || "",
        contactPerson: clientQuery.data.contactPerson || "",
        sector: clientQuery.data.sector || "",
      });
    }
  }, [clientQuery.data]);

  const handleSaveClient = async () => {
    if (!clientId) return;
    await updateClientMutation.mutateAsync({ id: clientId, ...formData });
  };

  const handleAddContact = async () => {
    if (!contactForm.name || !contactForm.email) { toast.error("Name and email are required"); return; }
    await createContactMutation.mutateAsync({ clientId: clientId!, name: contactForm.name, email: contactForm.email, phone: contactForm.phone || undefined });
  };

  const handleDeleteContact = (contactId: number) => {
    if (confirm("Remove this contact?")) deleteContactMutation.mutate({ id: contactId });
  };

  if (!clientId) return <div className="p-6 text-sm text-muted-foreground">Invalid client ID</div>;
  if (clientQuery.isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Loading…</div>
    </AdminLayout>
  );
  if (!clientQuery.data) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Client not found</div>
    </AdminLayout>
  );

  const clientContactIds = allContactsQuery.data?.filter((c: any) => c.clientId === clientId).map((c: any) => c.id) || [];
  const projectCount = projectsQuery.data?.filter((p: any) => clientContactIds.includes(p.clientContactId)).length || 0;

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <PageBreadcrumb items={[
        { label: "Clients", href: "/admin/clients" },
        { label: formData.name || "Client Detail" },
      ]} />

      {/* Page Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-[#E8F4FD] flex items-center justify-center flex-shrink-0">
            <Building2 size={22} className="text-[#0176D3]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{formData.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formData.sector || "No sector"} · {projectCount} project{projectCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              <X size={14} className="mr-1.5" /> Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => isEditing ? handleSaveClient() : setIsEditing(true)}
            disabled={updateClientMutation.isPending}
            style={isEditing ? { background: "#0176D3" } : undefined}
          >
            {isEditing ? (
              <><Save size={14} className="mr-1.5" />{updateClientMutation.isPending ? "Saving…" : "Save Changes"}</>
            ) : (
              <><Edit2 size={14} className="mr-1.5" />Edit Profile</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column — client info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client Information card */}
          <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Client Information</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow label="Phone" icon={Phone}>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="h-8 text-sm"
                />
              </FieldRow>
              <FieldRow label="Website" icon={Globe}>
                <Input
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                  disabled={!isEditing}
                  className="h-8 text-sm"
                />
              </FieldRow>
              <FieldRow label="Contact Person" icon={User}>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  disabled={!isEditing}
                  className="h-8 text-sm"
                />
              </FieldRow>
              <FieldRow label="Sector">
                {isEditing ? (
                  <Select value={formData.sector || ""} onValueChange={(v) => setFormData({ ...formData, sector: v })}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorsQuery.data?.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={formData.sector} disabled className="h-8 text-sm" />
                )}
              </FieldRow>
            </div>
          </div>

          {/* Contacts card */}
          <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Client Contacts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {contactsQuery.data?.length || 0} contact{(contactsQuery.data?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Plus size={12} /> Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name *</Label>
                      <Input className="mt-1.5 h-8 text-sm" placeholder="John Doe" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email *</Label>
                      <Input type="email" className="mt-1.5 h-8 text-sm" placeholder="john@example.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</Label>
                      <Input className="mt-1.5 h-8 text-sm" placeholder="+1 (555) 123-4567" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                    </div>
                    <Button onClick={handleAddContact} disabled={createContactMutation.isPending} className="w-full" style={{ background: "#0176D3" }}>
                      {createContactMutation.isPending ? "Adding…" : "Add Contact"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y divide-border">
              {!contactsQuery.data || contactsQuery.data.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No contacts added yet</div>
              ) : (
                contactsQuery.data.map((contact: any) => (
                  <div key={contact.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">
                      {(contact.contactName || contact.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{contact.contactName || contact.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail size={10} />{contact.email}
                        </span>
                        {contact.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone size={10} />{contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      disabled={deleteContactMutation.isPending}
                      className="p-1.5 rounded text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column — summary */}
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="bg-white rounded border border-border p-4" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projects</span>
                <span className="text-sm font-semibold text-foreground">{projectCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Contacts</span>
                <span className="text-sm font-semibold text-foreground">{contactsQuery.data?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sector</span>
                <span className="text-sm font-semibold text-foreground">{formData.sector || "—"}</span>
              </div>
            </div>
          </div>

          {/* Projects linked */}
          {projectCount > 0 && (
            <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Projects</h3>
              </div>
              <div className="divide-y divide-border">
                {projectsQuery.data
                  ?.filter((p: any) => clientContactIds.includes(p.clientContactId))
                  .map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/admin/projects/${p.id}`)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[#F3F8FE] transition-colors"
                    >
                      <span className="text-sm text-[#0176D3] hover:underline font-medium">{p.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
