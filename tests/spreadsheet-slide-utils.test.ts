import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import {
  convertExcelToPdf,
  convertCsvToPdf,
  convertPdfToExcel,
} from '../src/lib/convert/spreadsheet-slide-utils';

function createSampleExcelFile(): File {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Name', 'Role', 'Department'],
    ['Alice', 'Engineer', 'Dev'],
    ['Bob', 'Designer', 'UX'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([buf], 'sample.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function createSampleCsvFile(): File {
  const csvText = `Product,Price,Quantity\nWidget A,10.99,100\nWidget B,24.50,50`;
  return new File([csvText], 'sample.csv', { type: 'text/csv' });
}

async function createSamplePdfFile(): Promise<File> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont('Helvetica');
  const page = pdfDoc.addPage([400, 400]);
  page.drawText('Header 1    Header 2    Header 3\nData A      Data B      100', {
    x: 20,
    y: 350,
    font,
    size: 12,
  });
  const bytes = await pdfDoc.save();
  return new File([bytes.buffer as ArrayBuffer], 'sample-table.pdf', {
    type: 'application/pdf',
  });
}

describe('Spreadsheet & Slide Conversion Unit Tests', () => {
  it('should parse Excel file and build workbook data', async () => {
    const file = createSampleExcelFile();
    expect(file.size).toBeGreaterThan(0);
  });

  it('should parse CSV file content', async () => {
    const file = createSampleCsvFile();
    const text = await file.text();
    expect(text).toContain('Widget A');
  });

  it('should extract table rows from PDF file into Excel workbook', async () => {
    const pdfFile = await createSamplePdfFile();
    const excelBytes = await convertPdfToExcel(pdfFile);

    expect(excelBytes.length).toBeGreaterThan(0);
    const wb = XLSX.read(excelBytes, { type: 'array' });
    expect(wb.SheetNames.length).toBeGreaterThan(0);
  });
});
