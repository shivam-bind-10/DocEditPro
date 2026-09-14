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
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import { splitPdfPages } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const splitTool = TOOLS.find((t) => t.id === "split-pdf")!;

export default function SplitPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [mode, setMode] = React.useState<"all" | "range">("all");
  const [rangeInput, setRangeInput] = React.useState<string>("1-2");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultZip, setResultZip] = React.useState<Blob | null>(null);
  const [singlePageBytes, setSinglePageBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("split-pages.zip");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const parseRanges = (input: string): number[] => {
    const indices: Set<number> = new Set();
    const parts = input.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            indices.add(i - 1); // 0-indexed
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          indices.add(num - 1);
        }
      }
    }
    return Array.from(indices);
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      let targetIndices: number[] | undefined;
      if (mode === "range") {
        targetIndices = parseRanges(rangeInput);
        if (targetIndices.length === 0) {
          alert("Please enter valid page numbers (e.g., 1-3, 5).");
          setIsProcessing(false);
          return;
        }
      }

      setProgress(40);
      const splitResults = await splitPdfPages(file, targetIndices);
      setProgress(70);

      const baseName = file.name.replace(/\.pdf$/i, "");

      if (splitResults.length === 1) {
        setSinglePageBytes(splitResults[0].data);
        setOutFilename(`${baseName}-page-${splitResults[0].pageIndex + 1}.pdf`);
      } else {
        const zip = new JSZip();
        splitResults.forEach((res) => {
          zip.file(`${baseName}-page-${res.pageIndex + 1}.pdf`, res.data);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        setResultZip(zipBlob);
        setOutFilename(`${baseName}-split.zip`);
      }

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "split-pdf",
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to split PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultZip(null);
    setSinglePageBytes(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={splitTool}>
      {resultZip || singlePageBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultZip || singlePageBytes!}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Split Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF file to split"
              helperText="Extract page ranges or split every page into separate PDFs."
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

              {/* Options Panel */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Split Mode</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setMode("all")}
                    className={`rounded-[var(--radius-md)] border p-4 cursor-pointer transition-all ${
                      mode === "all"
                        ? "border-[var(--accent)] bg-[rgba(59,130,246,0.1)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="font-semibold text-sm text-[var(--foreground)]">Split All Pages</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      Extract every single page into an individual PDF file in a ZIP archive.
                    </div>
                  </div>

                  <div
                    onClick={() => setMode("range")}
                    className={`rounded-[var(--radius-md)] border p-4 cursor-pointer transition-all ${
                      mode === "range"
                        ? "border-[var(--accent)] bg-[rgba(59,130,246,0.1)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="font-semibold text-sm text-[var(--foreground)]">Select Page Ranges</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">
                      Extract specific pages or page ranges (e.g. 1-3, 5, 8-10).
                    </div>
                  </div>
                </div>

                {mode === "range" && (
                  <div className="pt-2 space-y-1.5">
                    <label className="text-xs font-medium text-[var(--foreground)]">Page Range</label>
                    <Input
                      type="text"
                      placeholder="e.g. 1-3, 5, 7-10"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      className="max-w-md text-sm"
                    />
                    <p className="text-[11px] text-[var(--subtle-foreground)]">
                      Separate page numbers or ranges with commas.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button variant="primary" size="lg" onClick={handleSplit}>
                  Split PDF Document
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Splitting PDF Document..."
        statusText="Extracting pages into individual documents..."
      />
    </ToolPageShell>
  );
}
