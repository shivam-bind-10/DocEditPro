"use client";

import * as React from "react";
import { UploadCloud, Link as LinkIcon, AlertCircle, FileText, Sparkles, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateFile } from "@/lib/pdf/file-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string[]; // e.g. ['.pdf', 'image/*']
  multiple?: boolean;
  maxFiles?: number; // alias for multiple (>1 means multiple=true)
  maxSizeMB?: number;
  label?: string;
  title?: string;      // alias for label
  helperText?: string;
  description?: string; // alias for helperText
}

export function FileDropzone({
  onFilesSelected,
  accept = ['.pdf'],
  multiple,
  maxFiles,
  maxSizeMB = 200,
  label,
  title,
  helperText,
  description,
}: FileDropzoneProps) {
  // Resolve aliases
  const isMultiple = multiple ?? (maxFiles !== undefined ? maxFiles > 1 : false);
  const resolvedLabel = label ?? title ?? "Drag & drop your files here, or click to browse";
  const resolvedHelperText = helperText ?? description ?? `Supports files up to ${maxSizeMB}MB. 100% processed locally in your browser.`;
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
        onFilesSelected(isMultiple ? validFiles : [validFiles[0]]);
      }
    },
    [accept, maxSizeMB, isMultiple, onFilesSelected]
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
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-[var(--radius-xl)] border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300 cursor-pointer select-none overflow-hidden",
          isDragActive
            ? "border-blue-500 bg-blue-500/10 scale-[1.01] shadow-[0_0_40px_rgba(59,130,246,0.25)]"
            : "border-white/[0.12] bg-[var(--surface-card)] hover:border-blue-500/40 hover:bg-[var(--surface-hover)] hover:shadow-2xl",
          errorMessage && "border-rose-500/50 bg-rose-500/10"
        )}
      >
        {/* Bento Glowing Top Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(",")}
          multiple={isMultiple}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Floating Upload Icon Pill */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-blue-500/20 to-blue-600/10 border border-blue-500/30 text-blue-400 mb-5 shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform">
          <UploadCloud className="h-8 w-8 stroke-[1.8]" />
        </div>

        <h3 className="text-lg font-bold text-[var(--foreground)] mb-1.5">
          {resolvedLabel}
        </h3>
        <p className="text-xs text-[var(--muted-foreground)] max-w-md leading-relaxed mb-5">
          {resolvedHelperText}
        </p>

        {/* Accepted Formats Chips */}
        <div className="flex items-center space-x-1.5 mb-5">
          {accept.slice(0, 4).map((ext) => (
            <span
              key={ext}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-[var(--muted-foreground)] uppercase"
            >
              {ext.replace(".", "")}
            </span>
          ))}
        </div>

        {/* Shortcut Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--subtle-foreground)]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-elevated)] px-3 py-1 border border-[var(--border)] text-[11px] font-medium text-[var(--muted-foreground)]">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
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
            className="h-7 text-xs rounded-full px-3"
          >
            <LinkIcon className="h-3.5 w-3.5 mr-1 text-cyan-400" />
            Add from URL
          </Button>
        </div>
      </div>

      {/* URL Input Dropdown */}
      {showUrlInput && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center space-x-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-xl backdrop-blur-md"
        >
          <Input
            type="url"
            placeholder="Paste public document URL (e.g. https://example.com/document.pdf)..."
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
