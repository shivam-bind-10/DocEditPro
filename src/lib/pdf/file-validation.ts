export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  allowedTypes: string[] = ['.pdf'],
  maxSizeMB = 200
): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the ${maxSizeMB}MB browser limit.`,
    };
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const isAllowedExt = allowedTypes.some((type) => {
    if (type.startsWith('.')) return ext === type.toLowerCase();
    return file.type.includes(type.toLowerCase());
  });

  if (!isAllowedExt) {
    return {
      valid: false,
      error: `Unsupported file type (${ext}). Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
