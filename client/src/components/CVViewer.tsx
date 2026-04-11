import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface CVViewerProps {
  isOpen: boolean;
  onClose: () => void;
  cvUrl?: string;
  expertName?: string;
}

export function CVViewer({ isOpen, onClose, cvUrl, expertName = "Expert" }: CVViewerProps) {
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  if (!cvUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>CV - {expertName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-slate-600 mb-2">No CV available</p>
              <p className="text-sm text-slate-500">This expert hasn't uploaded a CV yet.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = cvUrl;
    link.download = `${expertName}_CV.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between w-full">
            <DialogTitle>CV - {expertName}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              title="Zoom out"
            >
              <ZoomOut size={16} />
            </Button>
            <span className="text-sm text-slate-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 2}
              title="Zoom in"
            >
              <ZoomIn size={16} />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
            title="Download CV"
          >
            <Download size={16} />
            Download
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease-out",
            }}
          >
            <iframe
              src={`${cvUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-[850px] h-[1100px] border-0 rounded-lg shadow-lg bg-white"
              title={`${expertName} CV`}
              style={{
                pointerEvents: "auto",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-center text-sm text-slate-600">
          PDF Viewer - Use zoom controls to adjust view
        </div>
      </DialogContent>
    </Dialog>
  );
}
