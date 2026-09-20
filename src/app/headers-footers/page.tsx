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
import { addHeadersAndFootersToPdf } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { LayoutGrid } from "lucide-react";

const headersFootersTool = TOOLS.find((t) => t.id === "headers-footers")!;

export default function HeadersFootersPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("headers-footers.pdf");

  // Options
  const [headerLeft, setHeaderLeft] = React.useState("");
  const [headerCenter, setHeaderCenter] = React.useState("");
  const [headerRight, setHeaderRight] = React.useState("{date}");
  const [footerLeft, setFooterLeft] = React.useState("Confidential");
  const [footerCenter, setFooterCenter] = React.useState("Page {page} of {total}");
  const [footerRight, setFooterRight] = React.useState("");

  const [fontSize, setFontSize] = React.useState(9);
  const [margin, setMargin] = React.useState(25);
  const [color, setColor] = React.useState("#444444");
  const [pageRange, setPageRange] = React.useState("all");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleApply = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await addHeadersAndFootersToPdf(file, {
        headerLeft,
        headerCenter,
        headerRight,
        footerLeft,
        footerCenter,
        footerRight,
        fontSize,
        margin,
        color,
        pageRange,
      });
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-headers-footers.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "headers-footers",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to add headers and footers: ${(err as Error).message || err}`);
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
    <ToolPageShell tool={headersFootersTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="Headers & Footers Added!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to add headers & footers"
              helperText="Insert document titles, page numbers, dates, and dynamic tokens into headers and footers."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <LayoutGrid className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              {/* Dynamic Token Hint */}
              <div className="rounded-md bg-[var(--card)] p-3 text-xs text-[var(--muted-foreground)] border border-[var(--border)] space-y-1">
                <p className="font-semibold text-[var(--foreground)]">Supported Dynamic Tokens:</p>
                <p>
                  <code className="bg-[var(--background)] px-1 py-0.5 rounded text-[var(--accent)]">{"{page}"}</code> = Current page number |{" "}
                  <code className="bg-[var(--background)] px-1 py-0.5 rounded text-[var(--accent)]">{"{total}"}</code> = Total pages |{" "}
                  <code className="bg-[var(--background)] px-1 py-0.5 rounded text-[var(--accent)]">{"{date}"}</code> = Today&apos;s date
                </p>
              </div>

              {/* Header Fields */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Header Content</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Header Left</label>
                    <Input
                      type="text"
                      value={headerLeft}
                      onChange={(e) => setHeaderLeft(e.target.value)}
                      placeholder="e.g. Document Title"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Header Center</label>
                    <Input
                      type="text"
                      value={headerCenter}
                      onChange={(e) => setHeaderCenter(e.target.value)}
                      placeholder="e.g. Section Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Header Right</label>
                    <Input
                      type="text"
                      value={headerRight}
                      onChange={(e) => setHeaderRight(e.target.value)}
                      placeholder="e.g. {date}"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Fields */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Footer Content</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Footer Left</label>
                    <Input
                      type="text"
                      value={footerLeft}
                      onChange={(e) => setFooterLeft(e.target.value)}
                      placeholder="e.g. Confidential"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Footer Center</label>
                    <Input
                      type="text"
                      value={footerCenter}
                      onChange={(e) => setFooterCenter(e.target.value)}
                      placeholder="e.g. Page {page} of {total}"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)]">Footer Right</label>
                    <Input
                      type="text"
                      value={footerRight}
                      onChange={(e) => setFooterRight(e.target.value)}
                      placeholder="e.g. Author Name"
                    />
                  </div>
                </div>
              </div>

              {/* Style & Page Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-[var(--border)] pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Font Size ({fontSize}px)</label>
                  <input
                    type="range"
                    min={7}
                    max={20}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Margin ({margin}px)</label>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Text Color</label>
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

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Page Range</label>
                  <Input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. 'all' or '2-10'"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleApply}>
                  Add Headers & Footers
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Adding Headers & Footers..."
        statusText="Formatting layout and applying text onto pages..."
      />
    </ToolPageShell>
  );
}
