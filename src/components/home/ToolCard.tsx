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
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Tool } from "@/lib/tools-data";

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

const NOTION_PASTEL_CATEGORIES: Record<
  string,
  { bg: string; text: string; border: string; chipBg: string }
> = {
  essentials: {
    bg: "bg-[rgba(59,130,246,0.12)]",
    text: "text-blue-400",
    border: "border-blue-500/25",
    chipBg: "bg-blue-500/10 text-blue-300",
  },
  "edit-organize": {
    bg: "bg-[rgba(86,69,212,0.14)]",
    text: "text-[#a78bfa]",
    border: "border-[#8b5cf6]/30",
    chipBg: "bg-[#5645d4]/15 text-[#c4b5fd]",
  },
  "security-privacy": {
    bg: "bg-[rgba(34,197,94,0.12)]",
    text: "text-emerald-400",
    border: "border-emerald-500/25",
    chipBg: "bg-emerald-500/10 text-emerald-300",
  },
  "convert-export": {
    bg: "bg-[rgba(6,182,212,0.12)]",
    text: "text-cyan-400",
    border: "border-cyan-500/25",
    chipBg: "bg-cyan-500/10 text-cyan-300",
  },
  "scan-share": {
    bg: "bg-[rgba(234,179,8,0.12)]",
    text: "text-amber-400",
    border: "border-amber-500/25",
    chipBg: "bg-amber-500/10 text-amber-300",
  },
  business: {
    bg: "bg-[rgba(244,63,94,0.12)]",
    text: "text-rose-400",
    border: "border-rose-500/25",
    chipBg: "bg-rose-500/10 text-rose-300",
  },
};

export function ToolCard({ tool }: { tool: Tool }) {
  const IconComponent = ICON_MAP[tool.icon] || HelpCircle;
  const style = NOTION_PASTEL_CATEGORIES[tool.category] || NOTION_PASTEL_CATEGORIES.essentials;

  return (
    <Link href={`/${tool.slug}`} className="block group h-full">
      <div className="h-full flex flex-col justify-between p-5 rounded-[14px] bg-[#202020] border border-white/[0.08] hover:border-[#5645d4]/50 hover:bg-[#252525] transition-all duration-200 hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5 relative">
        <div>
          <div className="flex items-center justify-between mb-3.5">
            {/* Notion Style Icon Chip */}
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${style.bg} ${style.text} border ${style.border} group-hover:scale-105 transition-transform`}
            >
              <IconComponent className="h-4.5 w-4.5 stroke-[1.8]" />
            </div>

            {/* Badges */}
            <div className="flex items-center space-x-1.5">
              {tool.popular && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#5645d4]/20 text-[#c4b5fd] border border-[#5645d4]/30">
                  <Sparkles className="h-2.5 w-2.5 text-[#a78bfa]" />
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

          <h3 className="text-sm sm:text-base font-bold text-[var(--foreground)] group-hover:text-[#a78bfa] transition-colors mb-1.5 flex items-center justify-between">
            <span className="truncate">{tool.name}</span>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
          </h3>

          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[var(--subtle-foreground)]">
          <span className="capitalize font-mono text-[10px]">{tool.category.replace("-", " ")}</span>
          <span className="text-[#a78bfa] font-medium text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
            Open tool →
          </span>
        </div>
      </div>
    </Link>
  );
}
