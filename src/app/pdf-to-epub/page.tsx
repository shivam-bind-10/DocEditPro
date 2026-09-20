"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertPdfToEpub } from "@/lib/convert/ebook-audio-zip-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { BookOpen } from "lucide-react";

const pdfToEpubTool = TOOLS.find((t) => t.id === "pdf-to-epub")!;

export default function PdfToEpubPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBlob, setResultBlob] = React.useState<Blob | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("ebook.epub");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const epubBlob = await convertPdfToEpub(file);
      setProgress(90);

      setResultBlob(epubBlob);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}.epub`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "pdf-to-epub",
        resultSize: epubBlob.size,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to convert PDF to EPUB: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBlob(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={pdfToEpubTool}>
      {resultBlob ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBlob}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Converted to EPUB eBook!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to convert to EPUB eBook"
              helperText="Package document text and chapters into an EPUB e-reader archive."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-6 w-6 text-[var(--accent)]" />
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
                  Convert to EPUB (.epub)
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Converting PDF to EPUB..."
        statusText="Structuring XHTML chapters and building Open Container manifest..."
      />
    </ToolPageShell>
  );
}
