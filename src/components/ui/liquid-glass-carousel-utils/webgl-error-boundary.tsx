"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface WebGLFallbackProps {
  className?: string;
  message?: string;
}

export function WebGLFallback({
  className,
  message = "This carousel needs WebGL, which is unavailable in this browser.",
}: WebGLFallbackProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center text-sm text-zinc-400 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10",
        className
      )}
    >
      <p>{message}</p>
    </div>
  );
}

export interface WebGLErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export interface WebGLErrorBoundaryState {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGLErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <WebGLFallback message="WebGL rendering error occurred." />
        )
      );
    }
    return this.props.children;
  }
}
