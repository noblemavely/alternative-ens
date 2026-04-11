import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  documentTitle?: string;
}

export default function DocumentViewer({
  open,
  onOpenChange,
  documentUrl,
  documentTitle = "Document",
}: DocumentViewerProps) {
  // Convert relative URLs to absolute URLs for proper loading
  const absoluteUrl = useMemo(() => {
    if (!documentUrl) return "";
    if (documentUrl.startsWith("http")) return documentUrl;
    // Convert relative path to absolute URL
    return `${window.location.origin}${documentUrl.startsWith("/") ? "" : "/"}${documentUrl}`;
  }, [documentUrl]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = absoluteUrl;
    link.download = `${documentTitle}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle>{documentTitle}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download size={16} />
            Download
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100">
          {absoluteUrl ? (
            <iframe
              src={`${absoluteUrl}#toolbar=1`}
              className="w-full h-full border-0 bg-white"
              title={documentTitle}
              onError={() => {
                console.error("Failed to load document:", absoluteUrl);
              }}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-slate-600">No document URL provided</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
