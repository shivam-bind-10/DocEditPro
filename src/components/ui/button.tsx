import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[#5645d4] text-white hover:bg-[#4838bc] border border-transparent shadow-sm hover:shadow-[0_4px_14px_rgba(86,69,212,0.35)] active:scale-[0.98]",
        secondary:
          "bg-white/[0.05] text-[var(--foreground)] border border-[var(--border)] hover:bg-white/[0.1] hover:border-[var(--border-hover)] active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/[0.06]",
        destructive:
          "bg-[var(--danger)] text-white hover:bg-red-600 border border-transparent active:scale-[0.98]",
        outline:
          "bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]",
        notionPill:
          "bg-[#5645d4] text-white hover:bg-[#4838bc] rounded-full px-5 py-2 text-xs font-semibold shadow-md shadow-[#5645d4]/20 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        md: "h-9 px-4 text-xs sm:text-sm gap-2",
        lg: "h-11 px-6 text-sm sm:text-base font-semibold gap-2.5",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
