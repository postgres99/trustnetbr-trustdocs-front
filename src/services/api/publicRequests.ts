import { apiRequest } from "./client";

export interface PublicRequestDocument {
  id: number;
  documentTypeId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAtUtc: string;
  reviewStatus: number;
  reviewStatusDescription: string;
  lastReviewerComment: string | null;
}

export interface PublicRequestRequirement {
  documentTypeId: number;
  documentTypeName: string;
  isRequired: boolean;
  order: number;
  canUpload: boolean;
  currentDocument: PublicRequestDocument | null;
}

export interface PublicRequest {
  id: number;
  templateName: string;
  clientName: string;
  status: number;
  statusDescription: string;
  createdAtUtc: string;
  expiresAtUtc: string | null;
  submittedAtUtc: string | null;
  isExpired: boolean;
  canUpload: boolean;
  canSubmit: boolean;
  requirements: PublicRequestRequirement[];
}

export function getPublicRequest(token: string) {
  return apiRequest<PublicRequest>(`/public/requests/${encodeURIComponent(token)}`);
}

export function uploadPublicDocument(
  token: string,
  documentTypeId: number,
  file: File
) {
  const form = new FormData();
  form.append("documentTypeId", String(documentTypeId));
  form.append("file", file);

  return apiRequest<PublicRequest>(
    `/public/requests/${encodeURIComponent(token)}/documents`,
    {
      method: "POST",
      body: form
    }
  );
}

export function deletePublicDocument(token: string, documentId: number) {
  return apiRequest<PublicRequest>(
    `/public/requests/${encodeURIComponent(token)}/documents/${documentId}`,
    { method: "DELETE" }
  );
}

export function submitPublicRequest(token: string) {
  return apiRequest<PublicRequest>(
    `/public/requests/${encodeURIComponent(token)}/submit`,
    { method: "POST" }
  );
}
