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
import { addPageNumbersToPdf, PageNumberOptions } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Hash } from "lucide-react";

const pageNumbersTool = TOOLS.find((t) => t.id === "page-numbers")!;

export default function PageNumbersPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("numbered.pdf");

  // Options
  const [format, setFormat] = React.useState<PageNumberOptions["format"]>("page_n_of_m");
  const [customFormat, setCustomFormat] = React.useState("Doc | Page {n} of {total}");
  const [position, setPosition] = React.useState<PageNumberOptions["position"]>("bottom-center");
  const [startNumber, setStartNumber] = React.useState(1);
  const [margin, setMargin] = React.useState(20);
  const [fontSize, setFontSize] = React.useState(10);
  const [color, setColor] = React.useState("#333333");
  const [pageRange, setPageRange] = React.useState("all");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleAddNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await addPageNumbersToPdf(file, {
        format,
        customFormat,
        position,
        startNumber,
        margin,
        fontSize,
        color,
        pageRange,
      });
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-numbered.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "page-numbers",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to add page numbers: ${(err as Error).message || err}`);
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
    <ToolPageShell tool={pageNumbersTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="Page Numbers Added Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to add page numbers"
              helperText="Insert customizable page numbering, header/footer numbers with custom formatting."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Hash className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as PageNumberOptions["format"])}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    <option value="page_n_of_m">Page X of Y</option>
                    <option value="page_n">Page X</option>
                    <option value="n">X (Number only)</option>
                    <option value="custom">Custom Format</option>
                  </select>
                </div>

                {format === "custom" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--foreground)]">
                      Custom Pattern (use {"{n}"} and {"{total}"})
                    </label>
                    <Input
                      type="text"
                      value={customFormat}
                      onChange={(e) => setCustomFormat(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as PageNumberOptions["position"])}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Start Number</label>
                  <Input
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Margin ({margin}px)</label>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Font Size ({fontSize}px)</label>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-12 rounded cursor-pointer border border-[var(--border)] bg-transparent"
                    />
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Page Range</label>
                  <Input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. 'all' or '1-5, 8'"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleAddNumbers}>
                  Add Page Numbers
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Adding Page Numbers..."
        statusText="Writing page numbers onto pages..."
      />
    </ToolPageShell>
  );
}
