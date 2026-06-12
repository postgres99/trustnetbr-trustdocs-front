import { apiRequest } from "./client";

export interface Tenant {
  id: number;
  name: string;
  cnpj: string | null;
  slug: string;
  isActive: boolean;
  createDate?: string;
  updateAt?: string;
}

export interface TenantInput {
  name: string;
  cnpj: string | null;
  slug: string;
  isActive: boolean;
}

export function getTenants(token: string, search = "") {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  return apiRequest<Tenant[]>(`/tenants${query}`, {}, token);
}

export function createTenant(token: string, input: TenantInput) {
  return apiRequest<Tenant>(
    "/tenants",
    { method: "POST", body: JSON.stringify(input) },
    token
  );
}

export function updateTenant(
  token: string,
  tenantId: number,
  input: TenantInput
) {
  return apiRequest<Tenant>(
    `/tenants/${tenantId}`,
    { method: "PUT", body: JSON.stringify(input) },
    token
  );
}
