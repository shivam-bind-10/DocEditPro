"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Shield,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
  PenTool,
  Minimize2,
  Combine,
  ScanText,
  Share2,
  BookOpen,
  FileText,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES, TOOLS } from "@/lib/tools-data";
import { ToolCard } from "@/components/home/ToolCard";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen flex-col bg-[#191919] text-[#ffffff] selection:bg-[#5645d4] selection:text-white font-sans">
      <Header />

      <main className="flex-1 space-y-16 pb-20">
        {/* 🏛️ Notion Style Hero Section with Deep Navy Accent */}
        <section className="relative pt-14 pb-8 px-4 sm:px-6 lg:px-8 text-center border-b border-white/[0.06]">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Notion Callout Pill */}
            <div className="inline-flex items-center space-x-2 rounded-full border border-[#5645d4]/40 bg-[#5645d4]/10 px-3.5 py-1 text-xs font-semibold text-[#c4b5fd] shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#a78bfa] animate-pulse" />
              <span>Notion Design System · 100% Client-Side Privacy</span>
              <span className="text-white/20">|</span>
              <span className="text-[#a78bfa]">Zero Cloud Uploads</span>
            </div>

            {/* Document Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white leading-[1.15]">
              Every PDF Tool You Need. <br />
              <span className="text-[#a78bfa]">
                Private. Local. Document-Native.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base text-[#9b9b9b] leading-relaxed">
              DocEditPro gives you 44 powerful PDF utilities with zero server file transfers. Edit text directly on real PDFs, compress files, convert between formats, merge, and sign — entirely in your browser via WebAssembly.
            </p>

            {/* Notion Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Link href="/pdf-editor">
                <Button variant="primary" size="lg" className="rounded-full px-6 font-semibold flex items-center space-x-2 shadow-lg shadow-[#5645d4]/25">
                  <PenTool className="h-4 w-4" />
                  <span>Launch PDF Editor</span>
                  <ArrowRight className="h-4 w-4 ml-0.5" />
                </Button>
              </Link>
              <Link href="/guides">
                <Button variant="secondary" size="lg" className="rounded-full px-5 text-sm font-medium">
                  <BookOpen className="h-4 w-4 mr-1.5 text-[#a78bfa]" />
                  <span>How-To Guides</span>
                </Button>
              </Link>
            </div>

            {/* Notion Workspace Search Bar */}
            <div className="mx-auto max-w-2xl pt-2">
              <div className="relative rounded-[12px] bg-[#202020] border border-white/[0.08] p-1.5 shadow-xl hover:border-[#5645d4]/50 transition-all">
                <div className="flex items-center px-3">
                  <Search className="h-4.5 w-4.5 text-[#a78bfa] shrink-0 mr-3" />
                  <input
                    type="text"
                    placeholder="Search tools (e.g. Edit Text, Compress, Merge, OCR, Word to PDF)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent py-2.5 text-xs sm:text-sm text-white placeholder-[#6b6b6b] outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-xs text-[#9b9b9b] hover:text-white px-2 py-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-xs">
                <span className="text-[#6b6b6b] text-[11px] mr-1">Quick Jump:</span>
                <Link
                  href="/pdf-editor"
                  className="px-2.5 py-0.5 rounded-full bg-[#5645d4]/15 border border-[#5645d4]/30 text-[#c4b5fd] hover:bg-[#5645d4]/25 transition-colors font-medium text-[11px]"
                >
                  ✏️ PDF Editor
                </Link>
                <Link
                  href="/compress-pdf"
                  className="px-2.5 py-0.5 rounded-full bg-[#202020] border border-white/[0.08] text-[#9b9b9b] hover:text-white hover:border-[#5645d4]/40 transition-colors text-[11px]"
                >
                  📉 Compress PDF
                </Link>
                <Link
                  href="/merge-pdf"
                  className="px-2.5 py-0.5 rounded-full bg-[#202020] border border-white/[0.08] text-[#9b9b9b] hover:text-white hover:border-[#5645d4]/40 transition-colors text-[11px]"
                >
                  🔀 Merge PDF
                </Link>
                <Link
                  href="/ocr-pdf"
                  className="px-2.5 py-0.5 rounded-full bg-[#202020] border border-white/[0.08] text-[#9b9b9b] hover:text-white hover:border-[#5645d4]/40 transition-colors text-[11px]"
                >
                  🔍 OCR Scan
                </Link>
                <Link
                  href="/word-to-pdf"
                  className="px-2.5 py-0.5 rounded-full bg-[#202020] border border-white/[0.08] text-[#9b9b9b] hover:text-white hover:border-[#5645d4]/40 transition-colors text-[11px]"
                >
                  📄 Word to PDF
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 🍱 Notion Bento Showcase Grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-[#5645d4]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9b9b9b]">
                Workspace Feature Modules
              </h2>
            </div>
            <span className="text-xs text-[#6b6b6b] font-mono">NOTION DESIGN SYSTEM</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Bento Card 1: Interactive PDF Studio (Deep Navy + Purple) */}
            <div className="md:col-span-2 lg:col-span-2 p-6 sm:p-8 rounded-[18px] bg-[#0a1530] border border-blue-900/40 flex flex-col justify-between group shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#5645d4]/30 border border-[#5645d4]/50 text-[#c4b5fd] text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-[#a78bfa]" />
                    <span>Interactive Studio</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-300/60">
                    Direct Text Editing
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white group-hover:text-[#c4b5fd] transition-colors">
                    Edit Already-Written Text in Any PDF
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100/70 mt-1.5 leading-relaxed">
                    Click directly on existing text on any document page to rewrite sentences, fix typos, change font styles, and replace pictures without reformatting.
                  </p>
                </div>

                {/* Simulated Live Studio Document */}
                <div className="rounded-[12px] border border-white/[0.1] bg-[#121218] p-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.08] text-[11px] text-[#9b9b9b]">
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                      <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                      <span className="font-mono text-white/90 ml-1.5">service_agreement_2026.pdf</span>
                    </div>
                    <span className="text-[10px] text-[#a78bfa] font-mono font-medium">✏️ Inline Editing Active</span>
                  </div>

                  {/* Document Page Mockup */}
                  <div className="bg-white rounded-[8px] p-4 text-black text-xs space-y-2.5 shadow-sm font-sans select-none">
                    <div className="flex justify-between items-center text-[9px] text-gray-500 border-b border-gray-200 pb-1 font-mono">
                      <span>DOCEDITPRO SECURE DOCUMENT</span>
                      <span>PAGE 1 OF 1</span>
                    </div>
                    <div className="font-bold text-sm text-gray-900">
                      Master Consulting Agreement
                    </div>
                    <div className="text-[11px] text-gray-700 leading-relaxed">
                      This Agreement is entered into by and between the client and provider.
                    </div>
                    <div className="p-1.5 rounded bg-purple-50 border-2 border-[#5645d4] text-[#5645d4] font-semibold text-xs flex items-center justify-between">
                      <span>Effective Date: October 7, 2026</span>
                      <span className="text-[9px] bg-[#5645d4] text-white px-1.5 py-0.2 rounded font-mono">
                        Editable Box
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/pdf-editor" className="inline-block w-full">
                  <Button variant="primary" size="lg" className="w-full font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 rounded-full">
                    <PenTool className="h-4 w-4" />
                    <span>Open PDF Editor Studio</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bento Card 2: 100% Client-Side Privacy Vault */}
            <div className="p-6 rounded-[18px] bg-[#202020] border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Zero Server Storage
                  </h3>
                  <p className="text-xs text-[#9b9b9b] mt-1 leading-relaxed">
                    All document operations run locally in WebAssembly. No files ever leave your machine.
                  </p>
                </div>

                <div className="p-3 rounded-[10px] bg-[#191919] border border-white/[0.06] space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9b9b9b]">Network Traffic:</span>
                    <span className="text-emerald-400 font-mono font-bold">0 KB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9b9b9b]">Local Security:</span>
                    <span className="text-white font-mono">Active Sandbox</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/privacy-scanner" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-between">
                  <span>Privacy Scanner</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 3: Compression Engine */}
            <div className="p-6 rounded-[18px] bg-[#202020] border border-white/[0.08] hover:border-blue-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  <Minimize2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    Smart Compression
                  </h3>
                  <p className="text-xs text-[#9b9b9b] mt-1 leading-relaxed">
                    Shrink massive PDF files for email attachments while preserving sharp typography.
                  </p>
                </div>

                <div className="p-3 rounded-[10px] bg-[#191919] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#9b9b9b] uppercase">Reduction</div>
                    <div className="text-2xl font-black text-blue-400 font-mono">-78%</div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-[#6b6b6b]">
                    <div>18.4MB ➔ 3.9MB</div>
                    <div className="text-emerald-400 text-[10px]">Lossless</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/compress-pdf" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between">
                  <span>Compress PDF</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 4: Searchable OCR */}
            <div className="p-6 rounded-[18px] bg-[#202020] border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <ScanText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    Searchable OCR
                  </h3>
                  <p className="text-xs text-[#9b9b9b] mt-1 leading-relaxed">
                    Turn physical paper scans and images into selectable digital text locally.
                  </p>
                </div>

                <div className="p-2.5 rounded-[10px] bg-[#191919] border border-white/[0.06] text-[10px] font-mono text-amber-300 truncate">
                  [EXTRACTED] INVOICE #9482 · $2,450
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/ocr-pdf" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-between">
                  <span>OCR Scanner</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 5: Merge & Split */}
            <div className="p-6 rounded-[18px] bg-[#202020] border border-white/[0.08] hover:border-[#8b5cf6]/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#5645d4]/15 text-[#a78bfa] border border-[#5645d4]/25">
                  <Combine className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                    Merge & Split
                  </h3>
                  <p className="text-xs text-[#9b9b9b] mt-1 leading-relaxed">
                    Drag, reorder, combine unlimited files, or burst documents into individual pages.
                  </p>
                </div>

                <div className="p-2.5 rounded-[10px] bg-[#191919] border border-white/[0.06] text-[11px] font-mono text-white/90">
                  Unlimited Documents
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/merge-pdf" className="text-xs font-semibold text-[#a78bfa] hover:text-[#c4b5fd] flex items-center justify-between">
                  <span>Merge Files</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Bento Card 6: P2P Share */}
            <div className="p-6 rounded-[18px] bg-[#202020] border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                  <Share2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    P2P Transfer
                  </h3>
                  <p className="text-xs text-[#9b9b9b] mt-1 leading-relaxed">
                    Direct browser-to-browser WebRTC encrypted file transfer with zero server relays.
                  </p>
                </div>

                <div className="p-2.5 rounded-[10px] bg-[#191919] border border-white/[0.06] text-[11px] font-mono text-cyan-300">
                  Encrypted WebRTC
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <Link href="/p2p-share" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-between">
                  <span>P2P Transfer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 🛠️ Complete Notion Tool Directory */}
        <section id="all-tools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                All 44 PDF Tools
              </h2>
              <p className="text-xs text-[#9b9b9b] mt-0.5">
                Every tool runs 100% locally in your browser.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              <Button
                variant={selectedCategory === "all" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="h-8 text-xs font-semibold rounded-full"
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
                    className="h-8 text-xs whitespace-nowrap rounded-full"
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
            <div className="text-center py-16 space-y-3 rounded-[14px] bg-[#202020] border border-white/[0.08] p-8">
              <Search className="h-8 w-8 text-[#9b9b9b] mx-auto" />
              <h3 className="text-lg font-bold">No tools found matching &quot;{searchQuery}&quot;</h3>
              <p className="text-xs text-[#9b9b9b]">
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

        {/* 📚 Notion Guides Banner Strip */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-[18px] bg-[#202020] border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-[#a78bfa] text-xs font-bold uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                <span>How-To Guides & Tutorials</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Learn How to Edit, Convert, and Protect Documents
              </h3>
              <p className="text-xs text-[#9b9b9b] max-w-xl">
                Read step-by-step guides covering Bates numbering, offline Word conversions, permanent redaction, and direct PDF text replacement.
              </p>
            </div>

            <Link href="/guides">
              <Button variant="outline" size="sm" className="whitespace-nowrap text-xs font-semibold px-4 h-9 rounded-full">
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
