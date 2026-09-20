"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { convertHtmlToPdf } from "@/lib/convert/html-markdown-utils";
import { addRecentFile } from "@/lib/storage/db";
import { FilePlus, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Code } from "lucide-react";

const createPdfTool = TOOLS.find((t) => t.id === "create-pdf")!;

const TEMPLATES = [
  {
    name: "Blank Document",
    content: "<h1>Document Title</h1><p>Start writing your document here...</p>",
  },
  {
    name: "Meeting Notes",
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong> Team Members</p>
<h2>Agenda</h2>
<ul>
  <li>Project status review</li>
  <li>Upcoming milestones</li>
  <li>Action items</li>
</ul>
<h2>Action Items</h2>
<ol>
  <li>Finalize design specs</li>
  <li>Complete feature implementation</li>
</ol>`,
  },
  {
    name: "Project Proposal",
    content: `<h1>Project Proposal</h1>
<h2>Executive Summary</h2>
<p>This proposal outlines the strategy and scope for building privacy-first web utilities.</p>
<h2>Objectives</h2>
<ul>
  <li>High performance client-side execution</li>
  <li>Zero server file storage</li>
  <li>Seamless user experience</li>
</ul>`,
  },
];

export default function CreatePdfPage() {
  const [docTitle, setDocTitle] = React.useState("My-Document");
  const [htmlContent, setHtmlContent] = React.useState(TEMPLATES[0].content);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("document.pdf");

  const editorRef = React.useRef<HTMLDivElement | null>(null);

  const applyFormatting = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const handleCreatePdf = async () => {
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : htmlContent;
    if (!currentHtml || currentHtml.trim().length === 0) {
      alert("Please enter document content before exporting.");
      return;
    }

    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const pdfBytes = await convertHtmlToPdf(currentHtml);
      setProgress(90);

      setResultBytes(pdfBytes);
      const cleanTitle = docTitle.replace(/[^a-z0-9_-]/gi, "_") || "document";
      setOutFilename(`${cleanTitle}.pdf`);

      await addRecentFile({
        name: `${cleanTitle}.pdf`,
        size: pdfBytes.length,
        type: "application/pdf",
        toolSlug: "create-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to create PDF: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResultBytes(null);
    setHtmlContent(TEMPLATES[0].content);
    if (editorRef.current) {
      editorRef.current.innerHTML = TEMPLATES[0].content;
    }
    setProgress(0);
  };

  return (
    <ToolPageShell tool={createPdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          onReset={handleReset}
          actionTitle="PDF Document Created Successfully!"
        />
      ) : (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 gap-4">
            <div className="flex items-center space-x-3">
              <FilePlus className="h-6 w-6 text-[var(--accent)]" />
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Create New PDF Document</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Compose and format rich documents directly in your browser.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document Title"
                className="w-48"
              />
              <Button variant="primary" size="lg" onClick={handleCreatePdf}>
                Export PDF
              </Button>
            </div>
          </div>

          {/* Template Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--muted-foreground)] mr-2">Templates:</span>
            {TEMPLATES.map((tmpl, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setHtmlContent(tmpl.content);
                  if (editorRef.current) editorRef.current.innerHTML = tmpl.content;
                }}
              >
                {tmpl.name}
              </Button>
            ))}
          </div>

          {/* Editor Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1 bg-[var(--card)] p-2 rounded-md border border-[var(--border)]">
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("bold")}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("italic")}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("underline")}>
              <Underline className="h-4 w-4" />
            </Button>
            <span className="h-4 w-px bg-[var(--border)] mx-1" />
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("formatBlock", "<h1>")}>
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("formatBlock", "<h2>")}>
              <Heading2 className="h-4 w-4" />
            </Button>
            <span className="h-4 w-px bg-[var(--border)] mx-1" />
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("insertUnorderedList")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("insertOrderedList")}>
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => applyFormatting("formatBlock", "<pre>")}>
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* WYSIWYG Editable Canvas */}
          <div className="border border-[var(--border)] rounded-md p-6 bg-white text-black min-h-[400px]">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              className="outline-none min-h-[360px] prose max-w-none text-black"
            />
          </div>
        </Card>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Generating PDF..."
        statusText="Rendering layout vector canvas into PDF pages..."
      />
    </ToolPageShell>
  );
}
