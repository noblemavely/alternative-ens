import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Edit2, Save, Trash2, Plus, FileText, X,
  Mail, Phone, Briefcase, GraduationCap, UserCircle2, Link2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ActivityTimeline from "@/components/ActivityTimeline";
import DocumentViewer from "@/components/DocumentViewer";
import { EmploymentHistoryForm } from "@/components/EmploymentHistoryForm";
import { EducationHistoryForm } from "@/components/EducationHistoryForm";
import { ExpertNotesSection } from "@/components/ExpertNotesSection";
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

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const SHORTLIST_STATUSES = [
  { value: "pending",           label: "Pending" },
  { value: "new",               label: "New" },
  { value: "shortlisted",       label: "Shortlisted" },
  { value: "contacted",         label: "Contacted" },
  { value: "attempting_contact",label: "Attempting Contact" },
  { value: "engaged",           label: "Engaged" },
  { value: "qualified",         label: "Qualified" },
  { value: "proposal_sent",     label: "Proposal Sent" },
  { value: "negotiation",       label: "Negotiation" },
  { value: "verbal_agreement",  label: "Verbal Agreement" },
  { value: "closed_won",        label: "Closed Won" },
  { value: "closed_lost",       label: "Closed Lost" },
  { value: "interested",        label: "Interested" },
  { value: "rejected",          label: "Rejected" },
];

function statusBadgeClass(status: string) {
  if (["closed_won", "qualified", "engaged", "interested"].includes(status)) return "badge-success";
  if (["closed_lost", "rejected"].includes(status)) return "badge-error";
  if (["proposal_sent", "negotiation", "verbal_agreement"].includes(status)) return "badge-warning";
  return "badge-info";
}

export default function AdminExpertDetail() {
  const [, params] = useRoute("/admin/experts/:id");
  const [, navigate] = useLocation();
  const expertId = params?.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [shortlistNotes, setShortlistNotes] = useState("");
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedCVFile, setSelectedCVFile] = useState<File | null>(null);
  const [editingShortlistId, setEditingShortlistId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [employmentHistory, setEmploymentHistory] = useState<any[]>([]);
  const [educationHistory, setEducationHistory] = useState<any[]>([]);

  const expertQuery                = trpc.experts.getById.useQuery({ id: expertId! }, { enabled: !!expertId });
  const projectsQuery              = trpc.projects.list.useQuery({ limit: 1000 });
  const shortlistedProjectsQuery   = trpc.shortlists.getByExpert.useQuery({ expertId: expertId! }, { enabled: !!expertId });
  const clientsQuery               = trpc.clients.list.useQuery({ limit: 1000 });
  const contactsQuery              = trpc.clientContacts.list.useQuery({ limit: 1000 });
  const sectorsQuery               = trpc.sectors.list.useQuery();
  const functionsQuery             = trpc.functions.list.useQuery();
  const expertProjectsQuery        = trpc.experts.getProjectsForExpert.useQuery({ expertId: expertId! }, { enabled: !!expertId });
  const activityTimelineQuery      = trpc.experts.getActivityTimeline.useQuery({ expertId: expertId! }, { enabled: !!expertId });
  const projectActivityQuery       = trpc.experts.getProjectActivityTimeline.useQuery({ expertId: expertId!, projectId: selectedProjectId || 0 }, { enabled: !!expertId && !!selectedProjectId });
  const employmentQuery            = trpc.expertEmployment.getByExpert.useQuery({ expertId: expertId! }, { enabled: !!expertId });
  const educationQuery             = trpc.expertEducation.getByExpert.useQuery({ expertId: expertId! }, { enabled: !!expertId });

  const uploadCVMutation       = trpc.upload.uploadCV.useMutation({ onError: (e: any) => toast.error(e.message || "Failed to upload CV") });
  const updateExpertMutation   = trpc.experts.update.useMutation({ onSuccess: () => { toast.success("Expert updated"); setIsEditing(false); setSelectedCVFile(null); expertQuery.refetch(); }, onError: (e: any) => toast.error(e.message || "Failed to update expert") });
  const shortlistMutation      = trpc.shortlists.add.useMutation({ onSuccess: () => { toast.success("Expert shortlisted"); setSelectedProject(""); setShortlistNotes(""); setShowShortlistModal(false); shortlistedProjectsQuery.refetch(); }, onError: (e: any) => toast.error(e.message || "Failed to shortlist") });
  const updateShortlistMutation = trpc.shortlists.update.useMutation({ onSuccess: () => { toast.success("Status updated"); setEditingShortlistId(null); setEditingStatus(""); shortlistedProjectsQuery.refetch(); projectActivityQuery.refetch(); }, onError: (e: any) => toast.error(e.message || "Failed to update status") });

  const addEmploymentMutation    = trpc.expertEmployment.add.useMutation({ onSuccess: () => { toast.success("Employment added"); employmentQuery.refetch(); }, onError: (e: any) => toast.error(e.message) });
  const updateEmploymentMutation = trpc.expertEmployment.update.useMutation({ onSuccess: () => { toast.success("Employment updated"); employmentQuery.refetch(); }, onError: (e: any) => toast.error(e.message) });
  const deleteEmploymentMutation = trpc.expertEmployment.delete.useMutation({ onSuccess: () => { toast.success("Employment deleted"); employmentQuery.refetch(); }, onError: (e: any) => toast.error(e.message) });
  const addEducationMutation     = trpc.expertEducation.add.useMutation({ onSuccess: () => { toast.success("Education added"); educationQuery.refetch(); }, onError: (e: any) => toast.error(e.message) });
  const updateEducationMutation  = trpc.expertEducation.update.useMutation({ onSuccess: () => { toast.success("Education updated"); educationQuery.refetch(); }, onError: (e: any) => toast.error(e.message) });
  const deleteEducationMutation  = trpc.expertEducation.delete.useMutation({ onSuccess: () => { toast.success("Education deleted"); educationQuery.refetch(); }, onError: (e: any) => toast.error(e.message) });

  useEffect(() => { if (expertQuery.data) setFormData({ firstName: expertQuery.data.firstName || "", lastName: expertQuery.data.lastName || "", email: expertQuery.data.email || "", phone: expertQuery.data.phone || "", sector: expertQuery.data.sector || "", function: expertQuery.data.function || "", biography: expertQuery.data.biography || "", cvUrl: expertQuery.data.cvUrl || "", cvKey: expertQuery.data.cvKey || "" }); }, [expertQuery.data]);
  useEffect(() => { if (employmentQuery.data) setEmploymentHistory(employmentQuery.data); }, [employmentQuery.data]);
  useEffect(() => { if (educationQuery.data) setEducationHistory(educationQuery.data); }, [educationQuery.data]);
  useEffect(() => { if (expertProjectsQuery.data?.length && !selectedProjectId) setSelectedProjectId(expertProjectsQuery.data[0].id); }, [expertProjectsQuery.data, selectedProjectId]);

  const handleSaveExpert = async () => {
    if (!expertId) return;
    if (selectedCVFile) {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(selectedCVFile);
        });
        const uploadResult = await uploadCVMutation.mutateAsync({ fileName: selectedCVFile.name, fileData: base64Data, contentType: selectedCVFile.type || "application/pdf" });
        await updateExpertMutation.mutateAsync({ id: expertId, ...formData, cvUrl: uploadResult.url, cvKey: uploadResult.key });
      } catch { toast.error("Failed to upload CV file"); }
    } else {
      await updateExpertMutation.mutateAsync({ id: expertId, ...formData });
    }
  };

  const handleShortlist = () => {
    if (!selectedProject) { toast.error("Please select a project"); return; }
    shortlistMutation.mutate({ projectId: parseInt(selectedProject), expertId: expertId!, notes: shortlistNotes || undefined });
  };

  const handleStatusChange = (shortlistId: number, newStatus: string) => {
    updateShortlistMutation.mutate({ id: shortlistId, status: newStatus as any });
  };

  if (!expertId) return <div className="p-6 text-sm text-muted-foreground">Invalid expert ID</div>;
  if (expertQuery.isLoading) return <AdminLayout><div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Loading…</div></AdminLayout>;
  if (!expertQuery.data) return <AdminLayout><div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Expert not found</div></AdminLayout>;

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.email;
  const initials = ((formData.firstName?.[0] ?? "") + (formData.lastName?.[0] ?? "")).toUpperCase() || "E";

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <PageBreadcrumb items={[
        { label: "Experts", href: "/admin/experts" },
        { label: fullName || "Expert Detail" },
      ]} />

      {/* Page Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-base font-bold text-emerald-700">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{fullName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formData.sector || "No sector"}{formData.function ? ` · ${formData.function}` : ""}
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
            onClick={() => isEditing ? handleSaveExpert() : setIsEditing(true)}
            disabled={updateExpertMutation.isPending}
            style={isEditing ? { background: "var(--primary)" } : undefined}
          >
            {isEditing ? (
              <><Save size={14} className="mr-1.5" />{updateExpertMutation.isPending ? "Saving…" : "Save Changes"}</>
            ) : (
              <><Edit2 size={14} className="mr-1.5" />Edit Profile</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-4">

          {/* Professional Information */}
          <SectionCard title="Professional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow label="First Name">
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} disabled={!isEditing} className="h-8 text-sm" />
              </FieldRow>
              <FieldRow label="Last Name">
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} disabled={!isEditing} className="h-8 text-sm" />
              </FieldRow>
              <FieldRow label="Email" icon={Mail}>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!isEditing} className="h-8 text-sm" />
              </FieldRow>
              <FieldRow label="Phone" icon={Phone}>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!isEditing} className="h-8 text-sm" />
              </FieldRow>
              <FieldRow label="Sector">
                {isEditing ? (
                  <Select value={formData.sector} onValueChange={(v) => setFormData({ ...formData, sector: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select sector…" /></SelectTrigger>
                    <SelectContent>{sectorsQuery.data?.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={formData.sector} disabled className="h-8 text-sm" />
                )}
              </FieldRow>
              <FieldRow label="Function">
                {isEditing ? (
                  <Select value={formData.function} onValueChange={(v) => setFormData({ ...formData, function: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select function…" /></SelectTrigger>
                    <SelectContent>{functionsQuery.data?.map((f: any) => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={formData.function} disabled className="h-8 text-sm" />
                )}
              </FieldRow>
              <div className="sm:col-span-2">
                <FieldRow label="Biography">
                  <Textarea value={formData.biography} onChange={(e) => setFormData({ ...formData, biography: e.target.value })} disabled={!isEditing} className="text-sm resize-none" rows={3} />
                </FieldRow>
              </div>
            </div>

            {/* CV section */}
            <div className="mt-4 pt-4 border-t border-border">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2">
                <FileText size={12} /> CV / Resume
              </Label>
              {!isEditing ? (
                formData.cvUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border border-[#B3D9F7]">
                    <FileText size={18} className="text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">CV Document</p>
                      <p className="text-xs text-muted-foreground truncate">{formData.cvKey || "Resume uploaded"}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDocumentViewerOpen(true)}>
                      View
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No CV uploaded</p>
                )
              ) : (
                <div className="space-y-3">
                  {formData.cvUrl && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border border-[#B3D9F7]">
                      <FileText size={18} className="text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Current CV</p>
                        <p className="text-xs text-muted-foreground truncate">{formData.cvKey}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.open(formData.cvUrl, "_blank")}>View</Button>
                    </div>
                  )}
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setSelectedCVFile(e.target.files?.[0] || null)} className="h-8 text-sm" />
                  {selectedCVFile && <p className="text-xs text-emerald-700 font-medium">✓ {selectedCVFile.name} selected</p>}
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX · Max 10 MB</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Employment History */}
          {isEditing ? (
            <SectionCard title="Employment History">
              <EmploymentHistoryForm
                entries={employmentHistory.map((emp: any) => ({ id: emp.id?.toString(), company: emp.companyName, position: emp.position, startDate: emp.startDate, endDate: emp.endDate, currentlyWorking: emp.isCurrent, description: emp.description }))}
                onAdd={(e) => addEmploymentMutation.mutate({ expertId: expertId!, companyName: e.company, position: e.position, startDate: e.startDate, endDate: e.endDate || undefined, isCurrent: e.currentlyWorking, description: e.description || undefined })}
                onUpdate={(e) => { if (e.id) updateEmploymentMutation.mutate({ id: parseInt(e.id), company: e.company, position: e.position, startDate: e.startDate, endDate: e.endDate, currentlyWorking: e.currentlyWorking, description: e.description }); }}
                onDelete={(id) => deleteEmploymentMutation.mutate({ id: parseInt(id) })}
              />
            </SectionCard>
          ) : employmentHistory.length > 0 ? (
            <SectionCard title="Employment History">
              <div className="divide-y divide-border -mx-5 -mb-5">
                {employmentHistory.map((emp: any) => (
                  <div key={emp.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Briefcase size={14} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{emp.position}</p>
                        <p className="text-sm text-muted-foreground">{emp.companyName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {emp.startDate}{emp.isCurrent ? " – Present" : emp.endDate ? ` – ${emp.endDate}` : ""}
                        </p>
                        {emp.description && <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">{emp.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {/* Education History */}
          {isEditing ? (
            <SectionCard title="Education History">
              <EducationHistoryForm
                entries={educationHistory.map((edu: any) => ({ id: edu.id?.toString(), school: edu.schoolName, degree: edu.degree, field: edu.fieldOfStudy, startDate: edu.startDate, endDate: edu.endDate, description: edu.description }))}
                onAdd={(e) => addEducationMutation.mutate({ expertId: expertId!, schoolName: e.school, degree: e.degree, fieldOfStudy: e.field, startDate: e.startDate, endDate: e.endDate || undefined, description: e.description || undefined })}
                onUpdate={(e) => { if (e.id) updateEducationMutation.mutate({ id: parseInt(e.id), school: e.school, degree: e.degree, fieldOfStudy: e.field, startDate: e.startDate, endDate: e.endDate }); }}
                onDelete={(id) => deleteEducationMutation.mutate({ id: parseInt(id) })}
              />
            </SectionCard>
          ) : educationHistory.length > 0 ? (
            <SectionCard title="Education History">
              <div className="divide-y divide-border -mx-5 -mb-5">
                {educationHistory.map((edu: any) => (
                  <div key={edu.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-[#F3F2FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GraduationCap size={14} className="text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}</p>
                        <p className="text-sm text-muted-foreground">{edu.schoolName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {/* Notes */}
          <div className="bg-white rounded border border-border p-5" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Notes</h3>
            <ExpertNotesSection expertId={expertId!} />
          </div>

          {/* Projects & Shortlisting */}
          <div className="bg-white rounded border border-border" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Projects & Shortlisting</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {shortlistedProjectsQuery.data?.length || 0} project{(shortlistedProjectsQuery.data?.length || 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <Dialog open={showShortlistModal} onOpenChange={setShowShortlistModal}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"><Plus size={12} /> Add to Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Expert to Project</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Client *</Label>
                      <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setSelectedProject(""); }}>
                        <SelectTrigger className="mt-1.5 h-8 text-sm"><SelectValue placeholder="Choose a client…" /></SelectTrigger>
                        <SelectContent>{(clientsQuery.data?.items ?? []).map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.companyName || c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Project *</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject} disabled={!selectedClient}>
                        <SelectTrigger className="mt-1.5 h-8 text-sm"><SelectValue placeholder={selectedClient ? "Choose a project…" : "Select a client first…"} /></SelectTrigger>
                        <SelectContent>
                          {(projectsQuery.data?.items ?? []).filter((p: any) => (contactsQuery.data?.items ?? []).find((c: any) => c.id === p.clientContactId)?.clientId?.toString() === selectedClient).map((p: any) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes (Optional)</Label>
                      <Textarea className="mt-1.5 text-sm resize-none" placeholder="Notes for this project…" value={shortlistNotes} onChange={(e) => setShortlistNotes(e.target.value)} rows={3} />
                    </div>
                    <Button onClick={handleShortlist} disabled={shortlistMutation.isPending || !selectedProject} className="w-full" style={{ background: "var(--primary)" }}>
                      {shortlistMutation.isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Shortlisting…</> : "Shortlist Expert"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y divide-border">
              {!shortlistedProjectsQuery.data || shortlistedProjectsQuery.data.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No projects assigned yet</div>
              ) : (
                shortlistedProjectsQuery.data.map((shortlist: any) => {
                  const project = (projectsQuery.data?.items ?? []).find((p: any) => p.id === shortlist.projectId);
                  const contact = (contactsQuery.data?.items ?? []).find((c: any) => c.id === project?.clientContactId);
                  const client  = (clientsQuery.data?.items ?? []).find((c: any) => c.id === contact?.clientId);
                  const isEditingThis = editingShortlistId === shortlist.id;

                  return (
                    <div key={shortlist.id} className="px-5 py-4 hover:hover:bg-primary/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <button onClick={() => setLocation(`/admin/projects/${project?.id}`)} className="text-sm font-semibold text-primary hover:underline">
                            {project?.name}
                          </button>
                          <p className="text-xs text-muted-foreground mt-0.5">Client: {client?.name || "Unknown"}</p>
                          <div className="mt-2">
                            {isEditingThis ? (
                              <div className="flex items-center gap-2">
                                <Select value={editingStatus} onValueChange={setEditingStatus}>
                                  <SelectTrigger className="w-44 h-7 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>{SHORTLIST_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button size="sm" className="h-7 text-xs" style={{ background: "var(--primary)" }} onClick={() => handleStatusChange(shortlist.id, editingStatus)} disabled={updateShortlistMutation.isPending}>
                                  {updateShortlistMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingShortlistId(null); setEditingStatus(""); }}>Cancel</Button>
                              </div>
                            ) : (
                              <span className={statusBadgeClass(shortlist.status)}>{SHORTLIST_STATUSES.find(s => s.value === shortlist.status)?.label || shortlist.status}</span>
                            )}
                          </div>
                          {shortlist.notes && <p className="text-xs text-muted-foreground mt-2 italic">{shortlist.notes}</p>}
                        </div>
                        {!isEditingThis && (
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" onClick={() => { setEditingShortlistId(shortlist.id); setEditingStatus(shortlist.status); }}>
                            Edit Status
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          {expertProjectsQuery.data && expertProjectsQuery.data.length > 0 ? (
            <SectionCard title="Activity Timeline">
              <div className="space-y-3">
                <Select value={selectedProjectId?.toString() || ""} onValueChange={(v) => setSelectedProjectId(parseInt(v))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select project to view activity" /></SelectTrigger>
                  <SelectContent>{expertProjectsQuery.data.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                {selectedProjectId && (
                  <ActivityTimeline
                    events={projectActivityQuery.data || []}
                    projectName={expertProjectsQuery.data.find((p: any) => p.id === selectedProjectId)?.name}
                    isLoading={projectActivityQuery.isLoading}
                  />
                )}
              </div>
            </SectionCard>
          ) : (
            <ActivityTimeline events={activityTimelineQuery.data || []} isLoading={activityTimelineQuery.isLoading} />
          )}
        </div>

        {/* Right — summary sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded border border-border p-4" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Verified</span>
                <span className={expertQuery.data.isVerified ? "badge-success" : "badge-warning"}>
                  {expertQuery.data.isVerified ? "Verified" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Projects</span>
                <span className="text-sm font-semibold">{shortlistedProjectsQuery.data?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Experience</span>
                <span className="text-sm font-semibold">{employmentHistory.length} roles</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Education</span>
                <span className="text-sm font-semibold">{educationHistory.length} records</span>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded border border-border p-4" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Contact</h3>
            <div className="space-y-2.5">
              {formData.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground truncate">{formData.email}</span>
                </div>
              )}
              {formData.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">{formData.phone}</span>
                </div>
              )}
              {expertQuery.data?.linkedinUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Link2 size={13} className="text-muted-foreground flex-shrink-0" />
                  <a href={expertQuery.data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* CV quick access */}
          {formData.cvUrl && (
            <div className="bg-white rounded border border-border p-4" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Resume / CV</h3>
              <button
                onClick={() => setDocumentViewerOpen(true)}
                className="w-full flex items-center gap-2 p-3 rounded bg-blue-50 border border-[#B3D9F7] hover:bg-[#D1EBFA] transition-colors"
              >
                <FileText size={16} className="text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-primary">View CV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <DocumentViewer
        open={documentViewerOpen}
        onOpenChange={setDocumentViewerOpen}
        documentUrl={expertQuery.data.cvUrl || ""}
        documentTitle={`${expertQuery.data.firstName} ${expertQuery.data.lastName} – Resume`}
      />
    </AdminLayout>
  );
}
