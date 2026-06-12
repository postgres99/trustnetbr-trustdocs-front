import { apiRequest } from "./client";

export interface EnumOption {
  value: number;
  name: string;
  description: string;
}

export interface NamedOption {
  value: string;
  name: string;
  description: string;
}

export function getDocumentReviewStatuses() {
  return apiRequest<EnumOption[]>("/enums/document-review-statuses");
}

export function getSupportedCultures() {
  return apiRequest<NamedOption[]>("/enums/supported-cultures");
}

export function getSupportedTimeZones() {
  return apiRequest<NamedOption[]>("/enums/supported-time-zones");
}

export function getApplicationRoles() {
  return apiRequest<NamedOption[]>("/enums/application-roles");
}
