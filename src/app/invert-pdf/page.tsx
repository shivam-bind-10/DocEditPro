"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { invertPdfColors } from "@/lib/convert/ebook-audio-zip-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Moon, Sun, Contrast } from "lucide-react";

const invertPdfTool = TOOLS.find((t) => t.id === "invert-pdf")!;

export default function InvertPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [mode, setMode] = React.useState<"dark" | "sepia" | "grayscale">("dark");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("inverted.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleInvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await invertPdfColors(file, mode);
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-${mode}.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "invert-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to invert PDF colors: ${(err as Error).message || err}`);
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
    <ToolPageShell tool={invertPdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Colors Transformed Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to invert colors for dark mode reading"
              helperText="Transform document background and color schemes into dark mode or sepia while text remains selectable."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Moon className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              {/* Theme Mode Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Select Color Transformation Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={mode === "dark" ? "primary" : "outline"}
                    onClick={() => setMode("dark")}
                    className="flex-col h-20 space-y-1"
                  >
                    <Moon className="h-5 w-5" />
                    <span className="text-xs font-semibold">Dark Mode</span>
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "sepia" ? "primary" : "outline"}
                    onClick={() => setMode("sepia")}
                    className="flex-col h-20 space-y-1"
                  >
                    <Sun className="h-5 w-5 text-amber-500" />
                    <span className="text-xs font-semibold">Sepia Warmth</span>
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "grayscale" ? "primary" : "outline"}
                    onClick={() => setMode("grayscale")}
                    className="flex-col h-20 space-y-1"
                  >
                    <Contrast className="h-5 w-5" />
                    <span className="text-xs font-semibold">Grayscale</span>
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleInvert}>
                  Apply Color Inversion
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Inverting PDF Colors..."
        statusText="Applying color matrix transformation to pages..."
      />
    </ToolPageShell>
  );
}
