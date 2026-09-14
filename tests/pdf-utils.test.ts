import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfFiles, splitPdfPages } from '../src/lib/pdf/pdf-utils';

async function createSamplePdf(pageCount = 1): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([300, 400]);
  }
  const bytes = await pdfDoc.save();
  return new File([bytes.buffer as ArrayBuffer], `sample-${pageCount}pages.pdf`, { type: 'application/pdf' });
}

describe('PDF Utilities Unit Tests', () => {
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

    // Extract pages 0 and 2 (page 1 and page 3)
    const splitResults = await splitPdfPages(file, [0, 2]);
    expect(splitResults).toHaveLength(2);
    expect(splitResults[0].pageIndex).toBe(0);
    expect(splitResults[1].pageIndex).toBe(2);
  });
});
