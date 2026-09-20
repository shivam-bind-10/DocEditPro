"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractTextFromPdf } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { FileText, Copy, Download, Check, RefreshCw } from "lucide-react";

const extractTextTool = TOOLS.find((t) => t.id === "extract-text")!;

export default function ExtractTextPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [extractedText, setExtractedText] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const text = await extractTextFromPdf(file);
      setProgress(90);

      setExtractedText(text);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "extract-text",
        resultSize: text.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to extract text: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!extractedText || !file) return;
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, "")}-text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setExtractedText(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={extractTextTool}>
      {extractedText !== null ? (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Text Extracted from {file?.name}</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Total characters: {extractedText.length.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-500 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied!" : "Copy Text"}
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownloadTxt}>
                <Download className="h-4 w-4 mr-1" />
                Download .TXT
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Start Over
              </Button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={extractedText}
              className="w-full h-96 p-4 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm font-mono text-[var(--foreground)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to extract text"
              helperText="Pull all embedded selectable text from PDF documents instantly in your browser."
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

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleExtract}>
                  Extract Text Now
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Extracting Text..."
        statusText="Parsing text layer and structural objects..."
      />
    </ToolPageShell>
  );
}
