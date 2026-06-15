import { describe, expect, it } from "vitest";
import {
  DOCUMENT_REVIEW_STATUS,
  getInitialReviewStatus,
  MAX_REVIEW_COMMENT_LENGTH,
  validateDocumentReview
} from "./documentReviewRules";

describe("document review rules", () => {
  it("starts uploaded documents in under-review status", () => {
    expect(getInitialReviewStatus(DOCUMENT_REVIEW_STATUS.uploaded)).toBe(
      DOCUMENT_REVIEW_STATUS.underReview
    );
  });

  it.each([
    DOCUMENT_REVIEW_STATUS.rejected,
    DOCUMENT_REVIEW_STATUS.needsResubmission
  ])("requires a comment for status %s", (status) => {
    expect(validateDocumentReview(status, " ")).toBe("comment-required");
    expect(validateDocumentReview(status, "Unreadable document.")).toBeNull();
  });

  it("allows approval without a comment", () => {
    expect(
      validateDocumentReview(DOCUMENT_REVIEW_STATUS.approved, "")
    ).toBeNull();
  });

  it("rejects comments longer than the API limit", () => {
    expect(
      validateDocumentReview(
        DOCUMENT_REVIEW_STATUS.underReview,
        "a".repeat(MAX_REVIEW_COMMENT_LENGTH + 1)
      )
    ).toBe("comment-too-long");
  });
});
