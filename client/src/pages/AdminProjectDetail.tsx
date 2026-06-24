import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Calendar, Edit2, X, Save, CheckCircle, AlertCircle, XCircle, Briefcase } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import { POPULAR_CURRENCIES, formatCurrency } from "@/shared/currencies";
import AdminLayout from "@/components/AdminLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const SHORTLIST_STATUSES = [
  { value: "attached", label: "Attached" },
  { value: "invited",  label: "Invited / Questionnaire Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "p2c_done", label: "P2C Done" },
  { value: "declined", label: "Declined" },
  { value: "calls_done", label: "Calls Done" },
];

function statusBadgeClass(status: string) {
  if (["accepted", "calls_done"].includes(status)) return "badge-success";
  if (["declined"].includes(status))               return "badge-error";
  if (["invited"].includes(status))                return "badge-warning";
  if (["p2c_done"].includes(status))               return "badge-purple";
  return "badge-info";
}

function projectStatusBadge(status: string) {
  if (status === "Active")  return "badge-success";
  if (status === "On Hold") return "badge-warning";
  if (status === "Closed")  return "badge-error";
  return "badge-neutral";
}

function projectStatusIcon(status: string) {
  if (status === "Active")  return <CheckCircle size={14} />;
  if (status === "On Hold") return <AlertCircle size={14} />;
  if (status === "Closed")  return <XCircle size={14} />;
  return null;
}

function SectionCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminProjectDetail() {
  const [, params] = useRoute("/admin/projects/:id");
  const [, navigate] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const projectQuery          = trpc.projects.getById.useQuery({ id: projectId! }, { enabled: !!projectId });
  const shortlistQuery        = trpc.shortlists.getByProject.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const activityTimelineQuery = trpc.projects.getActivityTimeline.useQuery({ projectId: projectId! }, { enabled: !!projectId });

  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success("Project updated"); setIsEditing(false); projectQuery.refetch(); activityTimelineQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to update project"),
  });

  const updateProjectStatusMutation = trpc.projects.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); projectQuery.refetch(); activityTimelineQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to update status"),
  });

  const updateStatusMutation = trpc.shortlists.update.useMutation({
    onSuccess: () => { toast.success("Status updated"); shortlistQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to update status"),
  });

  const removeFromShortlistMutation = trpc.shortlists.remove.useMutation({
    onSuccess: () => { toast.success("Expert removed"); shortlistQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to remove expert"),
  });

  if (!projectId) return <div className="p-6 text-sm text-muted-foreground">Invalid project ID</div>;
  if (projectQuery.isLoading) return <AdminLayout><div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Loading…</div></AdminLayout>;
  if (!projectQuery.data) return <AdminLayout><div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Project not found</div></AdminLayout>;

  const project             = projectQuery.data;
  const shortlistedExperts  = shortlistQuery.data || [];
  const activityTimeline    = activityTimelineQuery.data || [];

  const rateLabel = project.projectType === "Call"
    ? "Rate (60-min call)"
    : project.projectType === "Advisory" || project.projectType === "ID"
    ? "Payout"
    : "Rate";

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <PageBreadcrumb items={[
        { label: "Projects", href: "/admin/projects" },
        { label: project.name },
      ]} />

      {/* Page Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Briefcase size={22} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge-neutral">{project.projectType}</span>
              <span className={projectStatusBadge(project.status || "Active")}>
                {projectStatusIcon(project.status || "Active")}
                {project.status || "Active"}
              </span>
            </div>
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
            onClick={() => {
              if (isEditing) {
                updateProjectMutation.mutate({ id: project.id, rate: editData.rate ? parseFloat(editData.rate) : undefined, currency: editData.currency || "USD", description: editData.description || undefined });
              } else {
                setEditData({ rate: project.rate || "", currency: project.currency || "USD", description: project.description || "" });
                setIsEditing(true);
              }
            }}
            disabled={updateProjectMutation.isPending}
            style={isEditing ? { background: "var(--primary)" } : undefined}
          >
            {isEditing ? (
              <><Save size={14} className="mr-1.5" />{updateProjectMutation.isPending ? "Saving…" : "Save Changes"}</>
            ) : (
              <><Edit2 size={14} className="mr-1.5" />Edit Project</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — main */}
        <div className="lg:col-span-2 space-y-4">

          {/* Project Information */}
          <SectionCard title="Project Information">
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</Label>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{project.projectType}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rateLabel}</Label>
                  <Input type="text" className="mt-1.5 h-8 text-sm" placeholder="Enter rate" value={editData?.rate || ""} onChange={(e) => setEditData({ ...editData, rate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currency</Label>
                  <Select value={editData?.currency || "USD"} onValueChange={(v) => setEditData({ ...editData, currency: v })}>
                    <SelectTrigger className="mt-1.5 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{POPULAR_CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} – {c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
                  <textarea
                    className="mt-1.5 w-full text-sm rounded border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Project description…"
                    value={editData?.description || ""}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</Label>
                  <p className="mt-1 text-sm text-foreground">{project.projectType}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rateLabel}</Label>
                  <p className="mt-1 text-sm text-foreground font-medium">
                    {project.rate ? formatCurrency(project.rate, project.currency || "USD") : "—"}
                  </p>
                </div>
                {project.targetCompanies && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target Companies</Label>
                    <p className="mt-1 text-sm text-foreground">{project.targetCompanies}</p>
                  </div>
                )}
                {project.targetPersona && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target Persona</Label>
                    <p className="mt-1 text-sm text-foreground">{project.targetPersona}</p>
                  </div>
                )}
                {project.description && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{project.description}</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Shortlisted Experts */}
          <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Shortlisted Experts</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{shortlistedExperts.length} expert{shortlistedExperts.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {shortlistedExperts.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No experts shortlisted yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="sf-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Sector</th>
                      <th>Function</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortlistedExperts.map((shortlist: any) => (
                      <tr key={shortlist.id}>
                        <td>
                          <button onClick={() => navigate(`/admin/experts/${shortlist.expertId}`)} className="text-primary hover:underline font-medium text-sm">
                            {shortlist.expert?.firstName} {shortlist.expert?.lastName}
                          </button>
                        </td>
                        <td className="muted">{shortlist.expert?.email}</td>
                        <td className="muted">{shortlist.expert?.sector || "—"}</td>
                        <td className="muted">{shortlist.expert?.function || "—"}</td>
                        <td>
                          <Select
                            value={shortlist.status}
                            onValueChange={(v) => updateStatusMutation.mutate({ id: shortlist.id, status: v as any })}
                          >
                            <SelectTrigger className="w-44 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SHORTLIST_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => removeFromShortlistMutation.mutate({ id: shortlist.id })}
                            disabled={removeFromShortlistMutation.isPending}
                            className="inline-flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          {activityTimeline.length > 0 && (
            <SectionCard title="Activity Timeline" subtitle="Status changes and project events">
              <div className="space-y-0 divide-y divide-border -mx-5 -mb-5">
                {activityTimeline.map((event: any) => (
                  <div key={event.id} className="flex gap-3 px-5 py-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                        <Calendar size={12} className="text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                      {event.fromStatus && event.toStatus && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={projectStatusBadge(event.fromStatus)}>{event.fromStatus}</span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className={projectStatusBadge(event.toStatus)}>{event.toStatus}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right — summary */}
        <div className="space-y-4">
          {/* Status control */}
          <div className="bg-white rounded border border-border p-4" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Project Status</h3>
            <div className="flex items-center gap-3">
              <Select
                value={project.status || "Active"}
                onValueChange={(v) => updateProjectStatusMutation.mutate({ id: project.id, status: v as "Active" | "On Hold" | "Closed" })}
                disabled={updateProjectStatusMutation.isPending}
              >
                <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              {updateProjectStatusMutation.isPending && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            </div>
          </div>

          {/* Summary stats */}
          <div className="bg-white rounded border border-border p-4" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-semibold text-foreground">{project.projectType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Experts</span>
                <span className="text-sm font-semibold text-foreground">{shortlistedExperts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rate</span>
                <span className="text-sm font-semibold text-foreground">
                  {project.rate ? formatCurrency(project.rate, project.currency || "USD") : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={projectStatusBadge(project.status || "Active")}>
                  {projectStatusIcon(project.status || "Active")}
                  {project.status || "Active"}
                </span>
              </div>
            </div>
          </div>

          {/* Expert status breakdown */}
          {shortlistedExperts.length > 0 && (
            <div className="bg-white rounded border border-border p-4" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Expert Pipeline</h3>
              <div className="space-y-2">
                {Array.from(new Set(shortlistedExperts.map((s: any) => s.status))).map((status: any) => {
                  const count = shortlistedExperts.filter((s: any) => s.status === status).length;
                  const label = SHORTLIST_STATUSES.find(s => s.value === status)?.label || status;
                  return (
                    <div key={status} className="flex justify-between items-center">
                      <span className={statusBadgeClass(status)}>{label}</span>
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
