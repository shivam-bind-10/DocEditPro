"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  Archive,
  Download,
  Check,
  CheckCircle2,
  Minimize2,
  RotateCw,
  Stamp,
  Lock,
  FileCheck,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { addRecentFile } from "@/lib/storage/db";
import JSZip from "jszip";

type BatchAction = "compress" | "rotate" | "watermark" | "encrypt" | "flatten";

export default function BatchQueuePage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [action, setAction] = React.useState<BatchAction>("compress");
  const [watermarkText, setWatermarkText] = React.useState("CONFIDENTIAL");
  const [rotateDeg, setRotateDeg] = React.useState<90 | 180 | 270>(90);
  const [password, setPassword] = React.useState("");

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [processedResults, setProcessedResults] = React.useState<
    { name: string; blob: Blob; oldSize: number; newSize: number }[]
  >([]);

  const handleFilesSelected = (newFiles: File[]) => {
    const pdfs = newFiles.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    setFiles((prev) => [...prev, ...pdfs]);
    setProcessedResults([]);
  };

  const handleRunBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(5);

    const results: { name: string; blob: Blob; oldSize: number; newSize: number }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

        if (action === "rotate") {
          const pages = pdfDoc.getPages();
          for (const page of pages) {
            const currentRot = page.getRotation().angle;
            page.setRotation(degrees((currentRot + rotateDeg) % 360));
          }
        } else if (action === "watermark") {
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const pages = pdfDoc.getPages();
          for (const page of pages) {
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(watermarkText, 48);
            page.drawText(watermarkText, {
              x: width / 2 - textWidth / 2,
              y: height / 2,
              size: 48,
              font,
              color: rgb(0.7, 0.7, 0.7),
              opacity: 0.35,
              rotate: degrees(45),
            });
          }
        } else if (action === "flatten") {
          try {
            const form = pdfDoc.getForm();
            form.flatten();
          } catch {
            // no form
          }
        } else if (action === "compress") {
          // Flatten annotations and optimize object streams
          try {
            const form = pdfDoc.getForm();
            form.flatten();
          } catch {
            // ignore
          }
        }

        let outputBytes: Uint8Array;
        if (action === "encrypt" && password) {
          // PDF document with standard save
          outputBytes = await pdfDoc.save({ useObjectStreams: true });
        } else {
          outputBytes = await pdfDoc.save({ useObjectStreams: true });
        }

        const blob = new Blob([outputBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
        const resultName = `${file.name.replace(/\.pdf$/i, "")}-${action}.pdf`;

        results.push({
          name: resultName,
          blob,
          oldSize: file.size,
          newSize: blob.size,
        });

        await addRecentFile({
          name: resultName,
          size: file.size,
          type: "application/pdf",
          toolSlug: "batch-queue",
          resultSize: blob.size,
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setProcessedResults(results);
    } catch (err) {
      console.error(err);
      alert("Error occurred during batch queue processing.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (processedResults.length === 0) return;
    const zip = new JSZip();
    for (const item of processedResults) {
      zip.file(item.name, item.blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `doceditpro-batch-${action}-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = (item: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalOldBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalNewBytes = processedResults.reduce((acc, r) => acc + r.newSize, 0);

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
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Batch / Bulk Queue</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Apply one operation across dozens of PDF files simultaneously in a single pass. 100% in your browser.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        {files.length === 0 ? (
          <FileDropzone
            accept={[".pdf"]}
            maxFiles={50}
            onFilesSelected={handleFilesSelected}
            title="Drop multiple PDF files to queue for batch processing"
            description="Select or drag up to 50 files for bulk compress, watermark, rotate, or flatten"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Options Panel */}
            <div className="space-y-6">
              <Card className="p-5 border-[var(--border)] bg-[var(--surface)] space-y-4">
                <h3 className="font-semibold text-sm">Select Bulk Operation</h3>

                <div className="space-y-2">
                  {[
                    { id: "compress", label: "Batch Compress", icon: Minimize2, desc: "Optimize object streams" },
                    { id: "watermark", label: "Batch Watermark", icon: Stamp, desc: "Stamp custom text watermark" },
                    { id: "rotate", label: "Batch Rotate", icon: RotateCw, desc: "Rotate all pages uniformly" },
                    { id: "flatten", label: "Batch Flatten", icon: FileCheck, desc: "Strip fillable forms and annotations" },
                  ].map((act) => {
                    const Icon = act.icon;
                    const isSelected = action === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setAction(act.id as BatchAction);
                          setProcessedResults([]);
                        }}
                        className={`w-full p-3 rounded-lg border text-left flex items-start space-x-3 transition-colors ${
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                            : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? "text-[var(--accent)]" : ""}`} />
                        <div>
                          <div className="text-xs font-semibold text-[var(--foreground)]">{act.label}</div>
                          <div className="text-[11px] text-[var(--muted-foreground)]">{act.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-options */}
                {action === "watermark" && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">Watermark Text</label>
                    <Input
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL or DRAFT"
                      className="text-xs"
                    />
                  </div>
                )}

                {action === "rotate" && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">Rotation Angle</label>
                    <select
                      value={rotateDeg}
                      onChange={(e) => setRotateDeg(Number(e.target.value) as any)}
                      className="w-full h-8 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-2 text-xs text-[var(--foreground)]"
                    >
                      <option value={90}>90° Clockwise</option>
                      <option value={180}>180° Upside Down</option>
                      <option value={270}>270° Counter-Clockwise</option>
                    </select>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    onClick={handleRunBatch}
                    disabled={isProcessing}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                  >
                    Execute Batch on {files.length} File{files.length > 1 ? "s" : ""}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Files List & Results */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 border-[var(--border)] bg-[var(--surface)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    Queue: {files.length} Document(s) ({(totalOldBytes / 1024 / 1024).toFixed(2)} MB)
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFiles([]);
                      setProcessedResults([]);
                    }}
                    className="text-xs text-[var(--muted-foreground)] hover:text-red-400"
                  >
                    Clear Queue
                  </Button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-xs"
                    >
                      <span className="truncate font-medium max-w-md">{file.name}</span>
                      <span className="text-[var(--muted-foreground)] shrink-0 ml-2">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[var(--border)] text-right">
                  <label className="text-xs text-[var(--accent)] hover:underline cursor-pointer">
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

              {/* Completed Results */}
              {processedResults.length > 0 && (
                <Card className="p-5 border-[var(--border)] bg-[var(--surface)] space-y-4 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Batch Completed: {processedResults.length} Files Ready</span>
                    </div>
                    <Button
                      onClick={handleDownloadAll}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Download All as ZIP</span>
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {processedResults.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-xs"
                      >
                        <div className="truncate mr-2 font-medium">{item.name}</div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="text-[var(--muted-foreground)]">
                            {(item.newSize / 1024).toFixed(1)} KB
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadSingle(item)}
                            className="h-7 text-xs flex items-center space-x-1"
                          >
                            <Download className="h-3 w-3" />
                            <span>Save</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      <ProcessingOverlay isOpen={isProcessing} progress={progress} statusText={`Processing batch queue (${progress}%)...`} />
    </div>
  );
}
