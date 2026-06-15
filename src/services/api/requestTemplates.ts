import { apiRequest } from "./client";

export interface TemplateRequirement {
  requirementId: number;
  documentTypeId: number;
  documentTypeName: string;
  isRequired: boolean;
  order: number;
}

export interface RequestTemplate {
  id: number;
  tenantId: number | null;
  name: string;
  description: string | null;
  isActive: boolean;
  requirements: TemplateRequirement[];
}

export function getRequestTemplates(token: string) {
  return apiRequest<RequestTemplate[]>("/request-templates", {}, token);
}

export interface RequestTemplateInput {
  name: string;
  description: string | null;
  isActive: boolean;
}

export function createRequestTemplate(
  token: string,
  input: RequestTemplateInput
) {
  return apiRequest<RequestTemplate>(
    "/request-templates",
    {
      method: "POST",
      body: JSON.stringify({ tenantId: null, ...input })
    },
    token
  );
}

export function updateRequestTemplate(
  token: string,
  id: number,
  input: RequestTemplateInput
) {
  return apiRequest<RequestTemplate>(
    `/request-templates/${id}`,
    { method: "PUT", body: JSON.stringify(input) },
    token
  );
}

export function addTemplateRequirement(
  token: string,
  templateId: number,
  documentTypeId: number,
  isRequired: boolean
) {
  return apiRequest<RequestTemplate>(
    `/request-templates/${templateId}/requirements`,
    {
      method: "POST",
      body: JSON.stringify({ documentTypeId, isRequired })
    },
    token
  );
}

export function updateTemplateRequirement(
  token: string,
  templateId: number,
  requirementId: number,
  isRequired: boolean,
  order: number
) {
  return apiRequest<RequestTemplate>(
    `/request-templates/${templateId}/requirements/${requirementId}`,
    {
      method: "PUT",
      body: JSON.stringify({ isRequired, order })
    },
    token
  );
}

export function reorderTemplateRequirements(
  token: string,
  templateId: number,
  requirementIds: number[]
) {
  return apiRequest<RequestTemplate>(
    `/request-templates/${templateId}/requirements/order`,
    {
      method: "PUT",
      body: JSON.stringify({ requirementIds })
    },
    token
  );
}

export function removeTemplateRequirement(
  token: string,
  templateId: number,
  requirementId: number
) {
  return apiRequest<RequestTemplate>(
    `/request-templates/${templateId}/requirements/${requirementId}`,
    { method: "DELETE" },
    token
  );
}
