import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Users, Briefcase, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const clientsQuery = trpc.clients.list.useQuery();
  const expertsQuery = trpc.experts.list.useQuery();
  const projectsQuery = trpc.projects.list.useQuery();

  const stats = [
    {
      title: "Total Experts",
      value: expertsQuery.data?.length || 0,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Active Projects",
      value: projectsQuery.data?.length || 0,
      icon: Briefcase,
      color: "text-purple-600",
    },
    {
      title: "Total Clients",
      value: clientsQuery.data?.length || 0,
      icon: Users,
      color: "text-blue-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Alternative</h1>
          <p className="text-muted-foreground mt-2">Manage your expert network with elegance and precision</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const handleClick = () => {
              if (stat.title === "Total Clients") window.location.href = "/admin/clients";
              if (stat.title === "Total Experts") window.location.href = "/admin/experts";
              if (stat.title === "Active Projects") window.location.href = "/admin/projects";
            };
            return (
              <Card 
                key={stat.title} 
                className="card-elegant cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={handleClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">Click to view</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>Latest added clients to your network</CardDescription>
            </CardHeader>
            <CardContent>
              {clientsQuery.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : clientsQuery.data && clientsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {clientsQuery.data.slice(0, 5).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors">
                      <div>
                        <p className="font-medium text-sm">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No clients yet</div>
              )}
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Recent Experts</CardTitle>
              <CardDescription>Latest added experts to your network</CardDescription>
            </CardHeader>
            <CardContent>
              {expertsQuery.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : expertsQuery.data && expertsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {expertsQuery.data.slice(0, 5).map((expert) => (
                    <div key={expert.id} className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors">
                      <div>
                        <p className="font-medium text-sm">
                          {expert.firstName} {expert.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{expert.sector || "No sector"}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${expert.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {expert.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No experts yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
