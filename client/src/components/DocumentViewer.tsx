import { useState, Suspense, useMemo, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set the PDF.js worker source - use dynamic import for better compatibility
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  // Try to use a reliable CDN source that works with absolute URLs
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

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
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Convert relative URLs to absolute URLs for proper PDF.js loading
  const absoluteUrl = useMemo(() => {
    if (!documentUrl) return "";
    if (documentUrl.startsWith("http")) return documentUrl;
    // Convert relative path to absolute URL
    return `${window.location.origin}${documentUrl.startsWith("/") ? "" : "/"}${documentUrl}`;
  }, [documentUrl]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setIsLoading(false);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(numPages || prev, prev + 1));
  };

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
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-slate-400" size={32} />
              </div>
            }
          >
            <div className="bg-white shadow-lg">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <Loader2 className="animate-spin text-slate-400" size={32} />
                </div>
              )}
              <Document
                file={absoluteUrl}
                onLoadSuccess={handleDocumentLoadSuccess}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="animate-spin text-slate-400" size={32} />
                  </div>
                }
                error={
                  <div className="flex items-center justify-center p-8">
                    <p className="text-slate-600">Failed to load document: {absoluteUrl}</p>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  scale={1.5}
                />
              </Document>
            </div>
          </Suspense>
        </div>

        {numPages && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>

            <div className="text-sm text-slate-600">
              Page {currentPage} of {numPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === numPages}
              className="gap-2"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
