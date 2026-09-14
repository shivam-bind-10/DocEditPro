"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Shield, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/shared/CommandPalette";

export function Header() {
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);

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
            <Badge variant="accent" className="hidden md:inline-flex gap-1 py-0.5">
              <Shield className="h-3 w-3" />
              100% Client-Side
            </Badge>
          </div>

          {/* Search Bar Pill & Navigation */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="flex h-9 w-48 sm:w-64 items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--muted-foreground)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
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

            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/#all-tools">
                <Button variant="ghost" size="sm">
                  All Tools
                </Button>
              </Link>
              <Link href="/#privacy">
                <Button variant="ghost" size="sm">
                  Privacy
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
    </>
  );
}
