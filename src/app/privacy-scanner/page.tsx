"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { scanPdfPrivacyRisk, sanitizePdfMetadata, PrivacyReport } from "@/lib/pdf/security-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";

const scannerTool = TOOLS.find((t) => t.id === "privacy-scanner")!;

export default function PrivacyScannerPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [report, setReport] = React.useState<PrivacyReport | null>(null);
  const [sanitizedBytes, setSanitizedBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("sanitized.pdf");

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setSanitizedBytes(null);
      setIsProcessing(true);
      setProgress(40);

      try {
        const scanRes = await scanPdfPrivacyRisk(selectedFile);
        setReport(scanRes);
        setProgress(100);
      } catch (err: unknown) {
        alert(`Privacy scan failed: ${(err as Error).message || err}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSanitize = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(70);
      const cleanBytes = await sanitizePdfMetadata(file);
      setProgress(90);

      setSanitizedBytes(cleanBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-clean.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "privacy-scanner",
        resultSize: cleanBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to sanitize metadata: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setReport(null);
    setSanitizedBytes(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={scannerTool}>
      {sanitizedBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={sanitizedBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="Metadata Sanitized & Privacy Restored!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to scan for hidden metadata & privacy risks"
              helperText="Detect author names, creation software, hidden dates, location data, and strip them 100% locally."
            />
          ) : (
            <div className="space-y-6">
              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex items-center space-x-3">
                    <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                      <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Scan Another File
                  </Button>
                </div>

                {report && (
                  <div className="space-y-6">
                    {/* Status Summary Banner */}
                    <div
                      className={`p-4 rounded-md border flex items-start space-x-3 ${
                        report.issuesFoundCount > 0
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      }`}
                    >
                      {report.issuesFoundCount > 0 ? (
                        <ShieldAlert className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="font-semibold text-sm">
                          {report.issuesFoundCount > 0
                            ? `Found ${report.issuesFoundCount} Privacy Risks / Metadata Items`
                            : "Clean! No Hidden Author or System Metadata Found"}
                        </h4>
                        <p className="text-xs opacity-90 mt-1">
                          {report.issuesFoundCount > 0
                            ? "This document contains embedded author details, software versions, or timestamps that could expose your identity."
                            : "Your PDF is free from sensitive metadata traces."}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Items Grid */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-[var(--foreground)]">Embedded Document Properties</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-1">
                          <span className="text-[var(--muted-foreground)] font-medium">Author / Creator Name:</span>
                          <p className="font-semibold text-[var(--foreground)]">{report.author || "(Not present)"}</p>
                        </div>
                        <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-1">
                          <span className="text-[var(--muted-foreground)] font-medium">Creation Application:</span>
                          <p className="font-semibold text-[var(--foreground)]">{report.creator || "(Not present)"}</p>
                        </div>
                        <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-1">
                          <span className="text-[var(--muted-foreground)] font-medium">PDF Producer Software:</span>
                          <p className="font-semibold text-[var(--foreground)]">{report.producer || "(Not present)"}</p>
                        </div>
                        <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-1">
                          <span className="text-[var(--muted-foreground)] font-medium">Document Title:</span>
                          <p className="font-semibold text-[var(--foreground)]">{report.title || "(Not present)"}</p>
                        </div>
                        <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-1">
                          <span className="text-[var(--muted-foreground)] font-medium">Creation Timestamp:</span>
                          <p className="font-semibold text-[var(--foreground)]">{report.creationDate || "(Not present)"}</p>
                        </div>
                        <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-1">
                          <span className="text-[var(--muted-foreground)] font-medium">Modification Timestamp:</span>
                          <p className="font-semibold text-[var(--foreground)]">{report.modificationDate || "(Not present)"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button variant="primary" size="lg" onClick={handleSanitize} className="space-x-2">
                        <Trash2 className="h-4 w-4" />
                        <span>Strip All Metadata & Download Clean PDF</span>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Scanning PDF Privacy Risk..."
        statusText="Inspecting XMP metadata streams and structural dictionaries..."
      />
    </ToolPageShell>
  );
}
