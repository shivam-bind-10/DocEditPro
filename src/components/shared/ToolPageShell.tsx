"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Shield, ArrowLeft, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Tool, CATEGORIES } from "@/lib/tools-data";
import { ToastProvider } from "@/components/ui/toast";

interface ToolPageShellProps {
  tool: Tool;
  children: React.ReactNode;
}

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const categoryInfo = CATEGORIES.find((c) => c.id === tool.category);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white">
        <Header />

        <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
          {/* Breadcrumbs & Navigation Bar */}
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <nav className="flex items-center space-x-2">
              <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3 text-[var(--subtle-foreground)]" />
              <Link href={`/#${tool.category}`} className="hover:text-[var(--foreground)] transition-colors">
                {categoryInfo?.name || tool.category}
              </Link>
              <ChevronRight className="h-3 w-3 text-[var(--subtle-foreground)]" />
              <span className="text-[var(--foreground)] font-semibold">{tool.name}</span>
            </nav>

            <Link
              href="/"
              className="inline-flex items-center space-x-1 text-xs text-[var(--muted-foreground)] hover:text-white transition-colors bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-0.5" />
              <span>All 44 Tools</span>
            </Link>
          </div>

          {/* Bento Tool Header Card */}
          <div className="bento-card p-6 sm:p-8 space-y-3 relative overflow-hidden">
            <div className="bento-glow" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--foreground)]">
                  {tool.name}
                </h1>
                <div className="inline-flex items-center space-x-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  <Shield className="h-3 w-3" />
                  <span>100% Client-Side</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-[var(--subtle-foreground)]">
                Local WASM Processing
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
              {tool.description}
            </p>
          </div>

          {/* Tool Specific UI Content */}
          <div className="space-y-6">{children}</div>
        </main>

        <Footer />
      </div>
    </ToastProvider>
  );
}
