import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Trash2, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import { STATUS_LABELS, STATUS_COLORS } from "@shared/statusLabels";

export default function AdminProjectDetail() {
  const [, params] = useRoute("/admin/projects/:id");
  const [, navigate] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : null;

  // Fetch project details
  const projectQuery = trpc.projects.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  // Fetch shortlisted experts
  const shortlistQuery = trpc.shortlists.getByProject.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  // Fetch project activity timeline
  const activityTimelineQuery = trpc.projects.getActivityTimeline.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  // Update project status mutation
  const updateProjectStatusMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project status updated");
      projectQuery.refetch();
      activityTimelineQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update project status");
    },
  });

  // Update status mutation
  const updateStatusMutation = trpc.shortlists.update.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      shortlistQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  // Remove from shortlist mutation
  const removeFromShortlistMutation = trpc.shortlists.remove.useMutation({
    onSuccess: () => {
      toast.success("Expert removed from shortlist");
      shortlistQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove expert");
    },
  });

  if (!projectId) return <div>Invalid project ID</div>;
  if (projectQuery.isLoading) return <div className="p-6">Loading...</div>;
  if (!projectQuery.data) return <div className="p-6">Project not found</div>;

  const project = projectQuery.data;
  const shortlistedExperts = shortlistQuery.data || [];
  const activityTimeline = activityTimelineQuery.data || [];

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "On Hold":
        return "bg-amber-100 text-amber-700";
      case "Closed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="w-4 h-4" />;
      case "On Hold":
        return <AlertCircle className="w-4 h-4" />;
      case "Closed":
        return <Trash2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-slate-600">
              <Badge variant="outline" className="mt-1">{project.projectType}</Badge>
            </p>
          </div>
        </div>

        {/* Project Details */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Type</label>
                <p className="text-slate-900">{project.projectType}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Hourly Rate</label>
                <p className="text-slate-900">${project.hourlyRate}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Target Companies</label>
                <p className="text-slate-900">{project.targetCompanies || "N/A"}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Target Persona</label>
                <p className="text-slate-900">{project.targetPersona || "N/A"}</p>
              </div>
            </div>
            {project.description && (
              <div>
                <label className="text-xs font-semibold text-slate-600">Description</label>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Project Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Current Status</label>
                <Select
                  value={project.status || "Active"}
                  onValueChange={(value) =>
                    updateProjectStatusMutation.mutate({
                      id: project.id,
                      status: value as "Active" | "On Hold" | "Closed",
                    })
                  }
                  disabled={updateProjectStatusMutation.isPending}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-shrink-0">
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${getStatusBadgeStyle(project.status || "Active")}`}>
                  {getStatusIcon(project.status || "Active")}
                  {project.status || "Active"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        {activityTimeline.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
              <CardDescription>Track all status changes and project events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityTimeline.map((event: any) => (
                  <div key={event.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 pt-1">
                      <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                      {event.fromStatus && event.toStatus && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeStyle(event.fromStatus)}`}>
                            {event.fromStatus}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeStyle(event.toStatus)}`}>
                            {event.toStatus}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shortlisted Experts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Shortlisted Experts ({shortlistedExperts.length})</CardTitle>
            <CardDescription>Manage experts shortlisted for this project</CardDescription>
          </CardHeader>
          <CardContent>
            {shortlistedExperts.length === 0 ? (
              <p className="text-slate-600 text-sm py-8 text-center">No experts shortlisted yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Sector</th>
                      <th className="text-left py-3 px-4 font-semibold">Function</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortlistedExperts.map((shortlist: any) => (
                      <tr key={shortlist.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium">
                          <button
                            onClick={() => navigate(`/admin/experts/${shortlist.expertId}`)}
                            className="text-blue-600 hover:underline"
                          >
                            {shortlist.expert?.firstName} {shortlist.expert?.lastName}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{shortlist.expert?.email}</td>
                        <td className="py-3 px-4 text-slate-600">{shortlist.expert?.sector || "-"}</td>
                        <td className="py-3 px-4 text-slate-600">{shortlist.expert?.function || "-"}</td>
                        <td className="py-3 px-4">
                          <Select
                            value={shortlist.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({
                                id: shortlist.id,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="attempting_contact">Attempting Contact</SelectItem>
                              <SelectItem value="engaged">Engaged</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                              <SelectItem value="negotiation">Negotiation</SelectItem>
                              <SelectItem value="verbal_agreement">Verbal Agreement</SelectItem>
                              <SelectItem value="closed_won">Closed – Won</SelectItem>
                              <SelectItem value="closed_lost">Closed – Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeFromShortlistMutation.mutate({ id: shortlist.id })
                            }
                            disabled={removeFromShortlistMutation.isPending}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
