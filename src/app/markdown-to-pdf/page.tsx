"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertMarkdownToPdf } from "@/lib/convert/html-markdown-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { FileCode, Play } from "lucide-react";

const mdToPdfTool = TOOLS.find((t) => t.id === "markdown-to-pdf")!;

const SAMPLE_MARKDOWN = `# Privacy-First PDF Toolkit

Welcome to **DocEditPro**!

## Key Features
- **100% Client-Side**: No file upload to servers.
- **Fast WASM Processing**: PDF parsing, OCR, and conversions in-browser.
- **Privacy Guaranteed**: Your data stays strictly on your machine.

> "Simplicity and privacy are not optional; they are foundational."

### Code Sample
\`\`\`js
console.log("Hello from DocEditPro!");
\`\`\`
`;

export default function MarkdownToPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [markdownText, setMarkdownText] = React.useState(SAMPLE_MARKDOWN);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("markdown.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setMarkdownText(e.target.result as string);
        }
      };
      reader.readAsText(selected);
    }
  };

  const handleConvert = async () => {
    if (!markdownText || markdownText.trim().length === 0) {
      alert("Please enter or upload Markdown content.");
      return;
    }

    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await convertMarkdownToPdf(markdownText);
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file ? file.name.replace(/\.(md|markdown|txt)$/i, "") : "markdown";
      setOutFilename(`${baseName}.pdf`);

      await addRecentFile({
        name: file ? file.name : "markdown.md",
        size: file ? file.size : markdownText.length,
        type: "text/markdown",
        toolSlug: "markdown-to-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to convert Markdown to PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setMarkdownText(SAMPLE_MARKDOWN);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={mdToPdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          onReset={handleReset}
          actionTitle="Markdown Converted to PDF!"
        />
      ) : (
        <div className="space-y-6">
          {!file && (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".md", ".markdown", ".txt", "text/markdown"]}
              label="Drag & drop Markdown (.md) file or paste text below"
              helperText="Transform Github-flavored Markdown files into beautifully formatted PDFs."
            />
          )}

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center space-x-3">
                <FileCode className="h-6 w-6 text-[var(--accent)]" />
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {file ? file.name : "Markdown Content Editor"}
                  </h3>
                  {file && <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>}
                </div>
              </div>
              {file && (
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Clear File
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--foreground)]">Markdown Input</label>
              <textarea
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                placeholder="Paste or write Markdown code here..."
                className="w-full h-80 p-4 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm font-mono text-[var(--foreground)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="lg" onClick={handleConvert} className="space-x-2">
                <Play className="h-4 w-4" />
                <span>Convert to PDF</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Converting Markdown to PDF..."
        statusText="Parsing Markdown syntax & rendering HTML CSS components..."
      />
    </ToolPageShell>
  );
}
