export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

export const DOCUMENT_FILE_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export type DocumentValidationResult =
  | "valid"
  | "empty"
  | "too-large"
  | "invalid-format";

const allowedFormats: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"]
};

export function validateDocumentFile(file: {
  name: string;
  size: number;
  type: string;
}): DocumentValidationResult {
  if (file.size <= 0) {
    return "empty";
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "too-large";
  }

  const extension = file.name.split(".").pop()?.toLocaleLowerCase();
  const contentType = file.type.toLocaleLowerCase();

  if (
    !extension ||
    !allowedFormats[extension]?.includes(contentType)
  ) {
    return "invalid-format";
  }

  return "valid";
}
