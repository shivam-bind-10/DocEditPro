"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Trash2 } from "lucide-react";
import { mergePdfFiles } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const mergeTool = TOOLS.find((t) => t.id === "merge-pdf")!;

export default function MergePdfPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    setFiles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const merged = await mergePdfFiles(files);
      setProgress(90);

      const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);
      setResultBytes(merged);

      await addRecentFile({
        name: "merged-document.pdf",
        size: totalOriginalSize,
        type: "application/pdf",
        toolSlug: "merge-pdf",
        resultSize: merged.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to merge PDFs: ${(err as Error).message || err}`);
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
    <ToolPageShell tool={mergeTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename="merged-document.pdf"
          blob={resultBytes}
          originalSize={files.reduce((acc, f) => acc + f.size, 0)}
          onReset={handleReset}
          actionTitle="PDFs Merged Successfully!"
        />
      ) : (
        <div className="space-y-6">
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            multiple={true}
            accept={[".pdf"]}
            label="Drag & drop PDF files to merge"
            helperText="Add two or more PDF documents. Drag to reorder files."
          />

          {files.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Selected Files ({files.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  className="text-xs text-rose-400 hover:bg-rose-500/10"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-sm"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="flex items-center space-x-1 text-[var(--subtle-foreground)]">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveFile(idx, idx - 1)}
                          className="hover:text-[var(--foreground)] disabled:opacity-30"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          disabled={idx === files.length - 1}
                          onClick={() => moveFile(idx, idx + 1)}
                          className="hover:text-[var(--foreground)] disabled:opacity-30"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                      <FileText className="h-5 w-5 text-[var(--accent)] shrink-0" />
                      <div className="min-w-0 truncate">
                        <p className="font-mono font-medium text-[var(--foreground)] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFile(idx)}
                      className="text-[var(--subtle-foreground)] hover:text-rose-400 p-1.5 rounded"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Total Size: {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
                </p>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleMerge}
                  disabled={files.length < 2}
                  className="w-full sm:w-auto"
                >
                  Merge {files.length} PDFs
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Merging PDF Files..."
        statusText="Combining page trees and metadata 100% locally..."
      />
    </ToolPageShell>
  );
}
