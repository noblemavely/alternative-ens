import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Plus, CheckCircle, MapPin, Building2, Calendar } from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const searchSchema = z.object({
  sector:      z.string().optional(),
  function:    z.string().optional(),
  keyword:     z.string().optional(),
  companyName: z.string().optional(),
  location:    z.string().optional(),
  year:        z.string().optional(),
});

const shortlistSchema = z.object({
  projectId: z.number(),
  notes: z.string().optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;
type ShortlistFormData = z.infer<typeof shortlistSchema>;

export default function AdminSearch() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);

  const projectsQuery = trpc.projects.list.useQuery();
  const addShortlistMutation = trpc.shortlists.add.useMutation();

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      sector: "", function: "", keyword: "",
      companyName: "", location: "", year: "",
    },
  });

  const shortlistForm = useForm<ShortlistFormData>({
    resolver: zodResolver(shortlistSchema),
    defaultValues: { projectId: 0, notes: "" },
  });

  const onSearch = async (data: SearchFormData) => {
    try {
      const utils = trpc.useUtils();
      const results = await utils.experts.search.fetch({
        sector:      data.sector      || undefined,
        function:    data.function    || undefined,
        keyword:     data.keyword     || undefined,
        companyName: data.companyName || undefined,
        location:    data.location    || undefined,
        year:        data.year        || undefined,
      });
      setSearchResults(results);
      setHasSearched(true);
      if (results.length === 0) {
        toast.info("No experts found matching your criteria");
      } else {
        toast.success(`Found ${results.length} expert${results.length !== 1 ? "s" : ""}`);
      }
    } catch {
      toast.error("Search failed");
    }
  };

  const handleShortlist = (expert: any) => {
    setSelectedExpert(expert);
    setShortlistOpen(true);
  };

  const onShortlist = async (data: ShortlistFormData) => {
    try {
      await addShortlistMutation.mutateAsync({
        projectId: data.projectId,
        expertId: selectedExpert.id,
        notes: data.notes || undefined,
      });
      toast.success("Expert attached to project");
      setShortlistOpen(false);
      shortlistForm.reset();
      setSelectedExpert(null);
    } catch {
      toast.error("Failed to attach expert");
    }
  };

  return (
    <AdminLayout>
      <PageBreadcrumb items={[{ label: "Search" }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Search Experts</h1>
          <p className="page-subtitle">Find and attach experts to projects</p>
        </div>
      </div>

      {/* Search Filters */}
      <div className="card-surface p-6 mb-6">
        <Form {...searchForm}>
          <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={searchForm.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Sector</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. FMCG, Technology" {...field} className="h-9 rounded-lg" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={searchForm.control}
                name="function"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Function</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Marketing, Finance" {...field} className="h-9 rounded-lg" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={searchForm.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Keyword</FormLabel>
                    <FormControl>
                      <Input placeholder="Search name, bio, skills" {...field} className="h-9 rounded-lg" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={searchForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Unilever, HUL" {...field} className="h-9 rounded-lg" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={searchForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Location (Country)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. India, Singapore" {...field} className="h-9 rounded-lg" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={searchForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2020" maxLength={4} {...field} className="h-9 rounded-lg" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" className="gap-2 h-9 px-5 rounded-lg text-sm font-semibold" style={{ background: "#2563EB" }}>
                <Search size={14} />
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 px-4 rounded-lg text-sm"
                onClick={() => { searchForm.reset(); setSearchResults([]); setHasSearched(false); }}
              >
                Clear
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Results</p>
              <p className="text-xs text-muted-foreground mt-0.5">{searchResults.length} expert{searchResults.length !== 1 ? "s" : ""} found</p>
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Search size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No experts found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {searchResults.map((expert) => (
                <div key={expert.id} className="px-5 py-4 flex items-start gap-4 hover:bg-secondary/40 transition-colors">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                    {(expert.firstName?.[0] ?? "?").toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">
                        {expert.firstName} {expert.lastName}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${expert.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {expert.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{expert.email}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {expert.sector && (
                        <span className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Sector:</span> {expert.sector}
                        </span>
                      )}
                      {expert.function && (
                        <span className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Function:</span> {expert.function}
                        </span>
                      )}
                      {expert.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={10} />
                          {expert.location}
                        </span>
                      )}
                    </div>

                    {expert.biography && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 max-w-2xl">{expert.biography}</p>
                    )}
                  </div>

                  {/* Shortlist button */}
                  <Dialog open={shortlistOpen && selectedExpert?.id === expert.id} onOpenChange={setShortlistOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-shrink-0 h-8 text-xs gap-1.5 rounded-lg" onClick={() => handleShortlist(expert)}>
                        <Plus size={12} />
                        Attach
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Attach to Project</DialogTitle>
                        <DialogDescription>
                          Add {expert.firstName} {expert.lastName} to a project
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...shortlistForm}>
                        <form onSubmit={shortlistForm.handleSubmit(onShortlist)} className="space-y-4 pt-2">
                          <FormField
                            control={shortlistForm.control}
                            name="projectId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project <span className="text-red-400">*</span></FormLabel>
                                <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value || "")}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-lg">
                                      <SelectValue placeholder="Choose a project" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {projectsQuery.data?.map((project) => (
                                      <SelectItem key={project.id} value={String(project.id)}>
                                        {project.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={shortlistForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Input placeholder="Optional notes" {...field} className="rounded-lg" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full gap-2 rounded-lg" disabled={addShortlistMutation.isPending} style={{ background: "#2563EB" }}>
                            <CheckCircle size={14} />
                            {addShortlistMutation.isPending ? "Attaching…" : "Attach Expert"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial empty state */}
      {!hasSearched && (
        <div className="card-surface py-20 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <Search size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Run a search to find experts</p>
          <p className="text-xs text-muted-foreground">Use one or more filters above, then click Search</p>
        </div>
      )}
    </AdminLayout>
  );
}
