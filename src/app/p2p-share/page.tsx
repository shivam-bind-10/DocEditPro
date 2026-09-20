"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/utils";
import { Share2, Send, Download, Copy, Check, ShieldCheck, Link2 } from "lucide-react";
import Peer, { DataConnection } from "peerjs";

const p2pShareTool = TOOLS.find((t) => t.id === "p2p-share")!;

export default function P2pSharePage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [peerId, setPeerId] = React.useState<string>("");
  const [remotePeerId, setRemotePeerId] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("Initializing P2P WebRTC engine...");
  const [copied, setCopied] = React.useState(false);

  // Received file states
  const [receivedFile, setReceivedFile] = React.useState<{ name: string; blob: Blob } | null>(null);
  const [transferProgress, setTransferProgress] = React.useState(0);

  const peerRef = React.useRef<Peer | null>(null);
  const connRef = React.useRef<DataConnection | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new Peer();
      p.on("open", (id) => {
        setPeerId(id);
        setStatus("Ready! Share your Peer ID with a receiver or enter recipient ID.");
      });

      p.on("connection", (conn) => {
        connRef.current = conn;
        setStatus(`Connected with peer: ${conn.peer}`);

        conn.on("data", (data: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const msg = data as any;
          if (msg && msg.type === "file-payload") {
            const blob = new Blob([msg.buffer], { type: msg.fileType });
            setReceivedFile({ name: msg.fileName, blob });
            setStatus(`Successfully received file "${msg.fileName}" directly over P2P!`);
            setTransferProgress(100);
          }
        });
      });

      peerRef.current = p;

      return () => {
        p.destroy();
      };
    }
  }, []);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const connectToRemotePeer = () => {
    if (!remotePeerId || !peerRef.current) return;
    setStatus(`Connecting to remote peer ${remotePeerId}...`);
    const conn = peerRef.current.connect(remotePeerId);
    connRef.current = conn;

    conn.on("open", () => {
      setStatus(`Connected to remote peer: ${remotePeerId}`);
    });

    conn.on("data", (data: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = data as any;
      if (msg && msg.type === "file-payload") {
        const blob = new Blob([msg.buffer], { type: msg.fileType });
        setReceivedFile({ name: msg.fileName, blob });
        setStatus(`Successfully received file "${msg.fileName}" directly over P2P!`);
        setTransferProgress(100);
      }
    });
  };

  const sendFileToPeer = async () => {
    if (!file || !connRef.current) {
      alert("Please connect to a remote peer first.");
      return;
    }

    setStatus(`Sending "${file.name}" over direct WebRTC channel...`);
    setTransferProgress(30);
    const arrayBuffer = await file.arrayBuffer();
    setTransferProgress(70);

    connRef.current.send({
      type: "file-payload",
      fileName: file.name,
      fileType: file.type,
      buffer: arrayBuffer,
    });

    setTransferProgress(100);
    setStatus(`Successfully sent "${file.name}" directly to peer!`);
  };

  const copyPeerId = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolPageShell tool={p2pShareTool}>
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center space-x-3">
            <Share2 className="h-6 w-6 text-[var(--accent)]" />
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">P2P File Transfer (WebRTC Data Channel)</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Direct browser-to-browser encryption. Zero server file storage.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30">
            <ShieldCheck className="h-4 w-4 mr-1" />
            <span>Encrypted WebRTC Channel</span>
          </div>
        </div>

        {/* Peer ID Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-2">
            <label className="text-xs font-semibold text-[var(--foreground)]">Your P2P Connection ID</label>
            <div className="flex items-center space-x-2">
              <Input readOnly value={peerId || "Generating ID..."} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={copyPeerId} disabled={!peerId}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">Share this ID with the receiver to let them connect to you.</p>
          </div>

          <div className="p-4 rounded-md bg-[var(--background)] border border-[var(--border)] space-y-2">
            <label className="text-xs font-semibold text-[var(--foreground)]">Connect to Receiver / Sender ID</label>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder="Enter Remote Peer ID..."
                className="font-mono text-xs"
              />
              <Button variant="primary" size="sm" onClick={connectToRemotePeer} disabled={!remotePeerId}>
                <Link2 className="h-4 w-4 mr-1" /> Connect
              </Button>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]">Enter a peer ID to initiate direct P2P data connection.</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="p-3 rounded-md bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] flex items-center justify-between">
          <span className="font-medium">Status: {status}</span>
          {transferProgress > 0 && <span className="font-semibold text-[var(--accent)]">{transferProgress}%</span>}
        </div>

        {/* File Send Component */}
        <div className="space-y-4 pt-2 border-t border-[var(--border)]">
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Send PDF / File</h4>
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              label="Select file to send over P2P WebRTC"
              helperText="Upload any file to stream directly to connected peer."
            />
          ) : (
            <div className="flex items-center justify-between p-4 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <div>
                <p className="font-semibold text-sm text-[var(--foreground)]">{file.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
              </div>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Clear
                </Button>
                <Button variant="primary" size="sm" onClick={sendFileToPeer} className="space-x-1">
                  <Send className="h-4 w-4" />
                  <span>Send File Now</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Received File Card */}
        {receivedFile && (
          <div className="p-6 rounded-md bg-emerald-500/10 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-emerald-300">File Received via P2P!</h4>
                <p className="text-xs text-emerald-400 mt-0.5">{receivedFile.name}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const url = URL.createObjectURL(receivedFile.blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = receivedFile.name;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-1" /> Download File
              </Button>
            </div>
          </div>
        )}
      </Card>
    </ToolPageShell>
  );
}
