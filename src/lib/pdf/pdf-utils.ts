import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export async function mergePdfFiles(files: File[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

export async function splitPdfPages(
  file: File,
  pagesToExtract?: number[]
): Promise<{ pageIndex: number; data: Uint8Array }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);
  const totalPages = sourcePdf.getPageCount();

  const targetIndices = pagesToExtract || Array.from({ length: totalPages }, (_, i) => i);
  const results: { pageIndex: number; data: Uint8Array }[] = [];

  for (const idx of targetIndices) {
    if (idx < 0 || idx >= totalPages) continue;
    const singlePdf = await PDFDocument.create();
    const [copiedPage] = await singlePdf.copyPages(sourcePdf, [idx]);
    singlePdf.addPage(copiedPage);
    const pdfBytes = await singlePdf.save();
    results.push({ pageIndex: idx, data: pdfBytes });
  }

  return results;
}

export async function compressPdfFile(
  file: File,
  level: 'light' | 'medium' | 'heavy' = 'medium'
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Apply object stream compression & strip unused objects
  const qualityMap = { light: 0.85, medium: 0.65, heavy: 0.45 };
  const quality = qualityMap[level];

  // Re-encode embedded image streams if possible or resave with compressed structures
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  });

  // If initial structural compression wasn't enough for heavy level, canvas fallback re-encode
  if (level === 'heavy' && pdfBytes.length >= file.size) {
    const images = await renderPdfToCanvasBlobs(file, quality);
    return await createPdfFromCanvasBlobs(images);
  }

  return pdfBytes;
}

export async function renderPdfToCanvasBlobs(
  file: File,
  quality = 0.7,
  scale = 1.5,
  mimeType = 'image/jpeg'
): Promise<{ pageIndex: number; blob: Blob }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results: { pageIndex: number; blob: Blob }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), mimeType, quality);
      });
      results.push({ pageIndex: i - 1, blob });
    }
  }

  return results;
}

export async function createPdfFromCanvasBlobs(
  items: { pageIndex: number; blob: Blob }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const item of items) {
    const imageBytes = await item.blob.arrayBuffer();
    const image = await pdfDoc.embedJpg(imageBytes);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return await pdfDoc.save();
}

export async function convertImagesToPdf(
  files: File[],
  margin = 0
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type.includes('png') || file.name.endsWith('.png');

    const image = isPng
      ? await pdfDoc.embedPng(arrayBuffer)
      : await pdfDoc.embedJpg(arrayBuffer);

    const pageWidth = image.width + margin * 2;
    const pageHeight = image.height + margin * 2;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    page.drawImage(image, {
      x: margin,
      y: margin,
      width: image.width,
      height: image.height,
    });
  }

  return await pdfDoc.save();
}

export async function rotatePdfPages(
  file: File,
  rotationDegrees: number,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();

  const targets = pageIndices || Array.from({ length: totalPages }, (_, i) => i);

  for (const idx of targets) {
    if (idx >= 0 && idx < totalPages) {
      const page = pdfDoc.getPage(idx);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
    }
  }

  return await pdfDoc.save();
}

export async function addWatermarkToPdf(
  file: File,
  text: string,
  opacity = 0.3,
  fontSize = 48
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
      opacity,
      rotate: degrees(45),
    });
  }

  return await pdfDoc.save();
}

export async function addPageNumbersToPdf(
  file: File,
  position: 'bottom-right' | 'bottom-center' | 'bottom-left' = 'bottom-center',
  startNumber = 1
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, idx) => {
    const pageNumText = `Page ${idx + startNumber} of ${totalPages + startNumber - 1}`;
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);
    const { width } = page.getSize();

    let x = width / 2 - textWidth / 2;
    if (position === 'bottom-left') x = 36;
    if (position === 'bottom-right') x = width - textWidth - 36;

    page.drawText(pageNumText, {
      x,
      y: 20,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return await pdfDoc.save();
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: unknown) => (item && typeof item === 'object' && 'str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    fullText += `--- Page ${i} ---\n${pageText}\n\n`;
  }

  return fullText;
}
