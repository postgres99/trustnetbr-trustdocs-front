export const DOCUMENT_REVIEW_STATUS = {
  uploaded: 0,
  underReview: 1,
  approved: 2,
  rejected: 3,
  needsResubmission: 4
} as const;

export const MAX_REVIEW_COMMENT_LENGTH = 1000;

export type DocumentReviewValidationError =
  | "status-required"
  | "comment-required"
  | "comment-too-long";

export function getInitialReviewStatus(currentStatus: number) {
  return currentStatus === DOCUMENT_REVIEW_STATUS.uploaded
    ? DOCUMENT_REVIEW_STATUS.underReview
    : currentStatus;
}

export function validateDocumentReview(
  status: number,
  comment: string
): DocumentReviewValidationError | null {
  if (
    status < DOCUMENT_REVIEW_STATUS.underReview ||
    status > DOCUMENT_REVIEW_STATUS.needsResubmission
  ) {
    return "status-required";
  }

  const normalizedComment = comment.trim();
  const requiresComment =
    status === DOCUMENT_REVIEW_STATUS.rejected ||
    status === DOCUMENT_REVIEW_STATUS.needsResubmission;

  if (requiresComment && !normalizedComment) {
    return "comment-required";
  }

  if (normalizedComment.length > MAX_REVIEW_COMMENT_LENGTH) {
    return "comment-too-long";
  }

  return null;
}
