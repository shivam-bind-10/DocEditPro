"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { redactPdfFile, RedactionBox } from "@/lib/pdf/security-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { EyeOff, Plus, Trash2, ShieldAlert } from "lucide-react";

const redactTool = TOOLS.find((t) => t.id === "redact-pdf")!;

export default function RedactPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("redacted.pdf");

  const [burnPixels, setBurnPixels] = React.useState(true);
  const [redactions, setRedactions] = React.useState<RedactionBox[]>([
    { pageIndex: 0, x: 10, y: 10, width: 80, height: 15 }, // default sample top header box
  ]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const addRedactionArea = () => {
    setRedactions((prev) => [
      ...prev,
      { pageIndex: 0, x: 20, y: 30, width: 60, height: 10 },
    ]);
  };

  const handleRedact = async () => {
    if (!file) return;
    if (redactions.length === 0) {
      alert("Please add at least one redaction area.");
      return;
    }

    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const pdfBytes = await redactPdfFile(file, redactions, burnPixels);
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-redacted.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "redact-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to redact PDF: ${(err as Error).message || err}`);
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
    <ToolPageShell tool={redactTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Permanently Redacted!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to redact sensitive text"
              helperText="Permanently burn black redaction boxes into document pixels so text cannot be extracted."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <EyeOff className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              {/* Security Banner */}
              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-4 flex items-start space-x-3 text-xs text-amber-300">
                <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-200">Permanent Pixel Destruction</p>
                  <p className="mt-1">
                    Unlike standard PDF annotations, DocEditPro permanently flattens and burns pixels into the underlying image stream, ensuring sensitive data cannot be uncovered by selecting or copying text.
                  </p>
                </div>
              </div>

              {/* Redaction Areas List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Redaction Regions</h4>
                  <Button variant="outline" size="sm" onClick={addRedactionArea}>
                    <Plus className="h-4 w-4 mr-1" /> Add Region
                  </Button>
                </div>

                <div className="space-y-3">
                  {redactions.map((red, idx) => (
                    <div key={idx} className="p-4 rounded-md bg-[var(--background)] border border-[var(--border)] grid grid-cols-2 md:grid-cols-5 gap-3 items-end text-xs">
                      <div>
                        <label className="font-medium text-[var(--muted-foreground)]">Page #</label>
                        <Input
                          type="number"
                          min={1}
                          value={red.pageIndex + 1}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value)) - 1;
                            setRedactions((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, pageIndex: val } : r))
                            );
                          }}
                        />
                      </div>
                      <div>
                        <label className="font-medium text-[var(--muted-foreground)]">Left X (%)</label>
                        <Input
                          type="number"
                          value={red.x}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRedactions((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, x: val } : r))
                            );
                          }}
                        />
                      </div>
                      <div>
                        <label className="font-medium text-[var(--muted-foreground)]">Top Y (%)</label>
                        <Input
                          type="number"
                          value={red.y}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRedactions((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, y: val } : r))
                            );
                          }}
                        />
                      </div>
                      <div>
                        <label className="font-medium text-[var(--muted-foreground)]">Width (%)</label>
                        <Input
                          type="number"
                          value={red.width}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setRedactions((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, width: val } : r))
                            );
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <label className="font-medium text-[var(--muted-foreground)]">Height (%)</label>
                          <Input
                            type="number"
                            value={red.height}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRedactions((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, height: val } : r))
                              );
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRedactions((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-600 mb-0.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-[var(--border)]">
                <input
                  type="checkbox"
                  id="burnPixels"
                  checked={burnPixels}
                  onChange={(e) => setBurnPixels(e.target.checked)}
                  className="rounded border-[var(--border)]"
                />
                <label htmlFor="burnPixels" className="text-xs text-[var(--foreground)] font-medium cursor-pointer">
                  Burn Pixels into JPEG Streams (Recommended: Prevents text extraction completely)
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleRedact}>
                  Apply Redactions & Burn Pixels
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Burning Redactions..."
        statusText="Rasterizing pages into secure pixel streams..."
      />
    </ToolPageShell>
  );
}
