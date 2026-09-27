"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, PenTool, Type, Upload, Trash2, Copy, Download, Check, Plus, Edit3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveSignature, getSavedSignatures, deleteSignature, SavedSignature } from "@/lib/storage/db";

export default function SignatureLibraryPage() {
  const [signatures, setSignatures] = React.useState<SavedSignature[]>([]);
  const [mode, setMode] = React.useState<"draw" | "type" | "upload">("draw");
  const [name, setName] = React.useState("My Signature");
  const [typedText, setTypedText] = React.useState("");
  const [typedFont, setTypedFont] = React.useState<"cursive" | "script" | "calligraphy">("cursive");
  const [penColor, setPenColor] = React.useState("#000000");
  const [penWidth, setPenWidth] = React.useState(3);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawing = React.useRef(false);

  const loadSignatures = React.useCallback(async () => {
    const list = await getSavedSignatures();
    setSignatures(list);
  }, []);

  React.useEffect(() => {
    loadSignatures();
  }, [loadSignatures]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveDrawn = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    await saveSignature(name || "Drawn Signature", dataUrl);
    clearCanvas();
    setName("My Signature");
    loadSignatures();
  };

  const handleSaveTyped = async () => {
    if (!typedText.trim()) return;
    const offscreen = document.createElement("canvas");
    offscreen.width = 600;
    offscreen.height = 200;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 600, 200);
    ctx.fillStyle = penColor;
    ctx.font =
      typedFont === "cursive"
        ? "italic 52px 'Brush Script MT', cursive, sans-serif"
        : typedFont === "script"
        ? "italic 48px 'Snell Roundhand', cursive, serif"
        : "italic 44px 'Zapfino', 'Segoe Script', cursive, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedText, 300, 100);

    const dataUrl = offscreen.toDataURL("image/png");
    await saveSignature(name || `Typed: ${typedText}`, dataUrl);
    setTypedText("");
    setName("My Signature");
    loadSignatures();
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = img.width;
        offscreen.height = img.height;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        // Process transparency: remove white / light backgrounds
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If close to white, make transparent
          if (r > 210 && g > 210 && b > 210) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = offscreen.toDataURL("image/png");
        await saveSignature(file.name.replace(/\.[^/.]+$/, ""), transparentDataUrl);
        loadSignatures();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    await deleteSignature(id);
    loadSignatures();
  };

  const handleCopy = async (sig: SavedSignature) => {
    try {
      const res = await fetch(sig.dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setCopiedId(sig.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert("Failed to copy image to clipboard in this browser.");
    }
  };

  const handleDownload = (sig: SavedSignature) => {
    const a = document.createElement("a");
    a.href = sig.dataUrl;
    a.download = `${sig.name.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Tools
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Signature & Initials Library</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Create, organize, and reuse electronic signatures offline. Stored safely in your browser&apos;s IndexedDB.
              </p>
            </div>
          </div>
        </div>

        {/* Creator Studio Card */}
        <Card className="p-6 border-[var(--border)] bg-[var(--surface)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMode("draw")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === "draw"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span>Draw Signature</span>
              </button>
              <button
                onClick={() => setMode("type")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === "type"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                <span>Type Name</span>
              </button>
              <button
                onClick={() => setMode("upload")}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  mode === "upload"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-elevated)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Image</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <label className="text-xs text-[var(--muted-foreground)]">Ink Color:</label>
              <div className="flex items-center space-x-1.5">
                {[
                  { label: "Black", color: "#000000" },
                  { label: "Navy", color: "#1e3a8a" },
                  { label: "Red", color: "#b91c1c" },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setPenColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`h-5 w-5 rounded-full border-2 transition-transform ${
                      penColor === c.color ? "border-white scale-110" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mode 1: Draw */}
          {mode === "draw" && (
            <div className="space-y-4">
              <div className="relative border-2 border-dashed border-[var(--border)] rounded-lg bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={220}
                  className="w-full h-48 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="absolute bottom-2 left-4 text-[10px] text-gray-400 select-none pointer-events-none">
                  Draw your signature using mouse, touchpad, or stylus pen
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Signature label..."
                    className="text-xs max-w-xs h-8"
                  />
                  <div className="flex items-center space-x-1 text-xs text-[var(--muted-foreground)]">
                    <span>Width:</span>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      value={penWidth}
                      onChange={(e) => setPenWidth(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-xs">
                    Clear Pad
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDrawn}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save to Library</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Type */}
          {mode === "type" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Your Full Name or Initials</label>
                  <Input
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder="e.g. John Doe or JD"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Handwriting Style</label>
                  <select
                    value={typedFont}
                    onChange={(e) => setTypedFont(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-xs text-[var(--foreground)]"
                  >
                    <option value="cursive">Classic Cursive</option>
                    <option value="script">Modern Flowing Script</option>
                    <option value="calligraphy">Executive Calligraphy</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="h-36 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center p-4">
                {typedText ? (
                  <span
                    style={{
                      color: penColor,
                      fontFamily: typedFont === "cursive" ? "cursive" : "serif",
                      fontStyle: "italic",
                      fontSize: "2.75rem",
                    }}
                  >
                    {typedText}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Type above to preview generated handwriting</span>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  onClick={handleSaveTyped}
                  disabled={!typedText.trim()}
                  className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs flex items-center space-x-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Save Handwritten Signature</span>
                </Button>
              </div>
            </div>
          )}

          {/* Mode 3: Upload */}
          {mode === "upload" && (
            <div className="p-8 border-2 border-dashed border-[var(--border)] rounded-lg text-center space-y-3 bg-[var(--surface-elevated)]">
              <Upload className="h-8 w-8 text-[var(--accent)] mx-auto" />
              <div>
                <div className="text-sm font-semibold">Upload an image of your signature</div>
                <div className="text-xs text-[var(--muted-foreground)] mt-1">
                  JPG, PNG, or WEBP. White backgrounds are automatically converted to clean transparent ink.
                </div>
              </div>
              <label className="inline-block cursor-pointer">
                <Button variant="secondary" size="sm" className="text-xs">
                  Choose Image File
                </Button>
                <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
              </label>
            </div>
          )}
        </Card>

        {/* Saved Signatures Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Shield className="h-4 w-4 text-[var(--accent)]" />
              <span>Saved Signatures ({signatures.length})</span>
            </h2>
            <Link href="/edit-pdf-text">
              <Button variant="secondary" size="sm" className="text-xs flex items-center space-x-1">
                <Edit3 className="h-3.5 w-3.5" />
                <span>Open in PDF Editor</span>
              </Button>
            </Link>
          </div>

          {signatures.length === 0 ? (
            <Card className="p-8 text-center border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] text-xs">
              No signatures saved yet. Draw, type, or upload your first signature above!
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {signatures.map((sig) => (
                <Card
                  key={sig.id}
                  className="p-4 border-[var(--border)] bg-[var(--surface)] space-y-3 flex flex-col justify-between"
                >
                  <div className="h-28 rounded bg-white flex items-center justify-center p-3 border border-[var(--border)] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sig.dataUrl} alt={sig.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold truncate">{sig.name}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">
                      {new Date(sig.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <button
                      onClick={() => handleCopy(sig)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded transition-colors"
                      title="Copy PNG image to clipboard"
                    >
                      {copiedId === sig.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDownload(sig)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded transition-colors"
                      title="Download transparent PNG"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sig.id)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-red-400 rounded transition-colors"
                      title="Delete signature"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
