import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditAdminUser() {
  const [, params] = useRoute("/admin/users/:id/edit");
  const [, navigate] = useLocation();
  const userId = params?.id ? parseInt(params.id) : null;

  const [formData, setFormData] = useState({ name: "", email: "", role: "admin" });

  // Fetch admin user
  const userQuery = trpc.adminAuth.getUserById.useQuery(
    { id: userId! },
    { enabled: !!userId }
  );

  // Update admin user mutation
  const updateMutation = trpc.adminAuth.updateUser.useMutation({
    onSuccess: () => {
      toast.success("Admin user updated successfully");
      navigate("/admin/users");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update admin user");
    },
  });

  useEffect(() => {
    if (userQuery.data) {
      setFormData({
        name: userQuery.data.name || "",
        email: userQuery.data.email || "",
        role: userQuery.data.role || "admin",
      });
    }
  }, [userQuery.data]);

  const handleSave = async () => {
    if (!userId) return;
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }
    await updateMutation.mutateAsync({
      id: userId,
      name: formData.name,
      email: formData.email,
      role: formData.role as "admin" | "super_admin",
    });
  };

  if (!userId) return <div className="p-6">Invalid user ID</div>;
  if (userQuery.isLoading) return <div className="p-6">Loading...</div>;
  if (!userQuery.data) return <div className="p-6">Admin user not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Edit Admin User</h1>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
