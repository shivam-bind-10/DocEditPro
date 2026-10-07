"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Shield, Command, Edit3, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { RecentFilesModal } from "@/components/shared/RecentFilesModal";

export function Header() {
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);
  const [isRecentOpen, setIsRecentOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08080b]/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Privacy Badge */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-tr from-blue-600 to-cyan-400 text-white font-black text-sm group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all shadow-md">
                D
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-[var(--foreground)] group-hover:text-blue-400 transition-colors font-sans">
                DocEditPro
              </span>
            </Link>
            <div className="hidden lg:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
              <Shield className="h-3 w-3" />
              <span>100% Client-Side</span>
            </div>
          </div>

          {/* Search Bar Pill & Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              aria-label="Open command palette to search tools (Ctrl+K)"
              aria-haspopup="dialog"
              className="flex h-9 w-40 sm:w-56 md:w-64 items-center justify-between rounded-[var(--radius-md)] border border-white/[0.08] bg-[var(--surface-card)] px-3 text-xs text-[var(--muted-foreground)] hover:border-blue-500/40 hover:bg-[var(--surface-hover)] transition-all cursor-pointer shadow-xs"
            >
              <span className="flex items-center space-x-2 truncate">
                <Search className="h-3.5 w-3.5 text-blue-400" />
                <span className="truncate">Search 44 tools...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center space-x-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-[var(--subtle-foreground)]">
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </kbd>
            </button>

            <nav className="flex items-center space-x-1 sm:space-x-1.5">
              <Link href="/pdf-editor">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25 flex items-center space-x-1.5 font-bold shadow-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>PDF Editor</span>
                </Button>
              </Link>
              <button
                onClick={() => setIsRecentOpen(true)}
                title="Recent Files & History"
                aria-label="Open recent files history panel"
                aria-haspopup="dialog"
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Recents</span>
              </button>
              <Link href="/guides" className="hidden md:inline-block">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  Guides
                </Button>
              </Link>
              <Link href="/#all-tools" className="hidden md:inline-block">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  All Tools
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />

      <RecentFilesModal
        isOpen={isRecentOpen}
        onClose={() => setIsRecentOpen(false)}
      />
    </>
  );
}
