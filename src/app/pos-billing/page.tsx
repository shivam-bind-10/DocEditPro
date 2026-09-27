"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Plus, Trash2, ShoppingCart, Download, Printer } from "lucide-react";

const tool = TOOLS.find((t) => t.id === "pos-billing")!;

interface Product {
  name: string;
  price: number;
  qty: number;
}

async function generateReceiptPdf(
  shopName: string,
  items: Product[],
  receiptNo: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Thermal receipt width: 58mm ~ 164 points
  const receiptW = 164;
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = total * 0.18;
  const lineCount = items.length;
  const receiptH = 200 + lineCount * 20;

  const page = pdfDoc.addPage([receiptW, receiptH]);
  const white = rgb(1, 1, 1);
  const dark = rgb(0.05, 0.05, 0.05);
  page.drawRectangle({ x: 0, y: 0, width: receiptW, height: receiptH, color: white });

  let y = receiptH - 16;
  const cx = receiptW / 2;

  const centerText = (text: string, fontSize: number, font = helvetica) => {
    const w = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, { x: cx - w / 2, y, size: fontSize, font, color: dark });
    y -= fontSize + 4;
  };

  centerText(shopName || "My Shop", 11, helveticaBold);
  centerText("Receipt #" + receiptNo, 7);
  centerText(new Date().toLocaleString(), 7);
  y -= 4;
  page.drawLine({ start: { x: 4, y }, end: { x: receiptW - 4, y }, thickness: 0.5, color: dark });
  y -= 10;

  for (const item of items) {
    const lineTotal = (item.price * item.qty).toFixed(2);
    page.drawText(item.name.substring(0, 16), { x: 4, y, size: 8, font: helvetica, color: dark });
    page.drawText(`x${item.qty}`, { x: 90, y, size: 8, font: helvetica, color: dark });
    const amtW = helvetica.widthOfTextAtSize(`₹${lineTotal}`, 8);
    page.drawText(`₹${lineTotal}`, { x: receiptW - amtW - 4, y, size: 8, font: helvetica, color: dark });
    y -= 14;
  }

  y -= 4;
  page.drawLine({ start: { x: 4, y }, end: { x: receiptW - 4, y }, thickness: 0.5, color: dark });
  y -= 10;

  const subtotalW = helveticaBold.widthOfTextAtSize(`₹${total.toFixed(2)}`, 9);
  page.drawText("Subtotal:", { x: 4, y, size: 9, font: helveticaBold, color: dark });
  page.drawText(`₹${total.toFixed(2)}`, { x: receiptW - subtotalW - 4, y, size: 9, font: helveticaBold, color: dark });
  y -= 14;

  const taxW = helvetica.widthOfTextAtSize(`₹${tax.toFixed(2)}`, 8);
  page.drawText("Tax (18%):", { x: 4, y, size: 8, font: helvetica, color: dark });
  page.drawText(`₹${tax.toFixed(2)}`, { x: receiptW - taxW - 4, y, size: 8, font: helvetica, color: dark });
  y -= 14;

  page.drawLine({ start: { x: 4, y }, end: { x: receiptW - 4, y }, thickness: 0.5, color: dark });
  y -= 10;

  const grandTotal = (total + tax).toFixed(2);
  const totalW = helveticaBold.widthOfTextAtSize(`₹${grandTotal}`, 11);
  page.drawText("TOTAL:", { x: 4, y, size: 11, font: helveticaBold, color: dark });
  page.drawText(`₹${grandTotal}`, { x: receiptW - totalW - 4, y, size: 11, font: helveticaBold, color: dark });
  y -= 24;

  centerText("Thank you for your purchase!", 7);
  centerText("Powered by DocEditPro", 6);

  return await pdfDoc.save();
}

export default function PosBillingPage() {
  const [shopName, setShopName] = React.useState("My Shop");
  const [receiptNo, setReceiptNo] = React.useState("REC-001");
  const [items, setItems] = React.useState<Product[]>([
    { name: "", price: 0, qty: 1 },
  ]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const grandTotal = total + total * 0.18;

  const addItem = () => setItems((p) => [...p, { name: "", price: 0, qty: 1 }]);
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof Product, val: string | number) =>
    setItems((p) => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateReceiptPdf(shopName, items, receiptNo);
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed to generate receipt: ${(err as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateReceiptPdf(shopName, items, receiptNo);
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url);
      if (win) {
        win.onload = () => win.print();
      }
    } catch (err) {
      alert(`Failed: ${(err as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const inputClass =
    "h-9 bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--accent)]";

  return (
    <ToolPageShell tool={tool}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[var(--accent)]" /> Shop Info
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Shop Name</label>
              <Input className={inputClass} value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)]">Receipt Number</label>
              <Input className={inputClass} value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Cart Items</h3>
            <Button variant="secondary" size="sm" onClick={addItem}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-[var(--muted-foreground)] font-medium px-1">
              <span className="col-span-5">Item Name</span>
              <span className="col-span-3">Price (₹)</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-1">Total</span>
              <span className="col-span-1"></span>
            </div>

            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  className={`${inputClass} col-span-5`}
                  placeholder="Product name"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                />
                <Input
                  className={`${inputClass} col-span-3`}
                  type="number"
                  min="0"
                  value={item.price}
                  onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)}
                />
                <Input
                  className={`${inputClass} col-span-2`}
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(i, "qty", parseInt(e.target.value) || 1)}
                />
                <span className="col-span-1 text-xs text-[var(--muted-foreground)]">
                  ₹{(item.price * item.qty).toFixed(0)}
                </span>
                <button
                  onClick={() => removeItem(i)}
                  disabled={items.length <= 1}
                  className="col-span-1 text-[var(--subtle-foreground)] hover:text-rose-400 disabled:opacity-30 flex justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-[var(--border)] pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Subtotal</span><span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Tax (18% GST)</span><span>₹{(total * 0.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--foreground)] text-base border-t border-[var(--border)] pt-2">
              <span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="lg" onClick={handlePrint} disabled={isGenerating} className="flex-1">
              <Printer className="h-4 w-4 mr-2" /> Print Receipt
            </Button>
            <Button variant="primary" size="lg" onClick={handleDownload} disabled={isGenerating} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </Card>
      </div>
    </ToolPageShell>
  );
}
