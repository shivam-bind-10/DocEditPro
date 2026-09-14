"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Shield, ArrowLeftRight, Camera, Briefcase, Edit3, ArrowRight } from "lucide-react";
import { TOOLS, Tool } from "@/lib/tools-data";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  essentials: <Sparkles className="h-4 w-4 text-blue-400" />,
  'edit-organize': <Edit3 className="h-4 w-4 text-indigo-400" />,
  'security-privacy': <Shield className="h-4 w-4 text-emerald-400" />,
  'convert-export': <ArrowLeftRight className="h-4 w-4 text-amber-400" />,
  'scan-share': <Camera className="h-4 w-4 text-purple-400" />,
  business: <Briefcase className="h-4 w-4 text-cyan-400" />,
};

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();

  const filteredTools = React.useMemo(() => {
    if (!query.trim()) return TOOLS;
    const q = query.toLowerCase();
    return TOOLS.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = React.useCallback(
    (tool: Tool) => {
      onClose();
      router.push(`/${tool.slug}`);
    },
    [onClose, router]
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredTools.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredTools.length - 1
        );
      } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredTools[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex, handleSelect]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="space-y-4">
        {/* Search input bar */}
        <div className="relative flex items-center border-b border-[var(--border)] pb-3">
          <Search className="h-5 w-5 text-[var(--muted-foreground)] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search all 44 PDF tools (e.g. merge, compress, OCR, encrypt)..."
            className="w-full bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--subtle-foreground)] focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--border)] bg-[var(--surface-hover)] px-2 py-0.5 font-mono text-xs text-[var(--muted-foreground)]">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
          {filteredTools.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted-foreground)]">
              No matching PDF tools found for &quot;{query}&quot;
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelect(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group flex items-center justify-between rounded-[var(--radius-md)] p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--surface-hover)] border border-[var(--border-hover)]"
                      : "border border-transparent hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(59,130,246,0.12)] shrink-0">
                      {CATEGORY_ICONS[tool.category]}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                          {tool.name}
                        </span>
                        {tool.popular && (
                          <Badge variant="accent">Popular</Badge>
                        )}
                        {tool.new && (
                          <Badge variant="success">New</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--subtle-foreground)] group-hover:text-[var(--accent)] transition-colors shrink-0 ml-2" />
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard hints footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs text-[var(--subtle-foreground)]">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[10px]">
                ↑
              </kbd>{" "}
              <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[10px]">
                ↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{" "}
              Open
            </span>
          </div>
          <span>{filteredTools.length} tools available</span>
        </div>
      </div>
    </Dialog>
  );
}
