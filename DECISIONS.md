# Architecture & Technical Decisions Log

This document records key architectural, design, and technical decisions made during the construction of DocEditPro.

---

## Decision 1: App Name and Branding
- **Decision**: Selected **DocEditPro** as the product name.
- **Rationale**: Clean, functional, modern identity that conveys document editing and privacy-first professional PDF utilities.

## Decision 2: Pure Client-Side Architecture
- **Decision**: 100% of PDF processing (parsing, rendering, splitting, merging, OCR, office conversion) runs client-side in the browser via WebAssembly & JavaScript libraries (`pdf-lib`, `pdfjs-dist`, `tesseract.js`, `mammoth`, `xlsx`, `docx`).
- **Rationale**: Ensures zero server bandwidth overhead, complete privacy guarantee (no user files ever touch a server), and offline-first capabilities.

## Decision 3: Next.js 15 App Router + Tailwind Design System
- **Decision**: Built on Next.js 15 App Router with Tailwind CSS implementing modern Bento 2.0 modular layouts and Notion Design System tokens.
- **Rationale**: Modern performance, standard component structure, fast route transitions, and WCAG AA accessible contrast levels.

## Decision 4: Interactive PDF Text Editing Strategy
- **Decision**: Direct text layer extraction via `pdfjs-dist` with coordinate mapping and automated underlying whiteout masks when editing original text.
- **Rationale**: Allows users to click and edit already-written text on existing PDF files without distorting document layout or requiring cloud AI APIs.

## Decision 5: Notion Design System & Tokens (DESIGN.md)
- **Decision**: Created and codified the project design language in `DESIGN.md` based on the official Notion Design System specification from DesignMD (Notion Purple `#5645d4`, Deep Navy `#0a1530`, pastel category chip palettes, 4px/8px/14px/22px corner radii, and disciplined document typography).
- **Rationale**: Acts as the single source of truth for UI components, color tokens, and styling guidelines.
