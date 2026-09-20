"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertImagesToPdf } from "@/lib/pdf/pdf-utils";
import { addRecentFile } from "@/lib/storage/db";
import { Camera, CameraOff, RefreshCw, Trash2, Check, FilePlus } from "lucide-react";

const scanToPdfTool = TOOLS.find((t) => t.id === "scan-to-pdf")!;

export default function ScanToPdfPage() {
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [capturedFrames, setCapturedFrames] = React.useState<Blob[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("scanned-doc.pdf");

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      alert(`Camera access error: ${(err as Error).message || err}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedFrames((prev) => [...prev, blob]);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const removeFrame = (index: number) => {
    setCapturedFrames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePdf = async () => {
    if (capturedFrames.length === 0) {
      alert("Please capture at least one page scan.");
      return;
    }

    stopCamera();
    setIsProcessing(true);
    setProgress(30);

    try {
      const imageFiles: File[] = capturedFrames.map(
        (blob, idx) => new File([blob], `scan-page-${idx + 1}.jpg`, { type: "image/jpeg" })
      );

      setProgress(60);
      const pdfBytes = await convertImagesToPdf(imageFiles);
      setProgress(90);

      setResultBytes(pdfBytes);
      setOutFilename(`scanned-document-${Date.now()}.pdf`);

      await addRecentFile({
        name: "scanned-document.pdf",
        size: pdfBytes.length,
        type: "application/pdf",
        toolSlug: "scan-to-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to generate PDF from camera scans: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    stopCamera();
    setCapturedFrames([]);
    setResultBytes(null);
    setProgress(0);
  };

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <ToolPageShell tool={scanToPdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          onReset={handleReset}
          actionTitle="Camera Document Scanned to PDF!"
        />
      ) : (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6 text-[var(--accent)]" />
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Scan Document via Camera</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Capture multi-page documents directly using your webcam or mobile camera.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isCameraActive ? (
                <Button variant="primary" size="sm" onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-1" /> Start Camera
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={stopCamera}>
                  <CameraOff className="h-4 w-4 mr-1" /> Turn Off Camera
                </Button>
              )}
            </div>
          </div>

          {/* Live Camera Feed */}
          <div className="relative rounded-md overflow-hidden bg-black min-h-[300px] flex items-center justify-center border border-[var(--border)]">
            <video ref={videoRef} className={`w-full max-h-[480px] object-contain ${!isCameraActive ? "hidden" : ""}`} />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraActive && (
              <div className="text-center p-8 text-[var(--muted-foreground)] space-y-2">
                <Camera className="h-12 w-12 mx-auto text-[var(--accent)] opacity-60" />
                <p className="text-sm">Camera preview is off. Click &quot;Start Camera&quot; above to begin scanning.</p>
              </div>
            )}

            {isCameraActive && (
              <button
                onClick={captureFrame}
                className="absolute bottom-6 h-16 w-16 rounded-full bg-white border-4 border-[var(--accent)] shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
              >
                <div className="h-10 w-10 rounded-full bg-[var(--accent)]" />
              </button>
            )}
          </div>

          {/* Captured Scans Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Captured Pages ({capturedFrames.length})
              </h4>
              {capturedFrames.length > 0 && (
                <Button variant="primary" size="sm" onClick={handleGeneratePdf}>
                  <Check className="h-4 w-4 mr-1" /> Create PDF ({capturedFrames.length} pages)
                </Button>
              )}
            </div>

            {capturedFrames.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] italic">No pages captured yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {capturedFrames.map((blob, idx) => (
                  <div key={idx} className="relative group border border-[var(--border)] rounded-md overflow-hidden bg-[var(--card)]">
                    <img src={URL.createObjectURL(blob)} alt={`Scan page ${idx + 1}`} className="w-full h-36 object-cover" />
                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-medium">
                      Page {idx + 1}
                    </div>
                    <button
                      onClick={() => removeFrame(idx)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Processing Camera Scans..."
        statusText="Converting captured frames into PDF document pages..."
      />
    </ToolPageShell>
  );
}
