// Client-side PDF.js loader with offline local worker and CDN fallback
export async function getPdfjs() {
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined') {
    try {
      // Use local public worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
  }
  return pdfjsLib;
}
