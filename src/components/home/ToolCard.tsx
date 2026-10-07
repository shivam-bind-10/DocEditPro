"use client";

import Link from "next/link";
import {
  Combine,
  Minimize2,
  Scissors,
  FileImage,
  FileText,
  FileCode,
  Images,
  PenTool,
  LayoutGrid,
  RotateCw,
  Crop,
  Stamp,
  Hash,
  PanelTop,
  FileSpreadsheet,
  ScanText,
  Lock,
  Unlock,
  EyeOff,
  Layers,
  ShieldCheck,
  FilePlus,
  FileCode2,
  Code,
  Table,
  FileDigit,
  Presentation,
  Tv2,
  Sheet,
  Globe,
  BookOpen,
  BookMarked,
  Volume2,
  Mic,
  FolderArchive,
  Moon,
  Camera,
  Share2,
  Users,
  Receipt,
  Printer,
  Fingerprint,
  GitCompare,
  Wrench,
  HelpCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Tool } from "@/lib/tools-data";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ElementType> = {
  Combine,
  Minimize2,
  Scissors,
  FileImage,
  FileText,
  FileCode,
  Images,
  PenTool,
  LayoutGrid,
  RotateCw,
  Crop,
  Stamp,
  Hash,
  PanelTop,
  FileSpreadsheet,
  ScanText,
  Lock,
  Unlock,
  EyeOff,
  Layers,
  ShieldCheck,
  FilePlus,
  FileCode2,
  Code,
  Table,
  FileDigit,
  Presentation,
  Tv2,
  Sheet,
  Globe,
  BookOpen,
  BookMarked,
  Volume2,
  Mic,
  FolderArchive,
  Moon,
  Camera,
  Share2,
  Users,
  Receipt,
  Printer,
  Fingerprint,
  GitCompare,
  Wrench,
};

const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; glow: string; border: string }
> = {
  essentials: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    glow: "group-hover:shadow-blue-500/20",
    border: "group-hover:border-blue-500/40",
  },
  "edit-organize": {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    glow: "group-hover:shadow-purple-500/20",
    border: "group-hover:border-purple-500/40",
  },
  "security-privacy": {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    glow: "group-hover:shadow-emerald-500/20",
    border: "group-hover:border-emerald-500/40",
  },
  "convert-export": {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    glow: "group-hover:shadow-cyan-500/20",
    border: "group-hover:border-cyan-500/40",
  },
  "scan-share": {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    glow: "group-hover:shadow-amber-500/20",
    border: "group-hover:border-amber-500/40",
  },
  business: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    glow: "group-hover:shadow-rose-500/20",
    border: "group-hover:border-rose-500/40",
  },
};

export function ToolCard({ tool }: { tool: Tool }) {
  const IconComponent = ICON_MAP[tool.icon] || HelpCircle;
  const style = CATEGORY_STYLES[tool.category] || CATEGORY_STYLES.essentials;

  return (
    <Link href={`/${tool.slug}`} className="block group h-full">
      <div
        className={`h-full flex flex-col justify-between p-5 rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border)] backdrop-blur-md transition-all duration-300 ${style.border} ${style.glow} hover:shadow-xl hover:-translate-y-1 relative overflow-hidden`}
      >
        {/* Top Glowing Edge on hover */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-blue-400/40 transition-opacity" />

        <div>
          <div className="flex items-center justify-between mb-3.5">
            {/* Bento Icon Badge */}
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${style.bg} ${style.text} border border-white/[0.06] group-hover:scale-110 group-hover:rotate-1 transition-transform duration-300 shadow-sm`}
            >
              <IconComponent className="h-5 w-5 stroke-[1.8]" />
            </div>

            {/* Badges */}
            <div className="flex items-center space-x-1.5">
              {tool.popular && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-xs">
                  <Sparkles className="h-2.5 w-2.5 text-blue-400" />
                  <span>Popular</span>
                </span>
              )}
              {tool.new && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  New
                </span>
              )}
            </div>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors mb-1.5 flex items-center justify-between">
            <span className="truncate">{tool.name}</span>
            <ArrowUpRight className="h-4 w-4 text-[var(--subtle-foreground)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1" />
          </h3>

          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[var(--subtle-foreground)]">
          <span className="capitalize font-mono text-[10px]">{tool.category.replace("-", " ")}</span>
          <span className="text-[var(--accent)] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-0.5">
            <span>Use tool</span>
            <span>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
