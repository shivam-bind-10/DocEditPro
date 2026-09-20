"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { cropAndResizePdf } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";

const cropResizeTool = TOOLS.find((t) => t.id === "crop-resize-pdf")!;

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--muted-foreground)]">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
    </div>
  );
}

type Preset = "none" | "a4" | "letter" | "a3" | "custom";

export default function CropResizePdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [preset, setPreset] = React.useState<Preset>("none");
  const [customWidth, setCustomWidth] = React.useState<string>("595");
  const [customHeight, setCustomHeight] = React.useState<string>("842");
  const [cropTop, setCropTop] = React.useState<string>("0");
  const [cropRight, setCropRight] = React.useState<string>("0");
  const [cropBottom, setCropBottom] = React.useState<string>("0");
  const [cropLeft, setCropLeft] = React.useState<string>("0");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("cropped.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const hasCrop = [cropTop, cropRight, cropBottom, cropLeft].some((v) => parseFloat(v) > 0);
  const hasResize = preset !== "none";

  const handleProcess = async () => {
    if (!file || (!hasCrop && !hasResize)) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      setProgress(50);
      const result = await cropAndResizePdf(file, {
        preset: preset === "none" ? undefined : preset,
        customWidth: preset === "custom" ? parseFloat(customWidth) : undefined,
        customHeight: preset === "custom" ? parseFloat(customHeight) : undefined,
        cropTop: parseFloat(cropTop) || 0,
        cropRight: parseFloat(cropRight) || 0,
        cropBottom: parseFloat(cropBottom) || 0,
        cropLeft: parseFloat(cropLeft) || 0,
      });
      setProgress(90);

      setResultBytes(result);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-cropped.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "crop-resize-pdf",
        resultSize: result.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to crop/resize PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setProgress(0);
    setPreset("none");
  };

  const PRESETS: { value: Preset; label: string; desc: string }[] = [
    { value: "none", label: "Keep Original", desc: "No resize" },
    { value: "a4", label: "A4", desc: "210 × 297 mm" },
    { value: "letter", label: "Letter", desc: "8.5 × 11 in" },
    { value: "a3", label: "A3", desc: "297 × 420 mm" },
    { value: "custom", label: "Custom", desc: "Set size in pt" },
  ];

  const NumberInput = ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <div className="space-y-1">
      <label className="text-xs text-[var(--muted-foreground)]">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
    </div>
  );

  return (
    <ToolPageShell tool={cropResizeTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Cropped & Resized!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF file to crop or resize"
              helperText="Trim margins, convert page size to A4, Letter, A3 or custom dimensions."
            />
          ) : (
            <Card className="p-6 space-y-6">
              {/* File Header */}
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

              {/* Page Size Preset */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Page Size (Resize)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPreset(p.value)}
                      className={`rounded-[var(--radius-md)] border p-3 text-center transition-all ${
                        preset === p.value
                          ? "border-[var(--accent)] bg-[rgba(59,130,246,0.15)] text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <div className="text-xs font-semibold">{p.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{p.desc}</div>
                    </button>
                  ))}
                </div>

                {preset === "custom" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <NumberInput label="Width (points)" value={customWidth} onChange={setCustomWidth} placeholder="595" />
                    <NumberInput label="Height (points)" value={customHeight} onChange={setCustomHeight} placeholder="842" />
                    <p className="col-span-2 text-[10px] text-[var(--muted-foreground)]">
                      1 inch = 72 points. A4 = 595 × 842 pt, Letter = 612 × 792 pt.
                    </p>
                  </div>
                )}
              </div>

              {/* Crop Margins */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Crop Margins (points)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <NumberInput label="Top" value={cropTop} onChange={setCropTop} />
                  <NumberInput label="Right" value={cropRight} onChange={setCropRight} />
                  <NumberInput label="Bottom" value={cropBottom} onChange={setCropBottom} />
                  <NumberInput label="Left" value={cropLeft} onChange={setCropLeft} />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  Enter 0 to keep each edge unchanged. Cropping reduces the visible area without deleting content.
                </p>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleProcess}
                  disabled={!hasCrop && !hasResize}
                >
                  {hasCrop && hasResize
                    ? "Crop & Resize PDF"
                    : hasCrop
                    ? "Crop PDF"
                    : "Resize PDF"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Processing PDF..."
        statusText="Applying crop boxes and page dimension transforms..."
      />
    </ToolPageShell>
  );
}
