import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        accent: "bg-[rgba(59,130,246,0.15)] text-[var(--accent)] border border-[rgba(59,130,246,0.3)]",
        secondary: "bg-[var(--surface-hover)] text-[var(--muted-foreground)] border border-[var(--border)]",
        outline: "bg-transparent text-[var(--foreground)] border border-[var(--border)]",
        success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        danger: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
