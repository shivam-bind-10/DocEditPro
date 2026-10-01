"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Archive, Download, Check, ShieldCheck, FileCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { convertToPdfA, PdfAOptions } from "@/lib/pdf/pdfa-utils";
import { addRecentFile } from "@/lib/storage/db";

export default function PdfAPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [conformance, setConformance] = React.useState<"1B" | "2B">("1B");

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<{
    blob: Blob;
    url: string;
    name: string;
    metadata: Record<string, string>;
  } | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setTitle(f.name.replace(/\.pdf$/i, ""));
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setProgress(50);

      const res = await convertToPdfA(bytes, {
        title,
        author: author || "DocEditPro Archival Engine",
        subject,
        conformance,
      });
      setProgress(85);

      const blob = new Blob([res.pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const name = file.name.replace(/\.pdf$/i, "") + `-pdfa-${conformance.toLowerCase()}.pdf`;

      setResult({
        blob,
        url,
        name,
        metadata: res.metadataSummary,
      });

      await addRecentFile({
        name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "pdf-a",
        resultSize: blob.size,
      });

      setProgress(100);
    } catch (err) {
      console.error(err);
      alert("Failed to convert to PDF/A. Please ensure valid document bytes.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
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
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">PDF/A Archival Converter</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Convert standard PDFs to ISO-compliant PDF/A archival format for long-term legal preservation.
              </p>
            </div>
          </div>
        </div>

        {/* Upload State */}
        {!file ? (
          <FileDropzone
            accept={[".pdf"]}
            maxFiles={1}
            onFilesSelected={handleFileSelected}
            title="Drop PDF to convert to PDF/A"
            description="Embeds standard sRGB color intent, XMP archival metadata, and strips non-compliant scripts"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Settings */}
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 border-[var(--border)] bg-[var(--surface)] space-y-4">
                <h3 className="font-semibold text-sm flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                  <span>Archival Standards & Metadata</span>
                </h3>

                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Standard Conformance</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConformance("1B")}
                      className={`p-3 rounded-md border text-left text-xs transition-colors ${
                        conformance === "1B"
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      <div className="font-semibold text-[var(--foreground)]">PDF/A-1b</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">ISO 19005-1 (Standard Visual Preservation)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConformance("2B")}
                      className={`p-3 rounded-md border text-left text-xs transition-colors ${
                        conformance === "2B"
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      <div className="font-semibold text-[var(--foreground)]">PDF/A-2b</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">ISO 19005-2 (Enhanced Transparencies)</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Document Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title..."
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">Author / Organization</label>
                    <Input
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Legal Dept / Company"
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">Subject</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Master Agreement Archival"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing}
                    className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                  >
                    Convert to {conformance === "1B" ? "PDF/A-1b" : "PDF/A-2b"}
                  </Button>
                </div>
              </Card>

              {/* Result Download Card */}
              {result && (
                <Card className="p-6 border-[var(--border)] bg-[var(--surface)] border-l-4 border-l-emerald-500 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <div>
                        <h4 className="font-semibold text-sm">Archival Conversion Complete</h4>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {result.name} ({(result.blob.size / 1024).toFixed(1)} KB)
                        </p>
                      </div>
                    </div>
                    <a href={result.url} download={result.name}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5">
                        <Download className="h-4 w-4" />
                        <span>Download PDF/A</span>
                      </Button>
                    </a>
                  </div>

                  <div className="p-3 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-xs space-y-1 font-mono">
                    <div className="text-[var(--accent)] font-semibold mb-1">Compliance Attributes Verified:</div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">Standard:</span>
                      <span>{result.metadata.standard} ({result.metadata.isoStandard})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">OutputIntent:</span>
                      <span>{result.metadata.outputIntent} ({result.metadata.colorProfile})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">XMP Schema:</span>
                      <span>pdfaid:part=1, pdfaid:conformance=B</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar / Document details */}
            <div className="space-y-6">
              <Card className="p-5 border-[var(--border)] bg-[var(--surface)] space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Selected File</h4>
                <div className="flex items-start space-x-3">
                  <FileCheck className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
                  <div className="truncate">
                    <div className="text-xs font-medium truncate">{file.name}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="w-full text-xs text-[var(--muted-foreground)] hover:text-red-400 mt-2"
                >
                  Choose Different File
                </Button>
              </Card>

              <Card className="p-5 border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted-foreground)] space-y-2">
                <div className="font-semibold text-[var(--foreground)]">Why PDF/A?</div>
                <p>
                  PDF/A is an ISO-standardized version of the Portable Document Format specialized for preserving electronic documents.
                </p>
                <p>
                  It guarantees that documents can be accurately reproduced decades into the future by eliminating device dependencies like non-embedded fonts and dynamic scripts.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>

      <ProcessingOverlay isOpen={isProcessing} progress={progress} statusText="Building PDF/A archival structure..." />
    </div>
  );
}
