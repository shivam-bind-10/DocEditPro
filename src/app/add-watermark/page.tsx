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
import { addWatermarkToPdf, WatermarkOptions } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Stamp, Type, Image as ImageIcon } from "lucide-react";

const addWatermarkTool = TOOLS.find((t) => t.id === "add-watermark")!;

export default function AddWatermarkPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("watermarked.pdf");

  // Options
  const [watermarkType, setWatermarkType] = React.useState<"text" | "image">("text");
  const [text, setText] = React.useState("CONFIDENTIAL");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [opacity, setOpacity] = React.useState(0.3);
  const [fontSize, setFontSize] = React.useState(48);
  const [color, setColor] = React.useState("#333333");
  const [rotation, setRotation] = React.useState(45);
  const [position, setPosition] = React.useState<WatermarkOptions["position"]>("center");
  const [pageRange, setPageRange] = React.useState("all");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    if (watermarkType === "image" && !imageFile) {
      alert("Please select a watermark image file.");
      return;
    }

    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await addWatermarkToPdf(file, {
        type: watermarkType,
        text,
        imageFile: imageFile || undefined,
        opacity,
        fontSize,
        color,
        rotation,
        position,
        pageRange,
      });
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-watermarked.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "add-watermark",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to add watermark: ${(err as Error).message || err}`);
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
    <ToolPageShell tool={addWatermarkTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="Watermark Applied Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to add watermark"
              helperText="Add custom text or image watermarks with precise opacity and positioning."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Stamp className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              {/* Watermark Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Watermark Type</label>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant={watermarkType === "text" ? "primary" : "outline"}
                    className="flex-1 space-x-2"
                    onClick={() => setWatermarkType("text")}
                  >
                    <Type className="h-4 w-4" />
                    <span>Text Watermark</span>
                  </Button>
                  <Button
                    type="button"
                    variant={watermarkType === "image" ? "primary" : "outline"}
                    className="flex-1 space-x-2"
                    onClick={() => setWatermarkType("image")}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Image Watermark</span>
                  </Button>
                </div>
              </div>

              {/* Type Specific Options */}
              {watermarkType === "text" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--foreground)]">Watermark Text</label>
                    <Input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--foreground)]">Font Color</label>
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
                    <label className="text-xs font-medium text-[var(--foreground)]">Font Size ({fontSize}px)</label>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Select Watermark Image (PNG or JPG)</label>
                  <Input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                  {imageFile && (
                    <p className="text-xs text-[var(--accent)] font-medium">Selected image: {imageFile.name}</p>
                  )}
                </div>
              )}

              {/* Common Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--border)] pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Opacity ({Math.round(opacity * 100)}%)</label>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Rotation ({rotation}°)</label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={15}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as WatermarkOptions["position"])}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                  >
                    <option value="center">Center</option>
                    <option value="tiled">Tiled (Repeat)</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <label className="text-xs font-medium text-[var(--foreground)]">Page Range</label>
                  <Input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. 'all' or '1-3, 5'"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleApplyWatermark}>
                  Add Watermark
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Applying Watermark..."
        statusText="Embedding layer and rendering pages..."
      />
    </ToolPageShell>
  );
}
