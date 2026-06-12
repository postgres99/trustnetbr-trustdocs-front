import { apiRequest } from "./client";

export interface DocumentType {
  id: number;
  tenantId: number | null;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface DocumentTypeInput {
  name: string;
  description: string | null;
  isActive: boolean;
}

export function getDocumentTypes(token: string) {
  return apiRequest<DocumentType[]>("/document-types", {}, token);
}

export function createDocumentType(token: string, input: DocumentTypeInput) {
  return apiRequest<DocumentType>(
    "/document-types",
    {
      method: "POST",
      body: JSON.stringify({ tenantId: null, ...input })
    },
    token
  );
}

export function updateDocumentType(
  token: string,
  id: number,
  input: DocumentTypeInput
) {
  return apiRequest<DocumentType>(
    `/document-types/${id}`,
    { method: "PUT", body: JSON.stringify(input) },
    token
  );
}
