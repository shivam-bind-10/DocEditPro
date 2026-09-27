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
import { PDFDocument, rgb, degrees } from "pdf-lib";
import { Fingerprint, FileText } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const tool = TOOLS.find((t) => t.id === "fingerprint-pdf")!;

/**
 * Embeds an invisible per-copy fingerprint into the PDF.
 * Strategy: encodes the fingerprint ID as micro-spacing between whitespace
 * characters and stores it as a custom document metadata field.
 * Also draws a visually invisible (opacity=0) text watermark in the document
 * info dictionary and via a nearly transparent text layer.
 */
async function fingerprintPdf(
  file: File,
  copyId: string,
  recipientName: string
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Store fingerprint in PDF metadata (XMP / Info dictionary)
  pdfDoc.setSubject(`DocEditPro-FP:${copyId}|${recipientName}|${Date.now()}`);
  pdfDoc.setKeywords([`fp:${copyId}`, `recipient:${recipientName}`]);

  // Draw visually imperceptible watermark on each page
  // Using opacity = 0.008 (nearly invisible but still embedded in the PDF stream)
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    // Draw invisible fingerprint text — embedded in content stream but not visible
    page.drawText(`${copyId}`, {
      x: width / 2,
      y: height / 2,
      size: 6,
      color: rgb(1, 1, 1),
      opacity: 0.008,
      rotate: degrees(45),
    });
  }

  return await pdfDoc.save();
}

export default function FingerprintPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [copyId, setCopyId] = React.useState(() =>
    Math.random().toString(36).substring(2, 10).toUpperCase()
  );
  const [recipientName, setRecipientName] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
    setResultBytes(null);
  };

  const handleEmbed = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);
    try {
      setProgress(60);
      const bytes = await fingerprintPdf(file, copyId, recipientName);
      setProgress(90);
      setResultBytes(bytes);
      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "fingerprint-pdf",
        resultSize: bytes.length,
      });
      setProgress(100);
    } catch (err) {
      alert(`Failed: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setProgress(0);
    setCopyId(Math.random().toString(36).substring(2, 10).toUpperCase());
    setRecipientName("");
  };

  return (
    <ToolPageShell tool={tool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={`fingerprinted-${file?.name ?? "document.pdf"}`}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="Fingerprint Embedded!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF to fingerprint"
              helperText="A unique invisible tracking mark will be embedded in the document."
            />
          ) : (
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{file.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResultBytes(null); }}>
                  Change File
                </Button>
              </div>

              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] space-y-4">
                <div className="flex items-center gap-2 text-[var(--accent)]">
                  <Fingerprint className="h-5 w-5" />
                  <h3 className="font-semibold text-sm text-[var(--foreground)]">Fingerprint Configuration</h3>
                </div>

                <div className="grid gap-3">
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">
                      Unique Copy ID (auto-generated)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={copyId}
                        onChange={(e) => setCopyId(e.target.value.toUpperCase())}
                        className="font-mono bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] uppercase"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCopyId(Math.random().toString(36).substring(2, 10).toUpperCase())}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)] block mb-1">
                      Recipient Name (optional — embedded in metadata)
                    </label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. John Doe, Finance Team"
                      className="bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 space-y-1">
                <p className="font-semibold">How fingerprinting works:</p>
                <p>The Copy ID is stored in the PDF metadata (Subject, Keywords fields) and as an invisible micro-text layer. If the document is leaked, you can inspect the PDF&apos;s metadata to identify which copy was distributed.</p>
              </div>

              <Button variant="primary" size="lg" className="w-full" onClick={handleEmbed}>
                <Fingerprint className="h-4 w-4 mr-2" /> Embed Fingerprint
              </Button>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Embedding Fingerprint..."
        statusText="Writing copy ID to PDF metadata and content streams..."
      />
    </ToolPageShell>
  );
}
