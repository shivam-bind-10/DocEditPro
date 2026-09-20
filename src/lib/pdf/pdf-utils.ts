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
  const pdfjsLib = typeof window !== 'undefined'
    ? await import('pdfjs-dist')
    : await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

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

export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const indices = new Set<number>();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let i = start; i <= end; i++) {
        indices.add(i - 1);
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

function hexToRgbColor(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = (parseInt(cleanHex.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(cleanHex.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(cleanHex.substring(4, 6), 16) || 0) / 255;
  return rgb(r, g, b);
}

export interface WatermarkOptions {
  type?: 'text' | 'image';
  text?: string;
  imageFile?: File;
  opacity?: number;
  fontSize?: number;
  color?: string;
  rotation?: number;
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tiled';
  pageRange?: string;
}

export async function addWatermarkToPdf(
  file: File,
  textOrOptions: string | WatermarkOptions,
  legacyOpacity = 0.3,
  legacyFontSize = 48
): Promise<Uint8Array> {
  const options: WatermarkOptions = typeof textOrOptions === 'string'
    ? { type: 'text', text: textOrOptions, opacity: legacyOpacity, fontSize: legacyFontSize }
    : textOrOptions;

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const targetIndices = parsePageRange(options.pageRange || 'all', totalPages);

  const opacity = options.opacity ?? 0.3;
  const rotation = options.rotation ?? 45;
  const position = options.position ?? 'center';

  if (options.type === 'image' && options.imageFile) {
    const imgBuffer = await options.imageFile.arrayBuffer();
    const isPng = options.imageFile.type.includes('png') || options.imageFile.name.toLowerCase().endsWith('.png');
    const embeddedImg = isPng ? await pdfDoc.embedPng(imgBuffer) : await pdfDoc.embedJpg(imgBuffer);

    for (const idx of targetIndices) {
      if (idx < 0 || idx >= totalPages) continue;
      const page = pages[idx];
      const { width, height } = page.getSize();
      
      const imgWidth = options.fontSize ? (options.fontSize * embeddedImg.width) / embeddedImg.height : embeddedImg.width * 0.5;
      const imgHeight = options.fontSize ? options.fontSize : embeddedImg.height * 0.5;

      let x = width / 2 - imgWidth / 2;
      let y = height / 2 - imgHeight / 2;

      if (position === 'top-left') { x = 36; y = height - imgHeight - 36; }
      else if (position === 'top-right') { x = width - imgWidth - 36; y = height - imgHeight - 36; }
      else if (position === 'bottom-left') { x = 36; y = 36; }
      else if (position === 'bottom-right') { x = width - imgWidth - 36; y = 36; }

      page.drawImage(embeddedImg, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotate: degrees(rotation),
      });
    }
  } else {
    const watermarkText = options.text || 'CONFIDENTIAL';
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = options.fontSize ?? 48;
    const color = options.color ? hexToRgbColor(options.color) : rgb(0.2, 0.2, 0.2);

    for (const idx of targetIndices) {
      if (idx < 0 || idx >= totalPages) continue;
      const page = pages[idx];
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      if (position === 'tiled') {
        const stepX = textWidth + 100;
        const stepY = textHeight + 100;
        for (let tileX = 20; tileX < width; tileX += stepX) {
          for (let tileY = 20; tileY < height; tileY += stepY) {
            page.drawText(watermarkText, {
              x: tileX,
              y: tileY,
              size: fontSize,
              font,
              color,
              opacity,
              rotate: degrees(rotation),
            });
          }
        }
      } else {
        let x = width / 2 - textWidth / 2;
        let y = height / 2 - textHeight / 2;

        if (position === 'top-left') { x = 36; y = height - textHeight - 36; }
        else if (position === 'top-right') { x = width - textWidth - 36; y = height - textHeight - 36; }
        else if (position === 'bottom-left') { x = 36; y = 36; }
        else if (position === 'bottom-right') { x = width - textWidth - 36; y = 36; }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color,
          opacity,
          rotate: degrees(rotation),
        });
      }
    }
  }

  return await pdfDoc.save();
}

export interface PageNumberOptions {
  format?: 'page_n_of_m' | 'page_n' | 'n' | 'custom';
  customFormat?: string;
  position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
  startNumber?: number;
  margin?: number;
  fontSize?: number;
  color?: string;
  pageRange?: string;
}

export async function addPageNumbersToPdf(
  file: File,
  posOrOptions?: 'bottom-right' | 'bottom-center' | 'bottom-left' | PageNumberOptions,
  legacyStartNum = 1
): Promise<Uint8Array> {
  const options: PageNumberOptions = typeof posOrOptions === 'object'
    ? posOrOptions
    : { position: posOrOptions || 'bottom-center', startNumber: legacyStartNum };

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const startNum = options.startNumber ?? 1;
  const margin = options.margin ?? 20;
  const fontSize = options.fontSize ?? 10;
  const color = options.color ? hexToRgbColor(options.color) : rgb(0.3, 0.3, 0.3);
  const position = options.position ?? 'bottom-center';
  const targetIndices = parsePageRange(options.pageRange || 'all', totalPages);

  for (const idx of targetIndices) {
    if (idx < 0 || idx >= totalPages) continue;
    const page = pages[idx];
    const { width, height } = page.getSize();
    const currNum = idx + startNum;

    let pageNumText = `Page ${currNum} of ${totalPages + startNum - 1}`;
    if (options.format === 'page_n') {
      pageNumText = `Page ${currNum}`;
    } else if (options.format === 'n') {
      pageNumText = `${currNum}`;
    } else if (options.format === 'custom' && options.customFormat) {
      pageNumText = options.customFormat
        .replace(/{n}/g, String(currNum))
        .replace(/{total}/g, String(totalPages + startNum - 1));
    }

    const textWidth = font.widthOfTextAtSize(pageNumText, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x = width / 2 - textWidth / 2;
    if (position.includes('left')) x = margin;
    if (position.includes('right')) x = width - textWidth - margin;

    let y = margin;
    if (position.includes('top')) y = height - textHeight - margin;

    page.drawText(pageNumText, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });
  }

  return await pdfDoc.save();
}

export interface HeaderFooterOptions {
  headerLeft?: string;
  headerCenter?: string;
  headerRight?: string;
  footerLeft?: string;
  footerCenter?: string;
  footerRight?: string;
  fontSize?: number;
  color?: string;
  margin?: number;
  pageRange?: string;
}

export async function addHeadersAndFootersToPdf(
  file: File,
  options: HeaderFooterOptions
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const fontSize = options.fontSize ?? 9;
  const margin = options.margin ?? 25;
  const color = options.color ? hexToRgbColor(options.color) : rgb(0.25, 0.25, 0.25);
  const targetIndices = parsePageRange(options.pageRange || 'all', totalPages);
  const todayStr = new Date().toLocaleDateString();

  const processTokenString = (text: string, currentNum: number) => {
    return text
      .replace(/{page}/g, String(currentNum))
      .replace(/{total}/g, String(totalPages))
      .replace(/{date}/g, todayStr);
  };

  for (const idx of targetIndices) {
    if (idx < 0 || idx >= totalPages) continue;
    const page = pages[idx];
    const { width, height } = page.getSize();
    const currentNum = idx + 1;

    // Header Y & Footer Y
    const headerY = height - margin - fontSize;
    const footerY = margin;

    // Header Left
    if (options.headerLeft) {
      const text = processTokenString(options.headerLeft, currentNum);
      page.drawText(text, { x: margin, y: headerY, size: fontSize, font, color });
    }
    // Header Center
    if (options.headerCenter) {
      const text = processTokenString(options.headerCenter, currentNum);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x: width / 2 - textWidth / 2, y: headerY, size: fontSize, font, color });
    }
    // Header Right
    if (options.headerRight) {
      const text = processTokenString(options.headerRight, currentNum);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x: width - textWidth - margin, y: headerY, size: fontSize, font, color });
    }

    // Footer Left
    if (options.footerLeft) {
      const text = processTokenString(options.footerLeft, currentNum);
      page.drawText(text, { x: margin, y: footerY, size: fontSize, font, color });
    }
    // Footer Center
    if (options.footerCenter) {
      const text = processTokenString(options.footerCenter, currentNum);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x: width / 2 - textWidth / 2, y: footerY, size: fontSize, font, color });
    }
    // Footer Right
    if (options.footerRight) {
      const text = processTokenString(options.footerRight, currentNum);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, { x: width - textWidth - margin, y: footerY, size: fontSize, font, color });
    }
  }

  return await pdfDoc.save();
}

export async function cropAndResizePdf(
  file: File,
  options: {
    preset?: 'a4' | 'letter' | 'a3' | 'custom';
    customWidth?: number; // in points
    customHeight?: number; // in points
    cropTop?: number;
    cropRight?: number;
    cropBottom?: number;
    cropLeft?: number;
  }
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  const PRESETS: Record<string, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    a3: [841.89, 1190.55],
  };

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Apply crop margins first (modifies MediaBox)
    const cropTop = options.cropTop ?? 0;
    const cropRight = options.cropRight ?? 0;
    const cropBottom = options.cropBottom ?? 0;
    const cropLeft = options.cropLeft ?? 0;

    if (cropTop || cropRight || cropBottom || cropLeft) {
      page.setCropBox(
        cropLeft,
        cropBottom,
        width - cropLeft - cropRight,
        height - cropTop - cropBottom
      );
    }

    // Apply resize if a preset or custom size is specified
    if (options.preset && options.preset !== 'custom') {
      const [newW, newH] = PRESETS[options.preset];
      page.setSize(newW, newH);
    } else if (options.preset === 'custom' && options.customWidth && options.customHeight) {
      page.setSize(options.customWidth, options.customHeight);
    }
  }

  return await pdfDoc.save();
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = typeof window !== 'undefined'
    ? await import('pdfjs-dist')
    : await import('pdfjs-dist/legacy/build/pdf.mjs');
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
  } as any).promise;
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
