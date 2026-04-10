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
import { Search, Plus, CheckCircle, XCircle } from "lucide-react";

const searchSchema = z.object({
  sector: z.string().optional(),
  function: z.string().optional(),
  keyword: z.string().optional(),
});

const shortlistSchema = z.object({
  projectId: z.number(),
  notes: z.string().optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;
type ShortlistFormData = z.infer<typeof shortlistSchema>;

export default function AdminSearch() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);

  const projectsQuery = trpc.projects.list.useQuery();
  const searchQuery = trpc.experts.search.useQuery({ sector: "", function: "", keyword: "" }, { enabled: false });
  const addShortlistMutation = trpc.shortlists.add.useMutation();

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      sector: "",
      function: "",
      keyword: "",
    },
  });

  const shortlistForm = useForm<ShortlistFormData>({
    resolver: zodResolver(shortlistSchema),
    defaultValues: {
      projectId: 0,
      notes: "",
    },
  });

  const onSearch = async (data: SearchFormData) => {
    try {
      // Use the search query with the provided filters
      const utils = trpc.useUtils();
      const results = await utils.experts.search.fetch(data);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("No experts found matching your criteria");
      } else {
        toast.success(`Found ${results.length} expert(s)`);
      }
    } catch (error) {
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
      toast.success("Expert shortlisted successfully");
      setShortlistOpen(false);
      shortlistForm.reset();
      setSelectedExpert(null);
    } catch (error) {
      toast.error("Failed to shortlist expert");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Search Experts</h1>
          <p className="text-muted-foreground mt-2">Find and shortlist experts for your projects</p>
        </div>

        {/* Search Filters */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
            <CardDescription>Filter experts by sector, function, or keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={searchForm.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Technology, Finance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={searchForm.control}
                    name="function"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Function</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Product Manager, CEO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={searchForm.control}
                    name="keyword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keyword</FormLabel>
                        <FormControl>
                          <Input placeholder="Search by name or skills" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="gap-2" disabled={searchQuery.isLoading}>
                  <Search size={18} />
                  {searchQuery.isLoading ? "Searching..." : "Search"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>Found {searchResults.length} expert(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((expert) => (
                  <div key={expert.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {expert.firstName} {expert.lastName}
                        </h3>
                        <p className="text-sm text-muted mt-1">{expert.email}</p>
                        {expert.sector && (
                          <p className="text-sm text-muted mt-1">
                            <span className="font-medium">Sector:</span> {expert.sector}
                          </p>
                        )}
                        {expert.function && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Function:</span> {expert.function}
                          </p>
                        )}
                        {expert.biography && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{expert.biography}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                            expert.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {expert.isVerified ? "Verified" : "Pending"}
                        </span>
                        <Dialog open={shortlistOpen && selectedExpert?.id === expert.id} onOpenChange={setShortlistOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-2" onClick={() => handleShortlist(expert)}>
                              <Plus size={16} />
                              Shortlist
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Shortlist Expert</DialogTitle>
                              <DialogDescription>
                                Add {expert.firstName} {expert.lastName} to a project
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...shortlistForm}>
                              <form onSubmit={shortlistForm.handleSubmit(onShortlist)} className="space-y-4">
                                <FormField
                                  control={shortlistForm.control}
                                  name="projectId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Select Project *</FormLabel>
                                      <Select
                                        onValueChange={(v) => field.onChange(Number(v))}
                                        value={String(field.value)}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
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
                                        <Input placeholder="Optional notes about this expert" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="submit"
                                  className="w-full gap-2"
                                  disabled={addShortlistMutation.isPending}
                                >
                                  <CheckCircle size={16} />
                                  {addShortlistMutation.isPending ? "Adding..." : "Shortlist Expert"}
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !searchQuery.isLoading && (
          <Card className="card-elegant">
            <CardContent className="pt-12 pb-12 text-center">
              <Search size={48} className="mx-auto text-muted mb-4 opacity-50" />
              <p className="text-muted mb-4">No search results yet</p>
              <p className="text-sm text-muted-foreground">Use the search filters above to find experts</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
