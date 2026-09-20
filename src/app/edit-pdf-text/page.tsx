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
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Edit3, Type, Signature, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

const editPdfTextTool = TOOLS.find((t) => t.id === "edit-pdf-text")!;

interface TextElement {
  id: string;
  pageIndex: number;
  text: string;
  x: number; // percentage of page width
  y: number; // percentage of page height
  fontSize: number;
  color: string;
}

interface SignatureElement {
  id: string;
  pageIndex: number;
  dataUrl: string; // PNG base64 data
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function EditPdfTextPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("edited.pdf");

  // Canvas elements state
  const [textElements, setTextElements] = React.useState<TextElement[]>([]);
  const [sigElements, setSigElements] = React.useState<SignatureElement[]>([]);

  // Signature Modal state
  const [showSigModal, setShowSigModal] = React.useState(false);
  const sigCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  // New text box controls
  const [newText, setNewText] = React.useState("Custom Text");
  const [newFontSize, setNewFontSize] = React.useState(18);
  const [newColor, setNewColor] = React.useState("#000000");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const addTextBox = () => {
    const id = Math.random().toString(36).substring(2, 9);
    setTextElements((prev) => [
      ...prev,
      {
        id,
        pageIndex: 0, // default first page
        text: newText,
        x: 20, // 20% from left
        y: 20, // 20% from top
        fontSize: newFontSize,
        color: newColor,
      },
    ]);
  };

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");

    const id = Math.random().toString(36).substring(2, 9);
    setSigElements((prev) => [
      ...prev,
      {
        id,
        pageIndex: 0,
        dataUrl,
        x: 40,
        y: 60,
        width: 150,
        height: 60,
      },
    ]);
    setShowSigModal(false);
  };

  const handleSavePdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      setProgress(60);

      // Add text elements
      for (const tElem of textElements) {
        if (tElem.pageIndex < pages.length) {
          const page = pages[tElem.pageIndex];
          const { width, height } = page.getSize();

          // Convert hex color to rgb
          const cleanHex = tElem.color.replace("#", "");
          const r = (parseInt(cleanHex.substring(0, 2), 16) || 0) / 255;
          const g = (parseInt(cleanHex.substring(2, 4), 16) || 0) / 255;
          const b = (parseInt(cleanHex.substring(4, 6), 16) || 0) / 255;

          const targetX = (tElem.x / 100) * width;
          const targetY = height - (tElem.y / 100) * height; // PDF Y is inverted (0 at bottom)

          page.drawText(tElem.text, {
            x: targetX,
            y: targetY,
            size: tElem.fontSize,
            font,
            color: rgb(r, g, b),
          });
        }
      }

      // Add signature image elements
      for (const sElem of sigElements) {
        if (sElem.pageIndex < pages.length) {
          const page = pages[sElem.pageIndex];
          const { width, height } = page.getSize();

          const base64Data = sElem.dataUrl.split(",")[1];
          const imgBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const embeddedImg = await pdfDoc.embedPng(imgBuffer);

          const targetX = (sElem.x / 100) * width;
          const targetY = height - (sElem.y / 100) * height - sElem.height;

          page.drawImage(embeddedImg, {
            x: targetX,
            y: targetY,
            width: sElem.width,
            height: sElem.height,
          });
        }
      }

      setProgress(85);
      const pdfBytes = await pdfDoc.save();
      setProgress(100);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-edited.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "edit-pdf-text",
        resultSize: pdfBytes.length,
      });
    } catch (err: unknown) {
      alert(`Failed to save edited PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setTextElements([]);
    setSigElements([]);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={editPdfTextTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="Edited PDF Saved Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to edit text & sign"
              helperText="Add text overlays, signatures, and annotations directly to your PDF."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Edit3 className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              {/* Editing Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--card)] p-4 rounded-md border border-[var(--border)]">
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Text content..."
                    className="w-48"
                  />
                  <Input
                    type="number"
                    value={newFontSize}
                    onChange={(e) => setNewFontSize(Number(e.target.value))}
                    min={8}
                    max={72}
                    className="w-20"
                  />
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-9 w-10 rounded cursor-pointer border border-[var(--border)] bg-transparent"
                  />
                  <Button variant="outline" size="sm" onClick={addTextBox}>
                    <Plus className="h-4 w-4 mr-1" /> Add Text
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSigModal(true)}>
                    <Signature className="h-4 w-4 mr-1 text-[var(--accent)]" /> Create Signature
                  </Button>
                </div>
              </div>

              {/* Active Added Elements List */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Added Annotations ({textElements.length + sigElements.length})</h4>
                {textElements.length === 0 && sigElements.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] italic">
                    No text boxes or signatures added yet. Use the toolbar above to add text or signatures.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {textElements.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs">
                        <div className="flex items-center space-x-2">
                          <Type className="h-4 w-4 text-[var(--accent)]" />
                          <span className="font-medium text-[var(--foreground)]">&quot;{t.text}&quot;</span>
                          <span className="text-[var(--muted-foreground)]">({t.fontSize}px, {t.color})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTextElements((prev) => prev.filter((item) => item.id !== t.id))}
                          className="h-7 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {sigElements.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs">
                        <div className="flex items-center space-x-2">
                          <Signature className="h-4 w-4 text-[var(--accent)]" />
                          <span className="font-medium text-[var(--foreground)]">Handwritten Signature</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSigElements((prev) => prev.filter((item) => item.id !== s.id))}
                          className="h-7 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <Button variant="primary" size="lg" onClick={handleSavePdf}>
                  Apply Edits & Save PDF
                </Button>
              </div>
            </Card>
          )}

          {/* Signature Modal */}
          {showSigModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <Card className="w-full max-w-md p-6 space-y-4">
                <h3 className="font-semibold text-lg text-[var(--foreground)]">Draw Your Signature</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Use your mouse or touch screen to draw your signature below.</p>
                <div className="border border-[var(--border)] rounded-md bg-white">
                  <canvas
                    ref={sigCanvasRef}
                    width={400}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearSigCanvas}>
                    Clear
                  </Button>
                  <div className="space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowSigModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={saveSignature}>
                      Add Signature
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Saving Edited PDF..."
        statusText="Embedding text overlays and drawing signature vectors..."
      />
    </ToolPageShell>
  );
}
