import { apiDownload, apiRequest } from "./client";

export interface RequestSummary {
  id: number;
  templateName: string;
  clientName: string;
  status: number;
  statusDescription: string;
  createDate: string;
  submittedAtUtc: string | null;
}

export interface CreateRequestInput {
  requestTemplateId: number;
  externalClientId: number | null;
  clientFullName: string | null;
  clientCpf: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  expiresAtUtc: string | null;
}

export interface CreatedRequest {
  request: {
    id: number;
    templateName: string;
    clientName: string;
    statusDescription: string;
    expiresAtUtc: string | null;
  };
  publicTokenOnce: string;
}

export interface RequestDocument {
  id: number;
  documentTypeId: number;
  documentTypeName: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAtUtc: string;
  reviewStatus: number;
  reviewStatusDescription: string;
  lastReviewerComment: string | null;
  lastReviewedAtUtc: string | null;
  lastReviewedByUserId: string | null;
}

export interface RequestAuditEvent {
  id: number;
  occurredAtUtc: string;
  eventType: number;
  eventTypeDescription: string;
  actorDisplay: string | null;
  ipAddress: string | null;
  dataJson: string | null;
}

export interface RequestDetails {
  id: number;
  templateName: string;
  clientName: string;
  clientCpf?: string;
  clientEmail?: string | null;
  status: number;
  statusDescription: string;
  createDateUtc: string;
  expiresAtUtc: string | null;
  submittedAtUtc: string | null;
  documents: RequestDocument[];
  timeline?: RequestAuditEvent[];
}

export function getRequests(token: string, mineOnly: boolean) {
  return apiRequest<RequestSummary[]>(
    mineOnly ? "/my/requests" : "/requests",
    {},
    token
  );
}

export function createRequest(token: string, input: CreateRequestInput) {
  return apiRequest<CreatedRequest>(
    "/requests",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    token
  );
}

export function getRequestDetails(
  token: string,
  requestId: number,
  mineOnly: boolean
) {
  return apiRequest<RequestDetails>(
    mineOnly ? `/my/requests/${requestId}` : `/requests/${requestId}`,
    {},
    token
  );
}

export function updateDocumentStatus(
  token: string,
  documentId: number,
  status: number,
  comment: string
) {
  return apiRequest<RequestDetails>(
    `/requests/documents/${documentId}/status`,
    {
      method: "POST",
      body: JSON.stringify({
        status,
        comment: comment.trim() || null,
        reviewerUserId: null
      })
    },
    token
  );
}

export function downloadDocument(
  token: string,
  documentId: number,
  original: boolean
) {
  return apiDownload(
    `/requests/documents/${documentId}/${original ? "original" : "watermarked"}`,
    token
  );
}
