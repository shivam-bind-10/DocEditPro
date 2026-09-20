import mammoth from 'mammoth';
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function convertWordToPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();

  let rawText = '';
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    rawText = result.value || '';
  } catch {
    // Fallback if raw text extraction fails or plain text file
    const decoder = new TextDecoder('utf-8');
    rawText = decoder.decode(arrayBuffer);
  }

  if (!rawText.trim()) {
    rawText = 'Empty document';
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const maxLineWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  const lines = rawText.split('\n');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      currentY -= lineHeight;
      if (currentY < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      continue;
    }

    const words = trimmed.split(' ');
    let currentLineText = '';

    for (const word of words) {
      const testLine = currentLineText ? `${currentLineText} ${word}` : word;
      const textWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (textWidth > maxLineWidth && currentLineText) {
        currentPage.drawText(currentLineText, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= lineHeight;

        if (currentY < margin) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        currentLineText = word;
      } else {
        currentLineText = testLine;
      }
    }

    if (currentLineText) {
      currentPage.drawText(currentLineText, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= lineHeight;

      if (currentY < margin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
    }
  }

  return await pdfDoc.save();
}

export async function convertPdfToWord(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const docParagraphs: Paragraph[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    docParagraphs.push(
      new Paragraph({
        text: `--- Page ${i} ---`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    let currentLine = '';

    textContent.items.forEach((item: unknown) => {
      if (item && typeof item === 'object' && 'str' in item) {
        const str = (item as { str: string }).str;
        if (str.trim()) {
          currentLine += str + ' ';
        } else if (currentLine.trim()) {
          docParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: currentLine.trim(), size: 24 })],
              spacing: { after: 120 },
            })
          );
          currentLine = '';
        }
      }
    });

    if (currentLine.trim()) {
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: currentLine.trim(), size: 24 })],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
