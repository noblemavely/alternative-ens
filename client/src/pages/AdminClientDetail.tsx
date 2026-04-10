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
  const [showAddMapping, setShowAddMapping] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<string>("");
  const [mappingStatus, setMappingStatus] = useState("shortlisted");

  // Fetch client details
  const clientQuery = trpc.clients.getById.useQuery(
    { id: clientId! },
    { enabled: !!clientId }
  );

  // Fetch experts
  const expertsQuery = trpc.experts.list.useQuery();

  // Fetch client mappings
  // TODO: Implement expert-client mappings
  // const mappingsQuery = trpc.expertClientMapping.listByClient.useQuery(
  //   { clientId: clientId! },
  //   { enabled: !!clientId }
  // );

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

  // Create mapping mutation
  // const createMappingMutation = trpc.expertClientMapping.create.useMutation({
  //   onSuccess: () => {
  //     toast.success("Expert mapped successfully");
  //     setSelectedExpert("");
  //     setMappingStatus("shortlisted");
  //     setShowAddMapping(false);
  //     mappingsQuery.refetch();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error.message || "Failed to map expert");
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

  const handleAddMapping = () => {
    if (!selectedExpert) {
      toast.error("Please select an expert");
      return;
    }
    // TODO: Implement expert-client mapping
    // createMappingMutation.mutate({
    //   clientId: clientId!,
    //   expertId: parseInt(selectedExpert),
    //   status: mappingStatus as any,
    // });
  };

  // const handleRemoveMapping = (mappingId: number) => {
  //   if (confirm("Are you sure you want to remove this mapping?")) {
  //     deleteMappingMutation.mutate({ id: mappingId });
  //   }
  // };

  if (!clientId) return <div className="p-6">Invalid client ID</div>;
  if (clientQuery.isLoading) return <div className="p-6">Loading...</div>;
  if (!clientQuery.data) return <div className="p-6">Client not found</div>;

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{formData.name}</h1>
              <p className="text-slate-600">{formData.companyName}</p>
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
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Company Name</Label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Mapped Experts */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Mapped Experts</CardTitle>
                  <CardDescription>
                    0 experts
                  </CardDescription>
                </div>
                <Dialog open={showAddMapping} onOpenChange={setShowAddMapping}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus size={16} className="mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Map Expert to Client</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Select Expert</Label>
                        <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an expert..." />
                          </SelectTrigger>
                          <SelectContent>
                            {expertsQuery.data?.map((expert) => (
                              <SelectItem key={expert.id} value={expert.id.toString()}>
                                {expert.firstName} {expert.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={mappingStatus} onValueChange={setMappingStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.replace(/_/g, " ").toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddMapping} disabled={false} className="w-full">
                        Add Mapping
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {true ? (
                  <p className="text-sm text-muted-foreground">No experts mapped yet</p>
                ) : (
                  <div className="space-y-3">
                    {[].map((mapping: any) => (
                      <div key={mapping.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{mapping.expertName}</p>
                            <p className="text-xs text-primary font-medium mt-1">{mapping.status}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {}}
                            disabled={false}
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
        </div>
      </div>
    </div>
  );
}
