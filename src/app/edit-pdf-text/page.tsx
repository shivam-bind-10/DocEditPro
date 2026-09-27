"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { InteractivePdfEditor } from "@/components/editor/InteractivePdfEditor";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { PDFDocument } from "pdf-lib";

const editPdfTextTool = TOOLS.find((t) => t.id === "edit-pdf-text")!;

export default function EditPdfTextPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("edited.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultBytes(null);
    }
  };

  const handleCreateBlankPdf = async () => {
    // Generate a fresh clean A4 blank PDF in memory
    const doc = await PDFDocument.create();
    doc.addPage([595.28, 841.89]);
    const bytes = await doc.save();
    const blankFile = new File([bytes as Uint8Array<ArrayBuffer>], "untitled-document.pdf", {
      type: "application/pdf",
    });
    setFile(blankFile);
    setResultBytes(null);
  };

  const handleSaveSuccess = (pdfBytes: Uint8Array, filename: string) => {
    setResultBytes(pdfBytes);
    setOutFilename(filename);
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
  };

  const handleContinueEditing = () => {
    if (resultBytes) {
      const updatedFile = new File([resultBytes as Uint8Array<ArrayBuffer>], outFilename, {
        type: "application/pdf",
      });
      setFile(updatedFile);
      setResultBytes(null);
    }
  };

  return (
    <>
      {file && !resultBytes ? (
        // Full screen interactive studio mode
        <InteractivePdfEditor
          initialFile={file}
          onClose={handleReset}
          onSaveSuccess={handleSaveSuccess}
        />
      ) : (
        <ToolPageShell tool={editPdfTextTool}>
          {resultBytes ? (
            <div className="space-y-4">
              <ResultDownloadCard
                filename={outFilename}
                blob={resultBytes}
                originalSize={file?.size}
                onReset={handleReset}
                actionTitle="PDF Edited & Exported Successfully!"
              />
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={handleContinueEditing}>
                  Continue Editing This Document
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <FileDropzone
                onFilesSelected={handleFileSelected}
                accept={[".pdf", "application/pdf"]}
                label="Drop your PDF here to edit text, images, and pages"
                helperText="Opens the real PDF with full visual canvas. Edit text, replace pictures, add new content, draw, sign, and manage pages."
              />

              <div className="text-center pt-2">
                <span className="text-xs text-[var(--muted-foreground)]">Or start from scratch:</span>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateBlankPdf}
                    className="text-xs inline-flex items-center space-x-1.5"
                  >
                    <FilePlus className="h-4 w-4 text-[var(--accent)]" />
                    <span>Create & Edit Blank Document</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ToolPageShell>
      )}
    </>
  );
}
