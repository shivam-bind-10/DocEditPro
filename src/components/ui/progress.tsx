import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  showLabel?: boolean;
}

export function Progress({ value, showLabel = false, className, ...props }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end">
          <span className="font-mono text-xs text-[var(--muted-foreground)]">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
