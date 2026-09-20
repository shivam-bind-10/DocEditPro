"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { processPdfOcr, OcrResult } from "@/lib/ocr/ocr-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { ScanText, Copy, Download, Check, RefreshCw } from "lucide-react";

const ocrTool = TOOLS.find((t) => t.id === "ocr-pdf")!;

const LANGUAGES = [
  { code: "eng", label: "English" },
  { code: "spa", label: "Spanish (Español)" },
  { code: "fra", label: "French (Français)" },
  { code: "deu", label: "German (Deutsch)" },
  { code: "chi_sim", label: "Chinese Simplified (简体中文)" },
  { code: "jpn", label: "Japanese (日本語)" },
  { code: "hin", label: "Hindi (हिन्दी)" },
];

export default function OcrPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState("eng");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [statusText, setStatusText] = React.useState("Initializing OCR...");
  const [ocrFullText, setOcrFullText] = React.useState<string | null>(null);
  const [pageResults, setPageResults] = React.useState<OcrResult[]>([]);
  const [copied, setCopied] = React.useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(5);
    setStatusText("Preparing Tesseract WASM engine...");

    try {
      const res = await processPdfOcr(file, language, (prog, text) => {
        setProgress(prog);
        setStatusText(text);
      });

      setOcrFullText(res.fullText);
      setPageResults(res.pageResults);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "ocr-pdf",
        resultSize: res.fullText.length,
      });
    } catch (err: unknown) {
      alert(`OCR processing failed: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (ocrFullText) {
      navigator.clipboard.writeText(ocrFullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!ocrFullText || !file) return;
    const blob = new Blob([ocrFullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, "")}-ocr.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setOcrFullText(null);
    setPageResults([]);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={ocrTool}>
      {ocrFullText !== null ? (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-4">
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">OCR Text Recognized ({file?.name})</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Recognized {pageResults.length} pages using language ({language})
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-500 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied!" : "Copy OCR Text"}
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownloadTxt}>
                <Download className="h-4 w-4 mr-1" />
                Download .TXT
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-1" />
                OCR Another File
              </Button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={ocrFullText}
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
              label="Drag & drop scanned PDF for OCR recognition"
              helperText="Run client-side Optical Character Recognition (OCR) via Tesseract.js in a Web Worker."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <ScanText className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--foreground)]">Select Document Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleRunOcr}>
                  Run OCR Recognition
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Running OCR Engine..."
        statusText={statusText}
      />
    </ToolPageShell>
  );
}
