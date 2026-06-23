import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";

interface ExpertNotesSectionProps {
  expertId: number;
}

export function ExpertNotesSection({ expertId }: ExpertNotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  const notesQuery = trpc.expertNotes.getByExpert.useQuery({ expertId });
  const addNoteMutation = trpc.expertNotes.add.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setNewNoteContent("");
      setIsAdding(false);
      notesQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message || "Failed to add note"),
  });
  const deleteNoteMutation = trpc.expertNotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      notesQuery.refetch();
    },
    onError: (e: any) => toast.error(e.message || "Failed to delete note"),
  });

  const handleAddNote = () => {
    if (!newNoteContent.trim()) {
      toast.error("Please enter a note");
      return;
    }

    addNoteMutation.mutate({
      expertId,
      content: newNoteContent,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Notes</h3>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <Plus size={16} />
            Add Note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Note *
              </label>
              <Textarea
                placeholder="Add a note about this expert..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="border-slate-300 resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddNote}
                disabled={addNoteMutation.isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800"
              >
                {addNoteMutation.isPending ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" />Saving...</>
                ) : (
                  "Save Note"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewNoteContent("");
                }}
                className="flex-1 border-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-2">
        {notesQuery.isLoading ? (
          <p className="text-sm text-slate-500 py-4">Loading notes...</p>
        ) : !notesQuery.data || notesQuery.data.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">No notes yet</p>
        ) : (
          notesQuery.data.map((note: any) => (
            <Card key={note.id} className="border-slate-200">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{note.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteNoteMutation.mutate({ id: note.id })}
                    disabled={deleteNoteMutation.isPending}
                    className="border-slate-300 text-red-600 hover:text-red-700"
                  >
                    {deleteNoteMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
