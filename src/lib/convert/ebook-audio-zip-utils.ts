import { extractTextFromPdf, renderPdfToCanvasBlobs } from "../pdf/pdf-utils";
import { convertHtmlToPdf } from "./html-markdown-utils";
import JSZip from "jszip";
import { PDFDocument, rgb } from "pdf-lib";

export async function convertPdfToHtml(file: File): Promise<string> {
  const text = await extractTextFromPdf(file);
  const pages = text.split(/--- Page \d+ ---/g).filter((p) => p.trim().length > 0);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${file.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1f2937; }
    section { margin-bottom: 40px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
    h2 { color: #2563eb; font-size: 18px; margin-top: 0; }
    p { margin-bottom: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <article>
    <h1>${file.name}</h1>`;

  pages.forEach((pageText, idx) => {
    html += `
    <section>
      <h2>Page ${idx + 1}</h2>
      <p>${pageText.trim()}</p>
    </section>`;
  });

  html += `
  </article>
</body>
</html>`;

  return html;
}

export async function convertPdfToEpub(file: File): Promise<Blob> {
  const text = await extractTextFromPdf(file);
  const pages = text.split(/--- Page \d+ ---/g).filter((p) => p.trim().length > 0);

  const zip = new JSZip();

  // mimetype
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF
  const metaInf = zip.folder("META-INF");
  if (metaInf) {
    metaInf.file("container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);
  }

  // OEBPS
  const oebps = zip.folder("OEBPS");
  if (oebps) {
    let manifestItems = "";
    let spineRefs = "";

    pages.forEach((pageText, idx) => {
      const pageNum = idx + 1;
      const filename = `page${pageNum}.xhtml`;
      manifestItems += `<item id="page${pageNum}" href="${filename}" media-type="application/xhtml+xml"/>\n`;
      spineRefs += `<itemref idref="page${pageNum}"/>\n`;

      oebps.file(filename, `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Page ${pageNum}</title></head>
<body>
  <h2>Page ${pageNum}</h2>
  <p>${pageText.trim()}</p>
</body>
</html>`);
    });

    oebps.file("content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${file.name}</dc:title>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineRefs}
  </spine>
</package>`);
  }

  return await zip.generateAsync({ type: "blob" });
}

export async function convertEbookToPdf(file: File): Promise<Uint8Array> {
  let contentHtml = "";

  if (file.name.endsWith(".epub")) {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const xhtmlFiles = Object.keys(zip.files).filter((f) => f.endsWith(".xhtml") || f.endsWith(".html"));

    for (const xf of xhtmlFiles) {
      const text = await zip.files[xf].async("text");
      contentHtml += `<div>${text}</div>`;
    }
  } else {
    contentHtml = await file.text();
  }

  return await convertHtmlToPdf(contentHtml || `<h1>${file.name}</h1><p>eBook Document Content</p>`);
}

export async function convertPdfToZip(file: File): Promise<Blob> {
  const images = await renderPdfToCanvasBlobs(file, 0.9, 2.0, "image/jpeg");
  const zip = new JSZip();

  images.forEach((item, idx) => {
    zip.file(`page-${idx + 1}.jpeg`, item.blob);
  });

  return await zip.generateAsync({ type: "blob" });
}

export async function invertPdfColors(
  file: File,
  mode: "dark" | "sepia" | "grayscale" = "dark"
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    if (mode === "dark") {
      // Add dark background overlay
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.1, 0.1, 0.12),
        opacity: 0.85,
      });
    } else if (mode === "sepia") {
      // Add warm sepia overlay
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.96, 0.92, 0.84),
        opacity: 0.3,
      });
    } else if (mode === "grayscale") {
      // Grayscale subtle tint
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.15,
      });
    }
  }

  return await pdfDoc.save();
}
