import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";

export async function convertHtmlToPdf(
  htmlContent: string,
  customCss = ""
): Promise<Uint8Array> {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "794px"; // A4 width in px at 96 DPI
  container.style.padding = "32px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const styleEl = document.createElement("style");
  styleEl.textContent = `
    ${customCss}
    h1 { font-size: 28px; margin-bottom: 12px; font-weight: 700; color: #111; }
    h2 { font-size: 22px; margin-top: 16px; margin-bottom: 8px; font-weight: 600; color: #222; }
    h3 { font-size: 18px; margin-top: 14px; margin-bottom: 6px; font-weight: 600; }
    p { font-size: 14px; line-height: 1.6; margin-bottom: 12px; color: #333; }
    ul, ol { margin-left: 20px; margin-bottom: 12px; font-size: 14px; }
    li { margin-bottom: 4px; }
    code { font-family: monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-size: 13px; }
    pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; font-family: monospace; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 12px; color: #4b5563; font-style: italic; margin-bottom: 12px; }
  `;
  container.appendChild(styleEl);

  const contentWrapper = document.createElement("div");
  contentWrapper.innerHTML = htmlContent;
  container.appendChild(contentWrapper);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const arrayBuffer = pdf.output("arraybuffer");
    return new Uint8Array(arrayBuffer);
  } finally {
    document.body.removeChild(container);
  }
}

export async function convertMarkdownToPdf(markdownText: string): Promise<Uint8Array> {
  const html = await marked.parse(markdownText);
  return await convertHtmlToPdf(html);
}
