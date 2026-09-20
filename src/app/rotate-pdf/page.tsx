"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, RotateCw, RotateCcw } from "lucide-react";
import { rotatePdfPages } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const rotatePdfTool = TOOLS.find((t) => t.id === "rotate-pdf")!;

const ROTATIONS = [
  { label: "90° CW", value: 90, icon: "↻" },
  { label: "180°", value: 180, icon: "↕" },
  { label: "90° CCW", value: 270, icon: "↺" },
];

export default function RotatePdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [rotation, setRotation] = React.useState<number>(90);
  const [scope, setScope] = React.useState<"all" | "custom">("all");
  const [pageRangeInput, setPageRangeInput] = React.useState<string>("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("rotated.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const parsePageRange = (input: string, total: number): number[] => {
    const indices: number[] = [];
    const parts = input.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= total) indices.push(i - 1);
        }
      } else {
        const n = Number(part);
        if (n >= 1 && n <= total) indices.push(n - 1);
      }
    }
    return [...new Set(indices)];
  };

  const handleRotate = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      // Get total page count first
      const { PDFDocument } = await import("pdf-lib");
      const ab = await file.arrayBuffer();
      const tempDoc = await PDFDocument.load(ab);
      const totalPages = tempDoc.getPageCount();

      let pageIndices: number[] | undefined = undefined;
      if (scope === "custom" && pageRangeInput.trim()) {
        pageIndices = parsePageRange(pageRangeInput, totalPages);
      }

      setProgress(50);
      const rotated = await rotatePdfPages(file, rotation, pageIndices);
      setProgress(90);

      setResultBytes(rotated);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-rotated.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "rotate-pdf",
        resultSize: rotated.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to rotate PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setProgress(0);
    setScope("all");
    setPageRangeInput("");
  };

  return (
    <ToolPageShell tool={rotatePdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Rotated Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF file to rotate pages"
              helperText="Rotate the entire document or specific page ranges by 90°, 180°, or 270°."
            />
          ) : (
            <Card className="p-6 space-y-6">
              {/* File Header */}
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

              {/* Rotation Amount */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Rotation Angle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {ROTATIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRotation(r.value)}
                      className={`rounded-[var(--radius-md)] border p-4 text-center transition-all ${
                        rotation === r.value
                          ? "border-[var(--accent)] bg-[rgba(59,130,246,0.15)] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <div className="text-2xl mb-1">{r.icon}</div>
                      <div className="text-xs font-semibold">{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope: All or Custom */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Pages to Rotate
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "all", label: "All Pages" },
                    { value: "custom", label: "Specific Pages" },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScope(s.value as "all" | "custom")}
                      className={`rounded-[var(--radius-md)] border p-3 text-sm font-semibold transition-all ${
                        scope === s.value
                          ? "border-[var(--accent)] bg-[rgba(59,130,246,0.15)] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {scope === "custom" && (
                  <div className="space-y-2">
                    <label className="text-xs text-[var(--muted-foreground)]">
                      Enter page numbers or ranges (e.g. <code className="text-[var(--accent)]">1, 3-5, 8</code>)
                    </label>
                    <input
                      type="text"
                      value={pageRangeInput}
                      onChange={(e) => setPageRangeInput(e.target.value)}
                      placeholder="1, 3-5, 8"
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                  {rotation === 90 ? <RotateCw className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
                  {scope === "all" ? "All pages" : "Selected pages"} → {ROTATIONS.find((r) => r.value === rotation)?.label}
                </span>
                <Button variant="primary" size="lg" onClick={handleRotate}>
                  Rotate PDF
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Rotating PDF Pages..."
        statusText="Applying rotation transforms to page matrices..."
      />
    </ToolPageShell>
  );
}
