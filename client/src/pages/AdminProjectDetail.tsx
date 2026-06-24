import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Calendar, Edit2, X, Save, CheckCircle, AlertCircle, XCircle, Briefcase, ClipboardList, Plus, Copy, ChevronDown, Users, Link2, Pencil, Send, Eye, Download } from "lucide-react";
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

  // ── Questionnaire state ──────────────────────────────────────────────────
  const [creatingQuestionnaire, setCreatingQuestionnaire] = useState(false);
  const [qTitle, setQTitle] = useState("");
  // New-question form
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"long_text" | "yes_no" | "dropdown" | "multi_select">("long_text");
  const [newOptionsList, setNewOptionsList] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState("");
  // Edit-question form
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editType, setEditType] = useState<"long_text" | "yes_no" | "dropdown" | "multi_select">("long_text");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editOptionInput, setEditOptionInput] = useState("");
  // Responses
  const [showResponses, setShowResponses] = useState(false);
  // Email draft modal
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [emailDraft, setEmailDraft] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [currentShortlistId, setCurrentShortlistId] = useState<number | null>(null);

  const projectQuery          = trpc.projects.getById.useQuery({ id: projectId! }, { enabled: !!projectId });
  const shortlistQuery        = trpc.shortlists.getByProject.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const activityTimelineQuery = trpc.projects.getActivityTimeline.useQuery({ projectId: projectId! }, { enabled: !!projectId });
  const questionnaireQuery    = trpc.questionnaires.getByProject.useQuery({ projectId: projectId! }, { enabled: !!projectId });

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

  const createQuestionnaireMutation = trpc.questionnaires.create.useMutation({
    onSuccess: () => { toast.success("Questionnaire created"); questionnaireQuery.refetch(); setCreatingQuestionnaire(false); setQTitle(""); },
    onError: (e: any) => toast.error(e.message || "Failed to create questionnaire"),
  });

  const addQuestionMutation = trpc.questionnaires.addQuestion.useMutation({
    onSuccess: () => { toast.success("Question added"); questionnaireQuery.refetch(); setNewQuestionText(""); setNewOptionsList([]); setNewOptionInput(""); },
    onError: (e: any) => toast.error(e.message || "Failed to add question"),
  });

  const deleteQuestionMutation = trpc.questionnaires.deleteQuestion.useMutation({
    onSuccess: () => { toast.success("Question deleted"); questionnaireQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to delete question"),
  });

  const deleteQuestionnaireMutation = trpc.questionnaires.delete.useMutation({
    onSuccess: () => { toast.success("Questionnaire deleted"); questionnaireQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to delete questionnaire"),
  });

  const publishQuestionnaireMutation = trpc.questionnaires.publish.useMutation({
    onSuccess: () => { toast.success("Questionnaire published — generate links for each expert below"); questionnaireQuery.refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to publish"),
  });

  const updateQuestionMutation = trpc.questionnaires.updateQuestion.useMutation({
    onSuccess: () => { toast.success("Question updated"); questionnaireQuery.refetch(); setEditingQuestionId(null); },
    onError: (e: any) => toast.error(e.message || "Failed to update question"),
  });

  const createInvitationMutation = trpc.questionnaires.createInvitation.useMutation({
    onError: (e: any) => toast.error(e.message || "Failed to generate link"),
  });

  const generateEmailDraftQuery = trpc.shortlists.generateQuestionnaireEmailDraft.useQuery(
    { shortlistId: currentShortlistId! },
    { enabled: !!currentShortlistId }
  );

  const sendEmailAndUpdateStatusMutation = trpc.shortlists.sendQuestionnaireEmailAndUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Email sent and status updated to Invited");
      shortlistQuery.refetch();
      setShowEmailDraft(false);
      setCurrentShortlistId(null);
      setEmailSubject("");
      setEmailBody("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to send email"),
  });

  const responsesQuery = trpc.questionnaires.responses.useQuery(
    { questionnaireId: questionnaireQuery.data?.id! },
    { enabled: !!questionnaireQuery.data?.id && showResponses }
  );

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
                        <td className="whitespace-nowrap">
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
                            onValueChange={(v) => {
                              if (v === "invited") {
                                setCurrentShortlistId(shortlist.id);
                                setShowEmailDraft(true);
                              } else {
                                updateStatusMutation.mutate({ id: shortlist.id, status: v as any });
                              }
                            }}
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
                          <div className="flex items-center justify-end gap-1">
                            {/* Get Link - Active when status is "invited" or beyond */}
                            {["invited", "accepted", "questionnaire_responded", "p2c_done", "calls_done"].includes(shortlist.status) && (
                              <button
                                onClick={async () => {
                                  if (!questionnaireQuery.data) return;
                                  try {
                                    const inv = await createInvitationMutation.mutateAsync({
                                      questionnaireId: questionnaireQuery.data!.id,
                                      expertId: shortlist.expertId,
                                      shortlistId: shortlist.id,
                                    });
                                    const link = `${window.location.origin}/questionnaire/${inv.token}`;
                                    navigator.clipboard.writeText(link);
                                    toast.success("Link copied!");
                                  } catch (err) {
                                    toast.error("Failed to generate link");
                                  }
                                }}
                                disabled={createInvitationMutation.isPending}
                                title="Get Questionnaire Link"
                                className="inline-flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:bg-blue-50 hover:text-primary transition-colors"
                              >
                                <Link2 size={14} />
                              </button>
                            )}

                            {/* See Response - Active when expert has submitted */}
                            {shortlist.status === "questionnaire_responded" && (
                              <button
                                onClick={() => {
                                  // TODO: Open responses modal/panel
                                  toast.info("Response viewing coming soon");
                                }}
                                title="View Expert Response"
                                className="inline-flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:bg-green-50 hover:text-emerald-600 transition-colors"
                              >
                                <Eye size={14} />
                              </button>
                            )}

                            {/* Delete - Always active */}
                            <button
                              onClick={() => removeFromShortlistMutation.mutate({ id: shortlist.id })}
                              disabled={removeFromShortlistMutation.isPending}
                              title="Remove from Shortlist"
                              className="inline-flex items-center justify-center h-7 w-7 rounded text-muted-foreground hover:bg-red-50 hover:text-destructive transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Questionnaire */}
          <SectionCard title="Questionnaire" subtitle="Build a form, publish it, then send unique links to each expert">
            {questionnaireQuery.isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : !questionnaireQuery.data ? (
              creatingQuestionnaire ? (
                <div className="space-y-3">
                  <Input placeholder="Questionnaire title (e.g. Expert Screening — Cloud Migration)" value={qTitle} onChange={e => setQTitle(e.target.value)} className="h-9 rounded-lg" />
                  <div className="flex gap-2">
                    <Button size="sm" className="gap-1.5 rounded-lg" style={{ background: "#2563EB" }}
                      disabled={!qTitle.trim() || createQuestionnaireMutation.isPending}
                      onClick={() => createQuestionnaireMutation.mutate({ projectId: projectId!, title: qTitle })}>
                      {createQuestionnaireMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <ClipboardList size={12} />} Create
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setCreatingQuestionnaire(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="py-4 flex flex-col items-center gap-3">
                  <ClipboardList size={28} className="text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No questionnaire yet</p>
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" onClick={() => setCreatingQuestionnaire(true)}>
                    <Plus size={13} /> Create Questionnaire
                  </Button>
                </div>
              )
            ) : (() => {
              const q = questionnaireQuery.data!;
              return (
                <div className="space-y-5">

                  {/* Header: title + publish state */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{q.title}</p>
                      {q.isPublished
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1"><CheckCircle size={10} /> Published — generate expert links in the table above</span>
                        : <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">Draft — add your questions, then publish</span>}
                    </div>
                    {!q.isPublished && (
                      <Button size="sm" className="gap-1.5 rounded-lg text-xs" style={{ background: "#059669" }}
                        disabled={q.questions.length === 0 || publishQuestionnaireMutation.isPending}
                        onClick={() => publishQuestionnaireMutation.mutate({ id: q.id })}>
                        {publishQuestionnaireMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                        Save & Publish
                      </Button>
                    )}
                  </div>

                  {/* Questions list */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Questions ({q.questions.length})</p>
                    {q.questions.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No questions yet — add one below.</p>
                    ) : (
                      <div className="space-y-2">
                        {q.questions.map((question: any, idx: number) => {
                          const isEditing = editingQuestionId === question.id;
                          const parsedOpts: string[] = (() => { try { return JSON.parse(question.options || "[]"); } catch { return []; } })();

                          if (isEditing) {
                            return (
                              <div key={question.id} className="rounded-lg border border-primary/30 bg-blue-50/30 p-4 space-y-3">
                                <Input value={editText} onChange={e => setEditText(e.target.value)} className="h-8 rounded-lg text-sm" placeholder="Question text" />
                                <Select value={editType} onValueChange={(v: any) => { setEditType(v); if (v === "yes_no" || v === "long_text") setEditOptions([]); }}>
                                  <SelectTrigger className="h-8 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="long_text">Long Text</SelectItem>
                                    <SelectItem value="yes_no">Yes / No</SelectItem>
                                    <SelectItem value="dropdown">Dropdown (Radio)</SelectItem>
                                    <SelectItem value="multi_select">Multi-Select (Checkbox)</SelectItem>
                                  </SelectContent>
                                </Select>
                                {(editType === "dropdown" || editType === "multi_select") && (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Options</p>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {editOptions.map((opt, i) => (
                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                          {opt}
                                          <button type="button" onClick={() => setEditOptions(editOptions.filter((_, j) => j !== i))}><X size={10} /></button>
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <Input value={editOptionInput} onChange={e => setEditOptionInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = editOptionInput.trim(); if (v) { setEditOptions([...editOptions, v]); setEditOptionInput(""); } } }}
                                        placeholder="Type option, press Enter" className="h-8 rounded-lg text-xs flex-1" />
                                      <Button size="sm" variant="outline" className="h-8 rounded-lg px-3"
                                        onClick={() => { const v = editOptionInput.trim(); if (v) { setEditOptions([...editOptions, v]); setEditOptionInput(""); } }}>
                                        <Plus size={12} />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7 gap-1 rounded-lg text-xs" style={{ background: "#2563EB" }}
                                    disabled={!editText.trim() || updateQuestionMutation.isPending}
                                    onClick={() => updateQuestionMutation.mutate({ id: question.id, questionText: editText, questionType: editType, options: (editType === "dropdown" || editType === "multi_select") ? editOptions : [] })}>
                                    {updateQuestionMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Save
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => setEditingQuestionId(null)}>Cancel</Button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={question.id} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-white">
                              <span className="text-xs text-muted-foreground font-mono mt-0.5 w-4 flex-shrink-0">{idx + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground">{question.questionText}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="badge-info text-[10px]">{question.questionType.replace(/_/g, " ")}</span>
                                  {question.isRequired && <span className="text-[10px] text-muted-foreground">Required</span>}
                                </div>
                                {parsedOpts.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {parsedOpts.map((o, i) => (
                                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{o}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                  onClick={() => { setEditingQuestionId(question.id); setEditText(question.questionText); setEditType(question.questionType); setEditOptions(parsedOpts); setEditOptionInput(""); }}>
                                  <Pencil size={12} />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                                  onClick={() => deleteQuestionMutation.mutate({ id: question.id })} disabled={deleteQuestionMutation.isPending}>
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add question */}
                  <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Question</p>
                    <Input placeholder="Question text…" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} className="h-9 rounded-lg" />
                    <div className="flex gap-2">
                      <Select value={newQuestionType} onValueChange={(v: any) => { setNewQuestionType(v); if (v === "yes_no" || v === "long_text") setNewOptionsList([]); }}>
                        <SelectTrigger className="h-9 rounded-lg flex-1 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="long_text">Long Text</SelectItem>
                          <SelectItem value="yes_no">Yes / No</SelectItem>
                          <SelectItem value="dropdown">Dropdown (Radio)</SelectItem>
                          <SelectItem value="multi_select">Multi-Select (Checkbox)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="gap-1.5 rounded-lg" style={{ background: "#2563EB" }}
                        disabled={!newQuestionText.trim() || addQuestionMutation.isPending}
                        onClick={() => {
                          addQuestionMutation.mutate({
                            questionnaireId: q.id,
                            questionText: newQuestionText,
                            questionType: newQuestionType,
                            options: (newQuestionType === "dropdown" || newQuestionType === "multi_select") ? newOptionsList : undefined,
                            order: q.questions.length,
                          });
                          setNewOptionsList([]);
                          setNewOptionInput("");
                        }}>
                        {addQuestionMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
                      </Button>
                    </div>

                    {/* Chip-based options adder */}
                    {(newQuestionType === "dropdown" || newQuestionType === "multi_select") && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Options</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {newOptionsList.map((opt, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {opt}
                              <button type="button" onClick={() => setNewOptionsList(newOptionsList.filter((_, j) => j !== i))}><X size={10} /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newOptionInput}
                            onChange={e => setNewOptionInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = newOptionInput.trim(); if (v) { setNewOptionsList([...newOptionsList, v]); setNewOptionInput(""); } } }}
                            placeholder="Type an option, press Enter or click +"
                            className="h-8 rounded-lg text-xs flex-1"
                          />
                          <Button size="sm" variant="outline" className="h-8 rounded-lg px-3"
                            onClick={() => { const v = newOptionInput.trim(); if (v) { setNewOptionsList([...newOptionsList, v]); setNewOptionInput(""); } }}>
                            <Plus size={12} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Responses */}
                  <div>
                    <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowResponses(v => !v)}>
                      <Users size={12} />
                      Responses {responsesQuery.data ? `(${responsesQuery.data.length})` : ""}
                      <ChevronDown size={12} className={`transition-transform ${showResponses ? "rotate-180" : ""}`} />
                    </button>
                    {showResponses && (
                      responsesQuery.isLoading ? (
                        <div className="py-4 text-sm text-muted-foreground">Loading…</div>
                      ) : !responsesQuery.data?.length ? (
                        <p className="text-sm text-muted-foreground py-3">No responses yet.</p>
                      ) : (
                        <div className="mt-3 space-y-4">
                          {responsesQuery.data.map((resp: any) => (
                            <div key={resp.id} className="rounded-lg border border-border p-4 bg-white">
                              <p className="text-sm font-semibold text-foreground">{resp.respondentName || resp.respondentEmail}</p>
                              <p className="text-xs text-muted-foreground mb-3">{resp.respondentEmail} · {new Date(resp.submittedAt).toLocaleDateString()}</p>
                              <div className="space-y-2">
                                {q.questions.map((question: any) => {
                                  const ans = resp.answers[String(question.id)];
                                  if (ans === undefined) return null;
                                  return (
                                    <div key={question.id}>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{question.questionText}</p>
                                      <p className="text-sm text-foreground mt-0.5">{Array.isArray(ans) ? ans.join(", ") : ans}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  {/* Delete */}
                  <div className="pt-2 border-t border-border">
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-red-500 gap-1.5"
                      onClick={() => { if (confirm("Delete this questionnaire and all responses?")) deleteQuestionnaireMutation.mutate({ id: q.id }); }}>
                      <Trash2 size={12} /> Delete Questionnaire
                    </Button>
                  </div>
                </div>
              );
            })()}
          </SectionCard>

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

      {/* Email Draft Modal */}
      {showEmailDraft && generateEmailDraftQuery.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Review Email</h2>
              <button onClick={() => setShowEmailDraft(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Expert info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sending to</p>
                <p className="text-sm font-semibold text-foreground mt-1">{generateEmailDraftQuery.data.expertName}</p>
                <p className="text-sm text-muted-foreground">{generateEmailDraftQuery.data.expertEmail}</p>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Subject</label>
                <Input
                  value={emailSubject || generateEmailDraftQuery.data.subject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Email Body</label>
                <textarea
                  value={emailBody || generateEmailDraftQuery.data.body}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full h-40 p-3 rounded-lg border border-border font-mono text-xs resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1 italic">
                  Questionnaire link: {generateEmailDraftQuery.data.questionnaireLink}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-lg"
                  onClick={() => setShowEmailDraft(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 rounded-lg"
                  style={{ background: "#2563EB" }}
                  disabled={sendEmailAndUpdateStatusMutation.isPending}
                  onClick={() => {
                    sendEmailAndUpdateStatusMutation.mutate({
                      shortlistId: currentShortlistId!,
                      subject: emailSubject || generateEmailDraftQuery.data.subject,
                      htmlBody: generateEmailDraftQuery.data.htmlBody,
                      textBody: emailBody || generateEmailDraftQuery.data.body,
                    });
                  }}
                >
                  {sendEmailAndUpdateStatusMutation.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Sending…</>
                  ) : (
                    <><Send size={14} /> Send Email & Update Status</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {generateEmailDraftQuery.isLoading && currentShortlistId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="text-sm text-foreground">Generating email draft...</span>
          </div>
        </div>
      )}

      {generateEmailDraftQuery.isError && currentShortlistId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <p className="text-sm text-red-600 mb-3 font-semibold">Unable to send invitation</p>
            <p className="text-xs text-muted-foreground mb-4">
              {(generateEmailDraftQuery.error as any)?.message || "Error generating email draft"}
            </p>
            <Button
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setShowEmailDraft(false);
                setCurrentShortlistId(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
