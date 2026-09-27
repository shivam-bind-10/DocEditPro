import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface BatesOptions {
  prefix?: string;
  suffix?: string;
  startNumber?: number;
  digitPadding?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  fontSize?: number;
  margin?: number;
  color?: { r: number; g: number; b: number };
}

export function formatBatesNumber(
  num: number,
  prefix = "",
  suffix = "",
  padding = 6
): string {
  const padded = String(num).padStart(padding, "0");
  return `${prefix}${padded}${suffix}`;
}

export async function applyBatesNumbering(
  pdfBytes: Uint8Array,
  options: BatesOptions = {}
): Promise<{ pdfBytes: Uint8Array; nextNumber: number; totalPagesStamped: number }> {
  const {
    prefix = "",
    suffix = "",
    startNumber = 1,
    digitPadding = 6,
    position = "bottom-right",
    fontSize = 10,
    margin = 30,
    color = { r: 0.2, g: 0.2, b: 0.2 },
  } = options;

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  let currentNumber = startNumber;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const text = formatBatesNumber(currentNumber, prefix, suffix, digitPadding);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x = margin;
    let y = margin;

    if (position === "top-left") {
      x = margin;
      y = height - margin - textHeight;
    } else if (position === "top-center") {
      x = (width - textWidth) / 2;
      y = height - margin - textHeight;
    } else if (position === "top-right") {
      x = width - margin - textWidth;
      y = height - margin - textHeight;
    } else if (position === "bottom-left") {
      x = margin;
      y = margin;
    } else if (position === "bottom-center") {
      x = (width - textWidth) / 2;
      y = margin;
    } else if (position === "bottom-right") {
      x = width - margin - textWidth;
      y = margin;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
    });

    currentNumber++;
  }

  const outputBytes = await pdfDoc.save();
  return {
    pdfBytes: outputBytes,
    nextNumber: currentNumber,
    totalPagesStamped: pages.length,
  };
}

export async function applyBatchBatesNumbering(
  files: { name: string; bytes: Uint8Array }[],
  options: BatesOptions = {}
): Promise<{ name: string; bytes: Uint8Array }[]> {
  let currentStart = options.startNumber ?? 1;
  const results: { name: string; bytes: Uint8Array }[] = [];

  for (const file of files) {
    const res = await applyBatesNumbering(file.bytes, {
      ...options,
      startNumber: currentStart,
    });
    results.push({
      name: file.name.replace(/\.pdf$/i, "") + "-bates.pdf",
      bytes: res.pdfBytes,
    });
    currentStart = res.nextNumber;
  }

  return results;
}
