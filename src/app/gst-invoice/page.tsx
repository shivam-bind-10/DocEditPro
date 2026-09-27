"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Plus, Trash2, Download, Building2 } from "lucide-react";

const tool = TOOLS.find((t) => t.id === "gst-invoice")!;

interface LineItem {
  description: string;
  qty: number;
  rate: number;
  gstRate: number; // percentage e.g. 18
}

interface BusinessProfile {
  name: string;
  address: string;
  gstin: string;
  state: string;
}

const DEFAULT_PROFILE: BusinessProfile = {
  name: "",
  address: "",
  gstin: "",
  state: "",
};

function calcTax(
  items: LineItem[],
  supplyType: "intra" | "inter"
): {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
} {
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  for (const item of items) {
    const lineTotal = item.qty * item.rate;
    const taxAmt = (lineTotal * item.gstRate) / 100;
    subtotal += lineTotal;
    if (supplyType === "intra") {
      cgst += taxAmt / 2;
      sgst += taxAmt / 2;
    } else {
      igst += taxAmt;
    }
  }

  return {
    subtotal,
    cgst,
    sgst,
    igst,
    total: subtotal + cgst + sgst + igst,
  };
}

async function generateInvoicePdf(
  profile: BusinessProfile,
  buyer: BusinessProfile,
  invoiceNo: string,
  date: string,
  items: LineItem[],
  supplyType: "intra" | "inter"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.28;
  const pageH = 841.89;
  const page = pdfDoc.addPage([pageW, pageH]);

  const margin = 40;
  let y = pageH - margin;

  const darkGray = rgb(0.1, 0.1, 0.1);
  const accent = rgb(0.23, 0.51, 0.96);
  const lightGray = rgb(0.85, 0.85, 0.85);

  // Header bar
  page.drawRectangle({ x: 0, y: pageH - 55, width: pageW, height: 55, color: accent });
  page.drawText("TAX INVOICE", { x: margin, y: pageH - 37, size: 20, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText(`No: ${invoiceNo}  |  Date: ${date}`, { x: margin, y: pageH - 52, size: 9, font: helvetica, color: rgb(0.9, 0.9, 1) });

  y = pageH - 75;

  // Seller block
  page.drawText("FROM", { x: margin, y, size: 8, font: helveticaBold, color: accent });
  y -= 14;
  page.drawText(profile.name || "Your Business", { x: margin, y, size: 11, font: helveticaBold, color: darkGray });
  y -= 13;
  page.drawText(profile.address || "-", { x: margin, y, size: 9, font: helvetica, color: darkGray });
  y -= 12;
  page.drawText(`GSTIN: ${profile.gstin || "-"}  |  State: ${profile.state || "-"}`, { x: margin, y, size: 9, font: helvetica, color: darkGray });

  // Buyer block (right side)
  let by = pageH - 75;
  const rightX = pageW / 2 + 10;
  page.drawText("BILL TO", { x: rightX, y: by, size: 8, font: helveticaBold, color: accent });
  by -= 14;
  page.drawText(buyer.name || "-", { x: rightX, y: by, size: 11, font: helveticaBold, color: darkGray });
  by -= 13;
  page.drawText(buyer.address || "-", { x: rightX, y: by, size: 9, font: helvetica, color: darkGray });
  by -= 12;
  page.drawText(`GSTIN: ${buyer.gstin || "-"}  |  State: ${buyer.state || "-"}`, { x: rightX, y: by, size: 9, font: helvetica, color: darkGray });

  y = Math.min(y, by) - 20;

  // Line
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: lightGray });
  y -= 15;

  // Table header
  const cols = { desc: margin, qty: 280, rate: 340, gst: 410, amount: 480 };
  page.drawRectangle({ x: margin, y: y - 2, width: pageW - margin * 2, height: 18, color: rgb(0.94, 0.95, 1) });
  page.drawText("Description", { x: cols.desc + 4, y: y + 3, size: 9, font: helveticaBold, color: darkGray });
  page.drawText("Qty", { x: cols.qty, y: y + 3, size: 9, font: helveticaBold, color: darkGray });
  page.drawText("Rate", { x: cols.rate, y: y + 3, size: 9, font: helveticaBold, color: darkGray });
  page.drawText("GST%", { x: cols.gst, y: y + 3, size: 9, font: helveticaBold, color: darkGray });
  page.drawText("Amount", { x: cols.amount, y: y + 3, size: 9, font: helveticaBold, color: darkGray });
  y -= 16;

  for (const item of items) {
    const amt = item.qty * item.rate;
    page.drawText(item.description.substring(0, 42) || "-", { x: cols.desc + 4, y, size: 9, font: helvetica, color: darkGray });
    page.drawText(String(item.qty), { x: cols.qty, y, size: 9, font: helvetica, color: darkGray });
    page.drawText(`₹${item.rate.toFixed(2)}`, { x: cols.rate, y, size: 9, font: helvetica, color: darkGray });
    page.drawText(`${item.gstRate}%`, { x: cols.gst, y, size: 9, font: helvetica, color: darkGray });
    page.drawText(`₹${amt.toFixed(2)}`, { x: cols.amount, y, size: 9, font: helvetica, color: darkGray });
    y -= 15;
    page.drawLine({ start: { x: margin, y: y + 2 }, end: { x: pageW - margin, y: y + 2 }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) });
  }

  y -= 10;
  const { subtotal, cgst, sgst, igst, total } = calcTax(items, supplyType);

  const drawRow = (label: string, value: string, bold = false) => {
    const font = bold ? helveticaBold : helvetica;
    page.drawText(label, { x: cols.gst - 60, y, size: 9, font, color: darkGray });
    page.drawText(value, { x: cols.amount, y, size: 9, font, color: darkGray });
    y -= 14;
  };

  drawRow("Subtotal:", `₹${subtotal.toFixed(2)}`);
  if (supplyType === "intra") {
    drawRow("CGST:", `₹${cgst.toFixed(2)}`);
    drawRow("SGST:", `₹${sgst.toFixed(2)}`);
  } else {
    drawRow("IGST:", `₹${igst.toFixed(2)}`);
  }
  y -= 4;
  page.drawLine({ start: { x: cols.gst - 70, y }, end: { x: pageW - margin, y }, thickness: 0.5, color: accent });
  y -= 4;
  drawRow("TOTAL:", `₹${total.toFixed(2)}`, true);

  y -= 20;
  page.drawText("This is a computer-generated invoice. No signature required.", {
    x: margin, y, size: 8, font: helvetica, color: rgb(0.5, 0.5, 0.5),
  });

  return await pdfDoc.save();
}

export default function GstInvoicePage() {
  const [profile, setProfile] = React.useState<BusinessProfile>(DEFAULT_PROFILE);
  const [buyer, setBuyer] = React.useState<BusinessProfile>(DEFAULT_PROFILE);
  const [invoiceNo, setInvoiceNo] = React.useState("INV-001");
  const [date, setDate] = React.useState(new Date().toLocaleDateString("en-IN"));
  const [supplyType, setSupplyType] = React.useState<"intra" | "inter">("intra");
  const [items, setItems] = React.useState<LineItem[]>([
    { description: "", qty: 1, rate: 0, gstRate: 18 },
  ]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const { subtotal, cgst, sgst, igst, total } = calcTax(items, supplyType);

  const addItem = () =>
    setItems((prev) => [...prev, { description: "", qty: 1, rate: 0, gstRate: 18 }]);
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string | number) =>
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generateInvoicePdf(profile, buyer, invoiceNo, date, items, supplyType);
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed to generate invoice: ${(err as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const inputClass =
    "h-9 bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--accent)] placeholder:text-[var(--subtle-foreground)]";

  return (
    <ToolPageShell tool={tool}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Supply Type */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Supply Type</h3>
          <div className="flex gap-3">
            {(["intra", "inter"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSupplyType(type)}
                className={`flex-1 py-2.5 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${
                  supplyType === type
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border-hover)]"
                }`}
              >
                {type === "intra" ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)"}
              </button>
            ))}
          </div>
        </Card>

        {/* Invoice details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--muted-foreground)]">Invoice Number</label>
            <Input className={inputClass} value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)]">Invoice Date</label>
            <Input className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {/* Seller & Buyer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Seller / Your Business", state: profile, setter: setProfile },
            { label: "Buyer / Bill To", state: buyer, setter: setBuyer },
          ].map(({ label, state, setter }) => (
            <Card key={label} className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{label}</h3>
              </div>
              {(["name", "address", "gstin", "state"] as const).map((field) => (
                <div key={field}>
                  <label className="text-xs text-[var(--muted-foreground)] capitalize">{field}</label>
                  <Input
                    className={inputClass}
                    value={state[field]}
                    onChange={(e) => setter((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder={field === "gstin" ? "22AAAAA0000A1Z5" : ""}
                  />
                </div>
              ))}
            </Card>
          ))}
        </div>

        {/* Line Items */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Line Items</h3>
            <Button variant="secondary" size="sm" onClick={addItem}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs text-[var(--muted-foreground)] font-medium px-1">
              <span className="col-span-4">Description</span>
              <span className="col-span-2">Qty</span>
              <span className="col-span-2">Rate (₹)</span>
              <span className="col-span-2">GST %</span>
              <span className="col-span-1">Amount</span>
              <span className="col-span-1"></span>
            </div>

            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  className={`${inputClass} col-span-4`}
                  value={item.description}
                  placeholder="Product/service"
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                />
                <Input
                  className={`${inputClass} col-span-2`}
                  type="number"
                  min="0"
                  value={item.qty}
                  onChange={(e) => updateItem(i, "qty", parseFloat(e.target.value) || 0)}
                />
                <Input
                  className={`${inputClass} col-span-2`}
                  type="number"
                  min="0"
                  value={item.rate}
                  onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)}
                />
                <select
                  className={`col-span-2 h-9 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-sm)] text-sm text-[var(--foreground)] px-2`}
                  value={item.gstRate}
                  onChange={(e) => updateItem(i, "gstRate", parseFloat(e.target.value))}
                >
                  {[0, 5, 12, 18, 28].map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
                <span className="col-span-1 text-xs text-[var(--muted-foreground)]">
                  ₹{(item.qty * item.rate).toFixed(0)}
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

          {/* Tax Summary */}
          <div className="border-t border-[var(--border)] pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
            </div>
            {supplyType === "intra" ? (
              <>
                <div className="flex justify-between text-[var(--muted-foreground)]"><span>CGST</span><span>₹{cgst.toFixed(2)}</span></div>
                <div className="flex justify-between text-[var(--muted-foreground)]"><span>SGST</span><span>₹{sgst.toFixed(2)}</span></div>
              </>
            ) : (
              <div className="flex justify-between text-[var(--muted-foreground)]"><span>IGST</span><span>₹{igst.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-bold text-[var(--foreground)] text-base border-t border-[var(--border)] pt-2">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download Invoice PDF"}
          </Button>
        </Card>
      </div>
    </ToolPageShell>
  );
}
