"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { convertImagesToPdf } from "@/lib/pdf/pdf-utils";
import { addRecentFile } from "@/lib/storage/db";
import { Edit2, Eraser, Trash2, Download, Link2, Copy, Check, Users } from "lucide-react";
import Peer, { DataConnection } from "peerjs";

const collabWhiteboardTool = TOOLS.find((t) => t.id === "collab-whiteboard")!;

export default function CollabWhiteboardPage() {
  const [peerId, setPeerId] = React.useState<string>("");
  const [remotePeerId, setRemotePeerId] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("Initializing P2P WebRTC Whiteboard...");
  const [copied, setCopied] = React.useState(false);

  // Drawing tools state
  const [toolMode, setToolMode] = React.useState<"pen" | "eraser">("pen");
  const [penColor, setPenColor] = React.useState("#2563eb");
  const [lineWidth, setLineWidth] = React.useState(3);

  // Export states
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("whiteboard.pdf");

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = React.useRef(false);
  const lastPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const peerRef = React.useRef<Peer | null>(null);
  const connRef = React.useRef<DataConnection | null>(null);

  const drawLineOnCanvas = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number,
    isEraser: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineCap = "round";
    ctx.lineWidth = width;

    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }

    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new Peer();
      p.on("open", (id) => {
        setPeerId(id);
        setStatus("Ready! Share Peer ID with collaborators to join whiteboard session.");
      });

      p.on("connection", (conn) => {
        connRef.current = conn;
        setStatus(`Peer connected: ${conn.peer}`);

        conn.on("data", (data: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = data as any;
          if (msg && msg.type === "draw-stroke") {
            drawLineOnCanvas(msg.x1, msg.y1, msg.x2, msg.y2, msg.color, msg.width, msg.isEraser);
          } else if (msg && msg.type === "clear-canvas") {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d");
              if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        });
      });

      peerRef.current = p;

      return () => {
        p.destroy();
      };
    }
  }, []);

  const connectToPeer = () => {
    if (!remotePeerId || !peerRef.current) return;
    setStatus(`Connecting to whiteboard host ${remotePeerId}...`);
    const conn = peerRef.current.connect(remotePeerId);
    connRef.current = conn;

    conn.on("open", () => {
      setStatus(`Connected to host: ${remotePeerId}`);
    });

    conn.on("data", (data: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = data as any;
      if (msg && msg.type === "draw-stroke") {
        drawLineOnCanvas(msg.x1, msg.y1, msg.x2, msg.y2, msg.color, msg.width, msg.isEraser);
      } else if (msg && msg.type === "clear-canvas") {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    lastPosRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentPos = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };

    const isEraser = toolMode === "eraser";
    drawLineOnCanvas(lastPosRef.current.x, lastPosRef.current.y, currentPos.x, currentPos.y, penColor, lineWidth, isEraser);

    if (connRef.current) {
      connRef.current.send({
        type: "draw-stroke",
        x1: lastPosRef.current.x,
        y1: lastPosRef.current.y,
        x2: currentPos.x,
        y2: currentPos.y,
        color: penColor,
        width: lineWidth,
        isEraser,
      });
    }

    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (connRef.current) {
      connRef.current.send({ type: "clear-canvas" });
    }
  };

  const exportWhiteboardPdf = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (blob) {
        const imageFile = new File([blob], "whiteboard.jpg", { type: "image/jpeg" });
        const pdfBytes = await convertImagesToPdf([imageFile]);

        setResultBytes(pdfBytes);
        setOutFilename(`whiteboard-${Date.now()}.pdf`);

        await addRecentFile({
          name: "whiteboard.pdf",
          size: pdfBytes.length,
          type: "application/pdf",
          toolSlug: "collab-whiteboard",
          resultSize: pdfBytes.length,
        });
      }
    }, "image/jpeg", 0.95);
  };

  const copyPeerId = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolPageShell tool={collabWhiteboardTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          onReset={() => setResultBytes(null)}
          actionTitle="Whiteboard Exported to PDF!"
        />
      ) : (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-[var(--accent)]" />
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Collaborative P2P Whiteboard</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Real-time shared canvas via WebRTC data channel. Export directly to PDF.</p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={exportWhiteboardPdf}>
              <Download className="h-4 w-4 mr-1" /> Export Whiteboard to PDF
            </Button>
          </div>

          {/* Connection Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">Your Session ID:</span>
              <Input readOnly value={peerId || "Connecting..."} className="font-mono text-xs flex-1" />
              <Button variant="outline" size="sm" onClick={copyPeerId} disabled={!peerId}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <Input
                type="text"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder="Enter Peer Session ID to join..."
                className="font-mono text-xs flex-1"
              />
              <Button variant="primary" size="sm" onClick={connectToPeer} disabled={!remotePeerId}>
                <Link2 className="h-4 w-4 mr-1" /> Join Session
              </Button>
            </div>
          </div>

          {/* Drawing Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--card)] p-3 rounded-md border border-[var(--border)]">
            <div className="flex items-center space-x-2">
              <Button
                variant={toolMode === "pen" ? "primary" : "outline"}
                size="sm"
                onClick={() => setToolMode("pen")}
              >
                <Edit2 className="h-4 w-4 mr-1" /> Pen
              </Button>
              <Button
                variant={toolMode === "eraser" ? "primary" : "outline"}
                size="sm"
                onClick={() => setToolMode("eraser")}
              >
                <Eraser className="h-4 w-4 mr-1" /> Eraser
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-[var(--foreground)]">Color</label>
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="h-8 w-10 rounded cursor-pointer border border-[var(--border)] bg-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-[var(--foreground)]">Width ({lineWidth}px)</label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-24"
                />
              </div>

              <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4 mr-1" /> Clear Canvas
              </Button>
            </div>
          </div>

          {/* Interactive Whiteboard Canvas */}
          <div className="border border-[var(--border)] rounded-md bg-white overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={900}
              height={500}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[500px] cursor-crosshair touch-none bg-white"
            />
          </div>

          <p className="text-xs text-[var(--muted-foreground)] text-right">Status: {status}</p>
        </Card>
      )}
    </ToolPageShell>
  );
}
