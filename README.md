# DocEditPro — Privacy-First PDF & Document Toolkit

DocEditPro is a privacy-first, browser-based suite of 44 PDF utilities and 10 bonus productivity tools. All processing happens 100% client-side in your browser using WASM and client-side JavaScript. No file bytes are ever uploaded to any server.

## Core Principles
1. **100% Client-Side Privacy**: All processing runs locally in your browser using WebAssembly and Web Workers.
2. **Zero Server Uploads**: Your files never leave your device.
3. **No Paywalls or Watermarks**: Clean, high-quality document output with no branding inserted.
4. **Dark, Minimalist UI**: Crafted strictly following the `vercel.md` dark monochrome design system.

## Build Progress (100% Complete)

- [x] **Day 0**: Repo & Environment Setup
- [x] **Day 1**: Design System Foundation & App Shell
- [x] **Day 2**: File Handling & Preview Infrastructure
- [x] **Day 3**: Essentials Batch 1 (Merge & Split)
- [x] **Day 4**: Essentials Batch 2 (Compress, PDF to JPG, Images to PDF)
- [x] **Day 5**: Word ⇄ PDF (Word to PDF, PDF to Word)
- [x] **Day 6**: Organize & Transform Pages (Organize, Rotate, Crop & Resize)
- [x] **Day 7**: Annotate & Brand (Watermark, Page Numbers, Headers & Footers)
- [x] **Day 8**: Edit Text & OCR (Edit PDF Text, Extract Text, OCR, Inline Text Editing)
- [x] **Day 9**: Security & Privacy Suite (Encrypt, Remove Password, Redact, Flatten, Privacy Scanner)
- [x] **Day 10**: Create & Markup/Web Conversions (Create PDF, Markdown to PDF, HTML to PDF)
- [x] **Day 11**: Spreadsheet & Slide Conversions (Excel, CSV, PPTX conversions)
- [x] **Day 12**: E-Book, Web, Audio, Archival Conversions
- [x] **Day 13**: Scan, Share & Collaboration (Scan to PDF, P2P Share, Whiteboard)
- [x] **Day 14**: Business Tools (GST Invoice, POS Receipts, Fingerprint PDF)
- [x] **Day 15**: Compare & Repair PDFs
- [x] **Day 16**: Bonus Features (Command Palette, Recents, Batch Queue, Signatures, Form Filling, Bates, PDF/A)
- [x] **Day 17**: PWA, Accessibility & i18n
- [x] **Day 18**: SEO, Metadata & Guides
- [x] **Day 19**: Testing & Hardening
- [x] **Day 20**: Performance & Production Deploy

## Features Overview

### 🟢 Essentials
- **Merge PDF**: Combine multiple PDFs into a single organized document.
- **Compress PDF**: Reduce file size with Light, Medium, and Strong compression presets.
- **Split PDF**: Extract page ranges or burst all pages into individual files.
- **PDF to JPG**: Export pages as high-resolution JPG or PNG images.
- **Word to PDF / PDF to Word**: Bidirectional conversion between `.docx` and PDF.
- **Images to PDF**: Convert collections of JPG/PNG/WEBP images into a unified PDF.

### ✏️ Edit & Organize
- **PDF Studio Editor**: Edit existing text on any PDF, add new text, change/replace pictures, draw, stamp, sign, duplicate or add pages.
- **Organize Pages**: Visual drag-and-drop page reordering, rotation, and deletion.
- **Crop & Resize**: Adjust margins and resize pages to standard formats (A4, Letter, Legal).
- **Watermark & Page Numbers**: Add custom text/image watermarks and dynamic page numbering.
- **OCR Searchable PDF**: Convert scanned documents and images into searchable, selectable text.

### 🔐 Security & Privacy
- **Encrypt & Decrypt**: AES password protection and password removal.
- **Permanent Redaction**: Permanently mask and burn sensitive areas to prevent data leaks.
- **Flatten PDF**: Strip interactive forms, annotations, and scripts.
- **Privacy Scanner**: Detect and purge hidden EXIF metadata, author tags, and GPS coordinates.

### 🔄 Conversions & Business Suite
- **Spreadsheets & Slides**: Convert Excel/CSV and PowerPoint to/from PDF.
- **Markup & E-Books**: Markdown, HTML, EPUB, and MOBI conversion.
- **Audio & Accessibility**: Client-side Text-to-Speech audio reading.
- **GST Invoices & POS Billing**: Complete invoice generator with auto tax calculations and receipt printing.
- **P2P File Transfer & Whiteboard**: Direct browser-to-browser WebRTC encrypted file transfer and real-time collaboration.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the toolkit.
