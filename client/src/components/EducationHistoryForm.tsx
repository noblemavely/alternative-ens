import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Autocomplete } from "@/components/Autocomplete";
import { COMMON_UNIVERSITIES, COMMON_DEGREES, COMMON_FIELDS_OF_STUDY } from "@/lib/suggestions";

interface EducationEntry {
  id?: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface EducationHistoryFormProps {
  entries: EducationEntry[];
  onAdd: (entry: EducationEntry) => void;
  onUpdate: (entry: EducationEntry) => void;
  onDelete: (id: string) => void;
}

export function EducationHistoryForm({
  entries,
  onAdd,
  onUpdate,
  onDelete,
}: EducationHistoryFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EducationEntry>({
    school: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const handleSubmit = () => {
    if (!formData.school.trim() || !formData.degree.trim() || !formData.field.trim() || !formData.startDate) {
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
      school: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      description: "",
    });
    setIsAdding(false);
    toast.success(editingId ? "Education updated" : "Education added");
  };

  const handleEdit = (entry: EducationEntry) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Education History</h3>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus size={16} />
            Add Education
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                School/University *
              </label>
              <Autocomplete
                value={formData.school}
                onChange={(value) => setFormData({ ...formData, school: value })}
                options={COMMON_UNIVERSITIES}
                placeholder="Select or type university name..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Degree *
                </label>
                <Autocomplete
                  value={formData.degree}
                  onChange={(value) => setFormData({ ...formData, degree: value })}
                  options={COMMON_DEGREES}
                  placeholder="Select degree..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1">
                  Field of Study *
                </label>
                <Autocomplete
                  value={formData.field}
                  onChange={(value) => setFormData({ ...formData, field: value })}
                  options={COMMON_FIELDS_OF_STUDY}
                  placeholder="Select field of study..."
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
                  className="border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Additional details about your education..."
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
                    school: "",
                    degree: "",
                    field: "",
                    startDate: "",
                    endDate: "",
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
          <p className="text-sm text-slate-500 py-4">No education history added yet</p>
        ) : (
          entries.map((entry, idx) => (
            <Card key={entry.id || idx} className="border-slate-200">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{entry.degree} in {entry.field}</h4>
                    <p className="text-sm text-slate-600">{entry.school}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {entry.startDate} {entry.endDate && `- ${entry.endDate}`}
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
                        toast.success("Education removed");
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
