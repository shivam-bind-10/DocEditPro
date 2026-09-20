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
import { removePasswordFromPdf } from "@/lib/pdf/security-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Unlock } from "lucide-react";

const removePasswordTool = TOOLS.find((t) => t.id === "remove-password")!;

export default function RemovePasswordPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [password, setPassword] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("unlocked.pdf");

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await removePasswordFromPdf(file, password);
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-unlocked.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "remove-password",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to remove password: Incorrect password or invalid file structure. (${(err as Error).message || err})`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setPassword("");
    setProgress(0);
  };

  return (
    <ToolPageShell tool={removePasswordTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Password Removed Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop password-protected PDF"
              helperText="Decrypt and permanently remove passwords from PDF files client-side."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Unlock className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--foreground)]">File Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter current password to unlock..."
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleUnlock}>
                  Unlock & Remove Password
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Unlocking PDF..."
        statusText="Decrypting structures and removing security restrictions..."
      />
    </ToolPageShell>
  );
}
