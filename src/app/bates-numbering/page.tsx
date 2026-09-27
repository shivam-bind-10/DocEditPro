"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Hash, Download, Check, RefreshCw, FileText, Layers, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { applyBatchBatesNumbering, BatesOptions, formatBatesNumber } from "@/lib/pdf/bates-utils";
import { addRecentFile } from "@/lib/storage/db";
import JSZip from "jszip";

export default function BatesNumberingPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [prefix, setPrefix] = React.useState("CONFIDENTIAL-");
  const [suffix, setSuffix] = React.useState("");
  const [startNumber, setStartNumber] = React.useState(1);
  const [digitPadding, setDigitPadding] = React.useState(6);
  const [position, setPosition] = React.useState<BatesOptions["position"]>("bottom-right");
  const [fontSize, setFontSize] = React.useState(10);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [processedFiles, setProcessedFiles] = React.useState<{ name: string; blob: Blob; size: number }[]>([]);

  const handleFilesSelected = (newFiles: File[]) => {
    const pdfs = newFiles.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    setFiles((prev) => [...prev, ...pdfs]);
    setProcessedFiles([]);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      const fileBuffers = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          bytes: new Uint8Array(await file.arrayBuffer()),
        }))
      );
      setProgress(40);

      const results = await applyBatchBatesNumbering(fileBuffers, {
        prefix,
        suffix,
        startNumber,
        digitPadding,
        position,
        fontSize,
      });
      setProgress(85);

      const output = results.map((r) => {
        const blob = new Blob([r.bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
        return {
          name: r.name,
          blob,
          size: blob.size,
        };
      });

      setProcessedFiles(output);

      // Record in recent files
      for (let i = 0; i < files.length; i++) {
        await addRecentFile({
          name: output[i]?.name || files[i].name,
          size: files[i].size,
          type: "application/pdf",
          toolSlug: "bates-numbering",
          resultSize: output[i]?.size,
        });
      }

      setProgress(100);
    } catch (err) {
      console.error(err);
      alert("Failed to apply Bates numbering. Please ensure valid PDF files were provided.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllZip = async () => {
    if (processedFiles.length === 0) return;
    const zip = new JSZip();
    for (const f of processedFiles) {
      zip.file(f.name, f.blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bates-numbered-batch-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = (fileItem: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(fileItem.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileItem.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sampleStamp = formatBatesNumber(startNumber, prefix, suffix, digitPadding);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Tools
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bates Numbering</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Sequential legal and discovery document numbering across single or multi-file batches. 100% client-side.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        {files.length === 0 ? (
          <FileDropzone
            accept={{ "application/pdf": [".pdf"] }}
            maxFiles={50}
            onFilesSelected={handleFilesSelected}
            title="Drop PDF documents here to apply Bates numbering"
            description="Upload one or multiple PDF documents for continuous sequential numbering"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Options Panel */}
            <div className="space-y-6">
              <Card className="p-5 border-[var(--border)] bg-[var(--surface)] space-y-4">
                <h3 className="font-semibold text-sm flex items-center space-x-2 text-[var(--foreground)]">
                  <Hash className="h-4 w-4 text-[var(--accent)]" />
                  <span>Numbering Scheme</span>
                </h3>

                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Prefix</label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    placeholder="e.g. EXHIBIT- or CONFIDENTIAL-"
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Suffix (Optional)</label>
                  <Input
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    placeholder="e.g. -A"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">Start Number</label>
                    <Input
                      type="number"
                      min={1}
                      value={startNumber}
                      onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">Digits (Padding)</label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={digitPadding}
                      onChange={(e) => setDigitPadding(Math.max(1, parseInt(e.target.value) || 6))}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="bottom-right">Bottom Right (Standard Legal)</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Font Size (pt)</label>
                  <Input
                    type="number"
                    min={6}
                    max={24}
                    value={fontSize}
                    onChange={(e) => setFontSize(Math.max(6, parseInt(e.target.value) || 10))}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">Live Stamp Sample:</div>
                  <div className="p-2.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] font-mono text-sm text-[var(--accent)] font-bold text-center">
                    {sampleStamp}
                  </div>
                </div>

                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white mt-2"
                >
                  Apply Bates Stamping
                </Button>
              </Card>
            </div>

            {/* Document Queue & Results */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 border-[var(--border)] bg-[var(--surface)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center space-x-2 text-[var(--foreground)]">
                    <Layers className="h-4 w-4 text-[var(--accent)]" />
                    <span>Selected Documents ({files.length})</span>
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFiles([]);
                      setProcessedFiles([]);
                    }}
                    className="text-xs text-[var(--muted-foreground)] hover:text-red-400"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="h-4 w-4 text-[var(--accent)] shrink-0" />
                        <span className="truncate font-medium">{file.name}</span>
                      </div>
                      <span className="text-[var(--muted-foreground)] shrink-0 ml-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs text-[var(--muted-foreground)]">
                  <span>Continuous numbering across all files in order.</span>
                  <label className="text-[var(--accent)] hover:underline cursor-pointer">
                    + Add More PDFs
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                      }}
                    />
                  </label>
                </div>
              </Card>

              {/* Processed Results */}
              {processedFiles.length > 0 && (
                <Card className="p-5 border-[var(--border)] bg-[var(--surface)] space-y-4 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
                      <Check className="h-4 w-4" />
                      <span>{processedFiles.length} Document(s) Stamped Successfully</span>
                    </div>
                    {processedFiles.length > 1 && (
                      <Button
                        onClick={handleDownloadAllZip}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>Download All (ZIP)</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {processedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-xs"
                      >
                        <div className="truncate mr-2 font-medium">{file.name}</div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownloadSingle(file)}
                          className="h-8 text-xs flex items-center space-x-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Save</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <ProcessingOverlay isOpen={isProcessing} progress={progress} statusText="Applying legal Bates stamping..." />
    </div>
  );
}
