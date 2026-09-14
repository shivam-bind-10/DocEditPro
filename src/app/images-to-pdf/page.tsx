"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Images, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { convertImagesToPdf } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const imagesToPdfTool = TOOLS.find((t) => t.id === "images-to-pdf")!;

export default function ImagesToPdfPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [margin, setMargin] = React.useState<number>(0); // 0, 15, 30
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveFile = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    setFiles((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await convertImagesToPdf(files, margin);
      setProgress(90);

      setResultBytes(pdfBytes);

      await addRecentFile({
        name: "images-combined.pdf",
        size: files.reduce((acc, f) => acc + f.size, 0),
        type: "application/pdf",
        toolSlug: "images-to-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to convert images to PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={imagesToPdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename="images-combined.pdf"
          blob={resultBytes}
          originalSize={files.reduce((acc, f) => acc + f.size, 0)}
          onReset={handleReset}
          actionTitle="Images Converted to PDF Successfully!"
        />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept={[".jpg", ".jpeg", ".png", ".webp", "image/*"]}
            multiple={true}
            label="Drag & drop JPG, PNG, or WEBP images"
            helperText="Combine multiple photos into a single formatted PDF document."
          />

          {files.length > 0 && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Images className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">
                      Selected Images ({files.length})
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Total: {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  className="text-xs text-rose-400"
                >
                  Clear All
                </Button>
              </div>

              {/* Image List & Reordering */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="font-mono text-[var(--subtle-foreground)] font-bold">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 truncate">
                        <p className="font-mono font-medium text-[var(--foreground)] truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveFile(idx, idx - 1)}
                        className="p-1 text-[var(--subtle-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        disabled={idx === files.length - 1}
                        onClick={() => moveFile(idx, idx + 1)}
                        className="p-1 text-[var(--subtle-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Page Margin Presets */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Page Margin
                </label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { label: "No Margin", value: 0 },
                    { label: "Small (15px)", value: 15 },
                    { label: "Large (30px)", value: 30 },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMargin(m.value)}
                      className={`rounded-[var(--radius-md)] border p-2.5 text-center text-xs font-medium transition-all ${
                        margin === m.value
                          ? "border-[var(--accent)] bg-[rgba(59,130,246,0.15)] text-[var(--foreground)] font-bold"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button variant="primary" size="lg" onClick={handleConvert}>
                  Convert {files.length} Images to PDF
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Converting Images to PDF..."
        statusText="Embedding image layers and constructing PDF page tree..."
      />
    </ToolPageShell>
  );
}
