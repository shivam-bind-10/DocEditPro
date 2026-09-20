import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  mergePdfFiles,
  splitPdfPages,
  compressPdfFile,
  convertImagesToPdf,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  addHeadersAndFootersToPdf,
  parsePageRange,
} from '../src/lib/pdf/pdf-utils';

async function createSamplePdf(pageCount = 1): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([300, 400]);
  }
  const bytes = await pdfDoc.save();
  return new File([bytes.buffer as ArrayBuffer], `sample-${pageCount}pages.pdf`, {
    type: 'application/pdf',
  });
}

// 1x1 transparent PNG base64
const samplePngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function createSampleImageFile(filename = 'test.png'): File {
  const binary = atob(samplePngBase64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array.buffer as ArrayBuffer], filename, { type: 'image/png' });
}

describe('PDF Utilities Unit Tests', () => {
  it('should parse page ranges accurately', () => {
    expect(parsePageRange('all', 5)).toEqual([0, 1, 2, 3, 4]);
    expect(parsePageRange('1-3, 5', 5)).toEqual([0, 1, 2, 4]);
    expect(parsePageRange('2', 5)).toEqual([1]);
  });

  it('should merge two PDF files into one document', async () => {
    const file1 = await createSamplePdf(2);
    const file2 = await createSamplePdf(3);

    const mergedBytes = await mergePdfFiles([file1, file2]);
    const mergedDoc = await PDFDocument.load(mergedBytes);

    expect(mergedDoc.getPageCount()).toBe(5);
  });

  it('should split a 3-page PDF into 3 individual page documents', async () => {
    const file = await createSamplePdf(3);

    const splitResults = await splitPdfPages(file);
    expect(splitResults).toHaveLength(3);

    const page1Doc = await PDFDocument.load(splitResults[0].data);
    expect(page1Doc.getPageCount()).toBe(1);
  });

  it('should extract specific page ranges from a PDF', async () => {
    const file = await createSamplePdf(5);

    const splitResults = await splitPdfPages(file, [0, 2]);
    expect(splitResults).toHaveLength(2);
    expect(splitResults[0].pageIndex).toBe(0);
    expect(splitResults[1].pageIndex).toBe(2);
  });

  it('should compress a PDF file with object stream optimization', async () => {
    const file = await createSamplePdf(4);
    const compressedBytes = await compressPdfFile(file, 'medium');

    expect(compressedBytes.length).toBeGreaterThan(0);
    const doc = await PDFDocument.load(compressedBytes);
    expect(doc.getPageCount()).toBe(4);
  });

  it('should convert image files into a single PDF document', async () => {
    const img1 = createSampleImageFile('pic1.png');
    const img2 = createSampleImageFile('pic2.png');

    const pdfBytes = await convertImagesToPdf([img1, img2], 10);
    const doc = await PDFDocument.load(pdfBytes);

    expect(doc.getPageCount()).toBe(2);
  });

  it('should apply text and image watermarks to a PDF', async () => {
    const file = await createSamplePdf(2);
    const watermarkedBytes = await addWatermarkToPdf(file, {
      type: 'text',
      text: 'DRAFT',
      opacity: 0.5,
      position: 'center',
    });
    const doc = await PDFDocument.load(watermarkedBytes);
    expect(doc.getPageCount()).toBe(2);

    const img = createSampleImageFile('mark.png');
    const imgWatermarkBytes = await addWatermarkToPdf(file, {
      type: 'image',
      imageFile: img,
      opacity: 0.4,
    });
    const docImg = await PDFDocument.load(imgWatermarkBytes);
    expect(docImg.getPageCount()).toBe(2);
  });

  it('should add page numbers to a PDF file', async () => {
    const file = await createSamplePdf(3);
    const numberedBytes = await addPageNumbersToPdf(file, {
      format: 'page_n_of_m',
      position: 'bottom-center',
      startNumber: 1,
    });
    const doc = await PDFDocument.load(numberedBytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it('should add headers and footers with dynamic tokens', async () => {
    const file = await createSamplePdf(2);
    const outputBytes = await addHeadersAndFootersToPdf(file, {
      headerLeft: 'Header L',
      footerCenter: 'Page {page} of {total}',
    });
    const doc = await PDFDocument.load(outputBytes);
    expect(doc.getPageCount()).toBe(2);
  });
});
