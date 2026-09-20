import { PDFDocument, rgb } from "pdf-lib";
import { renderPdfToCanvasBlobs, createPdfFromCanvasBlobs } from "./pdf-utils";

export async function encryptPdfFile(
  file: File,
  userPassword?: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const uPass = userPassword || "";
  const oPass = ownerPassword || uPass || "ownerSecretPass";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await pdfDoc.save({
    userPassword: uPass,
    ownerPassword: oPass,
    permissions: {
      printing: "highResolution",
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: false,
    },
  } as any);
}

export async function removePasswordFromPdf(
  file: File,
  password?: string
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  // Pass password to load encrypted file
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    password: password || "",
    ignoreEncryption: false,
  } as any);

  // Re-saving without calling encrypt() outputs an unencrypted PDF
  return await pdfDoc.save();
}

export async function flattenPdfFile(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  try {
    const form = pdfDoc.getForm();
    form.flatten();
  } catch {
    // PDF might not have AcroForm fields, proceed
  }

  // Save with cleaned structure
  return await pdfDoc.save({
    useObjectStreams: true,
  });
}

export interface PrivacyReport {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  hasAnnotations: boolean;
  hasFormFields: boolean;
  issuesFoundCount: number;
}

export async function scanPdfPrivacyRisk(file: File): Promise<PrivacyReport> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const subject = pdfDoc.getSubject();
  const keywords = pdfDoc.getKeywords();
  const creator = pdfDoc.getCreator();
  const producer = pdfDoc.getProducer();
  const creationDate = pdfDoc.getCreationDate()?.toISOString();
  const modificationDate = pdfDoc.getModificationDate()?.toISOString();

  let hasFormFields = false;
  try {
    const form = pdfDoc.getForm();
    hasFormFields = form.getFields().length > 0;
  } catch {
    hasFormFields = false;
  }

  let issuesCount = 0;
  if (title) issuesCount++;
  if (author) issuesCount++;
  if (subject) issuesCount++;
  if (keywords) issuesCount++;
  if (creator) issuesCount++;
  if (producer) issuesCount++;
  if (creationDate) issuesCount++;
  if (modificationDate) issuesCount++;
  if (hasFormFields) issuesCount++;

  return {
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    creationDate,
    modificationDate,
    hasAnnotations: false,
    hasFormFields,
    issuesFoundCount: issuesCount,
  };
}

export async function sanitizePdfMetadata(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Clear all metadata properties
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);
  pdfDoc.setCreator("");
  pdfDoc.setProducer("");

  return await pdfDoc.save();
}

export interface RedactionBox {
  pageIndex: number;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

export async function redactPdfFile(
  file: File,
  redactions: RedactionBox[],
  burnPixels = true
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();

  for (const red of redactions) {
    if (red.pageIndex >= 0 && red.pageIndex < pages.length) {
      const page = pages[red.pageIndex];
      const { width, height } = page.getSize();

      const boxX = (red.x / 100) * width;
      const boxW = (red.width / 100) * width;
      const boxH = (red.height / 100) * height;
      const boxY = height - (red.y / 100) * height - boxH;

      page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH,
        color: rgb(0, 0, 0),
      });
    }
  }

  const modifiedBytes = await pdfDoc.save();

  // If burnPixels is requested, re-rasterize pages so text underneath is permanently flattened into pixels
  if (burnPixels) {
    const tempFile = new File([modifiedBytes.buffer as ArrayBuffer], "redacted-temp.pdf", { type: "application/pdf" });
    const canvasBlobs = await renderPdfToCanvasBlobs(tempFile, 0.9, 2.0, "image/jpeg");
    return await createPdfFromCanvasBlobs(canvasBlobs);
  }

  return modifiedBytes;
}
