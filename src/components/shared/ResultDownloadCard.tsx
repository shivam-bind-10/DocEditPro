"use client";

import * as React from "react";
import { Download, RefreshCw, CheckCircle, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";

interface ResultDownloadCardProps {
  filename: string;
  blob: Blob | Uint8Array;
  originalSize?: number;
  resultSize?: number;
  onReset: () => void;
  actionTitle?: string;
}

export function ResultDownloadCard({
  filename,
  blob,
  originalSize,
  resultSize,
  onReset,
  actionTitle = "Your document is ready!",
}: ResultDownloadCardProps) {
  const actualResultSize =
    resultSize ||
    (blob instanceof Blob ? blob.size : blob.length);

  const handleDownload = () => {
    let dataBlob: Blob;
    if (blob instanceof Blob) {
      dataBlob = blob;
    } else {
      const arrayBuffer = blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength) as ArrayBuffer;
      dataBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
    }

    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const savingsPercent = originalSize && actualResultSize && originalSize > actualResultSize
    ? Math.round(((originalSize - actualResultSize) / originalSize) * 100)
    : null;

  return (
    <Card className="w-full border-emerald-500/30 bg-emerald-500/5 p-6 space-y-6">
      <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {actionTitle}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Processed 100% locally in your browser
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Start Over
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <div className="flex items-center space-x-3 min-w-0">
          <FileCheck className="h-8 w-8 text-[var(--accent)] shrink-0" />
          <div className="min-w-0 truncate">
            <p className="font-mono text-sm font-semibold text-[var(--foreground)] truncate">
              {filename}
            </p>
            <div className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)] mt-0.5">
              <span>{formatBytes(actualResultSize)}</span>
              {savingsPercent !== null && (
                <span className="text-emerald-400 font-medium">
                  ({savingsPercent}% smaller)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="primary" size="lg" onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </Card>
  );
}
