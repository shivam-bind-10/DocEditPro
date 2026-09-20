"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { flattenPdfFile } from "@/lib/pdf/security-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Layers } from "lucide-react";

const flattenTool = TOOLS.find((t) => t.id === "flatten-pdf")!;

export default function FlattenPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("flattened.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleFlatten = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await flattenPdfFile(file);
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-flattened.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "flatten-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to flatten PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={flattenTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Flattened Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to flatten form fields & annotations"
              helperText="Convert interactive form fields, checkboxes, and comments into uneditable vector paths."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Layers className="h-6 w-6 text-[var(--accent)]" />
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
                <Button variant="primary" size="lg" onClick={handleFlatten}>
                  Flatten PDF Now
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Flattening PDF..."
        statusText="Converting interactive AcroForm fields to static content..."
      />
    </ToolPageShell>
  );
}
