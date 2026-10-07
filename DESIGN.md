# Notion Design System — DESIGN.md Specification

> **Source of Truth for AI Coding Agents & Front-End Developers**
> Based on the Notion Design Language specification from [DesignMD](https://designmd.co/d/notion).

---

## 1. Design Philosophy & Aesthetic Core

Notion's visual identity blends the structure of a powerful relational workspace with the tactile simplicity of a clean, distraction-free document canvas.

### Core Principles
1. **Document-First Typography**: Content is king. Generous line-heights, crisp sans-serif type, and clear heading hierarchies.
2. **Disciplined Minimalism**: Surfaces are calm, uncluttered, and functional. Contrast is achieved through subtle hairline borders, muted backgrounds, and deliberate color accents.
3. **Signature Color Moments**: The primary brand purple (`#5645d4`) and deep navy (`#0a1530`) are balanced by soft pastel card tints (peach, rose, mint, lavender, sky, cream).
4. **Structured Modularity**: Interfaces are organized into clean blocks, callouts, and rounded bento containers with consistent padding.
5. **Tactile Micro-Interactions**: Hover transitions, pill chips, and clear keyboard affordances (`⌘K`, shortcuts).

---

## 2. Color Tokens

### Primary & Brand Accents
| Token | Hex | Role |
|---|---|---|
| `--notion-purple` | `#5645d4` | Primary brand CTA, active links, focused states |
| `--notion-purple-hover` | `#4838bc` | Hover state for primary CTAs |
| `--notion-purple-light` | `rgba(86, 69, 212, 0.12)` | Subtle purple backgrounds, badge containers |
| `--notion-navy` | `#0a1530` | Deep contrast hero backdrops, dark banners |
| `--notion-navy-card` | `#0f1d40` | Elevated dark cards in navy containers |

### Neutral & Surface Scales (Dark & Light)

#### Dark Theme / Workspace Surfaces
| Token | Hex / Value | Usage |
|---|---|---|
| `--notion-bg-dark` | `#191919` | Main dark background canvas |
| `--notion-surface-dark` | `#202020` | Workspace cards, sidebar panels |
| `--notion-surface-hover-dark` | `#2c2c2c` | Hovered item highlight |
| `--notion-surface-elevated-dark` | `#262626` | Modals, popovers, command palette |
| `--notion-border-dark` | `rgba(255, 255, 255, 0.08)` | Hairline dividers and card outlines |
| `--notion-border-hover-dark` | `rgba(255, 255, 255, 0.18)` | Hovered card borders |
| `--notion-text-primary-dark` | `#ffffff` | Primary headings, titles |
| `--notion-text-secondary-dark` | `#9b9b9b` | Paragraphs, descriptions |
| `--notion-text-muted-dark` | `#6b6b6b` | Micro-copy, metadata, hotkeys |

#### Light Mode Workspace Surfaces
| Token | Hex / Value | Usage |
|---|---|---|
| `--notion-bg-light` | `#ffffff` | Clean document page canvas |
| `--notion-surface-light` | `#f7f6f3` | Subtle panel background, code blocks |
| `--notion-surface-hover-light` | `#efede8` | Table row hover, list hover |
| `--notion-border-light` | `rgba(55, 53, 47, 0.09)` | Standard hairline rule |
| `--notion-text-primary-light` | `#37352f` | Notion standard high-contrast charcoal |
| `--notion-text-secondary-light` | `#787774` | Subtitles and captions |

### Notion Pastel Palette (Feature & Category Chips)
| Color | Background (Light) | Dark Tint Overlay | Accent Border | Usage |
|---|---|---|---|---|
| **Mint / Green** | `#d3f9d8` | `rgba(34, 197, 94, 0.12)` | `#22c55e` | Success, verified, privacy badges |
| **Sky / Blue** | `#d0ebff` | `rgba(59, 130, 246, 0.12)` | `#3b82f6` | Essentials, conversions, links |
| **Lavender / Purple** | `#e8d9ff` | `rgba(139, 92, 246, 0.12)` | `#8b5cf6` | Edit tools, AI/Studio features |
| **Rose / Red** | `#ffd8d8` | `rgba(239, 68, 68, 0.12)` | `#ef4444` | Security, redaction, warnings |
| **Peach / Orange** | `#ffe8cc` | `rgba(249, 115, 22, 0.12)` | `#f97316` | Business tools, billing, stamps |
| **Cream / Yellow** | `#fff3bf` | `rgba(234, 179, 8, 0.12)` | `#eab308` | Highlights, OCR, notifications |

---

## 3. Typography Scale

Font Stack: `Inter, "Notion Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`  
Monospace: `ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace`

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-hero` | `56px` / `3.5rem` | `1.1` | `800` (Bold) | Hero main headline |
| `--text-h1` | `36px` / `2.25rem` | `1.2` | `700` (Bold) | Page titles |
| `--text-h2` | `24px` / `1.5rem` | `1.3` | `600` (SemiBold) | Section headers |
| `--text-h3` | `18px` / `1.125rem`| `1.4` | `600` (SemiBold) | Card titles |
| `--text-body` | `14px` / `0.875rem`| `1.5` | `400` (Regular) | Primary copy, tool descriptions |
| `--text-small` | `12px` / `0.75rem` | `1.4` | `400` / `500` | Secondary metadata, pills |
| `--text-micro` | `10px` / `0.625rem`| `1.3` | `600` (Bold Mono)| Category codes, shortcut keys |

---

## 4. Spacing Scale

Based on a standard 4px / 8px incremental grid with generous document gutters:

| Spacing Token | Value | Common Application |
|---|---|---|
| `space-1` | `4px` | Micro-pill padding, inline tag gaps |
| `space-2` | `8px` | Icon-to-text spacing, small button padding |
| `space-3` | `12px` | Input internal padding, chip margins |
| `space-4` | `16px` | Card internal padding (mobile), list gaps |
| `space-6` | `24px` | Standard Bento card padding |
| `space-8` | `32px` | Section margins, grid gaps |
| `space-12` | `48px` | Component block separation |
| `space-16` | `64px` | Major section gutters |
| `space-24` | `96px` | Hero section top/bottom padding |

---

## 5. Shape Language & Radii

| Radius Token | Value | Target Elements |
|---|---|---|
| `--radius-pill` | `9999px` | Badges, filter chips, search bar triggers |
| `--radius-sm` | `4px` | Tag chips, table cells, shortcut keys (`<kbd>`) |
| `--radius-md` | `8px` | Standard buttons, text inputs, dropdown menus |
| `--radius-lg` | `14px` | Tool cards, callout boxes, modal containers |
| `--radius-xl` | `22px` | Bento showcase containers, hero feature frames |

---

## 6. Shadows & Elevation

- **Elevation 0 (Flat)**: Hairline border with zero drop-shadow (`border: 1px solid rgba(255, 255, 255, 0.08)`).
- **Elevation 1 (Card Hover)**: `0 8px 24px -4px rgba(0, 0, 0, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.2)`.
- **Elevation 2 (Floating Popover / Modal)**: `0 20px 48px -8px rgba(0, 0, 0, 0.6), 0 4px 12px -2px rgba(0, 0, 0, 0.3)`.
- **Glow Accent Shadow**: `0 0 30px -4px rgba(86, 69, 212, 0.35)`.

---

## 7. Component Specifications

### 1. Primary "Notion Purple" Pill Button
- Height: `38px` (Medium) / `46px` (Large)
- Background: `#5645d4`
- Text: `#ffffff`, font-weight `600`, font-size `13px` / `14px`
- Radius: `8px` or `9999px` (Pill variant)
- Hover: `#4838bc`, subtle scale `1.01`, box-shadow `0 4px 14px rgba(86, 69, 212, 0.4)`

### 2. Secondary Ghost / Surface Button
- Background: `rgba(255, 255, 255, 0.05)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Text: `#fafafa`, hover background `rgba(255, 255, 255, 0.1)`

### 3. Bento Card Container
- Background: `#16161d` with `backdrop-filter: blur(12px)`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Corner Radius: `16px` to `20px`
- Padding: `24px`
- Hover: border changes to `rgba(86, 69, 212, 0.4)`, subtle translateY `-2px`

### 4. Notion Callout Block
- Background: `rgba(86, 69, 212, 0.08)`
- Border: `1px solid rgba(86, 69, 212, 0.25)`
- Left icon: Emoji or 18px Lucide icon in accent container
- Content: 13px clean text with bold lead-in title

### 5. Tag / Chip Pills
- Height: `22px`
- Radius: `4px` or `9999px`
- Typography: 11px font-medium
- Colors: Utilizes the Notion Pastel Palette (Mint, Sky, Lavender, Rose, Peach, Cream)

---

## 8. Implementation Guidelines for DocEditPro

1. **Keep Colors Consistent**: Map all UI themes to CSS variables in `src/app/globals.css`.
2. **Prioritize Performance**: Maintain 100% client-side WebAssembly execution without introducing blocking dependencies.
3. **Dark / High-Contrast Priority**: Dark mode by default with deep carbon surfaces, glowing hairline borders, and Notion Purple accent highlights.
4. **Strict Accessibility**: Ensure WCAG 2.1 AA compliant contrast ratios across all pastel chips and button text.
