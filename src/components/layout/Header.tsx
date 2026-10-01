"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Shield, Command, Edit3, Clock } from "lucide-react";
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
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Privacy Badge */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-white font-bold text-lg group-hover:bg-[var(--accent-hover)] transition-colors">
                D
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                DocEditPro
              </span>
            </Link>
            <Badge variant="accent" className="hidden lg:inline-flex gap-1 py-0.5">
              <Shield className="h-3 w-3" />
              100% Client-Side
            </Badge>
          </div>

          {/* Search Bar Pill & Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              aria-label="Open command palette to search tools (Ctrl+K)"
              aria-haspopup="dialog"
              className="flex h-9 w-40 sm:w-56 md:w-64 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--muted-foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <span className="flex items-center space-x-2 truncate">
                <Search className="h-3.5 w-3.5" />
                <span className="truncate">Search 44 tools...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center space-x-0.5 rounded border border-[var(--border)] bg-[var(--surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--subtle-foreground)]">
                <Command className="h-2.5 w-2.5" />
                <span>K</span>
              </kbd>
            </button>

            <nav className="flex items-center space-x-1">
              <Link href="/edit-pdf-text">
                <Button variant="secondary" size="sm" className="bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/25 flex items-center space-x-1.5 font-medium">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>PDF Editor</span>
                </Button>
              </Link>
              <button
                onClick={() => setIsRecentOpen(true)}
                title="Recent Files & History"
                aria-label="Open recent files history panel"
                aria-haspopup="dialog"
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-sm)] transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Recents</span>
              </button>
              <Link href="/#all-tools" className="hidden md:inline-block">
                <Button variant="ghost" size="sm">
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
