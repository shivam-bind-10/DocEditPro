import * as React from "react";
import Link from "next/link";
import { BookOpen, ShieldCheck, FileText, ArrowRight, Sparkles, CheckCircle2, Lock, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "PDF Guides & Tutorials — DocEditPro",
  description: "Learn how to edit, convert, compress, redact, and protect PDFs 100% in your browser with no file uploads.",
};

const GUIDES = [
  {
    slug: "how-to-edit-pdf-text",
    title: "How to Edit Existing Text in a PDF Without Adobe Acrobat",
    category: "Editing",
    readTime: "3 min read",
    summary:
      "A step-by-step guide to modifying already-written text, fixing typos, and changing typography directly inside any PDF in your web browser with complete privacy.",
    targetTool: "/edit-pdf-text",
    toolName: "PDF Editor",
    steps: [
      "Open the DocEditPro PDF Editor and drop or select your PDF file.",
      "The editor automatically extracts the text layer and highlights existing text lines.",
      "Click or double-click directly on any text block you want to edit.",
      "A clean background mask is applied and you can rewrite, delete, or reformat the text inline.",
      "Customize the font family, font size, bold/italic, alignment, and color from the top bar.",
      "Click 'Save & Download PDF' to export the updated document immediately.",
    ],
  },
  {
    slug: "how-to-compress-pdf-without-losing-quality",
    title: "How to Reduce PDF File Size Offline for Email & Web",
    category: "Optimization",
    readTime: "2 min read",
    summary:
      "Learn how to compress oversized PDFs locally using raster downsampling and stream compression without sending sensitive documents to external servers.",
    targetTool: "/compress-pdf",
    toolName: "Compress PDF",
    steps: [
      "Navigate to the Compress PDF utility on DocEditPro.",
      "Upload your PDF document (multi-page files supported).",
      "Choose a compression preset: Light (highest visual fidelity), Medium (recommended for email), or Strong (maximum reduction).",
      "Review the live before and after size comparison.",
      "Download your optimized, lightweight PDF ready for sharing.",
    ],
  },
  {
    slug: "how-to-permanently-redact-sensitive-pdf-data",
    title: "True PDF Redaction: How to Permanently Remove Confidential Data",
    category: "Security",
    readTime: "4 min read",
    summary:
      "Why standard black highlighter overlays leave underlying text selectable, and how true pixel-burn redaction guarantees permanent data erasure.",
    targetTool: "/redact-pdf",
    toolName: "Redact PDF",
    steps: [
      "Open the Redact PDF tool in DocEditPro.",
      "Drag a black box over credit card numbers, SSNs, names, or trade secrets.",
      "Click 'Apply Redaction & Burn Pixels'.",
      "The underlying PDF vectors and text glyphs are stripped and rewritten as clean raster blocks.",
      "Verify the output: text underneath cannot be highlighted, copied, or recovered by any PDF inspector.",
    ],
  },
  {
    slug: "how-to-convert-word-to-pdf-offline",
    title: "How to Convert DOCX to PDF Locally Without Office 365",
    category: "Conversions",
    readTime: "3 min read",
    summary:
      "Convert Word (.docx/.doc) files into clean, shareable PDFs in seconds using client-side JavaScript rendering.",
    targetTool: "/word-to-pdf",
    toolName: "Word to PDF",
    steps: [
      "Go to the Word to PDF converter tool.",
      "Select your `.docx` file from your device.",
      "The local parser processes styles, headings, tables, and paragraphs client-side.",
      "Preview the converted document on the interactive viewer.",
      "Download the PDF with standard formatting preserved.",
    ],
  },
  {
    slug: "legal-bates-numbering-guide",
    title: "Bates Numbering for Legal Discovery and Corporate Filings",
    category: "Legal & Business",
    readTime: "3 min read",
    summary:
      "How attorneys, paralegals, and auditors use sequential Bates stamps (prefix, suffix, start index) across document batches.",
    targetTool: "/bates-numbering",
    toolName: "Bates Numbering",
    steps: [
      "Open the Bates Numbering tool.",
      "Specify your Prefix (e.g., 'CONF-DOC-'), Start Index (e.g., 1001), and Number of Digits.",
      "Select position (Bottom-Right, Top-Right, Bottom-Center).",
      "Process the document to apply sequential identification codes across all pages.",
      "Export the compliance-ready indexed PDF.",
    ],
  },
  {
    slug: "how-to-fill-and-flatten-pdf-forms",
    title: "How to Fill Interactive PDF Forms and Flatten Them for Archival",
    category: "Productivity",
    readTime: "2 min read",
    summary:
      "Easily fill text inputs, checkboxes, and radio buttons in government and corporate AcroForms, then flatten them to prevent tampering.",
    targetTool: "/fill-form",
    toolName: "Fill Form",
    steps: [
      "Select the Fill PDF Form tool.",
      "DocEditPro scans the AcroForm dictionary and generates clean web input fields.",
      "Fill out text boxes, toggle checkmarks, and select options.",
      "Optionally apply 'Flatten PDF' to burn fields permanently into the page canvas.",
      "Save your completed, tamper-proof document.",
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-medium">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Practical How-To Guides & Tutorials</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Master Your PDF Workflows with 100% Privacy
        </h1>
        <p className="text-base text-[var(--muted-foreground)]">
          Comprehensive step-by-step guides for editing text, converting formats, compressing files,
          and securing documents directly in your browser.
        </p>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GUIDES.map((guide) => (
          <Card
            key={guide.slug}
            className="flex flex-col justify-between p-6 bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-hover)] transition-all hover:shadow-lg rounded-[var(--radius-md)]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--foreground)] border border-[var(--border)] font-medium">
                  {guide.category}
                </span>
                <span className="text-[var(--muted-foreground)] font-mono">{guide.readTime}</span>
              </div>

              <h2 className="font-bold text-lg leading-snug hover:text-[var(--accent)] transition-colors">
                {guide.title}
              </h2>

              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                {guide.summary}
              </p>

              {/* Steps overview */}
              <div className="pt-2 border-t border-[var(--border)] space-y-2">
                <span className="text-[11px] font-semibold text-[var(--foreground)] block uppercase tracking-wider">
                  Quick Steps:
                </span>
                <ol className="space-y-1 text-xs text-[var(--muted-foreground)]">
                  {guide.steps.slice(0, 3).map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start space-x-2">
                      <span className="text-[var(--accent)] font-bold font-mono">{sIdx + 1}.</span>
                      <span className="line-clamp-1">{step}</span>
                    </li>
                  ))}
                  {guide.steps.length > 3 && (
                    <li className="text-[11px] text-[var(--muted-foreground)] font-italic">
                      + {guide.steps.length - 3} more steps in tool
                    </li>
                  )}
                </ol>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-[var(--border)]">
              <Link href={guide.targetTool} className="w-full">
                <Button variant="primary" size="sm" className="w-full text-xs flex items-center justify-center space-x-1.5">
                  <span>Open {guide.toolName}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Privacy Banner */}
      <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[var(--accent)]">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="font-bold text-base text-[var(--foreground)]">Zero Server Uploads Guarantee</h3>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] max-w-xl">
            Every operation in these guides runs 100% inside your local web browser using WebAssembly.
            Your confidential documents, contracts, medical records, and financial statements never touch an external cloud or server.
          </p>
        </div>

        <Link href="/edit-pdf-text">
          <Button variant="outline" size="sm" className="whitespace-nowrap text-xs">
            Try PDF Editor Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
