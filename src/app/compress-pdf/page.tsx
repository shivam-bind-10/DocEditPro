"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Zap, ShieldAlert, Sparkles } from "lucide-react";
import { compressPdfFile } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const compressTool = TOOLS.find((t) => t.id === "compress-pdf")!;

export default function CompressPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [level, setLevel] = React.useState<"light" | "medium" | "heavy">("medium");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const compressed = await compressPdfFile(file, level);
      setProgress(90);

      setResultBytes(compressed);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "compress-pdf",
        resultSize: compressed.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to compress PDF: ${(err as Error).message || err}`);
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
    <ToolPageShell tool={compressTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={`compressed-${file?.name || "document.pdf"}`}
          blob={resultBytes}
          originalSize={file?.size}
          resultSize={resultBytes.length}
          onReset={handleReset}
          actionTitle="PDF Compressed Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF file to compress"
              helperText="Reduce file size while preserving document visual clarity."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Original Size: {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              {/* Compression Presets */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Compression Level</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    onClick={() => setLevel("light")}
                    className={`rounded-[var(--radius-md)] border p-4 cursor-pointer transition-all ${
                      level === "light"
                        ? "border-[var(--accent)] bg-[rgba(59,130,246,0.1)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span className="font-semibold text-sm text-[var(--foreground)]">Light</span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-2">
                      High quality, minor file size reduction (~10-20%).
                    </div>
                  </div>

                  <div
                    onClick={() => setLevel("medium")}
                    className={`rounded-[var(--radius-md)] border p-4 cursor-pointer transition-all ${
                      level === "medium"
                        ? "border-[var(--accent)] bg-[rgba(59,130,246,0.1)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-400" />
                      <span className="font-semibold text-sm text-[var(--foreground)]">Recommended</span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-2">
                      Optimal balance of size & visual crispness (~40-60%).
                    </div>
                  </div>

                  <div
                    onClick={() => setLevel("heavy")}
                    className={`rounded-[var(--radius-md)] border p-4 cursor-pointer transition-all ${
                      level === "heavy"
                        ? "border-[var(--accent)] bg-[rgba(59,130,246,0.1)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      <span className="font-semibold text-sm text-[var(--foreground)]">Extreme</span>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-2">
                      Maximum compression for emails & uploads (~70-85%).
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button variant="primary" size="lg" onClick={handleCompress}>
                  Compress PDF File
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Compressing PDF File..."
        statusText="Optimizing object streams and image assets 100% locally..."
      />
    </ToolPageShell>
  );
}
