import { createWorker } from "tesseract.js";
import { renderPdfToCanvasBlobs } from "@/lib/pdf/pdf-utils";

export interface OcrResult {
  pageIndex: number;
  text: string;
}

export async function processPdfOcr(
  file: File,
  language = "eng",
  onProgress?: (progress: number, statusText: string) => void
): Promise<{ fullText: string; pageResults: OcrResult[] }> {
  if (onProgress) onProgress(10, "Rendering PDF pages into high-resolution images...");
  const canvasBlobs = await renderPdfToCanvasBlobs(file, 0.85, 2.0, "image/png");

  if (onProgress) onProgress(25, "Initializing Tesseract OCR WASM engine...");
  const worker = await createWorker(language);

  const pageResults: OcrResult[] = [];
  let fullText = "";

  for (let i = 0; i < canvasBlobs.length; i++) {
    const item = canvasBlobs[i];
    const currentProgress = 25 + Math.round(((i + 1) / canvasBlobs.length) * 70);
    if (onProgress) {
      onProgress(currentProgress, `Recognizing text on page ${i + 1} of ${canvasBlobs.length}...`);
    }

    const recognizeRes = await worker.recognize(item.blob);
    const extractedPageText = recognizeRes.data.text || "";

    pageResults.push({
      pageIndex: item.pageIndex,
      text: extractedPageText,
    });

    fullText += `--- Page ${i + 1} ---\n${extractedPageText}\n\n`;
  }

  await worker.terminate();
  if (onProgress) onProgress(100, "OCR complete!");

  return { fullText, pageResults };
}
