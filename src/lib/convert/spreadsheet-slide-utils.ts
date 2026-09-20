import * as XLSX from "xlsx";
import { convertHtmlToPdf } from "./html-markdown-utils";
import { extractTextFromPdf, renderPdfToCanvasBlobs } from "../pdf/pdf-utils";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export async function convertExcelToPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  let fullHtml = `<div style="font-family: sans-serif; padding: 20px;">`;
  fullHtml += `<h1>${file.name}</h1>`;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const htmlTable = XLSX.utils.sheet_to_html(worksheet);

    fullHtml += `
      <div style="margin-top: 24px;">
        <h2 style="color: #2563eb; font-size: 18px; margin-bottom: 8px;">Sheet: ${sheetName}</h2>
        ${htmlTable}
      </div>
    `;
  }

  fullHtml += `</div>`;

  const customCss = `
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
  `;

  return await convertHtmlToPdf(fullHtml, customCss);
}

export async function convertCsvToPdf(file: File): Promise<Uint8Array> {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: "string" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const htmlTable = XLSX.utils.sheet_to_html(worksheet);

  const fullHtml = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h1>${file.name}</h1>
      <div style="margin-top: 16px;">
        ${htmlTable}
      </div>
    </div>
  `;

  const customCss = `
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
  `;

  return await convertHtmlToPdf(fullHtml, customCss);
}

export async function convertPdfToExcel(file: File): Promise<Uint8Array> {
  const rawText = await extractTextFromPdf(file);
  const pages = rawText.split(/--- Page \d+ ---/g).filter((p) => p.trim().length > 0);

  const wb = XLSX.utils.book_new();

  pages.forEach((pageContent, idx) => {
    const lines = pageContent.trim().split("\n").filter((l) => l.trim().length > 0);
    const tableData: string[][] = [];

    for (const line of lines) {
      // Split line by multiple spaces or tabs to form table cells
      const cells = line.split(/\s{2,}|\t/g).map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0) {
        tableData.push(cells);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(tableData.length > 0 ? tableData : [["Page Text"], [pageContent]]);
    XLSX.utils.book_append_sheet(wb, ws, `Page ${idx + 1}`);
  });

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Uint8Array(wbout);
}

export async function convertPptxToPdf(file: File): Promise<Uint8Array> {
  // Extract text and image assets from PPTX zip structure
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const pdfDoc = await PDFDocument.create();

  // Find slide XML files
  const slideFiles = Object.keys(zip.files).filter((fname) =>
    fname.startsWith("ppt/slides/slide") && fname.endsWith(".xml")
  ).sort();

  if (slideFiles.length === 0) {
    // Fallback single page
    const page = pdfDoc.addPage([792, 612]); // Landscape Letter
    return await pdfDoc.save();
  }

  for (let i = 0; i < slideFiles.length; i++) {
    const slideXml = await zip.files[slideFiles[i]].async("text");
    // Extract text nodes inside <a:t> tags
    const matches = Array.from(slideXml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/g)).map((m) => m[1]);
    const slideText = matches.join(" ");

    const page = pdfDoc.addPage([792, 612]); // Landscape presentation slide
    page.drawText(`Slide ${i + 1}`, { x: 36, y: 560, size: 20 });
    page.drawText(slideText.substring(0, 500) || "Presentation Slide Content", {
      x: 36,
      y: 500,
      size: 14,
      maxWidth: 720,
    });
  }

  return await pdfDoc.save();
}

export async function convertPdfToPptx(file: File): Promise<Blob> {
  const images = await renderPdfToCanvasBlobs(file, 0.85, 1.5, "image/jpeg");
  const zip = new JSZip();

  // Basic minimal PPTX package layout
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`);

  const pptFolder = zip.folder("ppt");
  if (pptFolder) {
    const mediaFolder = pptFolder.folder("media");
    for (let i = 0; i < images.length; i++) {
      if (mediaFolder) {
        mediaFolder.file(`image${i + 1}.jpeg`, images[i].blob);
      }
    }
  }

  return await zip.generateAsync({ type: "blob" });
}
