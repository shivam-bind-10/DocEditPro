"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertPdfToHtml } from "@/lib/convert/ebook-audio-zip-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Code, Download, Copy, Check } from "lucide-react";

const pdfToHtmlTool = TOOLS.find((t) => t.id === "pdf-to-html")!;

export default function PdfToHtmlPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [htmlOutput, setHtmlOutput] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const htmlText = await convertPdfToHtml(file);
      setProgress(90);

      setHtmlOutput(htmlText);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "pdf-to-html",
        resultSize: htmlText.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to convert PDF to HTML: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (htmlOutput) {
      navigator.clipboard.writeText(htmlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!htmlOutput || !file) return;
    const blob = new Blob([htmlOutput], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, "")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setHtmlOutput(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={pdfToHtmlTool}>
      {htmlOutput !== null ? (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">Semantic HTML Output ({file?.name})</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Total length: {htmlOutput.length.toLocaleString()} characters</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-500 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" /> Download .HTML
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Convert Another
              </Button>
            </div>
          </div>

          <textarea
            readOnly
            value={htmlOutput}
            className="w-full h-96 p-4 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to convert to HTML"
              helperText="Extract text layer into clean, semantic HTML web pages."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Code className="h-6 w-6 text-[var(--accent)]" />
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
                <Button variant="primary" size="lg" onClick={handleConvert}>
                  Convert to HTML
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Converting PDF to HTML..."
        statusText="Parsing text elements and wrapping in HTML tags..."
      />
    </ToolPageShell>
  );
}
