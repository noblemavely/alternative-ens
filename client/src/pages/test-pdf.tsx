import DocumentViewer from "@/components/DocumentViewer";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestPDF() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">PDF Viewer Test</h1>
      <p className="mb-4">Testing PDF viewer with uploaded resume</p>
      
      <Button onClick={() => setOpen(true)}>Open PDF Viewer</Button>
      
      <DocumentViewer
        open={open}
        onOpenChange={setOpen}
        documentUrl="/uploads/cv-uploads/1775927484200-Resume-NobleMavely-20251.pdf"
        documentTitle="Test Resume"
      />
    </div>
  );
}
