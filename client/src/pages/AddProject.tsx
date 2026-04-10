import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  clientContactId: z.string().min(1, "Client contact is required"),
  projectType: z.string().min(1, "Project type is required"),
  hourlyRate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function AddProject() {
  const [, navigate] = useLocation();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const createMutation = trpc.projects.create.useMutation();
  const clientsQuery = trpc.clients.list.useQuery();
  const contactsQuery = trpc.clientContacts.list.useQuery();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      clientContactId: "",
      projectType: "",
      hourlyRate: "",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description,
        clientContactId: parseInt(data.clientContactId),
        projectType: data.projectType as "Call" | "Advisory" | "ID",
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
      });
      toast.success("Project created successfully");
      navigate("/admin/projects");
    } catch (error: any) {
      toast.error(error.message || "Failed to create project");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/projects")}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add New Project</h1>
            <p className="text-slate-600 mt-1">Create a new project</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Enter the details for the new project</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Project name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedClientId(value ? parseInt(value) : null);
                        form.setValue('clientContactId', '');
                      }} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientsQuery.data?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedClientId && (
                  <FormField
                    control={form.control}
                    name="clientContactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Contact *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {contactsQuery.data?.filter((c: any) => c.clientId === selectedClientId).map((contact: any) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                {contact.contactName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Call">Call</SelectItem>
                          <SelectItem value="Advisory">Advisory</SelectItem>
                          <SelectItem value="ID">ID</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea placeholder="Project description..." className="w-full p-2 border border-border rounded-md" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/projects")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
