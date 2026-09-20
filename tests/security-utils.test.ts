import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  encryptPdfFile,
  removePasswordFromPdf,
  flattenPdfFile,
  scanPdfPrivacyRisk,
  sanitizePdfMetadata,
  redactPdfFile,
} from '../src/lib/pdf/security-utils';

async function createSamplePdf(pageCount = 1): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Secret Test Title');
  pdfDoc.setAuthor('John Doe Privacy Test');
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([300, 400]);
  }
  const bytes = await pdfDoc.save();
  return new File([bytes.buffer as ArrayBuffer], `sample-security-${pageCount}pages.pdf`, {
    type: 'application/pdf',
  });
}

describe('Security & Privacy Suite Unit Tests', () => {
  it('should encrypt a PDF document with a user password', async () => {
    const file = await createSamplePdf(2);
    const encryptedBytes = await encryptPdfFile(file, 'pass123');

    expect(encryptedBytes.length).toBeGreaterThan(0);
    const docWithPass = await PDFDocument.load(encryptedBytes);
    expect(docWithPass.getPageCount()).toBe(2);
  });

  it('should decrypt and remove password protection from an encrypted PDF', async () => {
    const file = await createSamplePdf(1);
    const encryptedBytes = await encryptPdfFile(file, 'mypassword');
    const encryptedFile = new File([encryptedBytes.buffer as ArrayBuffer], 'encrypted.pdf', {
      type: 'application/pdf',
    });

    const decryptedBytes = await removePasswordFromPdf(encryptedFile, 'mypassword');
    const cleanDoc = await PDFDocument.load(decryptedBytes);
    expect(cleanDoc.getPageCount()).toBe(1);
  });

  it('should flatten PDF form fields and annotations', async () => {
    const file = await createSamplePdf(2);
    const flattenedBytes = await flattenPdfFile(file);

    expect(flattenedBytes.length).toBeGreaterThan(0);
    const doc = await PDFDocument.load(flattenedBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it('should scan PDF for metadata privacy risks and sanitize metadata', async () => {
    const file = await createSamplePdf(1);
    const report = await scanPdfPrivacyRisk(file);

    expect(report.title).toBe('Secret Test Title');
    expect(report.author).toBe('John Doe Privacy Test');
    expect(report.issuesFoundCount).toBeGreaterThan(0);

    const cleanBytes = await sanitizePdfMetadata(file);
    const cleanFile = new File([cleanBytes.buffer as ArrayBuffer], 'clean.pdf', {
      type: 'application/pdf',
    });

    const cleanReport = await scanPdfPrivacyRisk(cleanFile);
    expect(cleanReport.title).toBeFalsy();
    expect(cleanReport.author).toBeFalsy();
  });

  it('should apply redaction rectangle to PDF pages', async () => {
    const file = await createSamplePdf(2);
    const redactedBytes = await redactPdfFile(
      file,
      [{ pageIndex: 0, x: 10, y: 10, width: 50, height: 20 }],
      false // test vector rectangle path without canvas burn in node env
    );

    const doc = await PDFDocument.load(redactedBytes);
    expect(doc.getPageCount()).toBe(2);
  });
});
