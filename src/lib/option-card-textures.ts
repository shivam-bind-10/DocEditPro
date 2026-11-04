import { Tool, TOOLS } from "@/lib/tools-data";

export interface OptionCarouselItem {
  id: string;
  title: string;
  slug: string;
  href: string;
  category: string;
  description: string;
  src: string;
  aspect: number;
}

// Crisp SVG icons for key tools
const ICON_SVG_PATHS: Record<string, string> = {
  Combine: `
    <rect x="6" y="4" width="28" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="18" y="12" width="28" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="24" y1="26" x2="36" y2="26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="24" y1="34" x2="36" y2="34" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  `,
  Minimize2: `
    <polyline points="8,18 18,18 18,8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="18" y1="18" x2="6" y2="6" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <polyline points="44,34 34,34 34,44" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="34" y1="34" x2="46" y2="46" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  `,
  Scissors: `
    <circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="14" cy="38" r="8" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="20" y1="18" x2="44" y2="38" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="20" y1="34" x2="44" y2="14" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  `,
  PenTool: `
    <path d="M26 6 L44 24 L20 48 L6 48 L6 34 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="20" cy="20" r="3" fill="currentColor"/>
    <line x1="6" y1="48" x2="16" y2="38" stroke="currentColor" stroke-width="3"/>
  `,
  FileText: `
    <path d="M10 6 L32 6 L42 16 L42 46 L10 46 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <polyline points="32,6 32,16 42,16" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="18" y1="26" x2="34" y2="26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="18" y1="34" x2="30" y2="34" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  `,
  FileCode: `
    <path d="M10 6 L32 6 L42 16 L42 46 L10 46 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <polyline points="20,28 16,32 20,36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="28,28 32,32 28,36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  ScanText: `
    <path d="M8 14 L8 8 L14 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M44 14 L44 8 L38 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M8 38 L8 44 L14 44" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M44 38 L44 44 L38 44" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="16" y1="20" x2="36" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="16" y1="26" x2="32" y2="26" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <line x1="16" y1="32" x2="28" y2="32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  `,
  Lock: `
    <rect x="10" y="20" width="32" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M16 20 L16 14 A 10 10 0 0 1 36 14 L 36 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="26" cy="32" r="3" fill="currentColor"/>
    <line x1="26" y1="35" x2="26" y2="39" stroke="currentColor" stroke-width="3"/>
  `,
  Camera: `
    <path d="M6 14 L14 14 L18 8 L34 8 L38 14 L46 14 A 4 4 0 0 1 50 18 L50 44 A 4 4 0 0 1 46 48 L6 48 A 4 4 0 0 1 2 44 L2 18 A 4 4 0 0 1 6 14 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="26" cy="30" r="9" fill="none" stroke="currentColor" stroke-width="3"/>
  `,
  LayoutGrid: `
    <rect x="8" y="8" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="30" y="8" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="8" y="30" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="30" y="30" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
  `,
  FileImage: `
    <path d="M10 6 L32 6 L42 16 L42 46 L10 46 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="22" cy="24" r="3" fill="currentColor"/>
    <polyline points="14,38 24,28 34,38" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  Stamp: `
    <path d="M26 8 A 12 12 0 0 1 38 20 C 38 28 32 32 34 38 L18 38 C 20 32 14 28 14 20 A 12 12 0 0 1 26 8 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="10" y="40" width="32" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
  `,
  Shield: `
    <path d="M26 6 L44 14 C 44 30 26 44 26 44 C 26 44 8 30 8 14 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
  `,
  ShieldCheck: `
    <path d="M26 6 L44 14 C 44 30 26 44 26 44 C 26 44 8 30 8 14 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <polyline points="18,24 24,30 34,18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  RotateCw: `
    <path d="M42 12 A 18 18 0 1 1 20 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <polyline points="22,2 20,8 26,10" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  Crop: `
    <path d="M12 4 L12 36 A 4 4 0 0 0 16 40 L48 40" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M4 12 L36 12 A 4 4 0 0 1 40 16 L40 48" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  `,
  Hash: `
    <line x1="8" y1="18" x2="44" y2="18" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="8" y1="34" x2="44" y2="34" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="20" y1="8" x2="16" y2="44" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="36" y1="8" x2="32" y2="44" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  `,
  PanelTop: `
    <rect x="6" y="8" width="40" height="36" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="6" y1="20" x2="46" y2="20" stroke="currentColor" stroke-width="3"/>
    <line x1="14" y1="14" x2="18" y2="14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  `,
  FileSpreadsheet: `
    <path d="M10 6 L32 6 L42 16 L42 46 L10 46 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <line x1="16" y1="24" x2="36" y2="24" stroke="currentColor" stroke-width="2"/>
    <line x1="16" y1="32" x2="36" y2="32" stroke="currentColor" stroke-width="2"/>
    <line x1="26" y1="24" x2="26" y2="40" stroke="currentColor" stroke-width="2"/>
  `,
  Unlock: `
    <rect x="10" y="20" width="32" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="3"/>
    <path d="M16 20 L16 14 A 10 10 0 0 1 36 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <circle cx="26" cy="32" r="3" fill="currentColor"/>
  `,
  EyeOff: `
    <path d="M4 26 C 10 16 20 12 26 12 C 32 12 42 16 48 26 C 42 36 32 40 26 40 C 20 40 10 36 4 26 Z" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="26" cy="26" r="6" fill="currentColor"/>
    <line x1="6" y1="6" x2="46" y2="46" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  `,
  Layers: `
    <polygon points="26,6 46,16 26,26 6,16" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <polyline points="6,24 26,34 46,24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="6,32 26,42 46,32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  `,
  Globe: `
    <circle cx="26" cy="26" r="18" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="8" y1="26" x2="44" y2="26" stroke="currentColor" stroke-width="3"/>
    <path d="M26 8 C 32 16 34 36 26 44 C 18 36 20 16 26 8 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>
  `,
  BookOpen: `
    <path d="M6 38 C 12 36 20 36 26 40 C 32 36 40 36 46 38 L 46 12 C 40 10 32 10 26 14 C 20 10 12 10 6 12 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <line x1="26" y1="14" x2="26" y2="40" stroke="currentColor" stroke-width="3"/>
  `,
  Printer: `
    <rect x="12" y="6" width="28" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="8" y="18" width="36" height="20" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
    <rect x="14" y="28" width="24" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>
  `,
  Share2: `
    <circle cx="38" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="12" cy="26" r="5" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="38" cy="40" r="5" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="16.5" y1="23.5" x2="33.5" y2="14.5" stroke="currentColor" stroke-width="3"/>
    <line x1="16.5" y1="28.5" x2="33.5" y2="37.5" stroke="currentColor" stroke-width="3"/>
  `,
  Fingerprint: `
    <path d="M26 10 A 14 14 0 0 0 14 24 C 14 34 20 40 20 44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M26 16 A 8 8 0 0 0 18 24 C 18 32 23 37 23 42" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M26 6 A 18 18 0 0 1 44 24 C 44 34 38 40 38 44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  `,
  Receipt: `
    <path d="M10 6 L42 6 L42 46 L38 43 L34 46 L30 43 L26 46 L22 43 L18 46 L14 43 L10 46 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <line x1="16" y1="16" x2="36" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="16" y1="24" x2="32" y2="24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="16" y1="32" x2="26" y2="32" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  `,
  Sparkles: `
    <path d="M26 4 L28 18 L42 20 L28 22 L26 36 L24 22 L10 20 L24 18 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="38" cy="36" r="3" fill="currentColor"/>
    <circle cx="12" cy="10" r="2" fill="currentColor"/>
  `,
};

const CATEGORY_PALETTES: Record<string, { glow: string; accent: string; label: string }> = {
  essentials: {
    glow: "#f97316",
    accent: "#fb923c",
    label: "DAILY ESSENTIAL",
  },
  "edit-organize": {
    glow: "#a855f7",
    accent: "#c084fc",
    label: "EDIT & ORGANIZE",
  },
  "security-privacy": {
    glow: "#10b981",
    accent: "#34d399",
    label: "SECURITY & PRIVACY",
  },
  "convert-export": {
    glow: "#3b82f6",
    accent: "#60a5fa",
    label: "CONVERT & EXPORT",
  },
  "scan-share": {
    glow: "#06b6d4",
    accent: "#22d3ee",
    label: "SCAN & SHARE",
  },
  business: {
    glow: "#eab308",
    accent: "#facc15",
    label: "BUSINESS SUITE",
  },
};

export function generateOptionCardSvg(tool: Tool): string {
  const palette = CATEGORY_PALETTES[tool.category] || {
    glow: "#3b82f6",
    accent: "#60a5fa",
    label: tool.category.toUpperCase(),
  };

  const iconSvg =
    ICON_SVG_PATHS[tool.icon] ||
    `
    <circle cx="26" cy="26" r="16" fill="none" stroke="currentColor" stroke-width="3"/>
    <line x1="26" y1="16" x2="26" y2="36" stroke="currentColor" stroke-width="3"/>
    <line x1="16" y1="26" x2="36" y2="26" stroke="currentColor" stroke-width="3"/>
  `;

  // Break description into 2 lines cleanly
  const words = tool.description.split(" ");
  let line1 = "";
  let line2 = "";
  for (const word of words) {
    if ((line1 + " " + word).length < 32) {
      line1 += (line1 ? " " : "") + word;
    } else {
      line2 += (line2 ? " " : "") + word;
    }
  }

  // Escape XML characters
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const safeTitle = escapeXml(tool.name);
  const safeLine1 = escapeXml(line1);
  const safeLine2 = escapeXml(line2);
  const safeCategory = escapeXml(palette.label);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <!-- Dark glass surface gradient -->
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#181820" />
      <stop offset="45%" stop-color="#101015" />
      <stop offset="100%" stop-color="#08080a" />
    </linearGradient>

    <!-- Vibrant radial ambient spotlight -->
    <radialGradient id="cardGlow" cx="80%" cy="18%" r="65%">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.45" />
      <stop offset="60%" stop-color="${palette.glow}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0" />
    </radialGradient>

    <!-- Secondary corner glow -->
    <radialGradient id="bottomGlow" cx="20%" cy="85%" r="55%">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0" />
    </radialGradient>

    <!-- Top glossy highlight -->
    <linearGradient id="topSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="600" height="800" rx="36" fill="url(#cardBg)" />
  <rect width="600" height="800" rx="36" fill="url(#cardGlow)" />
  <rect width="600" height="800" rx="36" fill="url(#bottomGlow)" />

  <!-- Double Glass Stroke -->
  <rect x="2" y="2" width="596" height="796" rx="34" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2.5" />
  <rect x="6" y="6" width="588" height="788" rx="30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />

  <!-- Specular top reflection curved sheen -->
  <path d="M 4 4 Q 300 130 596 4 L 596 220 Q 300 320 4 220 Z" fill="url(#topSheen)" opacity="0.8" />

  <!-- Category & Privacy Header Pill -->
  <g transform="translate(44, 46)">
    <rect width="180" height="34" rx="17" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
    <text x="90" y="22" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="${palette.accent}" letter-spacing="1.2">
      ${safeCategory}
    </text>

    <!-- 100% Client-side badge -->
    <g transform="translate(340, 0)">
      <rect width="172" height="34" rx="17" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.3)" stroke-width="1.5" />
      <circle cx="20" cy="17" r="4.5" fill="#34d399" />
      <text x="95" y="22" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#a7f3d0">
        100% Client-Side
      </text>
    </g>
  </g>

  <!-- Large Tool Icon Box -->
  <g transform="translate(44, 120)">
    <rect width="112" height="112" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" stroke-width="2" />
    <!-- Icon inner ambient glow -->
    <circle cx="56" cy="56" r="42" fill="${palette.glow}" opacity="0.32" filter="url(#dropGlow)" />
    <!-- Icon SVG -->
    <g transform="translate(30, 30) scale(1.05)" color="#ffffff">
      ${iconSvg}
    </g>
  </g>

  <!-- Tool Title -->
  <text x="44" y="305" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="700" fill="#ffffff" letter-spacing="-0.8">
    ${safeTitle}
  </text>

  <!-- Tool Description -->
  <text x="44" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="400" fill="#a1a1aa">
    <tspan x="44" dy="0">${safeLine1}</tspan>
    <tspan x="44" dy="36">${safeLine2}</tspan>
  </text>

  <!-- Clean Divider & Metadata Line -->
  <line x1="44" y1="480" x2="556" y2="480" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />
  <text x="44" y="520" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="500" fill="#71717a">
    Document Studio · Client-Side Local Engine
  </text>

  <!-- Big Prominent Action Button -->
  <g transform="translate(44, 660)">
    <rect width="512" height="72" rx="36" fill="#ffffff" />
    <text x="256" y="44" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#000000" letter-spacing="0.6">
      SELECT OPTION →
    </text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Key curated option tools
export const PRIMARY_OPTION_TOOL_IDS = [
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
  "edit-pdf-text",
  "word-to-pdf",
  "pdf-to-word",
  "ocr-pdf",
  "encrypt-pdf",
  "scan-to-pdf",
  "organize-pages",
  "pdf-to-jpg",
  "add-watermark",
];

export function getOptionCarouselItems(toolIds?: string[]): OptionCarouselItem[] {
  const tools =
    toolIds && toolIds.length > 0
      ? toolIds.map((id) => TOOLS.find((t) => t.id === id)).filter((t): t is Tool => Boolean(t))
      : TOOLS;

  return tools.map((tool) => ({
    id: tool.id,
    title: tool.name,
    slug: tool.slug,
    href: `/${tool.slug}`,
    category: tool.category,
    description: tool.description,
    src: generateOptionCardSvg(tool),
    aspect: 3 / 4,
  }));
}
