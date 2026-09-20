"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertHtmlToPdf } from "@/lib/convert/html-markdown-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Code2, Play } from "lucide-react";

const htmlToPdfTool = TOOLS.find((t) => t.id === "html-to-pdf")!;

const SAMPLE_HTML = `<div style="padding: 20px; font-family: sans-serif;">
  <h1 style="color: #2563eb;">HTML to PDF Document</h1>
  <p style="font-size: 16px; color: #4b5563;">
    This PDF was generated 100% client-side from raw HTML and CSS markup.
  </p>
  <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
    <h3>Custom HTML Box</h3>
    <p>All CSS styles, colors, and layout structures are preserved in the output PDF.</p>
  </div>
</div>`;

export default function HtmlToPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [htmlText, setHtmlText] = React.useState(SAMPLE_HTML);
  const [customCss, setCustomCss] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("webpage.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selected = files[0];
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setHtmlText(e.target.result as string);
        }
      };
      reader.readAsText(selected);
    }
  };

  const handleConvert = async () => {
    if (!htmlText || htmlText.trim().length === 0) {
      alert("Please enter or upload HTML code.");
      return;
    }

    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await convertHtmlToPdf(htmlText, customCss);
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file ? file.name.replace(/\.(html|htm)$/i, "") : "webpage";
      setOutFilename(`${baseName}.pdf`);

      await addRecentFile({
        name: file ? file.name : "webpage.html",
        size: file ? file.size : htmlText.length,
        type: "text/html",
        toolSlug: "html-to-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to convert HTML to PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setHtmlText(SAMPLE_HTML);
    setCustomCss("");
    setProgress(0);
  };

  return (
    <ToolPageShell tool={htmlToPdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          onReset={handleReset}
          actionTitle="HTML Converted to PDF!"
        />
      ) : (
        <div className="space-y-6">
          {!file && (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".html", ".htm", "text/html"]}
              label="Drag & drop HTML file or paste code below"
              helperText="Render HTML pages and CSS stylesheets into downloadable PDF documents."
            />
          )}

          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center space-x-3">
                <Code2 className="h-6 w-6 text-[var(--accent)]" />
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {file ? file.name : "HTML Code Editor"}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-medium text-[var(--foreground)]">HTML Code</label>
                <textarea
                  value={htmlText}
                  onChange={(e) => setHtmlText(e.target.value)}
                  placeholder="Paste <html> code here..."
                  className="w-full h-80 p-4 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm font-mono text-[var(--foreground)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--foreground)]">Optional Custom CSS</label>
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder="/* e.g. body { font-family: sans-serif; } */"
                  className="w-full h-80 p-4 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm font-mono text-[var(--foreground)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
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
        title="Converting HTML to PDF..."
        statusText="Rendering DOM canvas and preserving CSS styling..."
      />
    </ToolPageShell>
  );
}
