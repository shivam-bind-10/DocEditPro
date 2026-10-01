"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Download, Check, Edit3, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { detectFormFields, fillFormFields, FormFieldInfo } from "@/lib/pdf/form-utils";
import { addRecentFile } from "@/lib/storage/db";

export default function FillFormPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fields, setFields] = React.useState<FormFieldInfo[]>([]);
  const [formValues, setFormValues] = React.useState<Record<string, string | boolean>>({});
  const [flatten, setFlatten] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [resultPdf, setResultPdf] = React.useState<{ blob: Blob; url: string; name: string } | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResultPdf(null);
    setIsScanning(true);

    try {
      const bytes = new Uint8Array(await selected.arrayBuffer());
      const detected = await detectFormFields(bytes);
      setFields(detected);

      // Initialize form values
      const initialValues: Record<string, string | boolean> = {};
      for (const f of detected) {
        initialValues[f.name] = f.currentValue;
      }
      setFormValues(initialValues);
    } catch (err) {
      console.error(err);
      alert("Failed to inspect PDF form fields. Please check the file.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleValueChange = (name: string, value: string | boolean) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const filledBytes = await fillFormFields(bytes, formValues, flatten);
      const blob = new Blob([filledBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const name = file.name.replace(/\.pdf$/i, "") + "-filled.pdf";

      setResultPdf({ blob, url, name });

      await addRecentFile({
        name,
        size: file.size,
        type: "application/pdf",
        toolSlug: "fill-form",
        resultSize: blob.size,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save filled form. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Tools
          </Link>
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">PDF Form Filler</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Detect, populate, and permanently flatten interactive AcroForm fields. 100% private in-browser.
              </p>
            </div>
          </div>
        </div>

        {/* Upload State */}
        {!file ? (
          <FileDropzone
            accept={[".pdf"]}
            maxFiles={1}
            onFilesSelected={handleFileSelected}
            title="Drop interactive PDF form here"
            description="Supports AcroForms with text fields, checkboxes, and dropdown selectors"
          />
        ) : (
          <div className="space-y-6">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-[var(--accent)]" />
                <div>
                  <div className="text-sm font-semibold">{file.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {fields.length} form field(s) detected
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setFields([]);
                  setResultPdf(null);
                }}
                className="text-xs text-[var(--muted-foreground)] hover:text-red-400"
              >
                Change Document
              </Button>
            </div>

            {/* No Fields Detected Alert */}
            {fields.length === 0 && !isScanning && (
              <Card className="p-6 border-[var(--border)] bg-[var(--surface)] text-center space-y-4">
                <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
                <div>
                  <h3 className="text-base font-semibold">No Interactive Form Fields Found</h3>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto mt-1">
                    This document appears to be a standard static PDF without interactive fillable AcroForm fields.
                    You can still edit text, add checkmarks, or sign it directly in the interactive PDF Editor!
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/edit-pdf-text">
                    <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs">
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      Open in Interactive PDF Editor
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Fields List */}
            {fields.length > 0 && (
              <Card className="p-6 border-[var(--border)] bg-[var(--surface)] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h3 className="font-semibold text-sm">Interactive Fields</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Update the detected form fields below and choose whether to flatten the output.
                    </p>
                  </div>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer select-none bg-[var(--surface-elevated)] px-3 py-1.5 rounded-md border border-[var(--border)]">
                    <input
                      type="checkbox"
                      checked={flatten}
                      onChange={(e) => setFlatten(e.target.checked)}
                      className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span>Flatten Form (Prevent Further Editing)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field, idx) => {
                    const val = formValues[field.name];
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-mono font-medium text-[var(--accent)] truncate max-w-[200px]">
                            {field.name}
                          </label>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)]">
                            {field.type}
                          </span>
                        </div>

                        {field.type === "checkbox" ? (
                          <div className="flex items-center space-x-2 pt-1">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) => handleValueChange(field.name, e.target.checked)}
                              className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-xs text-[var(--foreground)]">
                              {Boolean(val) ? "Checked" : "Unchecked"}
                            </span>
                          </div>
                        ) : field.type === "dropdown" || field.type === "radio" ? (
                          <select
                            value={String(val || "")}
                            onChange={(e) => handleValueChange(field.name, e.target.value)}
                            className="w-full h-8 rounded border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          >
                            <option value="">-- Select option --</option>
                            {field.options?.map((opt, i) => (
                              <option key={i} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            value={String(val || "")}
                            onChange={(e) => handleValueChange(field.name, e.target.value)}
                            placeholder={`Enter ${field.name}...`}
                            className="text-xs h-8"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6"
                  >
                    Apply & Generate PDF
                  </Button>
                </div>
              </Card>
            )}

            {/* Result Download Card */}
            {resultPdf && (
              <Card className="p-6 border-[var(--border)] bg-[var(--surface)] border-l-4 border-l-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--foreground)]">Form Filled Successfully</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {resultPdf.name} ({(resultPdf.blob.size / 1024).toFixed(1)} KB) • {flatten ? "Flattened" : "Interactive"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <a href={resultPdf.url} download={resultPdf.name}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download Filled PDF</span>
                    </Button>
                  </a>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <ProcessingOverlay isOpen={isScanning || isProcessing} progress={50} statusText={isScanning ? "Scanning form fields..." : "Saving filled document..."} />
    </div>
  );
}
