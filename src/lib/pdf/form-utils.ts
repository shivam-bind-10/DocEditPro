import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
} from "pdf-lib";

export interface FormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio" | "option-list" | "unknown";
  currentValue: string | boolean;
  options?: string[];
  isMultiline?: boolean;
  isReadOnly?: boolean;
}

export async function detectFormFields(pdfBytes: Uint8Array): Promise<FormFieldInfo[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  let form;
  try {
    form = pdfDoc.getForm();
  } catch {
    return [];
  }

  const fields = form.getFields();
  const result: FormFieldInfo[] = [];

  for (const field of fields) {
    const name = field.getName();
    const isReadOnly = field.isReadOnly();

    if (field instanceof PDFTextField) {
      result.push({
        name,
        type: "text",
        currentValue: field.getText() || "",
        isMultiline: field.isMultiline(),
        isReadOnly,
      });
    } else if (field instanceof PDFCheckBox) {
      result.push({
        name,
        type: "checkbox",
        currentValue: field.isChecked(),
        isReadOnly,
      });
    } else if (field instanceof PDFDropdown) {
      result.push({
        name,
        type: "dropdown",
        currentValue: field.getSelected()[0] || "",
        options: field.getOptions(),
        isReadOnly,
      });
    } else if (field instanceof PDFRadioGroup) {
      result.push({
        name,
        type: "radio",
        currentValue: field.getSelected() || "",
        options: field.getOptions(),
        isReadOnly,
      });
    } else if (field instanceof PDFOptionList) {
      result.push({
        name,
        type: "option-list",
        currentValue: (field.getSelected() || []).join(", "),
        options: field.getOptions(),
        isReadOnly,
      });
    } else {
      result.push({
        name,
        type: "unknown",
        currentValue: "",
        isReadOnly,
      });
    }
  }

  return result;
}

export async function fillFormFields(
  pdfBytes: Uint8Array,
  values: Record<string, string | boolean>,
  flatten = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  for (const [name, val] of Object.entries(values)) {
    try {
      const field = form.getFieldMaybe(name);
      if (!field) continue;

      if (field instanceof PDFTextField) {
        field.setText(String(val ?? ""));
      } else if (field instanceof PDFCheckBox) {
        if (val === true || val === "true") {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFDropdown) {
        if (typeof val === "string" && val.length > 0) {
          field.select(val);
        }
      } else if (field instanceof PDFRadioGroup) {
        if (typeof val === "string" && val.length > 0) {
          field.select(val);
        }
      }
    } catch (err) {
      console.warn(`Failed to set value for form field ${name}:`, err);
    }
  }

  if (flatten) {
    try {
      form.flatten();
    } catch (err) {
      console.warn("Could not flatten form:", err);
    }
  }

  return await pdfDoc.save();
}
