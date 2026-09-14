"use client";

import * as React from "react";
import { Search, Shield, Zap, Lock, Sparkles, CheckCircle2 } from "lucide-react";
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
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative border-b border-[var(--border)] py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-[var(--surface)]/50 to-transparent">
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="inline-flex items-center space-x-2 rounded-full border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              <Shield className="h-3.5 w-3.5" />
              <span>100% Client-Side · Zero Server Uploads · No Watermarks</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-[var(--foreground)]">
              Every PDF tool you need. <br className="hidden sm:inline" />
              <span className="text-[var(--accent)]">100% Private in your browser.</span>
            </h1>

            <p className="mx-auto max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg">
              DocEditPro brings 44 powerful document tools directly to your browser.
              No file ever leaves your computer — no server processing, no sign-up, no limits.
            </p>

            {/* Quick Search */}
            <div className="mx-auto max-w-xl pt-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--muted-foreground)]" />
                <Input
                  type="text"
                  placeholder="Find a tool (e.g. Merge, Compress, OCR, Edit Text, Encrypt)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4 text-base bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] focus:border-[var(--accent)]"
                />
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto text-left text-xs text-[var(--muted-foreground)]">
              <div className="flex items-center space-x-2 rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5 bg-[var(--surface)]">
                <Lock className="h-4 w-4 text-[var(--accent)] shrink-0" />
                <div>
                  <div className="font-medium text-[var(--foreground)]">Zero File Uploads</div>
                  <div>Processed in WebWorker</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5 bg-[var(--surface)]">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-medium text-[var(--foreground)]">Lightning Fast</div>
                  <div>Native WASM Engine</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5 bg-[var(--surface)]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-[var(--foreground)]">No Watermarks</div>
                  <div>100% Clean Exports</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5 bg-[var(--surface)]">
                <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-medium text-[var(--foreground)]">44 PDF Tools</div>
                  <div>Complete Suite</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section id="all-tools" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <Button
              variant={selectedCategory === "all" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Tools ({TOOLS.length})
            </Button>
            {CATEGORIES.map((cat) => {
              const count = TOOLS.filter((t) => t.category === cat.id).length;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  {cat.name} ({count})
                </Button>
              );
            })}
          </div>

          {/* Tools Grid */}
          {filteredTools.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-[var(--muted-foreground)] space-y-3">
              <p className="text-lg font-medium text-[var(--foreground)]">No PDF tools found</p>
              <p className="text-sm">Try searching for another term like &quot;merge&quot;, &quot;compress&quot;, or &quot;convert&quot;.</p>
              <Button variant="secondary" size="sm" onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        {/* Privacy Proposition Banner */}
        <section id="privacy" className="border-t border-[var(--border)] bg-[var(--surface)] py-16 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                Why Client-Side Privacy Matters
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[var(--muted-foreground)]">
                Most online PDF editors upload your sensitive legal contracts, tax forms, and personal documents to third-party cloud servers.
                DocEditPro takes a fundamental stance: your files are your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-6 bg-[var(--background)] space-y-2">
                <div className="font-semibold text-[var(--foreground)] text-base">100% In-Browser Engine</div>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
                  Every byte of your PDF is parsed, modified, and saved locally using WebAssembly and Web Worker threads inside your browser tab.
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-6 bg-[var(--background)] space-y-2">
                <div className="font-semibold text-[var(--foreground)] text-base">Zero Server Bandwidth</div>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
                  We don&apos;t operate backend storage or file processing servers. Your network connection isn&apos;t clogged uploading massive PDF files.
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-6 bg-[var(--background)] space-y-2">
                <div className="font-semibold text-[var(--foreground)] text-base">Offline Capable PWA</div>
                <p className="text-[var(--muted-foreground)] text-xs leading-relaxed">
                  DocEditPro works seamlessly even without an active internet connection after your initial page load.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
