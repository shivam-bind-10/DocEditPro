# PDF Toolkit — Build Plan for Coding Agent

> **Read this entire document before writing any code.** It defines the product, the tech stack, every feature to build, the git workflow, and a day-by-day execution sequence. Work through the days in order. At the end of each day, commit and push directly to `main` as instructed in the Git Workflow section — do not wait for confirmation between days.

---

## 0. What We're Building

A privacy-first, browser-based PDF toolkit inspired by **ihatepdf.cv** — a suite of PDF utilities that run entirely client-side (no file ever touches a server), with no watermarks, no sign-up, and no paywalls.

We are **replicating its full non-AI feature set** and **explicitly excluding its two AI-dependent tools** ("Chat with PDF" and "AI Summarizer" — both require an LLM API and are out of scope for this build). Everything else — 44 tools across 6 categories — is in scope, plus 10 original bonus features listed in Section 4.

**Pick your own product name and visual identity.** Do not reuse the name "ihatepdf," its logo, or its exact brand colors — the feature set is generic/functional and fine to rebuild, but the brand identity is not ours to copy. Replace `{{APP_NAME}}` throughout this doc and the codebase with your chosen name.

### Core principles (non-negotiable)
1. **Everything is client-side.** All parsing, editing, converting, and generating happens in the browser using WASM/JS libraries. No file bytes are ever sent to a server or third-party API. This is the entire trust proposition of the product — do not violate it, even for a tool that would be "easier" server-side.
2. **No AI/LLM features.** Do not integrate OpenAI, Anthropic, Gemini, or any hosted inference API for document understanding, chat, or summarization. If a stretch feature seems to need it, cut the feature or find a non-AI/algorithmic approach instead.
3. **Dark, professional, simple.** One dark theme, one accent color, no clutter. Follow `vercel.md` exactly for all visual decisions.
4. **Every tool is a complete, working feature** — upload → configure → process → preview → download — not a stub or a "coming soon" placeholder.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives), theme per `vercel.md` |
| Icons | lucide-react |
| State | Zustand (app state), React Context (theme/prefs) |
| Local persistence | IndexedDB via `idb` (recent files, signatures, saved presets — never file uploads to a server) |
| PDF core | `pdf-lib` (create/merge/split/rotate/encrypt/watermark/page numbers), `pdfjs-dist` (render/preview/text extraction) |
| OCR | `tesseract.js` (WASM, runs in a Web Worker) |
| Office conversions | `mammoth` (.docx → HTML), `docx` (generate .docx), `xlsx` / SheetJS (Excel & CSV) |
| HTML/Markdown → PDF | `marked` or `remark` + `html2canvas` + `jspdf` (or a pdf-lib based HTML renderer) |
| Archives | `jszip` |
| Rich text editor | TipTap (for the "Create PDF" tool) |
| Drag & drop reorder | `dnd-kit` |
| Diffing | `diff-match-patch` (for Compare PDFs — no AI needed) |
| P2P / real-time | `peerjs` (WebRTC data channels) for P2P Share and the Collaborative Whiteboard — the public PeerJS broker only relays connection handshake metadata, never file/canvas data, which stays peer-to-peer |
| Testing | Vitest + React Testing Library (unit), Playwright (e2e smoke tests) |
| Deployment | Vercel |
| Analytics | Vercel Analytics or Plausible — cookie-free, no third-party trackers |

Package manager: npm. Node LTS.

---

## 2. Architecture Notes

- Every tool lives at its own route: `/tools/<tool-slug>` (or top-level `/<tool-slug>` to mirror clean URLs like the original — pick one pattern and use it consistently across all 44 pages).
- Shared components (built once on Day 2, reused everywhere): `FileDropzone`, `PdfThumbnailGrid`, `ProcessingOverlay`, `ResultDownloadCard`, `ToolPageShell` (title + description + options panel + action button layout).
- Heavy operations (OCR, large merges, image re-encoding) run inside a **Web Worker** so the UI thread never freezes.
- No API routes handle file bytes. If you find yourself writing an `app/api/*` route that accepts a file upload, stop — that breaks the core privacy principle.
- SEO: each tool page needs its own `<title>`, meta description, and OpenGraph tags (see Day 18).

### Suggested folder structure
```
{{APP_NAME}}/
├─ app/
│  ├─ (marketing)/page.tsx          # homepage
│  ├─ tools/[slug]/page.tsx or /tools/<slug>/page.tsx per tool
│  ├─ guides/                       # how-to articles (Day 18)
│  └─ layout.tsx
├─ components/
│  ├─ ui/                           # shadcn primitives
│  ├─ shared/                       # FileDropzone, PdfThumbnailGrid, etc.
│  └─ tools/<tool-slug>/            # tool-specific UI
├─ lib/
│  ├─ pdf/                          # pdf-lib & pdfjs helpers
│  ├─ convert/                      # docx/xlsx/epub/etc. helpers
│  ├─ workers/                      # web worker entry files
│  └─ storage/                      # IndexedDB wrapper
├─ public/
├─ vercel.md
├─ BUILD-PLAN.md
├─ DECISIONS.md                     # log non-obvious architectural choices as you go
└─ README.md
```

---

## 3. Full Feature List (44 tools — everything except AI tools)

Legend: 🟢 Essentials · ✏️ Edit & Organize · 🔐 Security & Privacy · 🔄 Convert & Export · 📷 Scan & Share · 🧾 Business

| # | Tool | Route | Notes |
|---|---|---|---|
| 1 | 🟢 Merge PDF | `/merge-pdf` | Multi-file upload, drag-reorder, unlimited files |
| 2 | 🟢 Compress PDF | `/compress-pdf` | Light/Medium/Heavy presets, show before/after size |
| 3 | 🟢 Split PDF | `/split-pdf` | Extract page ranges or split into individual pages, zip output |
| 4 | 🟢 PDF to JPG | `/pdf-to-jpg` | Up to 600 DPI, JPG or PNG, zip output |
| 5 | 🟢 Word to PDF | `/word-to-pdf` | .doc/.docx via mammoth → PDF |
| 6 | 🟢 PDF to Word | `/pdf-to-word` | Export editable .docx |
| 7 | 🟢 Images to PDF | `/images-to-pdf` | Batch JPG/PNG → single PDF |
| 8 | ✏️ Edit PDF Text | `/edit-pdf-text` | Click-to-edit text layer, add text boxes/images, draw/upload signature |
| 9 | ✏️ Organize Pages | `/organize-pages` | Reorder, rotate, delete via drag & drop |
| 10 | ✏️ Rotate PDF | `/rotate-pdf` | Whole doc or per-page, 90/180/270° |
| 11 | ✏️ Crop & Resize | `/crop-resize-pdf` | Crop margins, resize to A4/Letter/custom |
| 12 | ✏️ Add Watermark | `/add-watermark` | Text or image, opacity/position/rotation |
| 13 | ✏️ Add Page Numbers | `/page-numbers` | Format, position, start number |
| 14 | ✏️ Headers & Footers | `/headers-footers` | Text/date/page tokens |
| 15 | ✏️ Extract Text | `/extract-text` | Copy/download plain text from the text layer |
| 16 | ✏️ OCR — Searchable PDF | `/ocr-pdf` | tesseract.js in a Web Worker, language selector |
| 17 | 🔐 Encrypt PDF | `/encrypt-pdf` | AES-256 password protection |
| 18 | 🔐 Remove Password | `/remove-password` | Client-side decrypt with supplied password |
| 19 | 🔐 Redact PDF | `/redact-pdf` | Draw black-box redaction, burn pixels (permanent, not just an overlay) |
| 20 | 🔐 Flatten PDF | `/flatten-pdf` | Strip form fields/annotations/scripts |
| 21 | 🔐 Privacy Risk Scanner | `/privacy-scanner` | Surface hidden author/GPS/EXIF/metadata, strip & re-download clean |
| 22 | 🔄 Create PDF | `/create-pdf` | Rich text editor (TipTap) → PDF |
| 23 | 🔄 Markdown to PDF | `/markdown-to-pdf` | .md → styled PDF |
| 24 | 🔄 HTML to PDF | `/html-to-pdf` | Paste HTML or upload file, CSS preserved |
| 25 | 🔄 Excel to PDF | `/excel-to-pdf` | .xlsx/.xls → formatted PDF tables |
| 26 | 🔄 CSV to PDF | `/csv-to-pdf` | Auto-detect headers, clean table output |
| 27 | 🔄 PowerPoint to PDF | `/pptx-to-pdf` | .pptx/.ppt → PDF |
| 28 | 🔄 PDF to PowerPoint | `/pdf-to-pptx` | Each page → editable slide |
| 29 | 🔄 PDF to Excel | `/pdf-to-excel` | Table detection/extraction → .xlsx |
| 30 | 🔄 PDF to HTML | `/pdf-to-html` | Text layer → semantic HTML |
| 31 | 🔄 PDF to EPUB | `/pdf-to-epub` | For e-readers |
| 32 | 🔄 eBook to PDF | `/ebook-to-pdf` | EPUB/MOBI/AZW3 → PDF |
| 33 | 🔄 PDF to Audio | `/pdf-to-audio` | Browser-native Speech Synthesis (not a cloud AI service) reads the text aloud; record via MediaRecorder for download |
| 34 | 🔄 Audio to PDF | `/audio-to-pdf` | **Optional/stretch.** Uses the browser's built-in speech-recognition API where supported. Flag clearly in the UI that this may require an internet connection (unlike every other tool). If it conflicts with the "always offline" promise, cut it. |
| 35 | 🔄 PDF to ZIP | `/pdf-to-zip` | All pages as images, zipped |
| 36 | 🔄 Invert PDF Colors | `/invert-pdf` | Dark mode/sepia/grayscale, text stays selectable |
| 37 | 📷 Scan to PDF | `/scan-to-pdf` | Camera/webcam capture, auto-crop & deskew, multi-page session |
| 38 | 📷 P2P Share | `/p2p-share` | WebRTC browser-to-browser transfer, no server storage of file data |
| 39 | 📷 Collaborative Whiteboard | `/collab-whiteboard` | Real-time shared canvas via WebRTC, link-based, no sign-up |
| 40 | 🧾 GST Invoice Generator | `/gst-invoice` | CGST/SGST/IGST auto-calculated, saved business profile locally |
| 41 | 🧾 POS Billing | `/pos-billing` | Product/cart management, thermal-printer-friendly receipt output |
| 42 | 🧾 Fingerprint PDF | `/fingerprint-pdf` | Invisible per-copy tracking marks to trace document leaks |
| 43 | Compare PDFs | `/compare-pdfs` | Side-by-side sync-scroll + text diff highlighting (`diff-match-patch` — algorithmic, not AI) |
| 44 | Repair PDF | `/repair-pdf` | Multi-strategy recovery: rebuild xref table, salvage streams, reconstruct page tree — heuristic, not AI |

### Explicitly excluded (AI-dependent — do not build)
- ❌ Chat with PDF (AI) — required an LLM API
- ❌ AI PDF Summarizer — required an LLM API

---

## 4. Bonus Features (beyond the original site)

These extend the same "fast, private, no-nonsense" positioning without adding any AI dependency:

1. **Command palette** (⌘K / Ctrl+K) — fuzzy search across all 44 tools, launch instantly
2. **Recent Files / local history** — stored in IndexedDB only, one-click "Clear my data"
3. **Batch/bulk queue** — apply one operation (e.g. compress, watermark) across many files in one pass
4. **Reusable signature & initials library** — draw/type/upload once, reuse across every tool that needs a signature
5. **PDF form filling** — detect and fill existing AcroForm fields (complements the existing Flatten tool)
6. **Bates numbering** — sequential numbering across a set of documents, common in legal/business workflows
7. **PDF/A export** — archival-format output for long-term compliance storage
8. **Full keyboard navigation + WCAG 2.1 AA accessibility** — every tool usable without a mouse or with a screen reader
9. **Installable PWA** — offline-first app shell caching, works after first load with no connection
10. **Cookie-free analytics** — Vercel Analytics or Plausible only, no third-party trackers, consistent with the privacy pitch

---

## 5. Git & Deployment Workflow — read carefully, this is how you must operate

1. If no repo exists yet: `git init`, then create a GitHub remote (`gh repo create {{APP_NAME}} --public --source=. --push` or `git remote add origin <url>`).
2. **Work directly on `main`.** No feature branches, no pull requests — this is a solo autonomous build.
3. At the end of **every day/phase** below:
   - Run `npm run lint && npm run build` (and `npm test` once tests exist) to confirm nothing is broken.
   - `git add -A`
   - `git commit -m "<message given in that day's section>"`
   - `git push origin main` — **push immediately, do not pause for confirmation or review.**
4. Use Conventional Commit prefixes: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`.
5. If a push is rejected because the remote has moved on, `git pull --rebase origin main`, resolve any conflicts yourself, and push again — don't stop and ask.
6. Confirm `.gitignore` excludes `node_modules`, `.next`, `.env*`, and OS/editor cruft before the first commit.
7. Update `README.md`'s progress checklist and append any non-obvious decisions to `DECISIONS.md` after each day.

---

## 6. Day-by-Day Execution Plan

Work through these in order. Each day ends with a commit + push per Section 5. Treat "Day" as a unit of work, not a literal calendar day — move to the next day as soon as the current one's Definition of Done is met.

### Day 0 — Repo & Environment Setup
- `npx create-next-app@latest` (TypeScript, Tailwind, App Router, ESLint)
- `npx shadcn@latest init`
- Install: `pdf-lib pdfjs-dist tesseract.js mammoth docx xlsx jszip jspdf html2canvas marked dnd-kit diff-match-patch peerjs idb zustand lucide-react`
- Set up the folder structure from Section 2
- Add `.gitignore`, `README.md` stub, `MIT LICENSE`, `DECISIONS.md`
- **Commit:** `chore: project scaffold and dependencies`

### Day 1 — Design System Foundation
- Implement `vercel.md` tokens as Tailwind theme + CSS variables
- Build themed primitives: Button, Card, Input, Dialog, Toast, Progress, Badge, Tooltip
- Build app shell: header (logo, nav, ⌘K trigger), footer (grouped tool links)
- Build homepage: hero, category grid, privacy/no-watermark messaging (original copy)
- **Commit:** `feat: design system and app shell`

### Day 2 — File Handling Infrastructure
- `FileDropzone` (drag & drop, click-to-browse, clipboard paste, "add from URL")
- File validation utils + toast errors
- IndexedDB wrapper (`lib/storage`) for Recent Files + Clear Data control
- `PdfThumbnailGrid` (pdfjs-dist render, dnd-kit reorder)
- `ProcessingOverlay` (progress %, cancel)
- Web Worker pattern for offloading heavy ops
- **Commit:** `feat: core file handling and preview infrastructure`

### Day 3 — Essentials Batch 1: Merge & Split
- Build tools #1 Merge PDF, #3 Split PDF
- Unit tests for merge/split utils
- **Commit:** `feat(tools): merge-pdf, split-pdf`

### Day 4 — Essentials Batch 2
- Build tools #2 Compress PDF, #4 PDF to JPG, #7 Images to PDF
- **Commit:** `feat(tools): compress-pdf, pdf-to-jpg, images-to-pdf`

### Day 5 — Word ⇄ PDF
- Build tools #5 Word to PDF, #6 PDF to Word
- **Commit:** `feat(tools): word-to-pdf, pdf-to-word`

### Day 6 — Organize & Transform Pages
- Build tools #9 Organize Pages, #10 Rotate PDF, #11 Crop & Resize
- **Commit:** `feat(tools): organize-pages, rotate-pdf, crop-resize-pdf`

### Day 7 — Annotate & Brand
- Build tools #12 Add Watermark, #13 Add Page Numbers, #14 Headers & Footers
- **Commit:** `feat(tools): add-watermark, page-numbers, headers-footers`

### Day 8 — Edit Text & OCR
- Build tools #8 Edit PDF Text (integrate the signature library bonus feature here), #15 Extract Text, #16 OCR PDF
- **Commit:** `feat(tools): edit-pdf-text, extract-text, ocr-pdf`

### Day 9 — Security & Privacy Suite
- Build tools #17–21: Encrypt, Remove Password, Redact, Flatten, Privacy Scanner
- **Commit:** `feat(tools): encrypt, remove-password, redact, flatten, privacy-scanner`

### Day 10 — Create & Markup/Web Conversions
- Build tools #22 Create PDF, #23 Markdown to PDF, #24 HTML to PDF
- **Commit:** `feat(tools): create-pdf, markdown-to-pdf, html-to-pdf`

### Day 11 — Spreadsheet & Slide Conversions
- Build tools #25 Excel to PDF, #26 CSV to PDF, #27 PowerPoint to PDF, #28 PDF to PowerPoint, #29 PDF to Excel
- **Commit:** `feat(tools): excel/csv/pptx conversions`

### Day 12 — E-book, Web, Audio, Archival
- Build tools #30 PDF to HTML, #31 PDF to EPUB, #32 eBook to PDF, #33 PDF to Audio, #34 Audio to PDF (or cut, per notes above), #35 PDF to ZIP, #36 Invert PDF
- **Commit:** `feat(tools): ebook/html/audio/zip/invert conversions`

### Day 13 — Scan, Share & Collaboration
- Build tools #37 Scan to PDF, #38 P2P Share, #39 Collaborative Whiteboard
- **Commit:** `feat(tools): scan-to-pdf, p2p-share, collab-whiteboard`

### Day 14 — Business Tools
- Build tools #40 GST Invoice, #41 POS Billing, #42 Fingerprint PDF
- **Commit:** `feat(tools): gst-invoice, pos-billing, fingerprint-pdf`

### Day 15 — Compare & Repair (non-AI)
- Build tools #43 Compare PDFs, #44 Repair PDF
- **Commit:** `feat(tools): compare-pdfs, repair-pdf`

### Day 16 — Bonus Features Round
- Command palette, Recent Files panel, Batch/bulk queue mode, Signature library (if not already fully wired), Form filling, Bates numbering, PDF/A export option
- **Commit:** `feat: command palette, recents, batch queue, signatures, form-fill, bates, pdf-a`

### Day 17 — PWA, Accessibility, i18n Scaffold
- Service worker + manifest, offline app-shell caching
- Full keyboard nav + ARIA audit (WCAG 2.1 AA), skip-to-content, reduced-motion support
- i18n scaffold (structure only, English content)
- **Commit:** `feat: pwa, accessibility pass, i18n scaffold`

### Day 18 — SEO, Content & Analytics
- Per-tool metadata, `sitemap.xml`, `robots.txt`
- A handful of original how-to guide pages (do not copy competitor copy)
- Wire up cookie-free analytics
- **Commit:** `feat: seo metadata, sitemap, guides, analytics`

### Day 19 — Testing & Hardening
- Vitest coverage for all `lib/pdf` and `lib/convert` utils
- Playwright smoke tests: upload → process → download for at least 10 representative tools
- Large-file stress test (100–150MB), confirm Web Worker offload keeps UI responsive
- Error boundaries + friendly fallback UI for corrupted files/unsupported browsers
- **Commit:** `test: unit and e2e coverage, error handling hardening`

### Day 20 — Performance & Production Deploy
- Lighthouse pass, target 90+ on Performance/Accessibility/Best Practices/SEO
- Code-split per route, lazy-load heavy libs (tesseract.js, pdfjs workers)
- Configure `vercel.json`, connect the Vercel project, verify production build
- Update `README.md` with the live URL and local setup instructions
- **Commit:** `chore: performance pass and production deploy`

---

## 7. Definition of Done (whole project)

- [ ] All 44 non-AI tools are fully functional, 100% client-side, no server file upload
- [ ] Zero AI/LLM API calls anywhere in the codebase
- [ ] UI matches `vercel.md` across every page — dark, consistent, professional
- [ ] All 10 bonus features implemented
- [ ] Lighthouse 90+ across the board
- [ ] Deployed and reachable on a live Vercel URL
- [ ] Every day's work is committed and pushed to `main` per Section 5
