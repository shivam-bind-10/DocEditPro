"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Shield, Command, Edit3, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#191919]/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Privacy Badge */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#5645d4] text-white font-black text-xs group-hover:bg-[#4838bc] transition-all shadow-sm">
                D
              </div>
              <span className="text-base font-bold tracking-tight text-white group-hover:text-[#a78bfa] transition-colors font-sans">
                DocEditPro
              </span>
            </Link>
            <div className="hidden lg:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
              <Shield className="h-3 w-3" />
              <span>100% Client-Side</span>
            </div>
          </div>

          {/* Search Bar Pill & Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              aria-label="Open command palette to search tools (Ctrl+K)"
              aria-haspopup="dialog"
              className="flex h-8 w-36 sm:w-52 md:w-60 items-center justify-between rounded-[8px] border border-white/[0.08] bg-[#202020] px-2.5 text-xs text-[#9b9b9b] hover:border-[#5645d4]/50 hover:bg-[#252525] transition-all cursor-pointer"
            >
              <span className="flex items-center space-x-2 truncate">
                <Search className="h-3.5 w-3.5 text-[#a78bfa]" />
                <span className="truncate">Search 44 tools...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center space-x-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-[#6b6b6b]">
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </kbd>
            </button>

            <nav className="flex items-center space-x-1 sm:space-x-1.5">
              <Link href="/pdf-editor">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-7 text-xs bg-[#5645d4] hover:bg-[#4838bc] text-white flex items-center space-x-1 font-semibold rounded-md shadow-xs"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>PDF Editor</span>
                </Button>
              </Link>
              <button
                onClick={() => setIsRecentOpen(true)}
                title="Recent Files & History"
                aria-label="Open recent files history panel"
                aria-haspopup="dialog"
                className="hidden sm:flex items-center space-x-1 px-2 py-1 text-xs text-[#9b9b9b] hover:text-white hover:bg-white/[0.06] rounded-[6px] transition-colors cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Recents</span>
              </button>
              <Link href="/guides" className="hidden md:inline-block">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#9b9b9b] hover:text-white">
                  Guides
                </Button>
              </Link>
              <Link href="/#all-tools" className="hidden md:inline-block">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#9b9b9b] hover:text-white">
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
