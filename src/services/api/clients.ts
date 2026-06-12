import { apiRequest } from "./client";

export interface Client {
  id: number;
  tenantId: number | null;
  fullName: string;
  cpf: string;
  email: string | null;
  phone: string | null;
  isDeleted: boolean;
  deletedAtUtc: string | null;
  createDate: string;
  updateAt: string;
}

export interface ClientInput {
  fullName: string;
  cpf: string;
  email: string | null;
  phone: string | null;
}

export function getClients(token: string, search = "") {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  return apiRequest<Client[]>(`/clients${query}`, {}, token);
}

export function createClient(token: string, input: ClientInput) {
  return apiRequest<Client>(
    "/clients",
    {
      method: "POST",
      body: JSON.stringify({
        tenantId: null,
        ...input
      })
    },
    token
  );
}

export function updateClient(
  token: string,
  clientId: number,
  input: ClientInput
) {
  return apiRequest<Client>(
    `/clients/${clientId}`,
    {
      method: "PUT",
      body: JSON.stringify(input)
    },
    token
  );
}

export function deleteClient(token: string, clientId: number) {
  return apiRequest<Client>(
    `/clients/${clientId}`,
    { method: "DELETE" },
    token
  );
}
