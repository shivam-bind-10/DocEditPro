"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Shield, ArrowLeft } from "lucide-react";
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
      <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Header />

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Breadcrumbs & Back Link */}
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <nav className="flex items-center space-x-1.5">
              <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
                Home
              </Link>
              <ChevronRight className="h-3 w-3 text-[var(--subtle-foreground)]" />
              <Link href={`/#${tool.category}`} className="hover:text-[var(--foreground)] transition-colors">
                {categoryInfo?.name || tool.category}
              </Link>
              <ChevronRight className="h-3 w-3 text-[var(--subtle-foreground)]" />
              <span className="text-[var(--foreground)] font-medium">{tool.name}</span>
            </nav>

            <Link
              href="/"
              className="inline-flex items-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              All 44 Tools
            </Link>
          </div>

          {/* Tool Title & Description */}
          <div className="space-y-2 border-b border-[var(--border)] pb-6">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
                {tool.name}
              </h1>
              <div className="inline-flex items-center space-x-1 rounded-full border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.1)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                <Shield className="h-3 w-3" />
                <span>100% Client-Side</span>
              </div>
            </div>
            <p className="text-base text-[var(--muted-foreground)] max-w-3xl">
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
