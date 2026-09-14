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
} from "lucide-react";
import { Tool } from "@/lib/tools-data";
import { Card } from "@/components/ui/card";
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

export function ToolCard({ tool }: { tool: Tool }) {
  const IconComponent = ICON_MAP[tool.icon] || HelpCircle;

  return (
    <Link href={`/${tool.slug}`} className="block group">
      <Card hoverable className="h-full flex flex-col justify-between p-5 border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-all duration-150">
        <div>
          <div className="flex items-center justify-between mb-3">
            {/* Icon Chip */}
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(59,130,246,0.12)] text-[var(--accent)] group-hover:scale-105 transition-transform">
              <IconComponent className="h-5 w-5 stroke-[1.75]" />
            </div>
            <div className="flex items-center space-x-1.5">
              {tool.popular && <Badge variant="accent">Popular</Badge>}
              {tool.new && <Badge variant="success">New</Badge>}
            </div>
          </div>

          <h3 className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors mb-1.5 flex items-center justify-between">
            <span>{tool.name}</span>
            <ArrowRight className="h-4 w-4 text-[var(--subtle-foreground)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
            {tool.description}
          </p>
        </div>
      </Card>
    </Link>
  );
}
