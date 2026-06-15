import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_SIZE_BYTES,
  validateDocumentFile
} from "./documentUploadValidation";

function file(name: string, type: string, size = 1024) {
  return { name, type, size };
}

describe("validateDocumentFile", () => {
  it.each([
    ["document.pdf", "application/pdf"],
    ["photo.jpg", "image/jpeg"],
    ["photo.JPEG", "image/jpeg"],
    ["scan.png", "image/png"],
    ["scan.webp", "image/webp"]
  ])("accepts supported extension and content type: %s", (name, type) => {
    expect(validateDocumentFile(file(name, type))).toBe("valid");
  });

  it("accepts a document at the exact size limit", () => {
    expect(
      validateDocumentFile(
        file("document.pdf", "application/pdf", MAX_DOCUMENT_SIZE_BYTES)
      )
    ).toBe("valid");
  });

  it("rejects a document larger than 20 MB", () => {
    expect(
      validateDocumentFile(
        file("document.pdf", "application/pdf", MAX_DOCUMENT_SIZE_BYTES + 1)
      )
    ).toBe("too-large");
  });

  it("rejects an empty document", () => {
    expect(validateDocumentFile(file("document.pdf", "application/pdf", 0))).toBe(
      "empty"
    );
  });

  it.each([
    ["document.exe", "application/octet-stream"],
    ["document.pdf", "image/png"],
    ["photo.png", "image/jpeg"],
    ["document", "application/pdf"],
    ["document.pdf", ""]
  ])("rejects unsupported or inconsistent format: %s", (name, type) => {
    expect(validateDocumentFile(file(name, type))).toBe("invalid-format");
  });
});
