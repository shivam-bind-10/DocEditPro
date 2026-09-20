"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { convertPdfToWord } from "@/lib/convert/office-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const pdfToWordTool = TOOLS.find((t) => t.id === "pdf-to-word")!;

export default function PdfToWordPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultDocxBlob, setResultDocxBlob] = React.useState<Blob | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("converted.docx");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const docxBlob = await convertPdfToWord(file);
      setProgress(90);

      setResultDocxBlob(docxBlob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}.docx`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "pdf-to-word",
        resultSize: docxBlob.size,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to convert PDF to Word: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultDocxBlob(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={pdfToWordTool}>
      {resultDocxBlob ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultDocxBlob}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Exported to Editable Word (.docx)!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF file to convert to Word"
              helperText="Extract text and paragraph layout into an editable DOCX document."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleConvert}>
                  Export to Word (.docx)
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Converting PDF to Word..."
        statusText="Extracting text runs and generating OpenXML document structure..."
      />
    </ToolPageShell>
  );
}
