import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Plus, CheckCircle, MapPin, Building2, GraduationCap,
  Briefcase, X, ChevronDown, ChevronUp, SlidersHorizontal, Users,
} from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Link } from "wouter";

// ── Form schema ──────────────────────────────────────────────────────────────

const searchSchema = z.object({
  keyword:            z.string().optional(),
  sector:             z.string().optional(),
  function:           z.string().optional(),
  location:           z.string().optional(),
  companyName:        z.string().optional(),
  designation:        z.string().optional(),
  employmentYearFrom: z.string().optional(),
  employmentYearTo:   z.string().optional(),
  university:         z.string().optional(),
  degree:             z.string().optional(),
  fieldOfStudy:       z.string().optional(),
  educationYearFrom:  z.string().optional(),
  educationYearTo:    z.string().optional(),
});
type SearchFormData = z.infer<typeof searchSchema>;

const shortlistSchema = z.object({
  projectId: z.number(),
  notes:     z.string().optional(),
});
type ShortlistFormData = z.infer<typeof shortlistSchema>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(firstName?: string, lastName?: string) {
  return `${(firstName ?? "")[0] ?? ""}${(lastName ?? "")[0] ?? ""}`.toUpperCase() || "?";
}

function fmtDate(d?: string | null) {
  if (!d) return null;
  const [y, m] = d.split("-");
  if (!y) return null;
  if (m) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(m, 10) - 1] ?? ""} ${y}`;
  }
  return y;
}

function empDateRange(emp: any) {
  const start = fmtDate(emp.startDate);
  const end   = emp.isCurrent ? "Present" : fmtDate(emp.endDate);
  if (start && end) return `${start} – ${end}`;
  if (start) return `Since ${start}`;
  return null;
}

// ── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X size={10} />
      </button>
    </span>
  );
}

// ── FilterSection ────────────────────────────────────────────────────────────

function FilterSection({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Icon size={13} />
          {title}
        </span>
        {open ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── LabeledInput ─────────────────────────────────────────────────────────────

function LabeledInput({ label, placeholder, field }: { label: string; placeholder: string; field: any }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">{label}</label>
      <Input placeholder={placeholder} {...field} className="h-8 rounded-lg text-xs" />
    </div>
  );
}

// ── YearRangeInputs ──────────────────────────────────────────────────────────

function YearRangeInputs({ fromField, toField }: { fromField: any; toField: any }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">Year Range</label>
      <div className="flex gap-2 items-center">
        <Input placeholder="From" maxLength={4} {...fromField} className="h-8 rounded-lg text-xs text-center" />
        <span className="text-muted-foreground text-xs">–</span>
        <Input placeholder="To" maxLength={4} {...toField} className="h-8 rounded-lg text-xs text-center" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminSearch() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);

  const projectsQuery    = trpc.projects.list.useQuery();
  const addShortlistMutation = trpc.shortlists.add.useMutation();

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      keyword: "", sector: "", function: "", location: "",
      companyName: "", designation: "", employmentYearFrom: "", employmentYearTo: "",
      university: "", degree: "", fieldOfStudy: "", educationYearFrom: "", educationYearTo: "",
    },
  });

  const shortlistForm = useForm<ShortlistFormData>({
    resolver: zodResolver(shortlistSchema),
    defaultValues: { projectId: 0, notes: "" },
  });

  // ── Active filter chips ───────────────────────────────────────────────────

  const vals = searchForm.watch();
  const activeFilters: { key: keyof SearchFormData; label: string }[] = [
    ...(vals.keyword            ? [{ key: "keyword"            as const, label: `"${vals.keyword}"` }]                       : []),
    ...(vals.sector             ? [{ key: "sector"             as const, label: `Sector: ${vals.sector}` }]                  : []),
    ...(vals.function           ? [{ key: "function"           as const, label: `Function: ${vals.function}` }]              : []),
    ...(vals.location           ? [{ key: "location"           as const, label: `Location: ${vals.location}` }]              : []),
    ...(vals.companyName        ? [{ key: "companyName"        as const, label: `Company: ${vals.companyName}` }]            : []),
    ...(vals.designation        ? [{ key: "designation"        as const, label: `Role: ${vals.designation}` }]               : []),
    ...(vals.employmentYearFrom || vals.employmentYearTo
      ? [{ key: "employmentYearFrom" as const, label: `Emp years: ${vals.employmentYearFrom || "?"} – ${vals.employmentYearTo || "?"}` }]
      : []),
    ...(vals.university         ? [{ key: "university"         as const, label: `University: ${vals.university}` }]          : []),
    ...(vals.degree             ? [{ key: "degree"             as const, label: `Degree: ${vals.degree}` }]                  : []),
    ...(vals.fieldOfStudy       ? [{ key: "fieldOfStudy"       as const, label: `Field: ${vals.fieldOfStudy}` }]             : []),
    ...(vals.educationYearFrom || vals.educationYearTo
      ? [{ key: "educationYearFrom" as const, label: `Edu years: ${vals.educationYearFrom || "?"} – ${vals.educationYearTo || "?"}` }]
      : []),
  ];

  // ── Search handler ────────────────────────────────────────────────────────

  const utils = trpc.useUtils();

  const runSearch = async (data: SearchFormData) => {
    setIsSearching(true);
    try {
      const results = await utils.experts.search.fetch({
        keyword:            data.keyword            || undefined,
        sector:             data.sector             || undefined,
        function:           data.function           || undefined,
        location:           data.location           || undefined,
        companyName:        data.companyName        || undefined,
        designation:        data.designation        || undefined,
        employmentYearFrom: data.employmentYearFrom || undefined,
        employmentYearTo:   data.employmentYearTo   || undefined,
        university:         data.university         || undefined,
        degree:             data.degree             || undefined,
        fieldOfStudy:       data.fieldOfStudy       || undefined,
        educationYearFrom:  data.educationYearFrom  || undefined,
        educationYearTo:    data.educationYearTo    || undefined,
      });
      setSearchResults(results);
      setHasSearched(true);
      if (results.length === 0) toast.info("No experts match your filters");
      else toast.success(`${results.length} expert${results.length !== 1 ? "s" : ""} found`);
    } catch {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const clearAll = () => {
    searchForm.reset();
    setSearchResults([]);
    setHasSearched(false);
  };

  const removeFilter = (key: keyof SearchFormData) => {
    if (key === "employmentYearFrom") {
      searchForm.setValue("employmentYearFrom", "");
      searchForm.setValue("employmentYearTo", "");
    } else if (key === "educationYearFrom") {
      searchForm.setValue("educationYearFrom", "");
      searchForm.setValue("educationYearTo", "");
    } else {
      searchForm.setValue(key, "");
    }
    searchForm.handleSubmit(runSearch)();
  };

  // ── Attach handler ────────────────────────────────────────────────────────

  const onShortlist = async (data: ShortlistFormData) => {
    try {
      await addShortlistMutation.mutateAsync({
        projectId: data.projectId,
        expertId:  selectedExpert.id,
        notes:     data.notes || undefined,
      });
      toast.success(`${selectedExpert.firstName} attached to project`);
      setShortlistOpen(false);
      shortlistForm.reset();
      setSelectedExpert(null);
    } catch {
      toast.error("Failed to attach expert");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <PageBreadcrumb items={[{ label: "Expert Search" }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Expert Search</h1>
          <p className="page-subtitle">LinkedIn Recruiter-style search across profile, employment, and education</p>
        </div>
      </div>

      <Form {...searchForm}>
        <form onSubmit={searchForm.handleSubmit(runSearch)}>
          <div className="flex gap-5 items-start">

            {/* ── Left sidebar: filters ─────────────────────────────────── */}
            <aside className="w-64 flex-shrink-0 card-surface overflow-hidden sticky top-6 self-start">

              {/* Sidebar header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                  <SlidersHorizontal size={13} />
                  Filters
                </span>
                {activeFilters.length > 0 && (
                  <button type="button" onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              {/* Basic filters */}
              <FilterSection title="Basic Info" icon={Search}>
                <FormField control={searchForm.control} name="keyword" render={({ field }) => (
                  <LabeledInput label="Keyword" placeholder="Name, bio, skills…" field={field} />
                )} />
                <FormField control={searchForm.control} name="sector" render={({ field }) => (
                  <LabeledInput label="Sector" placeholder="e.g. FMCG, Technology" field={field} />
                )} />
                <FormField control={searchForm.control} name="function" render={({ field }) => (
                  <LabeledInput label="Function" placeholder="e.g. Marketing, Finance" field={field} />
                )} />
                <FormField control={searchForm.control} name="location" render={({ field }) => (
                  <LabeledInput label="Location (Country)" placeholder="e.g. India, Singapore" field={field} />
                )} />
              </FilterSection>

              {/* Employment filters */}
              <FilterSection title="Employment History" icon={Briefcase}>
                <FormField control={searchForm.control} name="companyName" render={({ field }) => (
                  <LabeledInput label="Company Name" placeholder="e.g. Swiggy, Unilever" field={field} />
                )} />
                <FormField control={searchForm.control} name="designation" render={({ field }) => (
                  <LabeledInput label="Designation / Role" placeholder="e.g. VP Sales, CFO" field={field} />
                )} />
                <FormField
                  control={searchForm.control}
                  name="employmentYearFrom"
                  render={({ field: fromField }) => (
                    <FormField
                      control={searchForm.control}
                      name="employmentYearTo"
                      render={({ field: toField }) => (
                        <YearRangeInputs fromField={fromField} toField={toField} />
                      )}
                    />
                  )}
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Finds experts whose employment period <em>overlaps</em> the year range — e.g. "Worked at Swiggy between 2014 and 2018"
                </p>
              </FilterSection>

              {/* Education filters */}
              <FilterSection title="Education" icon={GraduationCap}>
                <FormField control={searchForm.control} name="university" render={({ field }) => (
                  <LabeledInput label="University / Institution" placeholder="e.g. IIM, IIT, LSE" field={field} />
                )} />
                <FormField control={searchForm.control} name="degree" render={({ field }) => (
                  <LabeledInput label="Degree" placeholder="e.g. MBA, B.Tech, CFA" field={field} />
                )} />
                <FormField control={searchForm.control} name="fieldOfStudy" render={({ field }) => (
                  <LabeledInput label="Field of Study" placeholder="e.g. Finance, Engineering" field={field} />
                )} />
                <FormField
                  control={searchForm.control}
                  name="educationYearFrom"
                  render={({ field: fromField }) => (
                    <FormField
                      control={searchForm.control}
                      name="educationYearTo"
                      render={({ field: toField }) => (
                        <YearRangeInputs fromField={fromField} toField={toField} />
                      )}
                    />
                  )}
                />
              </FilterSection>

              {/* Search button */}
              <div className="px-4 py-3 border-t border-border">
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-9 gap-2 text-sm font-semibold rounded-lg"
                  style={{ background: "#2563EB" }}
                >
                  {isSearching ? (
                    <><span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-3.5 h-3.5" /> Searching…</>
                  ) : (
                    <><Search size={14} /> Search</>
                  )}
                </Button>
              </div>
            </aside>

            {/* ── Right panel: results ──────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-3">

              {/* Active filter chips + result count */}
              {(activeFilters.length > 0 || hasSearched) && (
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {activeFilters.map(f => (
                    <FilterChip key={f.key} label={f.label} onRemove={() => removeFilter(f.key)} />
                  ))}
                  {hasSearched && (
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
                      <Users size={12} />
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Pre-search state */}
              {!hasSearched && (
                <div className="card-surface py-24 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                    <Search size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Set your filters and click Search</p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Search by company, designation, year range, university, degree — or combine them to pinpoint the right expert.
                  </p>
                </div>
              )}

              {/* No results */}
              {hasSearched && searchResults.length === 0 && (
                <div className="card-surface py-24 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
                    <Search size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No experts match your filters</p>
                  <p className="text-xs text-muted-foreground">Try broadening your search — remove some filters or use partial names</p>
                </div>
              )}

              {/* Expert result cards */}
              {searchResults.map(expert => {
                const currentRole = expert.employment?.find((e: any) => e.isCurrent) ?? expert.employment?.[0];
                const topEdu      = expert.education?.[0];

                return (
                  <div key={expert.id} className="card-surface p-5 flex gap-4 hover:shadow-sm transition-shadow">

                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                      {initials(expert.firstName, expert.lastName)}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      {/* Name + badges */}
                      <div className="flex items-center flex-wrap gap-2 mb-0.5">
                        <Link href={`/admin/experts/${expert.id}`} className="font-semibold text-foreground text-sm hover:text-primary transition-colors">
                          {expert.firstName} {expert.lastName}
                        </Link>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${expert.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {expert.isVerified ? "Verified" : "Pending"}
                        </span>
                        {expert.sector && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{expert.sector}</span>
                        )}
                      </div>

                      {/* Current role */}
                      {currentRole && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Building2 size={11} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-foreground font-medium">{currentRole.position}</span>
                          <span className="text-xs text-muted-foreground">at {currentRole.companyName}</span>
                          {empDateRange(currentRole) && (
                            <span className="text-[10px] text-muted-foreground">· {empDateRange(currentRole)}</span>
                          )}
                        </div>
                      )}

                      {/* Location + function */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {expert.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin size={10} /> {expert.location}
                          </span>
                        )}
                        {expert.function && (
                          <span className="text-xs text-muted-foreground">{expert.function}</span>
                        )}
                      </div>

                      {/* Employment history (top 3) */}
                      {expert.employment?.length > 0 && (
                        <div className="mt-2.5 space-y-1">
                          {expert.employment.slice(0, 3).map((emp: any) => (
                            <div key={emp.id} className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0 mt-px" />
                              <span className="text-xs text-muted-foreground">
                                <span className="text-foreground font-medium">{emp.position}</span>
                                {" "}at <span className="font-medium">{emp.companyName}</span>
                                {empDateRange(emp) && <span className="text-[10px] ml-1 opacity-70">({empDateRange(emp)})</span>}
                              </span>
                            </div>
                          ))}
                          {expert.employment.length > 3 && (
                            <p className="text-[10px] text-muted-foreground ml-3">+{expert.employment.length - 3} more</p>
                          )}
                        </div>
                      )}

                      {/* Top education */}
                      {topEdu && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <GraduationCap size={11} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {topEdu.degree && <span className="text-foreground font-medium">{topEdu.degree}{topEdu.fieldOfStudy ? `, ${topEdu.fieldOfStudy}` : ""}</span>}
                            {topEdu.degree && " · "}
                            {topEdu.schoolName}
                            {fmtDate(topEdu.endDate) && <span className="text-[10px] opacity-70 ml-1">({fmtDate(topEdu.endDate)})</span>}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Dialog
                        open={shortlistOpen && selectedExpert?.id === expert.id}
                        onOpenChange={v => { setShortlistOpen(v); if (!v) { setSelectedExpert(null); shortlistForm.reset(); } }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 rounded-lg"
                            onClick={() => { setSelectedExpert(expert); setShortlistOpen(true); }}
                          >
                            <Plus size={12} /> Attach
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Attach to Project</DialogTitle>
                            <DialogDescription>Add {expert.firstName} {expert.lastName} to a project</DialogDescription>
                          </DialogHeader>
                          <Form {...shortlistForm}>
                            <form onSubmit={shortlistForm.handleSubmit(onShortlist)} className="space-y-4 pt-2">
                              <FormField control={shortlistForm.control} name="projectId" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project <span className="text-red-400">*</span></FormLabel>
                                  <Select onValueChange={v => field.onChange(Number(v))} value={String(field.value || "")}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-lg"><SelectValue placeholder="Choose a project" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {projectsQuery.data?.map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={shortlistForm.control} name="notes" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl><Input placeholder="Optional notes" {...field} className="rounded-lg" /></FormControl>
                                </FormItem>
                              )} />
                              <Button type="submit" className="w-full gap-2 rounded-lg" disabled={addShortlistMutation.isPending} style={{ background: "#2563EB" }}>
                                <CheckCircle size={14} />
                                {addShortlistMutation.isPending ? "Attaching…" : "Attach Expert"}
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>

                      <Link href={`/admin/experts/${expert.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-xs rounded-lg w-full text-muted-foreground">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Form>
    </AdminLayout>
  );
}
