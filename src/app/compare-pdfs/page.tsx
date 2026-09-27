"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, GitCompare, ChevronUp, ChevronDown } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { diff_match_patch } from "diff-match-patch";

const tool = TOOLS.find((t) => t.id === "compare-pdfs")!;

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer } as any).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item: unknown) =>
          item && typeof item === "object" && "str" in item
            ? (item as { str: string }).str
            : ""
        )
        .join(" ") + "\n\n";
  }
  return text;
}

interface DiffSegment {
  op: -1 | 0 | 1; // delete, equal, insert
  text: string;
}

function computeDiff(textA: string, textB: string): DiffSegment[] {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(textA, textB);
  dmp.diff_cleanupSemantic(diffs);
  return diffs.map(([op, text]) => ({ op: op as -1 | 0 | 1, text }));
}

export default function ComparePdfsPage() {
  const [fileA, setFileA] = React.useState<File | null>(null);
  const [fileB, setFileB] = React.useState<File | null>(null);
  const [textA, setTextA] = React.useState<string>("");
  const [textB, setTextB] = React.useState<string>("");
  const [diffs, setDiffs] = React.useState<DiffSegment[] | null>(null);
  const [isComparing, setIsComparing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"side-by-side" | "unified">("unified");
  const [diffStats, setDiffStats] = React.useState({ added: 0, removed: 0, unchanged: 0 });

  const scrollARef = React.useRef<HTMLDivElement>(null);
  const scrollBRef = React.useRef<HTMLDivElement>(null);

  const syncScroll = (source: "a" | "b") => (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const target = source === "a" ? scrollBRef.current : scrollARef.current;
    if (target) {
      target.scrollTop = el.scrollTop;
    }
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;
    setIsComparing(true);
    try {
      const [tA, tB] = await Promise.all([extractPdfText(fileA), extractPdfText(fileB)]);
      setTextA(tA);
      setTextB(tB);
      const computed = computeDiff(tA, tB);
      setDiffs(computed);
      const added = computed.filter((d) => d.op === 1).reduce((acc, d) => acc + d.text.length, 0);
      const removed = computed.filter((d) => d.op === -1).reduce((acc, d) => acc + d.text.length, 0);
      const unchanged = computed.filter((d) => d.op === 0).reduce((acc, d) => acc + d.text.length, 0);
      setDiffStats({ added, removed, unchanged });
    } catch (err) {
      alert(`Comparison failed: ${(err as Error).message}`);
    } finally {
      setIsComparing(false);
    }
  };

  const handleReset = () => {
    setFileA(null);
    setFileB(null);
    setTextA("");
    setTextB("");
    setDiffs(null);
  };

  return (
    <ToolPageShell tool={tool}>
      <div className="space-y-6">
        {!diffs ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File A */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400">
                    A – Original
                  </span>
                </div>
                {!fileA ? (
                  <FileDropzone
                    onFilesSelected={(files) => files.length > 0 && setFileA(files[0])}
                    accept={[".pdf"]}
                    label="Drop original PDF"
                    helperText=""
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <FileText className="h-5 w-5 text-rose-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{fileA.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(fileA.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFileA(null)} className="ml-auto">
                      ×
                    </Button>
                  </div>
                )}
              </Card>

              {/* File B */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                    B – Modified
                  </span>
                </div>
                {!fileB ? (
                  <FileDropzone
                    onFilesSelected={(files) => files.length > 0 && setFileB(files[0])}
                    accept={[".pdf"]}
                    label="Drop modified PDF"
                    helperText=""
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)]">
                    <FileText className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{fileB.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(fileB.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFileB(null)} className="ml-auto">
                      ×
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleCompare}
              disabled={!fileA || !fileB || isComparing}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              {isComparing ? "Comparing..." : "Compare PDFs"}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <ChevronUp className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">{diffStats.added} chars added</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ChevronDown className="h-4 w-4 text-rose-400" />
                <span className="text-rose-400 font-medium">{diffStats.removed} chars removed</span>
              </div>
              <span className="text-[var(--muted-foreground)]">{diffStats.unchanged} chars unchanged</span>
              <div className="ml-auto flex gap-2">
                {(["unified", "side-by-side"] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "unified" ? "Unified" : "Side-by-Side"}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>

            {activeTab === "unified" ? (
              <Card className="p-0 overflow-hidden">
                <div className="h-[500px] overflow-y-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {diffs.map((seg, i) => {
                    if (seg.op === 0) {
                      return (
                        <span key={i} className="text-[var(--muted-foreground)]">
                          {seg.text}
                        </span>
                      );
                    } else if (seg.op === 1) {
                      return (
                        <span key={i} className="bg-emerald-500/20 text-emerald-300 rounded px-0.5">
                          {seg.text}
                        </span>
                      );
                    } else {
                      return (
                        <span key={i} className="bg-rose-500/20 text-rose-300 line-through rounded px-0.5">
                          {seg.text}
                        </span>
                      );
                    }
                  })}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-0 overflow-hidden">
                  <div className="px-3 py-2 border-b border-[var(--border)] text-xs font-semibold text-rose-400">
                    A – {fileA?.name}
                  </div>
                  <div
                    ref={scrollARef}
                    onScroll={syncScroll("a")}
                    className="h-[480px] overflow-y-auto p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
                  >
                    <span className="text-[var(--muted-foreground)]">{textA}</span>
                  </div>
                </Card>
                <Card className="p-0 overflow-hidden">
                  <div className="px-3 py-2 border-b border-[var(--border)] text-xs font-semibold text-emerald-400">
                    B – {fileB?.name}
                  </div>
                  <div
                    ref={scrollBRef}
                    onScroll={syncScroll("b")}
                    className="h-[480px] overflow-y-auto p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
                  >
                    <span className="text-[var(--muted-foreground)]">{textB}</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}
