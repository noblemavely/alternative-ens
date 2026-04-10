import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";

const sectorSchema = z.object({
  name: z.string().min(1, "Sector name is required"),
});

const functionSchema = z.object({
  name: z.string().min(1, "Function name is required"),
});

type SectorFormData = z.infer<typeof sectorSchema>;
type FunctionFormData = z.infer<typeof functionSchema>;

export default function AdminSettings() {
  const [sectorOpen, setSectorOpen] = useState(false);
  const [functionOpen, setFunctionOpen] = useState(false);
  const [editingSectorId, setEditingSectorId] = useState<number | null>(null);
  const [editingFunctionId, setEditingFunctionId] = useState<number | null>(null);

  // Queries
  const sectorsQuery = trpc.sectors.list.useQuery();
  const functionsQuery = trpc.functions.list.useQuery();

  // Mutations
  const createSectorMutation = trpc.sectors.create.useMutation();
  const updateSectorMutation = trpc.sectors.update.useMutation();
  const deleteSectorMutation = trpc.sectors.delete.useMutation();
  const createFunctionMutation = trpc.functions.create.useMutation();
  const updateFunctionMutation = trpc.functions.update.useMutation();
  const deleteFunctionMutation = trpc.functions.delete.useMutation();

  // Sector Form
  const sectorForm = useForm<SectorFormData>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSectorSubmit = async (data: SectorFormData) => {
    try {
      if (editingSectorId) {
        await updateSectorMutation.mutateAsync({
          id: editingSectorId,
          name: data.name,
        });
        toast.success("Sector updated successfully!");
      } else {
        await createSectorMutation.mutateAsync({
          name: data.name,
        });
        toast.success("Sector created successfully!");
      }
      sectorsQuery.refetch();
      setSectorOpen(false);
      sectorForm.reset();
      setEditingSectorId(null);
    } catch (error) {
      toast.error("Failed to save sector");
    }
  };

  const handleEditSector = (sector: any) => {
    setEditingSectorId(sector.id);
    sectorForm.setValue("name", sector.name);
    setSectorOpen(true);
  };

  const handleDeleteSector = async (id: number) => {
    try {
      await deleteSectorMutation.mutateAsync({ id });
      toast.success("Sector deleted successfully!");
      sectorsQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete sector");
    }
  };

  // Function Form
  const functionForm = useForm<FunctionFormData>({
    resolver: zodResolver(functionSchema),
    defaultValues: {
      name: "",
    },
  });

  const onFunctionSubmit = async (data: FunctionFormData) => {
    try {
      if (editingFunctionId) {
        await updateFunctionMutation.mutateAsync({
          id: editingFunctionId,
          name: data.name,
        });
        toast.success("Function updated successfully!");
      } else {
        await createFunctionMutation.mutateAsync({
          name: data.name,
        });
        toast.success("Function created successfully!");
      }
      functionsQuery.refetch();
      setFunctionOpen(false);
      functionForm.reset();
      setEditingFunctionId(null);
    } catch (error) {
      toast.error("Failed to save function");
    }
  };

  const handleEditFunction = (func: any) => {
    setEditingFunctionId(func.id);
    functionForm.setValue("name", func.name);
    setFunctionOpen(true);
  };

  const handleDeleteFunction = async (id: number) => {
    try {
      await deleteFunctionMutation.mutateAsync({ id });
      toast.success("Function deleted successfully!");
      functionsQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete function");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure master lists for Sectors and Functions</p>
        </div>

        {/* Sectors Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Sectors</CardTitle>
                <CardDescription>Manage available sectors for experts</CardDescription>
              </div>
              <Dialog open={sectorOpen} onOpenChange={setSectorOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      sectorForm.reset();
                      setEditingSectorId(null);
                    }}
                    className="gap-2"
                  >
                    <Plus size={18} />
                    Add Sector
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSectorId ? "Edit Sector" : "Add New Sector"}</DialogTitle>
                    <DialogDescription>
                      {editingSectorId ? "Update the sector name" : "Create a new sector"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...sectorForm}>
                    <form onSubmit={sectorForm.handleSubmit(onSectorSubmit)} className="space-y-4">
                      <FormField
                        control={sectorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sector Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Technology, Finance, Healthcare" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        {editingSectorId ? "Update" : "Create"} Sector
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sectorsQuery.isLoading ? (
                <p className="text-muted-foreground">Loading sectors...</p>
              ) : sectorsQuery.data?.length === 0 ? (
                <p className="text-muted-foreground">No sectors yet. Add one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {sectorsQuery.data?.map((sector: any) => (
                    <div key={sector.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{sector.name}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSector(sector)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSector(sector.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Functions Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Functions</CardTitle>
                <CardDescription>Manage available functions for experts</CardDescription>
              </div>
              <Dialog open={functionOpen} onOpenChange={setFunctionOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      functionForm.reset();
                      setEditingFunctionId(null);
                    }}
                    className="gap-2"
                  >
                    <Plus size={18} />
                    Add Function
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingFunctionId ? "Edit Function" : "Add New Function"}</DialogTitle>
                    <DialogDescription>
                      {editingFunctionId ? "Update the function name" : "Create a new function"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...functionForm}>
                    <form onSubmit={functionForm.handleSubmit(onFunctionSubmit)} className="space-y-4">
                      <FormField
                        control={functionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Function Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Strategy, Operations, Compliance" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full">
                        {editingFunctionId ? "Update" : "Create"} Function
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {functionsQuery.isLoading ? (
                <p className="text-muted-foreground">Loading functions...</p>
              ) : functionsQuery.data?.length === 0 ? (
                <p className="text-muted-foreground">No functions yet. Add one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {functionsQuery.data?.map((func: any) => (
                    <div key={func.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{func.name}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditFunction(func)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFunction(func.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
