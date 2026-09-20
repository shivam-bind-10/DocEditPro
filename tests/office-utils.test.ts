import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';

// pdfjs-dist requires a browser worker environment; mock it for Node.js tests
vi.mock('pdfjs-dist', () => {
  return {
    default: {
      getDocument: vi.fn(),
      GlobalWorkerOptions: { workerSrc: '' },
      version: '6.0.0',
    },
    getDocument: vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Sample text for PDF to Word conversion test' }],
          }),
        }),
      }),
    }),
    GlobalWorkerOptions: { workerSrc: '' },
    version: '6.0.0',
  };
});

import { convertWordToPdf, convertPdfToWord } from '../src/lib/convert/office-utils';

async function createSamplePdf(): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 600]);
  page.drawText('Sample text for PDF to Word conversion test');
  const bytes = await pdfDoc.save();
  return new File([bytes.buffer as ArrayBuffer], 'sample-test.pdf', { type: 'application/pdf' });
}

describe('Office Conversion Utilities Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert raw text document to valid PDF document bytes', async () => {
    // Create a mock docx File (using plain text; mammoth falls back gracefully)
    const sampleText = 'Hello World from DocEditPro Word Converter';
    const blob = new Blob([sampleText], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const file = new File([blob], 'test.docx');

    const pdfBytes = await convertWordToPdf(file);
    expect(pdfBytes.length).toBeGreaterThan(0);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    expect(pdfDoc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('should extract text from PDF into a DOCX Blob', async () => {
    const pdfFile = await createSamplePdf();
    const docxBlob = await convertPdfToWord(pdfFile);

    expect(docxBlob.size).toBeGreaterThan(0);
    expect(docxBlob.type).toContain('wordprocessingml');
  });
});
