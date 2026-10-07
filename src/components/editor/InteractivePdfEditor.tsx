"use client";

import * as React from "react";
import {
  Type,
  Image as ImageIcon,
  Eraser,
  PenTool,
  Highlighter,
  Square,
  Circle,
  Stamp,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  RefreshCw,
  X,
  FileText,
  Search,
  ScanText,
  Wand2,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPdfjs } from "@/lib/pdf/pdfjs-init";
import { addRecentFile } from "@/lib/storage/db";
import { formatBytes } from "@/lib/utils";

export type ToolMode =
  | "select"
  | "edit-existing"
  | "text"
  | "whiteout"
  | "image"
  | "pen"
  | "highlighter"
  | "rectangle"
  | "circle"
  | "signature"
  | "stamp";

export interface EditorElement {
  id: string;
  pageIndex: number;
  type: "text" | "whiteout" | "image" | "shape" | "drawing" | "signature" | "stamp";
  x: number; // in PDF points (relative to page width)
  y: number; // in PDF points (top-down from page top)
  width: number;
  height: number;
  // Text attributes
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: "left" | "center" | "right";
  // Image attributes
  dataUrl?: string;
  opacity?: number;
  // Shape attributes
  shapeType?: "rectangle" | "circle" | "line" | "arrow";
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  // Drawing attributes
  points?: { x: number; y: number }[];
  isHighlighter?: boolean;
  // Stamp attributes
  stampText?: string;
}

export interface DetectedTextItem {
  id: string;
  pageIndex: number;
  text: string;
  x: number; // in PDF points from left
  y: number; // in PDF points from top
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color?: string;
  isEdited?: boolean;
}

export interface PageMeta {
  pageNumber: number; // 1-based
  originalIndex: number | null; // null if added blank page
  width: number; // in PDF points
  height: number;
  renderedDataUrl?: string;
}

const PRESET_COLORS = [
  "#000000",
  "#ffffff",
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#475569",
];

const PRESET_STAMPS = [
  { text: "APPROVED", color: "#16a34a" },
  { text: "CONFIDENTIAL", color: "#dc2626" },
  { text: "PAID", color: "#2563eb" },
  { text: "FINAL", color: "#475569" },
  { text: "VOID", color: "#dc2626" },
  { text: "DRAFT", color: "#d97706" },
  { text: "SIGN HERE", color: "#9333ea" },
];

interface InteractivePdfEditorProps {
  initialFile: File;
  onClose?: () => void;
  onSaveSuccess?: (pdfBytes: Uint8Array, filename: string) => void;
}

export function InteractivePdfEditor({
  initialFile,
  onClose,
  onSaveSuccess,
}: InteractivePdfEditorProps) {
  // Document state
  const [pages, setPages] = React.useState<PageMeta[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = React.useState<number>(0);
  const [isLoadingPdf, setIsLoadingPdf] = React.useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = React.useState<string>("Loading document...");
  const [zoomScale, setZoomScale] = React.useState<number>(1.0);

  // Detected Existing Text on Pages
  const [detectedTextMap, setDetectedTextMap] = React.useState<Record<number, DetectedTextItem[]>>({});
  const [showTextHighlights, setShowTextHighlights] = React.useState<boolean>(true);
  const [hoveredTextId, setHoveredTextId] = React.useState<string | null>(null);
  const [isOcrRunning, setIsOcrRunning] = React.useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = React.useState<number>(0);

  // Search & Replace modal state
  const [showFindReplaceModal, setShowFindReplaceModal] = React.useState<boolean>(false);
  const [findQuery, setFindQuery] = React.useState<string>("");
  const [replaceQuery, setReplaceQuery] = React.useState<string>("");
  const [caseSensitive, setCaseSensitive] = React.useState<boolean>(false);
  const [replaceStatusMsg, setReplaceStatusMsg] = React.useState<string | null>(null);

  // Editing state
  const [activeTool, setActiveTool] = React.useState<ToolMode>("select");
  const [elements, setElements] = React.useState<EditorElement[]>([]);
  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
  const [editingTextId, setEditingTextId] = React.useState<string | null>(null);

  // History state (Undo/Redo)
  const [history, setHistory] = React.useState<
    { elements: EditorElement[]; pages: PageMeta[]; textMap: Record<number, DetectedTextItem[]> }[]
  >([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  // Drawing state
  const [isDrawing, setIsDrawing] = React.useState<boolean>(false);
  const [currentDrawPoints, setCurrentDrawPoints] = React.useState<{ x: number; y: number }[]>([]);

  // Whiteout drag state
  const [isDraggingBox, setIsDraggingBox] = React.useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = React.useState<{ x: number; y: number } | null>(null);
  const [dragCurrentBox, setDragCurrentBox] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Element interaction (Move / Resize)
  const [isInteracting, setIsInteracting] = React.useState<boolean>(false);
  const [interactionMode, setInteractionMode] = React.useState<"move" | "resize" | null>(null);
  const [resizeHandle, setResizeHandle] = React.useState<string | null>(null);
  const [interactionStart, setInteractionStart] = React.useState<{
    mouseX: number;
    mouseY: number;
    elemX: number;
    elemY: number;
    elemW: number;
    elemH: number;
  } | null>(null);

  // Styling properties
  const [activeColor, setActiveColor] = React.useState<string>("#000000");
  const [activeFontSize, setActiveFontSize] = React.useState<number>(16);
  const [activeFontFamily, setActiveFontFamily] = React.useState<string>("Helvetica");
  const [activeStrokeWidth, setActiveStrokeWidth] = React.useState<number>(3);
  const [activeFillColor, setActiveFillColor] = React.useState<string>("transparent");

  // Modals
  const [showSigModal, setShowSigModal] = React.useState<boolean>(false);
  const [showStampModal, setShowStampModal] = React.useState<boolean>(false);
  const [sigTypeTab, setSigTypeTab] = React.useState<"draw" | "type">("draw");
  const [typedSigText, setTypedSigText] = React.useState<string>("John Doe");
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  // Refs
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const replaceImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const sigCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pageContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Helper to record history
  const pushHistory = React.useCallback(
    (
      newElements: EditorElement[],
      newPages: PageMeta[],
      newTextMap?: Record<number, DetectedTextItem[]>
    ) => {
      const tm = newTextMap || detectedTextMap;
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, { elements: newElements, pages: newPages, textMap: tm }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex, detectedTextMap]
  );

  // Initial PDF load & render & text layer extraction
  React.useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      try {
        setIsLoadingPdf(true);
        setLoadingStatus("Parsing PDF document & extracting text layers...");

        const arrayBuffer = await initialFile.arrayBuffer();
        const pdfjsLib = await getPdfjs();

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageMetas: PageMeta[] = [];
        const extractedTextMap: Record<number, DetectedTextItem[]> = {};

        for (let i = 1; i <= pdf.numPages; i++) {
          if (isCancelled) return;
          setLoadingStatus(`Rendering & indexing text on page ${i} of ${pdf.numPages}...`);

          const page = await pdf.getPage(i);
          const defaultViewport = page.getViewport({ scale: 1.0 });

          // Render high-res thumbnail for background
          const renderScale = 1.5;
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          }

          // Extract text items with exact bounding boxes
          try {
            const textContent = await page.getTextContent();
            const rawItems: {
              str: string;
              x: number;
              y: number;
              width: number;
              height: number;
              fontSize: number;
              fontName: string;
            }[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const item of textContent.items as any[]) {
              if (!item.str || !item.str.trim()) continue;

              const tx = item.transform[4];
              const ty = item.transform[5];
              const fontSize =
                Math.hypot(item.transform[2], item.transform[3]) ||
                Math.abs(item.transform[3]) ||
                12;

              const [vx, baselineVy] = defaultViewport.convertToViewportPoint(tx, ty);
              const width = item.width || fontSize * item.str.length * 0.55;
              const height = Math.max(item.height || 0, fontSize * 1.15);
              const topY = baselineVy - fontSize * 0.88;

              let family = "Helvetica";
              const fn = (item.fontName || "").toLowerCase();
              if (fn.includes("times") || fn.includes("serif")) family = "TimesRoman";
              if (fn.includes("courier") || fn.includes("mono")) family = "Courier";

              rawItems.push({
                str: item.str,
                x: Math.max(0, vx),
                y: Math.max(0, topY),
                width: Math.max(8, width),
                height: Math.max(10, height),
                fontSize: Math.round(fontSize),
                fontName: family,
              });
            }

            // Cluster adjacent items on the same baseline into cohesive readable lines
            const clustered: DetectedTextItem[] = [];
            const lineThreshold = 5;
            rawItems.sort((a, b) =>
              Math.abs(a.y - b.y) <= lineThreshold ? a.x - b.x : a.y - b.y
            );

            for (const it of rawItems) {
              const last = clustered[clustered.length - 1];
              if (
                last &&
                Math.abs(last.y - it.y) <= lineThreshold &&
                it.x >= last.x &&
                it.x - (last.x + last.width) <= it.fontSize * 1.8
              ) {
                const gap = it.x - (last.x + last.width);
                const addSpace = gap > it.fontSize * 0.2 ? " " : "";
                last.text = last.text + addSpace + it.str;
                last.width = Math.max(last.width, it.x + it.width - last.x);
                last.height = Math.max(last.height, it.height);
                last.fontSize = Math.max(last.fontSize, it.fontSize);
              } else {
                clustered.push({
                  id: `orig-${i - 1}-${clustered.length}-${Math.random().toString(36).substring(2, 6)}`,
                  pageIndex: i - 1,
                  text: it.str,
                  x: it.x,
                  y: it.y,
                  width: it.width,
                  height: it.height,
                  fontSize: it.fontSize,
                  fontFamily: it.fontName,
                  isEdited: false,
                });
              }
            }

            extractedTextMap[i - 1] = clustered;
          } catch {
            extractedTextMap[i - 1] = [];
          }

          pageMetas.push({
            pageNumber: i,
            originalIndex: i - 1,
            width: defaultViewport.width,
            height: defaultViewport.height,
            renderedDataUrl: canvas.toDataURL("image/jpeg", 0.85),
          });
        }

        if (!isCancelled) {
          setPages(pageMetas);
          setDetectedTextMap(extractedTextMap);
          setCurrentPageIndex(0);
          setElements([]);
          setHistory([{ elements: [], pages: pageMetas, textMap: extractedTextMap }]);
          setHistoryIndex(0);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          alert(`Failed to load PDF: ${(err as Error).message || err}`);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPdf(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [initialFile]);

  const currentPage = pages[currentPageIndex] || {
    pageNumber: 1,
    originalIndex: 0,
    width: 595.28,
    height: 841.89,
  };

  const currentDetectedTexts = (detectedTextMap[currentPageIndex] || []).filter(
    (t) => !t.isEdited
  );

  // Keyboard navigation & shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement)?.blur();
          setEditingTextId(null);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowFindReplaceModal(true);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementId) {
          e.preventDefault();
          const next = elements.filter((el) => el.id !== selectedElementId);
          setElements(next);
          setSelectedElementId(null);
          pushHistory(next, pages);
        }
      } else if (e.key === "Escape") {
        setSelectedElementId(null);
        setEditingTextId(null);
        setActiveTool("select");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, elements, pages, historyIndex, history, pushHistory]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setElements(prev.elements);
      setPages(prev.pages);
      setDetectedTextMap(prev.textMap);
      setHistoryIndex(historyIndex - 1);
      setSelectedElementId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setElements(next.elements);
      setPages(next.pages);
      setDetectedTextMap(next.textMap);
      setHistoryIndex(historyIndex + 1);
      setSelectedElementId(null);
    }
  };

  // Convert an existing PDF text item into an editable live text box
  const handleEditOriginalText = (origItem: DetectedTextItem) => {
    const paddingX = 3;
    const paddingY = 2;
    const whiteoutId = `wo-${origItem.id}`;
    const newWhiteout: EditorElement = {
      id: whiteoutId,
      pageIndex: origItem.pageIndex,
      type: "whiteout",
      x: Math.max(0, origItem.x - paddingX),
      y: Math.max(0, origItem.y - paddingY),
      width: origItem.width + paddingX * 2,
      height: origItem.height + paddingY * 2,
      backgroundColor: "#ffffff",
    };

    const textElemId = `edit-${origItem.id}`;
    const newTextElem: EditorElement = {
      id: textElemId,
      pageIndex: origItem.pageIndex,
      type: "text",
      x: origItem.x,
      y: origItem.y,
      width: Math.max(origItem.width + 16, 80),
      height: Math.max(origItem.height, 22),
      text: origItem.text,
      fontSize: origItem.fontSize || 14,
      fontFamily: origItem.fontFamily || "Helvetica",
      color: origItem.color || activeColor || "#000000",
      backgroundColor: "transparent",
      textAlign: "left",
    };

    const updatedMap = {
      ...detectedTextMap,
      [origItem.pageIndex]: (detectedTextMap[origItem.pageIndex] || []).map((it) =>
        it.id === origItem.id ? { ...it, isEdited: true } : it
      ),
    };

    const next = [...elements, newWhiteout, newTextElem];
    setDetectedTextMap(updatedMap);
    setElements(next);
    setSelectedElementId(textElemId);
    setEditingTextId(textElemId);
    setActiveTool("select");
    pushHistory(next, pages, updatedMap);
  };

  // Convert all detected text on current page to editable boxes at once
  const handleConvertAllPageTextToEditable = () => {
    const unedited = currentDetectedTexts;
    if (unedited.length === 0) {
      alert("All text on this page is already editable or no text was detected.");
      return;
    }

    const newWhiteouts: EditorElement[] = [];
    const newTextElements: EditorElement[] = [];

    unedited.forEach((origItem) => {
      const paddingX = 3;
      const paddingY = 2;
      newWhiteouts.push({
        id: `wo-${origItem.id}`,
        pageIndex: origItem.pageIndex,
        type: "whiteout",
        x: Math.max(0, origItem.x - paddingX),
        y: Math.max(0, origItem.y - paddingY),
        width: origItem.width + paddingX * 2,
        height: origItem.height + paddingY * 2,
        backgroundColor: "#ffffff",
      });

      newTextElements.push({
        id: `edit-${origItem.id}`,
        pageIndex: origItem.pageIndex,
        type: "text",
        x: origItem.x,
        y: origItem.y,
        width: Math.max(origItem.width + 16, 80),
        height: Math.max(origItem.height, 22),
        text: origItem.text,
        fontSize: origItem.fontSize || 14,
        fontFamily: origItem.fontFamily || "Helvetica",
        color: origItem.color || "#000000",
        backgroundColor: "transparent",
        textAlign: "left",
      });
    });

    const updatedMap = {
      ...detectedTextMap,
      [currentPageIndex]: (detectedTextMap[currentPageIndex] || []).map((it) => ({
        ...it,
        isEdited: true,
      })),
    };

    const next = [...elements, ...newWhiteouts, ...newTextElements];
    setDetectedTextMap(updatedMap);
    setElements(next);
    pushHistory(next, pages, updatedMap);
  };

  // Run Tesseract OCR on current page if scanned image without text layer
  const handleRunOcrOnPage = async () => {
    try {
      setIsOcrRunning(true);
      setOcrProgress(10);

      const tesseract = await import("tesseract.js");
      setOcrProgress(30);

      const pageImg = currentPage.renderedDataUrl;
      if (!pageImg) {
        alert("No page image available for OCR.");
        return;
      }

      setOcrProgress(50);
      const res = await tesseract.recognize(pageImg, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) {
            setOcrProgress(50 + Math.round(m.progress * 45));
          }
        },
      });

      setOcrProgress(95);
      const imgWidth = currentPage.width * 1.5;
      const imgHeight = currentPage.height * 1.5;
      const scaleX = currentPage.width / imgWidth;
      const scaleY = currentPage.height / imgHeight;

      // Extract words with bounding boxes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ocrItems: DetectedTextItem[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const words = (res.data as any).words || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      words.forEach((w: any, idx: number) => {
        if (!w.text || !w.text.trim()) return;
        const bbox = w.bbox;
        const x = bbox.x0 * scaleX;
        const y = bbox.y0 * scaleY;
        const width = (bbox.x1 - bbox.x0) * scaleX;
        const height = (bbox.y1 - bbox.y0) * scaleY;

        ocrItems.push({
          id: `ocr-${currentPageIndex}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          pageIndex: currentPageIndex,
          text: w.text,
          x,
          y,
          width: Math.max(12, width),
          height: Math.max(12, height),
          fontSize: Math.max(10, Math.round(height * 0.8)),
          fontFamily: "Helvetica",
          isEdited: false,
        });
      });

      const updatedMap = {
        ...detectedTextMap,
        [currentPageIndex]: [...(detectedTextMap[currentPageIndex] || []), ...ocrItems],
      };

      setDetectedTextMap(updatedMap);
      pushHistory(elements, pages, updatedMap);
      alert(`OCR complete! Detected ${ocrItems.length} editable text blocks.`);
    } catch (err: unknown) {
      alert(`OCR failed: ${(err as Error).message || err}`);
    } finally {
      setIsOcrRunning(false);
      setOcrProgress(0);
    }
  };

  // Find & Replace Execution
  const handleExecuteReplaceAll = () => {
    if (!findQuery.trim()) return;

    let matchCount = 0;
    const newWhiteouts: EditorElement[] = [];
    const newTextElements: EditorElement[] = [];
    const updatedMap = { ...detectedTextMap };

    // Search across all pages
    Object.keys(detectedTextMap).forEach((pKey) => {
      const pIdx = parseInt(pKey, 10);
      const items = detectedTextMap[pIdx] || [];

      items.forEach((item) => {
        if (item.isEdited) return;

        const textToSearch = caseSensitive ? item.text : item.text.toLowerCase();
        const queryToSearch = caseSensitive ? findQuery : findQuery.toLowerCase();

        if (textToSearch.includes(queryToSearch)) {
          matchCount++;
          const replacedText = item.text.replaceAll(
            new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), caseSensitive ? "g" : "gi"),
            replaceQuery
          );

          newWhiteouts.push({
            id: `wo-${item.id}`,
            pageIndex: pIdx,
            type: "whiteout",
            x: Math.max(0, item.x - 2),
            y: Math.max(0, item.y - 1),
            width: item.width + 4,
            height: item.height + 2,
            backgroundColor: "#ffffff",
          });

          newTextElements.push({
            id: `edit-${item.id}`,
            pageIndex: pIdx,
            type: "text",
            x: item.x,
            y: item.y,
            width: Math.max(item.width + 20, 60),
            height: Math.max(item.height, 20),
            text: replacedText,
            fontSize: item.fontSize || 14,
            fontFamily: item.fontFamily || "Helvetica",
            color: item.color || "#000000",
            backgroundColor: "transparent",
            textAlign: "left",
          });

          item.isEdited = true;
        }
      });

      updatedMap[pIdx] = [...items];
    });

    if (matchCount > 0) {
      const next = [...elements, ...newWhiteouts, ...newTextElements];
      setDetectedTextMap(updatedMap);
      setElements(next);
      pushHistory(next, pages, updatedMap);
      setReplaceStatusMsg(`Successfully replaced ${matchCount} occurrence(s)!`);
    } else {
      setReplaceStatusMsg("No matching text found.");
    }
  };

  // Page Management
  const handleAddBlankPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: PageMeta = {
      pageNumber: newPageNum,
      originalIndex: null,
      width: 595.28,
      height: 841.89,
      renderedDataUrl: undefined,
    };
    const nextPages = [...pages, newPage];
    setPages(nextPages);
    setCurrentPageIndex(nextPages.length - 1);
    pushHistory(elements, nextPages);
  };

  const handleDuplicatePage = (pageIdx: number) => {
    const srcPage = pages[pageIdx];
    const newPage: PageMeta = {
      ...srcPage,
      pageNumber: pages.length + 1,
    };
    const nextPages = [...pages.slice(0, pageIdx + 1), newPage, ...pages.slice(pageIdx + 1)];
    const reindexed = nextPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

    const srcElems = elements.filter((el) => el.pageIndex === pageIdx);
    const dupedElems: EditorElement[] = srcElems.map((el) => ({
      ...el,
      id: Math.random().toString(36).substring(2, 9),
      pageIndex: pageIdx + 1,
    }));

    const updatedElems = elements.map((el) => {
      if (el.pageIndex > pageIdx) {
        return { ...el, pageIndex: el.pageIndex + 1 };
      }
      return el;
    });

    const nextElements = [...updatedElems, ...dupedElems];
    setPages(reindexed);
    setElements(nextElements);
    setCurrentPageIndex(pageIdx + 1);
    pushHistory(nextElements, reindexed);
  };

  const handleDeletePage = (pageIdx: number) => {
    if (pages.length <= 1) {
      alert("A document must contain at least one page.");
      return;
    }
    if (!confirm(`Are you sure you want to delete Page ${pageIdx + 1}?`)) return;

    const nextPages = pages
      .filter((_, idx) => idx !== pageIdx)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));

    const nextElements = elements
      .filter((el) => el.pageIndex !== pageIdx)
      .map((el) => {
        if (el.pageIndex > pageIdx) {
          return { ...el, pageIndex: el.pageIndex - 1 };
        }
        return el;
      });

    setPages(nextPages);
    setElements(nextElements);
    setCurrentPageIndex(Math.min(currentPageIndex, nextPages.length - 1));
    setSelectedElementId(null);
    pushHistory(nextElements, nextPages);
  };

  // Convert client mouse event to PDF points relative to page container
  const getPointInPage = (
    e: React.MouseEvent<HTMLDivElement>
  ): { x: number; y: number } | null => {
    const container = pageContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const ptX = (clientX / rect.width) * currentPage.width;
    const ptY = (clientY / rect.height) * currentPage.height;

    return {
      x: Math.max(0, Math.min(currentPage.width, ptX)),
      y: Math.max(0, Math.min(currentPage.height, ptY)),
    };
  };

  // Canvas Mouse Handlers
  const handlePageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = getPointInPage(e);
    if (!pt) return;

    if (activeTool === "text") {
      const id = Math.random().toString(36).substring(2, 9);
      const newTextElem: EditorElement = {
        id,
        pageIndex: currentPageIndex,
        type: "text",
        x: pt.x,
        y: pt.y,
        width: 180,
        height: 40,
        text: "Type here...",
        fontSize: activeFontSize,
        fontFamily: activeFontFamily,
        color: activeColor,
        backgroundColor: "transparent",
        textAlign: "left",
      };
      const next = [...elements, newTextElem];
      setElements(next);
      setSelectedElementId(id);
      setEditingTextId(id);
      setActiveTool("select");
      pushHistory(next, pages);
      return;
    }

    if (activeTool === "whiteout" || activeTool === "rectangle" || activeTool === "circle") {
      setIsDraggingBox(true);
      setDragStartPoint(pt);
      setDragCurrentBox({ x: pt.x, y: pt.y, width: 10, height: 10 });
      return;
    }

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsDrawing(true);
      setCurrentDrawPoints([pt]);
      return;
    }

    if (activeTool === "select" && !isInteracting) {
      setSelectedElementId(null);
      setEditingTextId(null);
    }
  };

  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const pt = getPointInPage(e);
    if (!pt) return;

    if (isDrawing && (activeTool === "pen" || activeTool === "highlighter")) {
      setCurrentDrawPoints((prev) => [...prev, pt]);
      return;
    }

    if (isDraggingBox && dragStartPoint) {
      const x = Math.min(dragStartPoint.x, pt.x);
      const y = Math.min(dragStartPoint.y, pt.y);
      const width = Math.abs(pt.x - dragStartPoint.x);
      const height = Math.abs(pt.y - dragStartPoint.y);
      setDragCurrentBox({ x, y, width, height });
      return;
    }

    if (isInteracting && interactionStart && selectedElementId) {
      const dx = (e.clientX - interactionStart.mouseX) / zoomScale;
      const dy = (e.clientY - interactionStart.mouseY) / zoomScale;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedElementId) return el;

          if (interactionMode === "move") {
            return {
              ...el,
              x: Math.max(0, Math.min(currentPage.width - el.width, interactionStart.elemX + dx)),
              y: Math.max(0, Math.min(currentPage.height - el.height, interactionStart.elemY + dy)),
            };
          }

          if (interactionMode === "resize") {
            let nextW = el.width;
            let nextH = el.height;
            let nextX = el.x;
            let nextY = el.y;

            if (resizeHandle === "se") {
              nextW = Math.max(20, interactionStart.elemW + dx);
              nextH = Math.max(15, interactionStart.elemH + dy);
            } else if (resizeHandle === "sw") {
              nextW = Math.max(20, interactionStart.elemW - dx);
              nextH = Math.max(15, interactionStart.elemH + dy);
              nextX = interactionStart.elemX + dx;
            } else if (resizeHandle === "ne") {
              nextW = Math.max(20, interactionStart.elemW + dx);
              nextH = Math.max(15, interactionStart.elemH - dy);
              nextY = interactionStart.elemY + dy;
            } else if (resizeHandle === "nw") {
              nextW = Math.max(20, interactionStart.elemW - dx);
              nextH = Math.max(15, interactionStart.elemH - dy);
              nextX = interactionStart.elemX + dx;
              nextY = interactionStart.elemY + dy;
            }

            return {
              ...el,
              x: nextX,
              y: nextY,
              width: nextW,
              height: nextH,
            };
          }

          return el;
        })
      );
    }
  };

  const handlePageMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentDrawPoints.length > 1) {
        const id = Math.random().toString(36).substring(2, 9);
        const xs = currentDrawPoints.map((p) => p.x);
        const ys = currentDrawPoints.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const newDrawingElem: EditorElement = {
          id,
          pageIndex: currentPageIndex,
          type: "drawing",
          x: minX,
          y: minY,
          width: Math.max(10, maxX - minX),
          height: Math.max(10, maxY - minY),
          points: currentDrawPoints,
          color: activeColor,
          strokeWidth: activeTool === "highlighter" ? 14 : activeStrokeWidth,
          isHighlighter: activeTool === "highlighter",
          opacity: activeTool === "highlighter" ? 0.45 : 1.0,
        };
        const next = [...elements, newDrawingElem];
        setElements(next);
        pushHistory(next, pages);
      }
      setCurrentDrawPoints([]);
      return;
    }

    if (isDraggingBox && dragCurrentBox) {
      setIsDraggingBox(false);
      const id = Math.random().toString(36).substring(2, 9);

      if (activeTool === "whiteout") {
        const newWhiteout: EditorElement = {
          id,
          pageIndex: currentPageIndex,
          type: "whiteout",
          x: dragCurrentBox.x,
          y: dragCurrentBox.y,
          width: Math.max(20, dragCurrentBox.width),
          height: Math.max(15, dragCurrentBox.height),
          backgroundColor: "#ffffff",
        };
        const next = [...elements, newWhiteout];
        setElements(next);
        setSelectedElementId(id);
        setActiveTool("select");
        pushHistory(next, pages);
      } else if (activeTool === "rectangle" || activeTool === "circle") {
        const newShape: EditorElement = {
          id,
          pageIndex: currentPageIndex,
          type: "shape",
          shapeType: activeTool,
          x: dragCurrentBox.x,
          y: dragCurrentBox.y,
          width: Math.max(20, dragCurrentBox.width),
          height: Math.max(20, dragCurrentBox.height),
          strokeColor: activeColor,
          fillColor: activeFillColor,
          strokeWidth: activeStrokeWidth,
        };
        const next = [...elements, newShape];
        setElements(next);
        setSelectedElementId(id);
        setActiveTool("select");
        pushHistory(next, pages);
      }

      setDragStartPoint(null);
      setDragCurrentBox(null);
      return;
    }

    if (isInteracting) {
      setIsInteracting(false);
      setInteractionMode(null);
      setResizeHandle(null);
      setInteractionStart(null);
      pushHistory(elements, pages);
    }
  };

  const startMove = (e: React.MouseEvent, elem: EditorElement) => {
    e.stopPropagation();
    setSelectedElementId(elem.id);
    setIsInteracting(true);
    setInteractionMode("move");
    setInteractionStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
      elemW: elem.width,
      elemH: elem.height,
    });
  };

  const startResize = (e: React.MouseEvent, elem: EditorElement, handle: string) => {
    e.stopPropagation();
    setSelectedElementId(elem.id);
    setIsInteracting(true);
    setInteractionMode("resize");
    setResizeHandle(handle);
    setInteractionStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
      elemW: elem.width,
      elemH: elem.height,
    });
  };

  // Image Upload & Replacement
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxW = currentPage.width * 0.5;
        if (w > maxW) {
          const ratio = maxW / w;
          w = maxW;
          h = h * ratio;
        }

        const id = Math.random().toString(36).substring(2, 9);
        const newImgElem: EditorElement = {
          id,
          pageIndex: currentPageIndex,
          type: "image",
          x: (currentPage.width - w) / 2,
          y: (currentPage.height - h) / 2,
          width: w,
          height: h,
          dataUrl,
          opacity: 1.0,
        };

        const next = [...elements, newImgElem];
        setElements(next);
        setSelectedElementId(id);
        setActiveTool("select");
        pushHistory(next, pages);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleReplaceImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElementId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const next = elements.map((el) => {
        if (el.id === selectedElementId) {
          return { ...el, dataUrl };
        }
        return el;
      });
      setElements(next);
      pushHistory(next, pages);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Signature drawing logic
  const handleSigMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = activeColor || "#000000";

    const onMove = (ev: MouseEvent) => {
      ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
      ctx.stroke();
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleSaveSignature = () => {
    let dataUrl = "";
    if (sigTypeTab === "draw") {
      const canvas = sigCanvasRef.current;
      if (!canvas) return;
      dataUrl = canvas.toDataURL("image/png");
    } else if (sigTypeTab === "type") {
      const off = document.createElement("canvas");
      off.width = 400;
      off.height = 120;
      const ctx = off.getContext("2d");
      if (ctx) {
        ctx.font = "italic 38px 'Brush Script MT', cursive, sans-serif";
        ctx.fillStyle = activeColor || "#000000";
        ctx.fillText(typedSigText || "Signature", 20, 70);
        dataUrl = off.toDataURL("image/png");
      }
    }

    if (dataUrl) {
      const id = Math.random().toString(36).substring(2, 9);
      const newSigElem: EditorElement = {
        id,
        pageIndex: currentPageIndex,
        type: "signature",
        x: (currentPage.width - 180) / 2,
        y: currentPage.height - 140,
        width: 180,
        height: 60,
        dataUrl,
        opacity: 1.0,
      };
      const next = [...elements, newSigElem];
      setElements(next);
      setSelectedElementId(id);
      pushHistory(next, pages);
    }
    setShowSigModal(false);
  };

  const handleAddStamp = (stamp: { text: string; color: string }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newStamp: EditorElement = {
      id,
      pageIndex: currentPageIndex,
      type: "stamp",
      stampText: stamp.text,
      color: stamp.color,
      x: (currentPage.width - 150) / 2,
      y: (currentPage.height - 50) / 2,
      width: 150,
      height: 48,
    };
    const next = [...elements, newStamp];
    setElements(next);
    setSelectedElementId(id);
    setShowStampModal(false);
    pushHistory(next, pages);
  };

  // Compile & Export Final PDF with pdf-lib
  const handleExportPdf = async () => {
    try {
      setIsSaving(true);
      const originalBytes = await initialFile.arrayBuffer();
      const originalDoc = await PDFDocument.load(originalBytes);
      const outPdf = await PDFDocument.create();

      const fontHelvetica = await outPdf.embedFont(StandardFonts.Helvetica);
      const fontHelveticaBold = await outPdf.embedFont(StandardFonts.HelveticaBold);
      const fontHelveticaOblique = await outPdf.embedFont(StandardFonts.HelveticaOblique);
      const fontTimes = await outPdf.embedFont(StandardFonts.TimesRoman);
      const fontTimesBold = await outPdf.embedFont(StandardFonts.TimesRomanBold);
      const fontCourier = await outPdf.embedFont(StandardFonts.Courier);
      const fontCourierBold = await outPdf.embedFont(StandardFonts.CourierBold);

      for (let i = 0; i < pages.length; i++) {
        const pageMeta = pages[i];
        let outPage;

        if (pageMeta.originalIndex !== null && pageMeta.originalIndex < originalDoc.getPageCount()) {
          const [copied] = await outPdf.copyPages(originalDoc, [pageMeta.originalIndex]);
          outPage = outPdf.addPage(copied);
        } else {
          outPage = outPdf.addPage([pageMeta.width, pageMeta.height]);
        }

        const { width: pWidth, height: pHeight } = outPage.getSize();
        const pageElements = elements.filter((el) => el.pageIndex === i);

        // 1. Draw Whiteouts first (masking original text/content)
        for (const el of pageElements.filter((e) => e.type === "whiteout")) {
          const pdfY = pHeight - el.y - el.height;
          outPage.drawRectangle({
            x: el.x,
            y: pdfY,
            width: el.width,
            height: el.height,
            color: rgb(1, 1, 1),
          });
        }

        // 2. Draw Shapes
        for (const el of pageElements.filter((e) => e.type === "shape")) {
          const pdfY = pHeight - el.y - el.height;
          const cleanStroke = (el.strokeColor || "#000000").replace("#", "");
          const sr = (parseInt(cleanStroke.substring(0, 2), 16) || 0) / 255;
          const sg = (parseInt(cleanStroke.substring(2, 4), 16) || 0) / 255;
          const sb = (parseInt(cleanStroke.substring(4, 6), 16) || 0) / 255;

          if (el.shapeType === "rectangle") {
            outPage.drawRectangle({
              x: el.x,
              y: pdfY,
              width: el.width,
              height: el.height,
              borderColor: rgb(sr, sg, sb),
              borderWidth: el.strokeWidth || 2,
            });
          } else if (el.shapeType === "circle") {
            const rx = el.width / 2;
            const ry = el.height / 2;
            outPage.drawEllipse({
              x: el.x + rx,
              y: pdfY + ry,
              xScale: rx,
              yScale: ry,
              borderColor: rgb(sr, sg, sb),
              borderWidth: el.strokeWidth || 2,
            });
          }
        }

        // 3. Draw Images & Signatures
        for (const el of pageElements.filter((e) => (e.type === "image" || e.type === "signature") && e.dataUrl)) {
          const pdfY = pHeight - el.y - el.height;
          try {
            const base64Data = el.dataUrl!.split(",")[1];
            const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const isPng = el.dataUrl!.startsWith("data:image/png");

            const embeddedImg = isPng ? await outPdf.embedPng(imgBytes) : await outPdf.embedJpg(imgBytes);

            outPage.drawImage(embeddedImg, {
              x: el.x,
              y: pdfY,
              width: el.width,
              height: el.height,
              opacity: el.opacity ?? 1.0,
            });
          } catch {
            // ignore embed errors
          }
        }

        // 4. Draw Vector Drawings & Highlighters
        for (const el of pageElements.filter((e) => e.type === "drawing" && e.points && e.points.length > 1)) {
          const off = document.createElement("canvas");
          off.width = pWidth * 2;
          off.height = pHeight * 2;
          const ctx = off.getContext("2d");
          if (ctx) {
            ctx.scale(2, 2);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = el.color || "#000000";
            ctx.lineWidth = el.strokeWidth || 3;
            if (el.isHighlighter) {
              ctx.globalAlpha = 0.45;
            }

            ctx.beginPath();
            ctx.moveTo(el.points![0].x, el.points![0].y);
            for (let ptIdx = 1; ptIdx < el.points!.length; ptIdx++) {
              ctx.lineTo(el.points![ptIdx].x, el.points![ptIdx].y);
            }
            ctx.stroke();

            const dataUrl = off.toDataURL("image/png");
            const base64 = dataUrl.split(",")[1];
            const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
            const embeddedDraw = await outPdf.embedPng(pngBytes);
            outPage.drawImage(embeddedDraw, {
              x: 0,
              y: 0,
              width: pWidth,
              height: pHeight,
            });
          }
        }

        // 5. Draw Stamps
        for (const el of pageElements.filter((e) => e.type === "stamp" && e.stampText)) {
          const pdfY = pHeight - el.y - el.height;
          const cleanHex = (el.color || "#dc2626").replace("#", "");
          const r = (parseInt(cleanHex.substring(0, 2), 16) || 0) / 255;
          const g = (parseInt(cleanHex.substring(2, 4), 16) || 0) / 255;
          const b = (parseInt(cleanHex.substring(4, 6), 16) || 0) / 255;

          outPage.drawRectangle({
            x: el.x,
            y: pdfY,
            width: el.width,
            height: el.height,
            borderColor: rgb(r, g, b),
            borderWidth: 3,
          });

          const stampStr = el.stampText || "";
          const textWidth = fontHelveticaBold.widthOfTextAtSize(stampStr, 16);
          outPage.drawText(stampStr, {
            x: el.x + (el.width - textWidth) / 2,
            y: pdfY + (el.height - 16) / 2 + 2,
            size: 16,
            font: fontHelveticaBold,
            color: rgb(r, g, b),
          });
        }

        // 6. Draw Text Overlays & Edited Text
        for (const el of pageElements.filter((e) => e.type === "text" && e.text)) {
          const cleanHex = (el.color || "#000000").replace("#", "");
          const r = (parseInt(cleanHex.substring(0, 2), 16) || 0) / 255;
          const g = (parseInt(cleanHex.substring(2, 4), 16) || 0) / 255;
          const b = (parseInt(cleanHex.substring(4, 6), 16) || 0) / 255;

          let font = fontHelvetica;
          if (el.fontFamily === "TimesRoman" || el.fontFamily === "Times New Roman") {
            font = el.isBold ? fontTimesBold : fontTimes;
          } else if (el.fontFamily === "Courier") {
            font = el.isBold ? fontCourierBold : fontCourier;
          } else {
            font = el.isBold ? fontHelveticaBold : el.isItalic ? fontHelveticaOblique : fontHelvetica;
          }

          const fontSize = el.fontSize || 14;
          const lines = el.text!.split("\n");
          const lineHeight = fontSize * 1.25;

          lines.forEach((line, lineIdx) => {
            const lineY = pHeight - el.y - (lineIdx + 1) * lineHeight + fontSize * 0.2;
            outPage.drawText(line, {
              x: el.x,
              y: lineY,
              size: fontSize,
              font,
              color: rgb(r, g, b),
            });
          });
        }
      }

      const pdfBytes = await outPdf.save();
      const filename = initialFile.name.replace(/\.pdf$/i, "") + "-edited.pdf";

      await addRecentFile({
        name: filename,
        size: initialFile.size,
        type: "application/pdf",
        toolSlug: "edit-pdf-text",
        resultSize: pdfBytes.length,
      });

      if (onSaveSuccess) {
        onSaveSuccess(pdfBytes, filename);
      } else {
        const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: unknown) {
      alert(`Failed to save PDF: ${(err as Error).message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedElement = elements.find((e) => e.id === selectedElementId);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Application Ribbon */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)] text-xs z-30 shrink-0">
        <div className="flex items-center space-x-3">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-xs">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm truncate max-w-xs">{initialFile.name}</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              ({formatBytes(initialFile.size)})
            </span>
          </div>
        </div>

        {/* Center Actions: Undo / Redo & Zoom & Find/Replace */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] p-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 rounded hover:bg-[var(--surface-hover)] cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 rounded hover:bg-[var(--surface-hover)] cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--surface-elevated)] p-0.5">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.15))}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-hover)] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-hover)] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Find & Replace Shortcut Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFindReplaceModal(true)}
            className="h-8 text-xs flex items-center space-x-1.5 bg-[var(--surface-elevated)]"
            title="Find & Replace Text across document (Ctrl+F)"
          >
            <Search className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Find & Replace</span>
          </Button>

          <div className="hidden md:flex items-center space-x-1 pl-2 border-l border-[var(--border)]">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddBlankPage}
              className="h-8 text-xs flex items-center space-x-1"
            >
              <Plus className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Add Page</span>
            </Button>
          </div>
        </div>

        {/* Right Actions: Export / Download */}
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPdf}
            disabled={isSaving || isLoadingPdf}
            className="h-8 px-4 text-xs font-semibold flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Save & Download PDF</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Editing Toolbar */}
      <nav
        aria-label="Editing Tools"
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-elevated)] text-xs z-20 shrink-0"
      >
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          {/* Main Select Mode */}
          <Button
            variant={activeTool === "select" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("select")}
            className="h-8 text-xs px-2.5 flex items-center space-x-1"
            title="Select, Move, or Click any text to edit directly"
          >
            <Move className="h-3.5 w-3.5" />
            <span>Select / Click Text</span>
          </Button>

          {/* Edit Existing Text Quick Mode */}
          <Button
            variant={activeTool === "edit-existing" ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setActiveTool(activeTool === "edit-existing" ? "select" : "edit-existing");
              setShowTextHighlights(true);
            }}
            className={`h-8 text-xs px-2.5 flex items-center space-x-1.5 ${
              activeTool === "edit-existing"
                ? "bg-cyan-600 text-white hover:bg-cyan-500"
                : "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
            }`}
            title="Click any text on the page to edit it immediately"
          >
            <ScanText className="h-3.5 w-3.5" />
            <span>Edit Existing Text</span>
            {currentDetectedTexts.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-cyan-900/60 border border-cyan-500/40 text-[10px] rounded-full font-mono">
                {currentDetectedTexts.length}
              </span>
            )}
          </Button>

          {/* Add New Text Box */}
          <Button
            variant={activeTool === "text" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("text")}
            className="h-8 text-xs px-2.5 flex items-center space-x-1"
            title="Add New Text Box"
          >
            <Type className="h-3.5 w-3.5" />
            <span>Add Text</span>
          </Button>

          {/* Whiteout / Erase */}
          <Button
            variant={activeTool === "whiteout" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("whiteout")}
            className="h-8 text-xs px-2.5 flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20"
            title="Erase / Whiteout existing content"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Whiteout</span>
          </Button>

          {/* Insert Picture */}
          <Button
            variant={activeTool === "image" ? "primary" : "ghost"}
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            className="h-8 text-xs px-2.5 flex items-center space-x-1"
            title="Insert Picture"
          >
            <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
            <span>Add Picture</span>
          </Button>

          {/* Freehand Draw */}
          <Button
            variant={activeTool === "pen" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("pen")}
            className="h-8 text-xs px-2.5 flex items-center space-x-1"
            title="Freehand Draw"
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>Draw</span>
          </Button>

          {/* Highlighter */}
          <Button
            variant={activeTool === "highlighter" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("highlighter")}
            className="h-8 text-xs px-2.5 flex items-center space-x-1"
            title="Highlighter"
          >
            <Highlighter className="h-3.5 w-3.5 text-yellow-400" />
            <span>Highlight</span>
          </Button>

          {/* Shapes */}
          <Button
            variant={activeTool === "rectangle" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("rectangle")}
            className="h-8 text-xs px-2 flex items-center space-x-1"
            title="Rectangle"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant={activeTool === "circle" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTool("circle")}
            className="h-8 text-xs px-2 flex items-center space-x-1"
            title="Circle"
          >
            <Circle className="h-3.5 w-3.5" />
          </Button>

          {/* Signature */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSigModal(true)}
            className="h-8 text-xs px-2.5 flex items-center space-x-1 text-emerald-400"
            title="Sign Document"
          >
            <span>Sign</span>
          </Button>

          {/* Stamp */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStampModal(true)}
            className="h-8 text-xs px-2.5 flex items-center space-x-1 text-rose-400"
            title="Insert Document Stamp"
          >
            <Stamp className="h-3.5 w-3.5 mr-0.5" />
            <span>Stamp</span>
          </Button>
        </div>

        {/* Dynamic Context Properties Toolbar for Selected Element */}
        <div className="flex items-center space-x-3 overflow-x-auto">
          {/* Quick Page Text Action Buttons */}
          <div className="flex items-center space-x-1.5 border-r border-[var(--border)] pr-3">
            <button
              onClick={() => setShowTextHighlights((v) => !v)}
              className={`p-1.5 rounded flex items-center space-x-1 text-[11px] ${
                showTextHighlights
                  ? "bg-cyan-500/15 text-cyan-300"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title="Toggle Text Highlight Boxes"
            >
              {showTextHighlights ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden xl:inline">Text Boxes</span>
            </button>

            {currentDetectedTexts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleConvertAllPageTextToEditable}
                className="h-7 px-2 text-[11px] text-cyan-300 hover:bg-cyan-500/15 flex items-center space-x-1"
                title="Convert all text blocks on this page to editable boxes"
              >
                <Wand2 className="h-3 w-3" />
                <span>Make All Editable</span>
              </Button>
            )}

            {currentDetectedTexts.length === 0 && !isLoadingPdf && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRunOcrOnPage}
                disabled={isOcrRunning}
                className="h-7 px-2 text-[11px] text-amber-300 hover:bg-amber-500/15 flex items-center space-x-1"
                title="Run OCR to detect text from scanned image"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>{isOcrRunning ? `OCR ${ocrProgress}%` : "OCR Text"}</span>
              </Button>
            )}
          </div>

          {selectedElement?.type === "text" ? (
            <div className="flex items-center space-x-2 bg-[var(--surface)] p-1 rounded border border-[var(--border)]">
              {/* Font Family */}
              <select
                value={selectedElement.fontFamily || "Helvetica"}
                onChange={(e) => {
                  const val = e.target.value;
                  setElements((prev) =>
                    prev.map((el) => (el.id === selectedElement.id ? { ...el, fontFamily: val } : el))
                  );
                }}
                className="h-7 text-xs bg-[var(--surface-elevated)] border border-[var(--border)] rounded px-1.5 text-[var(--foreground)]"
              >
                <option value="Helvetica">Sans-Serif (Helvetica)</option>
                <option value="TimesRoman">Serif (Times)</option>
                <option value="Courier">Monospace (Courier)</option>
              </select>

              {/* Font Size */}
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="8"
                  max="96"
                  value={selectedElement.fontSize || 14}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 14;
                    setElements((prev) =>
                      prev.map((el) => (el.id === selectedElement.id ? { ...el, fontSize: val } : el))
                    );
                  }}
                  className="w-12 h-7 text-xs bg-[var(--surface-elevated)] border border-[var(--border)] rounded px-1 text-center text-[var(--foreground)]"
                />
                <span className="text-[10px] text-[var(--muted-foreground)]">pt</span>
              </div>

              {/* Bold / Italic / Align */}
              <div className="flex items-center border border-[var(--border)] rounded bg-[var(--surface-elevated)]">
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === selectedElement.id ? { ...el, isBold: !el.isBold } : el
                      )
                    );
                  }}
                  className={`p-1 rounded ${
                    selectedElement.isBold
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  title="Bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === selectedElement.id ? { ...el, isItalic: !el.isItalic } : el
                      )
                    );
                  }}
                  className={`p-1 rounded ${
                    selectedElement.isItalic
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  title="Italic"
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === selectedElement.id ? { ...el, textAlign: "left" } : el
                      )
                    );
                  }}
                  className={`p-1 rounded ${
                    selectedElement.textAlign === "left" || !selectedElement.textAlign
                      ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === selectedElement.id ? { ...el, textAlign: "center" } : el
                      )
                    );
                  }}
                  className={`p-1 rounded ${
                    selectedElement.textAlign === "center"
                      ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setElements((prev) =>
                      prev.map((el) =>
                        el.id === selectedElement.id ? { ...el, textAlign: "right" } : el
                      )
                    );
                  }}
                  className={`p-1 rounded ${
                    selectedElement.textAlign === "right"
                      ? "bg-[var(--surface-hover)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Text Color */}
              <input
                type="color"
                value={selectedElement.color || "#000000"}
                onChange={(e) => {
                  const val = e.target.value;
                  setElements((prev) =>
                    prev.map((el) => (el.id === selectedElement.id ? { ...el, color: val } : el))
                  );
                }}
                className="h-6 w-6 rounded cursor-pointer border border-[var(--border)] p-0 bg-transparent"
                title="Text Color"
              />

              {/* Delete Button */}
              <button
                onClick={() => {
                  const next = elements.filter((el) => el.id !== selectedElement.id);
                  setElements(next);
                  setSelectedElementId(null);
                  pushHistory(next, pages);
                }}
                className="p-1 text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer"
                title="Delete Text Box"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : selectedElement?.type === "image" ? (
            <div className="flex items-center space-x-2 bg-[var(--surface)] p-1 rounded border border-[var(--border)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => replaceImageInputRef.current?.click()}
                className="h-7 text-xs px-2 flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                <span>Change Picture</span>
              </Button>

              <div className="flex items-center space-x-1 text-[11px] text-[var(--muted-foreground)] px-2">
                <span>Opacity:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={selectedElement.opacity ?? 1.0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setElements((prev) =>
                      prev.map((el) => (el.id === selectedElement.id ? { ...el, opacity: val } : el))
                    );
                  }}
                  className="w-16 h-1 cursor-pointer accent-[var(--accent)]"
                />
              </div>

              <button
                onClick={() => {
                  const next = elements.filter((el) => el.id !== selectedElement.id);
                  setElements(next);
                  setSelectedElementId(null);
                  pushHistory(next, pages);
                }}
                className="p-1 text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer"
                title="Delete Picture"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : selectedElement ? (
            <div className="flex items-center space-x-2 bg-[var(--surface)] p-1 rounded border border-[var(--border)]">
              <span className="text-[11px] text-[var(--muted-foreground)] capitalize">
                {selectedElement.type} Selected
              </span>
              <button
                onClick={() => {
                  const next = elements.filter((el) => el.id !== selectedElement.id);
                  setElements(next);
                  setSelectedElementId(null);
                  pushHistory(next, pages);
                }}
                className="p-1 text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer"
                title="Delete Element"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[var(--muted-foreground)]">Tool Color:</span>
              <div className="flex items-center space-x-1">
                {PRESET_COLORS.slice(0, 5).map((col) => (
                  <button
                    key={col}
                    onClick={() => setActiveColor(col)}
                    style={{ backgroundColor: col }}
                    className={`h-4 w-4 rounded-full border cursor-pointer ${
                      activeColor === col
                        ? "border-[var(--accent)] ring-1 ring-[var(--accent)] scale-110"
                        : "border-[var(--border)]"
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="h-5 w-5 rounded cursor-pointer border border-[var(--border)] p-0 bg-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Studio Viewport (Sidebar + Centered Document Page) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Page Thumbnails Sidebar */}
        <aside className="w-48 sm:w-56 border-r border-[var(--border)] bg-[var(--surface)] p-3 overflow-y-auto shrink-0 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] pb-1 border-b border-[var(--border)]">
              <span>Pages ({pages.length})</span>
              <button
                onClick={handleAddBlankPage}
                className="p-1 rounded text-[var(--accent)] hover:bg-[var(--accent)]/15 cursor-pointer"
                title="Add Blank Page"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3 pr-1">
              {pages.map((p, idx) => {
                const isCurrent = idx === currentPageIndex;
                const pageElemCount = elements.filter((el) => el.pageIndex === idx).length;
                const pageDetectedCount = (detectedTextMap[idx] || []).filter(
                  (t) => !t.isEdited
                ).length;

                return (
                  <div
                    key={`${p.pageNumber}-${idx}`}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`group relative flex flex-col items-center rounded-[var(--radius-sm)] border p-2 cursor-pointer transition-all ${
                      isCurrent
                        ? "border-[var(--accent)] bg-[var(--surface-elevated)] ring-2 ring-[var(--accent)]/30"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    {/* Thumbnail preview */}
                    <div className="relative w-full h-32 flex items-center justify-center bg-white rounded border border-[var(--border)] overflow-hidden shadow-xs">
                      {p.renderedDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.renderedDataUrl}
                          alt={`Page ${idx + 1}`}
                          className="h-full w-full object-contain pointer-events-none"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                          <FileText className="h-6 w-6 text-gray-400" />
                          <span className="text-[10px] text-gray-500 font-mono">Blank Page</span>
                        </div>
                      )}

                      {pageElemCount > 0 && (
                        <span className="absolute bottom-1 right-1 bg-[var(--accent)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                          +{pageElemCount}
                        </span>
                      )}

                      {pageDetectedCount > 0 && pageElemCount === 0 && (
                        <span className="absolute bottom-1 left-1 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[8px] px-1 py-0.2 rounded font-mono">
                          {pageDetectedCount} txt
                        </span>
                      )}
                    </div>

                    {/* Page Actions Footer */}
                    <div className="w-full flex items-center justify-between pt-1.5 text-xs text-[var(--muted-foreground)]">
                      <span
                        className={`font-mono text-[11px] ${
                          isCurrent ? "font-bold text-[var(--accent)]" : ""
                        }`}
                      >
                        P. {idx + 1}
                      </span>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicatePage(idx);
                          }}
                          className="p-1 hover:text-[var(--foreground)] rounded hover:bg-[var(--surface-hover)] cursor-pointer"
                          title="Duplicate Page"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(idx);
                          }}
                          disabled={pages.length <= 1}
                          className="p-1 hover:text-rose-400 rounded hover:bg-rose-500/15 disabled:opacity-30 cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--border)]">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddBlankPage}
              className="w-full text-xs flex items-center justify-center space-x-1"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Blank Page</span>
            </Button>
          </div>
        </aside>

        {/* Center Canvas Workspace */}
        <main className="flex-1 bg-[#121212] overflow-auto flex items-center justify-center p-6 md:p-12 relative select-none">
          {isLoadingPdf ? (
            <div className="text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-[var(--accent)] animate-spin mx-auto" />
              <p className="text-sm font-medium">{loadingStatus}</p>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: "center center",
                transition: "transform 150ms cubic-bezier(0.2, 0, 0, 1)",
              }}
              className="relative shadow-2xl rounded-sm transition-all"
            >
              {/* Document Page Canvas Container */}
              <div
                ref={pageContainerRef}
                style={{
                  width: `${currentPage.width}px`,
                  height: `${currentPage.height}px`,
                }}
                onMouseDown={handlePageMouseDown}
                onMouseMove={handlePageMouseMove}
                onMouseUp={handlePageMouseUp}
                className={`relative bg-white shadow-2xl overflow-hidden cursor-${
                  activeTool === "select"
                    ? "default"
                    : activeTool === "text"
                    ? "text"
                    : activeTool === "whiteout" ||
                      activeTool === "rectangle" ||
                      activeTool === "circle" ||
                      activeTool === "pen" ||
                      activeTool === "highlighter"
                    ? "crosshair"
                    : "default"
                }`}
              >
                {/* 1. Underlying Real PDF Page Render */}
                {currentPage.renderedDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentPage.renderedDataUrl}
                    alt={`Page ${currentPageIndex + 1}`}
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-white" />
                )}

                {/* 2. Detected Original PDF Text Layer (Click to Edit Directly!) */}
                {showTextHighlights &&
                  (activeTool === "select" || activeTool === "edit-existing") &&
                  currentDetectedTexts.map((textItem) => {
                    const isHovered = hoveredTextId === textItem.id;
                    const isDirectEditMode = activeTool === "edit-existing";

                    return (
                      <div
                        key={textItem.id}
                        style={{
                          left: `${textItem.x}px`,
                          top: `${textItem.y}px`,
                          width: `${textItem.width}px`,
                          height: `${textItem.height}px`,
                        }}
                        onMouseEnter={() => setHoveredTextId(textItem.id)}
                        onMouseLeave={() => setHoveredTextId(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOriginalText(textItem);
                        }}
                        className={`absolute rounded transition-all cursor-pointer z-15 ${
                          isHovered || isDirectEditMode
                            ? "bg-cyan-500/20 border border-cyan-400 shadow-xs ring-1 ring-cyan-400/40"
                            : "bg-cyan-400/5 hover:bg-cyan-400/15 border border-transparent hover:border-cyan-300/40"
                        }`}
                        title="Click to edit this text"
                      >
                        {isHovered && (
                          <div className="absolute -top-6 left-0 bg-cyan-900 text-cyan-200 border border-cyan-500/40 text-[9px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none flex items-center space-x-1">
                            <span>✏️ Click to Edit Text</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* 3. Dragging preview box (for whiteout or shapes) */}
                {isDraggingBox && dragCurrentBox && (
                  <div
                    style={{
                      left: `${dragCurrentBox.x}px`,
                      top: `${dragCurrentBox.y}px`,
                      width: `${dragCurrentBox.width}px`,
                      height: `${dragCurrentBox.height}px`,
                    }}
                    className={`absolute border-2 pointer-events-none z-30 ${
                      activeTool === "whiteout"
                        ? "bg-white/90 border-amber-500 shadow-sm"
                        : "border-blue-500 bg-blue-500/20"
                    }`}
                  />
                )}

                {/* 4. Live Drawing Stroke Preview */}
                {isDrawing && currentDrawPoints.length > 1 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                    <polyline
                      fill="none"
                      stroke={activeColor}
                      strokeWidth={activeTool === "highlighter" ? 14 : activeStrokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={activeTool === "highlighter" ? 0.45 : 1.0}
                      points={currentDrawPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    />
                  </svg>
                )}

                {/* 5. Rendered Annotations & Editable Elements on Current Page */}
                {elements
                  .filter((el) => el.pageIndex === currentPageIndex)
                  .map((el) => {
                    const isSelected = el.id === selectedElementId;

                    return (
                      <div
                        key={el.id}
                        style={{
                          left: `${el.x}px`,
                          top: `${el.y}px`,
                          width: `${el.width}px`,
                          height: `${el.height}px`,
                          opacity: el.opacity ?? 1.0,
                        }}
                        onMouseDown={(e) => startMove(e, el)}
                        className={`absolute select-none cursor-move ${
                          isSelected
                            ? "ring-2 ring-blue-500 ring-offset-1 z-20"
                            : "hover:ring-1 hover:ring-blue-400/50 z-10"
                        }`}
                      >
                        {/* Whiteout Box */}
                        {el.type === "whiteout" && (
                          <div
                            style={{ backgroundColor: el.backgroundColor || "#ffffff" }}
                            className="w-full h-full border border-gray-100 shadow-2xs"
                            title="Whiteout Mask"
                          />
                        )}

                        {/* Editable Live Text Box */}
                        {el.type === "text" && (
                          <div
                            onDoubleClick={() => setEditingTextId(el.id)}
                            style={{
                              fontSize: `${el.fontSize || 14}px`,
                              fontFamily: el.fontFamily || "Helvetica",
                              color: el.color || "#000000",
                              fontWeight: el.isBold ? "bold" : "normal",
                              fontStyle: el.isItalic ? "italic" : "normal",
                              textAlign: el.textAlign || "left",
                              backgroundColor: el.backgroundColor || "transparent",
                            }}
                            className="w-full h-full p-0.5 whitespace-pre-wrap leading-tight overflow-hidden break-words"
                          >
                            {editingTextId === el.id ? (
                              <textarea
                                autoFocus
                                value={el.text || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setElements((prev) =>
                                    prev.map((item) =>
                                      item.id === el.id ? { ...item, text: val } : item
                                    )
                                  );
                                }}
                                onBlur={() => {
                                  setEditingTextId(null);
                                  pushHistory(elements, pages);
                                }}
                                className="w-full h-full resize-none bg-white/95 text-black border border-blue-500 rounded p-1 outline-none shadow-sm font-sans"
                              />
                            ) : (
                              el.text || ""
                            )}
                          </div>
                        )}

                        {/* Image Attachment */}
                        {el.type === "image" && el.dataUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={el.dataUrl}
                            alt="Document Attachment"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        )}

                        {/* Signature */}
                        {el.type === "signature" && el.dataUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={el.dataUrl}
                            alt="Signature"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        )}

                        {/* Stamp */}
                        {el.type === "stamp" && (
                          <div
                            style={{ borderColor: el.color || "#dc2626" }}
                            className="w-full h-full border-3 rounded-md flex items-center justify-center p-1.5 shadow-xs"
                          >
                            <span
                              style={{ color: el.color || "#dc2626" }}
                              className="font-bold tracking-wider text-xs md:text-sm uppercase text-center"
                            >
                              {el.stampText}
                            </span>
                          </div>
                        )}

                        {/* Shapes */}
                        {el.type === "shape" && (
                          <div className="w-full h-full">
                            {el.shapeType === "rectangle" && (
                              <div
                                style={{
                                  borderColor: el.strokeColor || "#000000",
                                  borderWidth: `${el.strokeWidth || 2}px`,
                                  backgroundColor: el.fillColor || "transparent",
                                }}
                                className="w-full h-full"
                              />
                            )}
                            {el.shapeType === "circle" && (
                              <div
                                style={{
                                  borderColor: el.strokeColor || "#000000",
                                  borderWidth: `${el.strokeWidth || 2}px`,
                                  backgroundColor: el.fillColor || "transparent",
                                }}
                                className="w-full h-full rounded-full"
                              />
                            )}
                          </div>
                        )}

                        {/* Drawings */}
                        {el.type === "drawing" && el.points && (
                          <svg className="w-full h-full overflow-visible pointer-events-none">
                            <polyline
                              fill="none"
                              stroke={el.color || "#000000"}
                              strokeWidth={el.strokeWidth || 3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={el.points
                                .map((p) => `${p.x - el.x},${p.y - el.y}`)
                                .join(" ")}
                            />
                          </svg>
                        )}

                        {/* Transform & Resize Corner Handles when Selected */}
                        {isSelected && (
                          <>
                            <div
                              onMouseDown={(e) => startResize(e, el, "nw")}
                              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize z-30 shadow-xs"
                            />
                            <div
                              onMouseDown={(e) => startResize(e, el, "ne")}
                              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize z-30 shadow-xs"
                            />
                            <div
                              onMouseDown={(e) => startResize(e, el, "sw")}
                              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize z-30 shadow-xs"
                            />
                            <div
                              onMouseDown={(e) => startResize(e, el, "se")}
                              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white cursor-se-resize z-30 shadow-xs"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Page Navigation Bar */}
      <footer className="flex items-center justify-between px-6 py-2 border-t border-[var(--border)] bg-[var(--surface)] text-xs z-30 shrink-0">
        <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
          <span>Mode:</span>
          <span className="font-semibold uppercase text-[var(--foreground)]">{activeTool}</span>
          <span>·</span>
          <span className="text-cyan-400 font-medium">Click any text on the page to edit directly</span>
          <span>·</span>
          <span>Press Ctrl+F to Find & Replace</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPageIndex <= 0}
            onClick={() => setCurrentPageIndex((idx) => Math.max(0, idx - 1))}
            className="h-7 px-2"
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
          </Button>

          <span className="font-mono text-xs px-2 text-[var(--foreground)] font-medium">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentPageIndex >= pages.length - 1}
            onClick={() => setCurrentPageIndex((idx) => Math.min(pages.length - 1, idx + 1))}
            className="h-7 px-2"
          >
            Next <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      </footer>

      {/* Hidden File Inputs for Picture Upload & Picture Replacement */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        ref={replaceImageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleReplaceImageFileChange}
        className="hidden"
      />

      {/* Find & Replace Modal */}
      {showFindReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 bg-[var(--surface)] border-[var(--border)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-base">Find & Replace Text</h3>
              </div>
              <button
                onClick={() => {
                  setShowFindReplaceModal(false);
                  setReplaceStatusMsg(null);
                }}
                className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Find text:</label>
                <Input
                  type="text"
                  value={findQuery}
                  onChange={(e) => {
                    setFindQuery(e.target.value);
                    setReplaceStatusMsg(null);
                  }}
                  placeholder="Enter word or phrase to find..."
                  className="text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Replace with:</label>
                <Input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => {
                    setReplaceQuery(e.target.value);
                    setReplaceStatusMsg(null);
                  }}
                  placeholder="Enter replacement text..."
                  className="text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <label className="flex items-center space-x-2 text-xs text-[var(--muted-foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="rounded border-[var(--border)]"
                  />
                  <span>Match case sensitive</span>
                </label>
              </div>

              {replaceStatusMsg && (
                <div className="p-2 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-center font-medium text-cyan-300">
                  {replaceStatusMsg}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowFindReplaceModal(false);
                  setReplaceStatusMsg(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteReplaceAll}
                disabled={!findQuery.trim()}
                className="flex items-center space-x-1"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Replace All Occurrences</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Signature Modal */}
      {showSigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 bg-[var(--surface)] border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-semibold text-base">Create Signature</h3>
              <button
                onClick={() => setShowSigModal(false)}
                className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex border-b border-[var(--border)] space-x-4 text-xs font-medium">
              <button
                onClick={() => setSigTypeTab("draw")}
                className={`pb-2 border-b-2 ${
                  sigTypeTab === "draw"
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--muted-foreground)]"
                }`}
              >
                Draw Signature
              </button>
              <button
                onClick={() => setSigTypeTab("type")}
                className={`pb-2 border-b-2 ${
                  sigTypeTab === "type"
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--muted-foreground)]"
                }`}
              >
                Type Signature
              </button>
            </div>

            {sigTypeTab === "draw" ? (
              <div className="space-y-3">
                <div className="border border-[var(--border)] rounded-md bg-white">
                  <canvas
                    ref={sigCanvasRef}
                    width={400}
                    height={150}
                    onMouseDown={handleSigMouseDown}
                    className="w-full h-36 cursor-crosshair touch-none"
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <button
                    onClick={() => {
                      const canvas = sigCanvasRef.current;
                      if (!canvas) return;
                      const ctx = canvas.getContext("2d");
                      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline"
                  >
                    Clear Canvas
                  </button>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    Sign using mouse or stylus
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="text"
                  value={typedSigText}
                  onChange={(e) => setTypedSigText(e.target.value)}
                  placeholder="Enter your name..."
                  className="text-sm"
                />
                <div className="border border-[var(--border)] rounded-md bg-white p-6 text-center">
                  <p className="font-serif italic text-3xl text-gray-900">
                    {typedSigText || "Your Name"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border)]">
              <Button variant="ghost" size="sm" onClick={() => setShowSigModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveSignature}>
                Insert Signature
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stamp Selector Modal */}
      {showStampModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-sm p-6 space-y-4 bg-[var(--surface)] border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-semibold text-base">Select Document Stamp</h3>
              <button
                onClick={() => setShowStampModal(false)}
                className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
              {PRESET_STAMPS.map((stamp) => (
                <button
                  key={stamp.text}
                  onClick={() => handleAddStamp(stamp)}
                  style={{ borderColor: stamp.color, color: stamp.color }}
                  className="p-3 border-2 rounded-md font-bold text-xs uppercase tracking-wider text-center hover:scale-105 transition-transform bg-white/5 cursor-pointer"
                >
                  {stamp.text}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--border)]">
              <Button variant="ghost" size="sm" onClick={() => setShowStampModal(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
