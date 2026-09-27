"use client";

import * as React from "react";
import Link from "next/link";
import { Clock, Trash2, ArrowUpRight, ShieldCheck, FileText } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getRecentFiles, clearAllData, RecentFileRecord } from "@/lib/storage/db";
import { formatBytes } from "@/lib/utils";

export function RecentFilesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [recentFiles, setRecentFiles] = React.useState<RecentFileRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadFiles = React.useCallback(async () => {
    setLoading(true);
    try {
      const files = await getRecentFiles(30);
      setRecentFiles(files);
    } catch {
      setRecentFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      loadFiles();
    }
  }, [isOpen, loadFiles]);

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear your local file history and signatures?")) {
      await clearAllData();
      setRecentFiles([]);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Local Activity & Recent Files">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] bg-[var(--surface-elevated)] p-3 rounded-[var(--radius-sm)] border border-[var(--border)]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Files are strictly stored in your local browser IndexedDB.</span>
          </div>
          {recentFiles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All Data
            </Button>
          )}
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-[var(--muted-foreground)]">
            Loading recent files...
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Clock className="h-8 w-8 text-[var(--subtle-foreground)] mx-auto opacity-50" />
            <p className="text-sm font-medium text-[var(--foreground)]">No recent local files</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Files you process in any tool will be listed here for quick reference.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] transition-all"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[var(--surface-elevated)] text-[var(--accent)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-[var(--foreground)] truncate max-w-[200px] sm:max-w-xs" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {formatBytes(file.size)} • {new Date(file.timestamp).toLocaleDateString()} at{" "}
                      {new Date(file.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/${file.toolSlug}`}
                  onClick={onClose}
                  className="flex items-center space-x-1 text-[11px] font-medium text-[var(--accent)] hover:underline shrink-0 pl-2"
                >
                  <span>Open Tool</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
