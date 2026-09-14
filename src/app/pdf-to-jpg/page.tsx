"use client";

import * as React from "react";
import JSZip from "jszip";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { renderPdfToCanvasBlobs } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const pdfToJpgTool = TOOLS.find((t) => t.id === "pdf-to-jpg")!;

export default function PdfToJpgPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState<"image/jpeg" | "image/png">("image/jpeg");
  const [dpi, setDpi] = React.useState<number>(150); // 72, 150, 300, 600
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultZip, setResultZip] = React.useState<Blob | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("converted-images.zip");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      const scale = dpi / 72; // pdf.js default 72 dpi
      setProgress(50);
      const images = await renderPdfToCanvasBlobs(file, 0.9, scale, format);
      setProgress(80);

      const zip = new JSZip();
      const ext = format === "image/png" ? "png" : "jpg";
      const baseName = file.name.replace(/\.pdf$/i, "");

      images.forEach((img) => {
        zip.file(`${baseName}-page-${img.pageIndex + 1}.${ext}`, img.blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      setResultZip(zipBlob);
      setOutFilename(`${baseName}-images-${dpi}dpi.zip`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "pdf-to-jpg",
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to convert PDF to images: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultZip(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={pdfToJpgTool}>
      {resultZip ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultZip}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Pages Converted to Images!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF file to convert to images"
              helperText="Extract all pages into high-resolution JPG or PNG images."
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

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                    Image Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormat("image/jpeg")}
                      className={`rounded-[var(--radius-md)] border p-3 text-center text-xs font-semibold transition-all ${
                        format === "image/jpeg"
                          ? "border-[var(--accent)] bg-[rgba(59,130,246,0.15)] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      JPG (Smaller File)
                    </button>
                    <button
                      onClick={() => setFormat("image/png")}
                      className={`rounded-[var(--radius-md)] border p-3 text-center text-xs font-semibold transition-all ${
                        format === "image/png"
                          ? "border-[var(--accent)] bg-[rgba(59,130,246,0.15)] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      PNG (Lossless)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                    Resolution (DPI)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[72, 150, 300, 600].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDpi(d)}
                        className={`rounded-[var(--radius-md)] border p-2 text-center text-xs font-mono transition-all ${
                          dpi === d
                            ? "border-[var(--accent)] bg-[rgba(59,130,246,0.15)] text-[var(--foreground)] font-bold"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                        }`}
                      >
                        {d} DPI
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button variant="primary" size="lg" onClick={handleConvert}>
                  Convert to {format === "image/png" ? "PNG" : "JPG"} Images
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Converting PDF to Images..."
        statusText={`Rendering canvas pages at ${dpi} DPI...`}
      />
    </ToolPageShell>
  );
}
