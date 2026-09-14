# vercel.md — UI Design System

> Design reference for {{APP_NAME}}. Inspired by the minimal, monochrome-first aesthetic popularized by Vercel/Geist — **not** a reproduction of Vercel's brand. Do not use Vercel's logo, wordmark, or exact brand colors. Everything below is an original token set in a similar style.

## 1. Philosophy

- **Monochrome first, one accent.** The interface is black/white/gray. Color is used only for the single accent, and for semantic states (success/warning/danger).
- **Borders over shadows.** Elevation comes from a 1px border and a subtle background-color shift, not drop shadows. Use shadow only as a soft hover accent, never as the primary depth cue.
- **Content first.** No hero illustrations, no gradients, no decorative graphics. The tool grid and the dropzone are the stars of every page.
- **Fast and quiet.** Motion is short (150–200ms), functional, and never bouncy or playful. Respect `prefers-reduced-motion`.
- **Consistency over novelty.** All 44 tool pages share one layout template. A user should be able to predict where everything is after visiting one tool page.

## 2. Color Tokens

Define as CSS variables in `globals.css` and mirror in `tailwind.config` (`theme.extend.colors`).

```css
:root {
  /* Backgrounds */
  --background: #000000;        /* page background */
  --surface: #0a0a0a;           /* cards, panels */
  --surface-hover: #111111;
  --surface-elevated: #141414;  /* modals, popovers */

  /* Borders */
  --border: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.16);

  /* Foreground */
  --foreground: #fafafa;
  --muted-foreground: #a1a1a1;
  --subtle-foreground: #6e6e6e;

  /* Accent — used sparingly: primary buttons, links, active states, focus rings */
  --accent: #3b82f6;
  --accent-hover: #60a5fa;
  --accent-foreground: #ffffff;

  /* Semantic */
  --success: #22c55e;
  --warning: #eab308;
  --danger: #ef4444;

  /* Focus ring (accessibility) */
  --ring: #3b82f6;
}
```

Rules:
- Never introduce a second accent color. Category badges, icons, etc. all use the same `--accent` at different opacities (10%, 20%, 100%) rather than new hues.
- Body text is `--foreground`; secondary/help text is `--muted-foreground`; disabled/placeholder text is `--subtle-foreground`.
- Minimum contrast: body text on background must meet WCAG AA (4.5:1). `--foreground` on `--background` easily clears this; don't drop below `--muted-foreground` for anything readable.

## 3. Typography

- **UI font:** Geist Sans (via `next/font/google` fallback to Inter if Geist isn't available in your setup)
- **Code/mono font:** Geist Mono (fallback: ui-monospace)

| Token | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| display | 48px / 3rem | 600 | 1.1 | Homepage hero only |
| h1 | 32px / 2rem | 600 | 1.2 | Page titles |
| h2 | 24px / 1.5rem | 600 | 1.3 | Section headers |
| h3 | 18px / 1.125rem | 600 | 1.4 | Card titles |
| body | 15px | 400 | 1.6 | Default text |
| small | 13px | 400 | 1.5 | Captions, help text |
| mono | 13px | 400 | 1.5 | File names, technical values |

Keep line length readable: max-width `65ch` for prose blocks (guides, about pages).

## 4. Spacing & Layout

- Base unit: 4px (Tailwind default scale — use it as-is, don't invent a custom scale).
- Page content max-width: `1200px`, centered, `px-6` on mobile / `px-8` on desktop.
- Section vertical rhythm: `py-16` between major homepage sections, `py-8` inside a tool page.
- Tool grid: 1 column mobile → 2 columns `sm` → 3 columns `lg` → 4 columns `xl`.

## 5. Radius & Elevation

- `radius-sm`: 6px — inputs, badges, small buttons
- `radius-md`: 8px — cards, dropzones, buttons
- `radius-lg`: 12px — modals, large panels

Elevation = `1px solid var(--border)` + `background: var(--surface)`. On hover, transition `border-color` to `var(--border-hover)` and background to `var(--surface-hover)` over 150ms. Reserve `box-shadow` for floating elements only (dropdowns, modals): `0 8px 24px rgba(0,0,0,0.4)`.

## 6. Components

### Button
- **Primary**: `background: var(--accent)`, white text, `radius-md`, hover → `var(--accent-hover)`
- **Secondary**: transparent background, `1px solid var(--border)`, `--foreground` text, hover → `var(--surface-hover)`
- **Ghost**: no border, no background, `--muted-foreground` text, hover → `--foreground` + `var(--surface-hover)`
- **Destructive**: `var(--danger)` background, used only for irreversible actions (delete file, clear all data)
- Sizes: `sm` (32px height), `md` (40px height, default), `lg` (48px height, used for the main CTA on a tool page)
- Every button needs a visible focus ring (`outline: 2px solid var(--ring); outline-offset: 2px`) for keyboard users.

### Tool Card (homepage/category grid)
```
┌─────────────────────────────┐
│ [icon chip]                 │
│ Tool Name                   │
│ One-line description        │
└─────────────────────────────┘
```
- `radius-md`, `1px solid var(--border)`, padding `p-5`
- Icon chip: 40x40px, `radius-sm`, background `var(--accent)` at 12% opacity, icon in `var(--accent)`, lucide-react icon size 20, stroke-width 1.75
- Hover: border → `var(--border-hover)`, subtle `translateY(-2px)` (150ms ease-out), never a shadow pop that feels "bouncy"

### Dropzone (FileDropzone component)
- Dashed `2px` border in `var(--border)`, `radius-md`, generous padding (`p-12`), centered icon + "Drag files here or click to browse" + muted helper text (accepted types/size limit)
- Drag-active state: border becomes solid `var(--accent)`, background tint `var(--accent)` at 6% opacity
- Error state (wrong file type): border `var(--danger)`, inline error text below

### Progress / Processing Overlay
- Thin 2px progress bar, track = `var(--border)`, fill = `var(--accent)`, rounded ends
- Percentage label in mono font
- Cancel button as `ghost` variant, top-right of the overlay

### Toast
- Bottom-right stack, `var(--surface-elevated)` background, `1px solid var(--border)`, `radius-md`, left-edge 3px accent bar colored by type (`--accent` info, `--success`, `--warning`, `--danger`)

### Modal / Dialog
- Centered, `var(--surface-elevated)`, `radius-lg`, `max-width: 480px` for confirmations / `720px` for tool option panels, backdrop `rgba(0,0,0,0.6)` with blur(4px)

### Navbar
- Height 64px, `border-bottom: 1px solid var(--border)`, sticky
- Left: wordmark (text-based, no illustrated logo needed — keep it typographic)
- Center/right: primary nav links (Tools, Guides), a visible "⌘K search" pill button, GitHub icon link
- Background: `var(--background)` with slight blur when scrolled (`backdrop-filter: blur(8px)`, background at 80% opacity)

### Footer
- `border-top: 1px solid var(--border)`, tool links grouped by the 6 categories, muted text, small font size

### Tool Page Template (use for all 44 tool pages)
1. Breadcrumb (Home / Category / Tool)
2. `h1` tool name + one-sentence description (muted-foreground)
3. `FileDropzone`
4. Options panel (appears once a file is loaded) — checkboxes/sliders/inputs specific to that tool, in a bordered card
5. Primary CTA button (`lg`, primary variant) — "Merge PDFs", "Compress PDF", etc., not a generic "Submit"
6. Result state: `ResultDownloadCard` — filename, resulting size, Download button (primary), "Start over" (ghost)

Every tool page is this same skeleton with a different options panel — do not let any individual tool invent its own one-off layout.

## 7. Motion

- Standard transition: `150ms ease-out` for hover/focus states
- Page/route transitions: none or a 200ms fade — no slide/zoom page transitions
- Respect `prefers-reduced-motion: reduce` — disable all non-essential transitions when set

## 8. Iconography

- `lucide-react` exclusively, stroke-width 1.75, default size 20px (24px in nav/headers)
- One icon per tool card, chosen for immediate recognizability (e.g. `Merge` → `Combine`, `Split` → `Scissors`, `Lock` → `Lock`, `OCR` → `ScanText`)
- Icons are always monochrome (`currentColor`), colored via the parent's text color, never multi-color icon sets

## 9. Responsive Rules

- Mobile-first Tailwind breakpoints: default (< 640px), `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Dropzone and options panel stack vertically below `md`
- Command palette becomes a full-screen sheet below `sm`
- Tap targets minimum 40px height on touch devices

## 10. Do's and Don'ts

**Do**
- Reuse the shared component library for every one of the 44 tools
- Keep copy short, direct, and specific ("Merge PDFs" not "Submit")
- Maintain AA contrast everywhere, including muted text
- Keep the whole site to one dark theme — no light-mode toggle (per product spec)

**Don't**
- Don't add gradients, neon colors, or decorative illustrations
- Don't introduce a second accent color anywhere
- Don't use Vercel's actual logo, triangle mark, or exact brand palette — this is an inspired-by system, not a clone
- Don't let any tool page deviate from the shared Tool Page Template
- Don't use drop shadows as the primary elevation cue — borders first
