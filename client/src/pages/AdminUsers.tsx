import { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Shield, User, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminUsers() {
  const [, navigate] = useLocation();

  // Fetch admin users
  const usersQuery = trpc.adminAuth.listUsers.useQuery();

  // Delete mutation
  const deleteMutation = trpc.adminAuth.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Admin user deleted");
      usersQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const handleEdit = (adminId: number) => {
    navigate(`/admin/users/${adminId}/edit`);
  };

  const handleDelete = (adminId: number) => {
    if (confirm("Are you sure you want to delete this admin user?")) {
      deleteMutation.mutate({ id: adminId });
    }
  };

  const admins = usersQuery.data || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/settings")}
          className="gap-2 -ml-4"
        >
          <ArrowLeft size={16} />
          Back to Settings
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
            <p className="text-muted-foreground mt-2">Manage administrator accounts and permissions</p>
          </div>
          <Button onClick={() => navigate("/admin/users/new")} className="gap-2">
            <Plus size={16} />
            Add Admin User
          </Button>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Administrators</CardTitle>
          <CardDescription>Total: {admins.length} admin user(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading admin users...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No admin users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin: any) => (
                    <tr key={admin.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={16} className="text-primary" />
                          </div>
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{admin.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={admin.role === "super_admin" ? "default" : "secondary"}>
                          <Shield size={12} className="mr-1" />
                          {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(admin.id)}
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(admin.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
