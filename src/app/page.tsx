"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Sparkles,
  Edit3,
  Shield,
  ArrowLeftRight,
  Camera,
  Briefcase,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES, TOOLS } from "@/lib/tools-data";
import { ToolCard } from "@/components/home/ToolCard";
import { LiquidGlassCarousel } from "@/components/ui/liquid-glass-carousel";
import RibbonGlow from "@/components/ui/ribbon-glow";
import {
  getOptionCarouselItems,
  OptionCarouselItem,
} from "@/lib/option-card-textures";

const QUICK_SEARCH_CHIPS = ["Merge", "Compress", "Word", "OCR", "Encrypt", "Sign"];

export default function HomePage() {
  const router = useRouter();
  const [activeCarouselIndex, setActiveCarouselIndex] = React.useState<number>(0);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [showCatalog, setShowCatalog] = React.useState<boolean>(true);
  const [viewMode, setViewMode] = React.useState<"grid" | "compact">("compact");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Generate option card textures for all 44 tools in the Liquid Glass Carousel
  const optionItems: OptionCarouselItem[] = React.useMemo(() => {
    return getOptionCarouselItems();
  }, []);

  const activeOption = optionItems[activeCarouselIndex] || optionItems[0];

  // Keyboard shortcut '/' to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Direct option click navigation: takes the user straight to that option's functioning
  const handleSelectOption = React.useCallback(
    (item: { href?: string; slug?: string }) => {
      const targetUrl = item.href || (item.slug ? `/${item.slug}` : "/");
      router.push(targetUrl);
    },
    [router],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] font-sans antialiased selection:bg-white selection:text-black">
      <Header />

      <main className="flex-1 space-y-12 pb-24">
        {/* =========================================================================
            1. HERO & LIQUID GLASS 3D OPTIONS CAROUSEL (WITH AMBIENT RIBBON GLOW)
            ========================================================================= */}
        <section className="relative w-full overflow-hidden pt-10 sm:pt-14 pb-14 sm:pb-16">
          {/* RibbonGlow Ambient Interactive WebGL2 Fluid Background */}
          <div className="absolute inset-0 opacity-75 pointer-events-none">
            <RibbonGlow
              background="#000000"
              color1="#e8864a"
              color2="#c0405a"
              speed={42}
              size={108}
              angle={-180}
              hover={110}
              reach={280}
              style={{ minWidth: 0, minHeight: 0, position: "absolute", inset: 0 }}
            />
            {/* Center-radial dimming vignette to ensure text readability */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 65% 55% at 50% 35%, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.1) 70%, transparent 100%)",
              }}
            />
            {/* Bottom gradient — ribbon fades into site background */}
            <div
              className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, transparent, var(--background, #09090c))" }}
            />
            {/* Top gradient — blends behind header */}
            <div
              className="absolute inset-x-0 top-0 h-28 pointer-events-none"
              style={{ background: "linear-gradient(to top, transparent, var(--background, #09090c))" }}
            />
          </div>

          <div className="relative z-10 mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-8 text-center space-y-8 sm:space-y-10">
            {/* Display Headline */}
            <div className="max-w-[780px] mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>100% Client-Side Engine</span>
                <span className="text-white/25">·</span>
                <span className="text-white font-medium">Zero Server Uploads</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
                Every PDF tool you need. <br />
                <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent font-normal">
                  Private, fast and entirely in your browser.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-[62ch] mx-auto">
                Scroll your mouse wheel to cycle through options, then click the active option to launch it directly.
              </p>
            </div>

            {/* THE LIQUID GLASS OPTIONS CAROUSEL (WHITE BACKGROUND) */}
            <div className="mt-6 sm:mt-10 relative w-full rounded-2xl overflow-hidden border border-zinc-200/90 dark:border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)] bg-white">
              <div className="h-[490px] sm:h-[530px] md:h-[580px] w-full">
                <LiquidGlassCarousel
                  items={optionItems}
                  panelHeight={420}
                  gap={18}
                  background="#ffffff"
                  entry={false}
                  onActiveChange={(index) => setActiveCarouselIndex(index)}
                  onSelectOption={(item) => handleSelectOption(item)}
                />
              </div>

              {/* Active Option Bar under the Liquid Glass Stage */}
              <div className="relative z-30 px-5 py-4 bg-zinc-50 border-t border-zinc-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      {activeOption.category.replace("-", " ")}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      Option {activeCarouselIndex + 1} of {optionItems.length}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight mt-1">
                    {activeOption.title}
                  </h3>
                  <p className="text-xs text-zinc-600 truncate max-w-xl hidden sm:block">
                    {activeOption.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 border border-zinc-300 text-zinc-700 font-medium">
                      Mouse Wheel ↕
                    </span>
                    <span>Scroll to choose · Click to launch</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectOption(activeOption)}
                    className="h-9 px-5 rounded-full bg-zinc-900 hover:bg-black text-white font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Launch {activeOption.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. SECONDARY / NON-DISTRACTING DIRECTORY
            (Old sprawl is tucked away neatly so the carousel remains the primary choice)
            ========================================================================= */}
        <section id="all-tools" className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="rounded-2xl border border-white/[0.08] bg-[#121216]/60 p-5 sm:p-6 backdrop-blur-md space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                  <span>Complete Tool Directory</span>
                  <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/10">
                    {TOOLS.length} Tools
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Browse, search, and access all {TOOLS.length} client-side document utilities below.
                </p>
              </div>

              <button
                onClick={() => setShowCatalog((prev) => !prev)}
                className="self-start sm:self-auto h-9 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-medium inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>{showCatalog ? "Collapse Index" : `Show All ${TOOLS.length} Tools`}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    showCatalog ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Collapsed content: only shown when explicitly toggled or when searching */}
            {(showCatalog || searchQuery) && (
              <div className="pt-5 border-t border-white/[0.08] space-y-6 animate-in fade-in duration-300">
                {/* Search chips & view switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <span className="text-zinc-500 mr-1 text-[11px]">Quick search:</span>
                    {QUICK_SEARCH_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setSearchQuery(chip)}
                        className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                          searchQuery.toLowerCase() === chip.toLowerCase()
                            ? "bg-white text-black border-white font-medium"
                            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-zinc-300"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-[11px] text-zinc-400 hover:text-white underline ml-2 cursor-pointer"
                      >
                        Clear search
                      </button>
                    )}
                  </div>

                  <div className="flex items-center p-1 rounded-lg bg-white/[0.04] border border-white/10 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => setViewMode("grid")}
                      title="Grid View"
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-white text-black shadow-xs"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("compact")}
                      title="Compact List View"
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === "compact"
                          ? "bg-white text-black shadow-xs"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filtered Tools Grid/List */}
                {filteredTools.length > 0 ? (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5"
                        : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5"
                    }
                  >
                    {filteredTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} variant={viewMode} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-zinc-400">
                    No tools found in catalog matching &ldquo;{searchQuery}&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            3. DOCUMENTATION / GUIDES CALLOUT
            ========================================================================= */}
        <section className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="rounded-2xl border border-white/[0.08] bg-[#121216]/60 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Documentation
              </span>
              <h3 className="text-lg font-semibold text-white">
                Master Local Document Workflows
              </h3>
              <p className="text-[13px] text-zinc-400 max-w-xl">
                Read step-by-step guides on Bates numbering, offline OCR extraction, P2P encrypted file sharing, and direct PDF editing.
              </p>
            </div>

            <Link
              href="/guides"
              className="h-10 px-5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <span>View All Guides</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
