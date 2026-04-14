import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Autocomplete } from "@/components/Autocomplete";
import { COMMON_COMPANIES } from "@/lib/suggestions";

interface EmploymentEntry {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
}

interface EmploymentHistoryFormProps {
  entries: EmploymentEntry[];
  onAdd: (entry: EmploymentEntry) => void;
  onUpdate: (entry: EmploymentEntry) => void;
  onDelete: (id: string) => void;
}

export function EmploymentHistoryForm({
  entries,
  onAdd,
  onUpdate,
  onDelete,
}: EmploymentHistoryFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmploymentEntry>({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    description: "",
  });

  const handleSubmit = () => {
    if (!formData.company.trim() || !formData.position.trim() || !formData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      onUpdate({ ...formData, id: editingId });
      setEditingId(null);
    } else {
      onAdd(formData);
    }

    setFormData({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      currentlyWorking: false,
      description: "",
    });
    setIsAdding(false);
    toast.success(editingId ? "Employment updated" : "Employment added");
  };

  const handleEdit = (entry: EmploymentEntry) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Employment History</h3>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus size={16} />
            Add Employment
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Company *
                </label>
                <Autocomplete
                  value={formData.company}
                  onChange={(value) => setFormData({ ...formData, company: value })}
                  options={COMMON_COMPANIES}
                  placeholder="Select or type company name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Position *
                </label>
                <Input
                  placeholder="e.g., Product Manager"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Start Date *
                </label>
                <Input
                  type="month"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="border-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  End Date
                </label>
                <Input
                  type="month"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  disabled={formData.currentlyWorking}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="currentlyWorking"
                checked={formData.currentlyWorking}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentlyWorking: e.target.checked,
                    endDate: e.target.checked ? "" : formData.endDate,
                  })
                }
                className="rounded border-slate-300"
              />
              <label htmlFor="currentlyWorking" className="text-sm text-slate-700">
                I currently work here
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Describe your responsibilities and achievements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-slate-300 resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1 bg-slate-900 hover:bg-slate-800">
                {editingId ? "Update" : "Add"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({
                    company: "",
                    position: "",
                    startDate: "",
                    endDate: "",
                    currentlyWorking: false,
                    description: "",
                  });
                }}
                className="flex-1 border-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No employment history added yet</p>
        ) : (
          entries.map((entry, idx) => (
            <Card key={entry.id || idx} className="border-slate-200">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{entry.position}</h4>
                    <p className="text-sm text-slate-600">{entry.company}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {entry.startDate} {entry.endDate && `- ${entry.endDate}`}
                      {entry.currentlyWorking && " (Current)"}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-slate-700 mt-2">{entry.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(entry)}
                      className="border-slate-300"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onDelete(entry.id || "");
                        toast.success("Employment removed");
                      }}
                      className="border-slate-300 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
