import { apiRequest } from "./client";

export interface UserListItem {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  tenantId: number | null;
  roles: string[];
}

export interface UserDetails extends UserListItem {
  userName: string;
  cpfCnpj: string;
  emailConfirmed: boolean;
  timeZoneId: string;
  preferredCulture: string;
  availableRoles: string[];
}

export interface UserAuditEvent {
  id: number;
  occurredAtUtc: string;
  eventType: string;
  eventTypeDescription: string;
  actorDisplay: string | null;
  actorUserId: string;
  ipAddress: string | null;
  dataJson: string | null;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  cpfCnpj: string | null;
  tenantId: number | null;
  roles: string[];
  timeZoneId: string;
  preferredCulture: string;
}

export interface CreateUserResult {
  user: UserDetails;
  temporaryPassword: string;
}

export interface UpdateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  cpfCnpj: string | null;
  tenantId: number | null;
}

export function getUsers(token: string, search = "") {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  return apiRequest<UserListItem[]>(`/users${query}`, {}, token);
}

export function getUser(token: string, userId: string) {
  return apiRequest<UserDetails>(
    `/users/${encodeURIComponent(userId)}`,
    {},
    token
  );
}

export function createUser(token: string, input: CreateUserInput) {
  return apiRequest<CreateUserResult>(
    "/users",
    { method: "POST", body: JSON.stringify(input) },
    token
  );
}

export function updateUser(
  token: string,
  userId: string,
  input: UpdateUserInput
) {
  return apiRequest<UserDetails>(
    `/users/${encodeURIComponent(userId)}`,
    { method: "PUT", body: JSON.stringify(input) },
    token
  );
}

export function updateUserRoles(
  token: string,
  userId: string,
  roles: string[]
) {
  return apiRequest<UserDetails>(
    `/users/${encodeURIComponent(userId)}/roles`,
    { method: "PUT", body: JSON.stringify({ roles }) },
    token
  );
}

export function updateUserPreferences(
  token: string,
  userId: string,
  timeZoneId: string,
  preferredCulture: string
) {
  return apiRequest<UserDetails>(
    `/users/${encodeURIComponent(userId)}/preferences`,
    {
      method: "PUT",
      body: JSON.stringify({ timeZoneId, preferredCulture })
    },
    token
  );
}

export function toggleUserActive(token: string, userId: string) {
  return apiRequest<UserDetails>(
    `/users/${encodeURIComponent(userId)}/toggle-active`,
    { method: "POST" },
    token
  );
}

export function resetUserPassword(token: string, userId: string) {
  return apiRequest<{ userId: string; temporaryPassword: string }>(
    `/users/${encodeURIComponent(userId)}/reset-password`,
    { method: "POST" },
    token
  );
}

export function getUserAudit(token: string, userId: string) {
  return apiRequest<UserAuditEvent[]>(
    `/users/${encodeURIComponent(userId)}/audit`,
    {},
    token
  );
}
