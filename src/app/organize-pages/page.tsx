"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { mergePdfFiles, rotatePdfPages } from "@/lib/pdf/pdf-utils";
import { addRecentFile } from "@/lib/storage/db";
import { RotateCw, Trash2, GripVertical } from "lucide-react";

const organizeTool = TOOLS.find((t) => t.id === "organize-pages")!;

interface PageItem {
  id: string;
  pageIndex: number; // original page index in source PDF
  thumbnail: string; // data URL
  rotation: number; // accumulated rotation in degrees
}

interface SortablePageCardProps {
  item: PageItem;
  onDelete: (id: string) => void;
  onRotate: (id: string) => void;
}

function SortablePageCard({ item, onDelete, onRotate }: SortablePageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden select-none"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 rounded cursor-grab active:cursor-grabbing bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-white" />
      </div>

      {/* Page thumbnail */}
      <div className="relative bg-white overflow-hidden" style={{ aspectRatio: "0.707" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail}
          alt={`Page ${item.pageIndex + 1}`}
          className="w-full h-full object-contain"
          style={{ transform: `rotate(${item.rotation}deg)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-[var(--surface-hover)]">
        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">p.{item.pageIndex + 1}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onRotate(item.id)}
            title="Rotate 90°"
            className="p-1 rounded hover:bg-[var(--border)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <RotateCw className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            title="Remove page"
            className="p-1 rounded hover:bg-red-500/20 transition-colors text-[var(--muted-foreground)] hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizePagesPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pages, setPages] = React.useState<PageItem[]>([]);
  const [isRendering, setIsRendering] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("organized.pdf");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const renderPageThumbnails = React.useCallback(async (pdfFile: File) => {
    setIsRendering(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageItems: PageItem[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        }
        pageItems.push({
          id: `page-${i}-${Math.random().toString(36).slice(2, 6)}`,
          pageIndex: i - 1,
          thumbnail: canvas.toDataURL("image/jpeg", 0.7),
          rotation: 0,
        });
      }

      setPages(pageItems);
    } catch (err) {
      alert(`Failed to render PDF pages: ${(err as Error).message}`);
    } finally {
      setIsRendering(false);
    }
  }, []);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      renderPageThumbnails(files[0]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((prev) => {
        const oldIndex = prev.findIndex((p) => p.id === active.id);
        const newIndex = prev.findIndex((p) => p.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleRotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleDeletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApply = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    setProgress(20);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const { degrees } = await import("pdf-lib");

      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);
      const outputPdf = await PDFDocument.create();

      setProgress(50);

      for (const pageItem of pages) {
        const [copiedPage] = await outputPdf.copyPages(sourcePdf, [pageItem.pageIndex]);
        if (pageItem.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + pageItem.rotation) % 360));
        }
        outputPdf.addPage(copiedPage);
      }

      setProgress(85);
      const pdfBytes = await outputPdf.save();
      setResultBytes(pdfBytes);

      const baseName = file.name.replace(/\.pdf$/i, "");
      setOutFilename(`${baseName}-organized.pdf`);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "organize-pages",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to organize pages: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setResultBytes(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={organizeTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          originalSize={file?.size}
          onReset={handleReset}
          actionTitle="PDF Pages Organized Successfully!"
        />
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf"]}
              label="Drag & drop PDF to organize its pages"
              helperText="Reorder, rotate, or delete individual pages with drag and drop."
            />
          ) : isRendering ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-8 w-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--muted-foreground)]">Rendering page thumbnails…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {pages.length} page{pages.length !== 1 ? "s" : ""}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    Change File
                  </Button>
                </div>
                <Button variant="primary" size="sm" onClick={handleApply} disabled={pages.length === 0}>
                  Apply & Download
                </Button>
              </div>

              {/* Instructions */}
              <p className="text-xs text-[var(--muted-foreground)] bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] px-3 py-2">
                💡 Drag pages to reorder · Click <strong>↻</strong> to rotate 90° · Click <strong>🗑</strong> to delete
              </p>

              {/* Page grid */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {pages.map((page) => (
                      <SortablePageCard
                        key={page.id}
                        item={page}
                        onDelete={handleDeletePage}
                        onRotate={handleRotatePage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {pages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
                  <p className="text-sm">All pages deleted. Add the file again or reset.</p>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={handleReset}>
                    Start Over
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Organizing Pages..."
        statusText="Copying pages in your selected order into a new PDF..."
      />
    </ToolPageShell>
  );
}
