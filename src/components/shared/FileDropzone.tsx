"use client";

import * as React from "react";
import { UploadCloud, Link as LinkIcon, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateFile } from "@/lib/pdf/file-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string[]; // e.g. ['.pdf', 'image/*']
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
}

export function FileDropzone({
  onFilesSelected,
  accept = ['.pdf'],
  multiple = false,
  maxSizeMB = 200,
  label = "Drag & drop PDF files here, or click to browse",
  helperText = `Supports PDF files up to ${maxSizeMB}MB. 100% processed locally in your browser.`,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [isLoadingUrl, setIsLoadingUrl] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = React.useCallback(
    (fileList: FileList | File[]) => {
      setErrorMessage(null);
      const filesArray = Array.from(fileList);
      const validFiles: File[] = [];

      for (const file of filesArray) {
        const validation = validateFile(file, accept, maxSizeMB);
        if (!validation.valid) {
          setErrorMessage(validation.error || 'Invalid file.');
          return;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onFilesSelected(multiple ? validFiles : [validFiles[0]]);
      }
    },
    [accept, maxSizeMB, multiple, onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Clipboard paste support
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        processFiles(e.clipboardData.files);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processFiles]);

  const handleUrlFetch = async () => {
    if (!url.trim()) return;
    setIsLoadingUrl(true);
    setErrorMessage(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const filename = url.split("/").pop()?.split("?")[0] || "downloaded-file.pdf";
      const file = new File([blob], filename, { type: blob.type || "application/pdf" });
      processFiles([file]);
      setShowUrlInput(false);
      setUrl("");
    } catch (err: unknown) {
      setErrorMessage(`Failed to fetch file from URL (${(err as Error).message || err}).`);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed p-10 text-center transition-all cursor-pointer select-none",
          isDragActive
            ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.005]"
            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]",
          errorMessage && "border-[var(--danger)] bg-rose-500/5"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(",")}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--accent)] mb-4 shadow-sm">
          <UploadCloud className="h-7 w-7" />
        </div>

        <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
          {label}
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] max-w-md leading-relaxed mb-4">
          {helperText}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--subtle-foreground)]">
          <span className="inline-flex items-center gap-1 rounded bg-[var(--surface-elevated)] px-2 py-1 border border-[var(--border)]">
            <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
            Paste from Clipboard (Ctrl+V)
          </span>
          <span>or</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowUrlInput(!showUrlInput);
            }}
            className="h-7 text-xs"
          >
            <LinkIcon className="h-3.5 w-3.5 mr-1" />
            Add from URL
          </Button>
        </div>
      </div>

      {/* URL Input Dropdown */}
      {showUrlInput && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3"
        >
          <Input
            type="url"
            placeholder="Paste public file URL (e.g. https://example.com/document.pdf)..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 text-xs h-9"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleUrlFetch}
            disabled={isLoadingUrl || !url.trim()}
          >
            {isLoadingUrl ? "Fetching..." : "Fetch File"}
          </Button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center space-x-2 rounded-[var(--radius-md)] border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
