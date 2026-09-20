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
import { encryptPdfFile } from "@/lib/pdf/security-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Lock, Eye, EyeOff } from "lucide-react";

const encryptTool = TOOLS.find((t) => t.id === "encrypt-pdf")!;

export default function EncryptPdfPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("protected.pdf");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleEncrypt = async () => {
    if (!file) return;
    if (!password) {
      alert("Please enter a password to encrypt the PDF.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match. Please verify your password.");
      return;
    }

    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await encryptPdfFile(file, password);
      setProgress(90);

      setResultBytes(pdfBytes);
      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-encrypted.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "encrypt-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to encrypt PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setPassword("");
    setConfirmPassword("");
    setProgress(0);
  };

  return (
    <ToolPageShell tool={encryptTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Encrypted & Password Protected!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to encrypt with password"
              helperText="Protect your document with AES encryption 100% in your browser."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Lock className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Set Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password..."
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--foreground)]">Confirm Password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password..."
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleEncrypt}>
                  Encrypt PDF Now
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Encrypting PDF..."
        statusText="Applying AES encryption keys..."
      />
    </ToolPageShell>
  );
}
