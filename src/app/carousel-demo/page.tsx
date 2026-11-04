"use client";

import { LiquidGlassCarousel } from "@/components/ui/liquid-glass-carousel";

export default function CarouselDemoPage() {
  return (
    <div className="h-svh w-full bg-white">
      <LiquidGlassCarousel entry={false} background="#ffffff" />
    </div>
  );
}
