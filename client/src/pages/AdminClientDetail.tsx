import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Edit2, Save, Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminClientDetail() {
  const [, params] = useRoute("/admin/clients/:id");
  const [, navigate] = useLocation();
  const clientId = params?.id ? parseInt(params.id) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "" });

  // Fetch client details
  const clientQuery = trpc.clients.getById.useQuery(
    { id: clientId! },
    { enabled: !!clientId }
  );

  // Fetch sectors
  const sectorsQuery = trpc.sectors.list.useQuery();

  // Fetch client contacts
  const contactsQuery = trpc.clientContacts.listByClient.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );

  // Update client mutation
  const updateClientMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      setIsEditing(false);
      clientQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update client");
    },
  });

  // Create contact mutation
  const createContactMutation = trpc.clientContacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact added successfully");
      setContactForm({ name: "", email: "", phone: "" });
      setShowAddContact(false);
      contactsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add contact");
    },
  });

  // Delete contact mutation
  const deleteContactMutation = trpc.clientContacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact removed");
      contactsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove contact");
    },
  });

  // Initialize form data when client data loads
  useEffect(() => {
    if (clientQuery.data) {
      setFormData({
        name: clientQuery.data.name || "",
        email: clientQuery.data.email || "",
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
    await updateClientMutation.mutateAsync({
      id: clientId,
      ...formData,
    });
  };

  const handleAddContact = async () => {
    if (!contactForm.name || !contactForm.email) {
      toast.error("Name and email are required");
      return;
    }
    await createContactMutation.mutateAsync({
      clientId: clientId!,
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone || undefined,
    });
  };

  const handleDeleteContact = (contactId: number) => {
    if (confirm("Are you sure you want to remove this contact?")) {
      deleteContactMutation.mutate({ id: contactId });
    }
  };

  if (!clientId) return <div className="p-6">Invalid client ID</div>;
  if (clientQuery.isLoading) return <div className="p-6">Loading...</div>;
  if (!clientQuery.data) return <div className="p-6">Client not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{formData.name}</h1>
              <p className="text-slate-600">{formData.sector}</p>
            </div>
          </div>
          <Button
            onClick={() => (isEditing ? handleSaveClient() : setIsEditing(true))}
            disabled={updateClientMutation.isPending}
            variant={isEditing ? "default" : "outline"}
          >
            {isEditing ? (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 size={16} className="mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Details */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Company Website</Label>
                  <Input
                    type="url"
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                    disabled={!isEditing}
                    className="text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Contact Person</Label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    disabled={!isEditing}
                    className="text-slate-900"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">Sector</Label>
                  {isEditing ? (
                    <Select value={formData.sector || ""} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectorsQuery.data?.map((sector) => (
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
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Client Contacts</CardTitle>
                  <CardDescription>
                    {contactsQuery.data?.length || 0} contact{(contactsQuery.data?.length || 0) !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus size={16} className="mr-1" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          placeholder="John Doe"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          placeholder="+1 (555) 123-4567"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddContact} disabled={createContactMutation.isPending} className="w-full">
                        {createContactMutation.isPending ? "Adding..." : "Add Contact"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {!contactsQuery.data || contactsQuery.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contacts added yet</p>
                ) : (
                  <div className="space-y-3">
                    {contactsQuery.data.map((contact: any) => (
                      <div key={contact.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>                            <p className="font-semibold text-sm">{contact.contactName || contact.name}</p>                       <p className="text-xs text-slate-600 mt-1">{contact.email}</p>
                            {contact.phone && <p className="text-xs text-slate-600">{contact.phone}</p>}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={deleteContactMutation.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-slate-900">{contactsQuery.data?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600">Sector</p>
                  <p className="text-sm font-medium text-slate-900">{formData.sector || "Not set"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
