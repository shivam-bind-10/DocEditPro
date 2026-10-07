"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Shield,
  Zap,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  PenTool,
  Minimize2,
  Combine,
  ScanText,
  Share2,
  FileSpreadsheet,
  FileText,
  Clock,
  Layers,
  Check,
  Eye,
  Sliders,
  Cpu,
  BookOpen,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES, TOOLS } from "@/lib/tools-data";
import { ToolCard } from "@/components/home/ToolCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filteredTools = React.useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white">
      <Header />

      <main className="flex-1 space-y-16 pb-20">
        {/* Hero Section */}
        <section className="relative pt-12 pb-6 px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Bento Pill Badge */}
            <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-bento-pulse" />
              <span>Bento 2.0 · 100% Client-Side Architecture</span>
              <span className="text-white/30">|</span>
              <span className="text-blue-300">No Server Uploads</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl text-[var(--foreground)] leading-[1.1]">
              Every PDF Tool You Need. <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                100% Private In Your Browser.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base text-[var(--muted-foreground)] leading-relaxed">
              Edit text on real PDFs, compress files, convert between 15+ formats, merge, redact, and sign. All processing happens locally using WebAssembly with zero data sent to external servers.
            </p>

            {/* Search Bar Bento Container */}
            <div className="mx-auto max-w-2xl pt-2">
              <div className="relative rounded-[var(--radius-lg)] bg-[var(--surface-card)] border border-[var(--border)] p-1.5 shadow-xl backdrop-blur-md hover:border-[var(--border-hover)] transition-all">
                <div className="flex items-center px-3">
                  <Search className="h-5 w-5 text-blue-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    placeholder="Search all 44 tools (e.g., Edit Text, Compress, Merge, OCR, Word to PDF)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-[var(--muted-foreground)] hover:text-white px-2 py-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Filter Tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-xs">
                <span className="text-[var(--subtle-foreground)] text-[11px] mr-1">Trending:</span>
                <Link
                  href="/pdf-editor"
                  className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  ✏️ PDF Editor (Edit Text)
                </Link>
                <Link
                  href="/compress-pdf"
                  className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white hover:border-[var(--border-hover)] transition-colors"
                >
                  📉 Compress PDF
                </Link>
                <Link
                  href="/merge-pdf"
                  className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white hover:border-[var(--border-hover)] transition-colors"
                >
                  🔀 Merge PDF
                </Link>
                <Link
                  href="/ocr-pdf"
                  className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white hover:border-[var(--border-hover)] transition-colors"
                >
                  🔍 OCR Scan
                </Link>
                <Link
                  href="/word-to-pdf"
                  className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-white hover:border-[var(--border-hover)] transition-colors"
                >
                  📄 Word to PDF
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 🍱 Bento 2.0 Showcase Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Featured Highlights
              </h2>
            </div>
            <span className="text-xs text-[var(--subtle-foreground)] font-mono">BENTO ENGINE v2.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Bento Card 1: Interactive PDF Studio (Span 2 cols on lg) */}
            <div className="md:col-span-2 lg:col-span-2 bento-card p-6 sm:p-8 flex flex-col justify-between group">
              <div className="bento-glow" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span>Interactive Studio</span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--subtle-foreground)]">
                    Direct Text Editing
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                    Edit Already-Written Text in Any PDF
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
                    Click directly on existing text to modify words, rewrite paragraphs, fix typos, change font styles, and replace pictures with zero layout distortion.
                  </p>
                </div>

                {/* Simulated Live Studio Canvas Widget */}
                <div className="relative rounded-xl border border-white/[0.08] bg-[#09090e] p-4 overflow-hidden shadow-2xl">
                  {/* Studio Mini Header Bar */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-[11px] text-[var(--muted-foreground)]">
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                      <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                      <span className="font-mono text-white/80 ml-1.5">agreement_draft_v2.pdf</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/5 px-2 py-0.5 rounded text-[10px] text-cyan-300 border border-cyan-500/20">
                      <span>✏️ Live Edit Active</span>
                    </div>
                  </div>

                  {/* Document Paper Preview */}
                  <div className="bg-white rounded-lg p-4 text-black text-xs space-y-2.5 shadow-inner select-none font-sans">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 border-b border-gray-200 pb-1 font-mono">
                      <span>CONFIDENTIAL DOCUMENT</span>
                      <span>PAGE 1 OF 3</span>
                    </div>
                    <div className="font-bold text-sm text-gray-900">
                      Master Consulting Agreement
                    </div>
                    <div className="text-[11px] text-gray-700 leading-relaxed">
                      This Agreement is entered into by and between the parties for professional services.
                    </div>
                    {/* Live Edited Box Highlight */}
                    <div className="p-1.5 rounded bg-blue-50 border-2 border-blue-500 text-blue-900 font-medium text-xs flex items-center justify-between shadow-xs">
                      <span>Effective Date: October 7, 2026</span>
                      <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono">
                        Editable
                      </span>
                    </div>
                  </div>

                  {/* Floating Action Pills */}
                  <div className="flex items-center justify-between pt-3 text-[10px] text-[var(--muted-foreground)]">
                    <div className="flex items-center space-x-1.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Helvetica / 14pt</span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">OCR Support</span>
                    </div>
                    <span className="text-cyan-400 font-medium">Ctrl+F Find & Replace</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/pdf-editor" className="inline-block w-full">
                  <Button variant="primary" size="lg" className="w-full font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25">
                    <PenTool className="h-4 w-4" />
                    <span>Open PDF Editor Studio</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bento Card 2: 100% Client-Side Privacy Vault */}
            <div className="bento-card p-6 flex flex-col justify-between group">
              <div className="bento-glow" />
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Zero-Knowledge Sandbox
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    All file bytes stay confined to your device. No cloud storage, no training datasets, no remote logs.
                  </p>
                </div>

                {/* Radar Status Dial */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--muted-foreground)]">Network Activity:</span>
                    <span className="text-emerald-400 font-mono font-bold">0 KB Transferred</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--muted-foreground)]">Processing Core:</span>
                    <span className="text-white font-mono">WebAssembly</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-full rounded-full" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/privacy-scanner" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-between">
                  <span>Run Privacy Scanner</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 3: Intelligent Compression */}
            <div className="bento-card p-6 flex flex-col justify-between group">
              <div className="bento-glow" />
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <Minimize2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    Smart File Compression
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    Shrink massive PDF files for email attachments and portals while keeping crisp text sharpness.
                  </p>
                </div>

                {/* Compression Metric Box */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Average Reduction</div>
                    <div className="text-2xl font-black text-blue-400 font-mono">-78%</div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-[var(--subtle-foreground)]">
                    <div>18.4 MB ➔ 3.9 MB</div>
                    <div className="text-emerald-400 text-[10px]">Lossless Mode</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/compress-pdf" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between">
                  <span>Compress Document</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 4: Algorithmic OCR Scanner */}
            <div className="bento-card p-6 flex flex-col justify-between group">
              <div className="bento-glow" />
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <ScanText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    Searchable OCR Engine
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    Turn scanned physical paper documents and receipts into selectable, searchable digital text.
                  </p>
                </div>

                {/* Scan Simulator */}
                <div className="relative h-16 rounded-xl bg-black/50 border border-white/[0.06] overflow-hidden p-2.5 flex flex-col justify-center">
                  <div className="absolute inset-x-0 h-0.5 bg-amber-400/80 shadow-[0_0_10px_#f59e0b] animate-bento-scan pointer-events-none" />
                  <div className="flex items-center space-x-2 text-[10px] text-amber-300 font-mono">
                    <span>[OCR EXTRACTED]</span>
                    <span className="text-white/80 truncate">INVOICE #9482 · $2,450.00</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/ocr-pdf" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-between">
                  <span>Run OCR Scan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 5: Fast Multi-File Merge & Split */}
            <div className="bento-card p-6 flex flex-col justify-between group">
              <div className="bento-glow" />
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Combine className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    Merge & Split Power
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    Drag, reorder, combine unlimited PDF files, or burst large documents into individual page sets.
                  </p>
                </div>

                {/* Document Stack Visual */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center space-x-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className="inline-block h-8 w-6 rounded border border-blue-400/50 bg-blue-500/20 shadow-xs" />
                    <div className="inline-block h-8 w-6 rounded border border-purple-400/50 bg-purple-500/20 shadow-xs" />
                    <div className="inline-block h-8 w-6 rounded border border-emerald-400/50 bg-emerald-500/20 shadow-xs" />
                  </div>
                  <span className="text-[11px] font-mono text-white/90">Unlimited Files</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/merge-pdf" className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center justify-between">
                  <span>Merge Files</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 6: P2P Share & Live Collaboration */}
            <div className="bento-card p-6 flex flex-col justify-between group">
              <div className="bento-glow" />
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    P2P Direct Transfer
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                    Transfer large confidential PDFs directly between devices using peer-to-peer WebRTC encryption.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-[11px]">
                  <span className="text-[var(--muted-foreground)]">Protocol:</span>
                  <span className="text-cyan-300 font-mono font-bold">Encrypted WebRTC</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/p2p-share" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-between">
                  <span>Start P2P Transfer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 🛠️ Complete Bento Tool Directory */}
        <section id="all-tools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
                All 44 PDF Tools
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Explore every utility in the complete privacy-first toolkit.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <Button
                variant={selectedCategory === "all" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="h-8 text-xs font-semibold"
              >
                All ({TOOLS.length})
              </Button>
              {CATEGORIES.map((cat) => {
                const count = TOOLS.filter((t) => t.category === cat.id).length;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="h-8 text-xs whitespace-nowrap"
                  >
                    {cat.name} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-16 space-y-3 bento-card p-8">
              <Search className="h-8 w-8 text-[var(--muted-foreground)] mx-auto" />
              <h3 className="text-lg font-bold">No tools found matching &quot;{searchQuery}&quot;</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Try searching for general keywords like &quot;merge&quot;, &quot;edit&quot;, &quot;convert&quot;, or &quot;security&quot;.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </section>

        {/* 📚 Bento Guides & Productivity Footer Strip */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bento-card p-8 bg-gradient-to-r from-blue-950/30 via-[var(--surface-card)] to-indigo-950/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                <span>Step-by-Step Tutorials</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Learn How to Edit, Convert, and Protect Documents
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] max-w-xl">
                Browse our comprehensive how-to articles covering Bates numbering, offline Word conversions, permanent redaction, and direct PDF text replacement.
              </p>
            </div>

            <Link href="/guides">
              <Button variant="outline" size="sm" className="whitespace-nowrap text-xs font-semibold px-4 h-9">
                <span>View All How-To Guides</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
