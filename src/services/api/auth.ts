import { apiBlob, apiRequest } from "./client";

export interface AuthenticatedUser {
  id: string;
  userName: string;
  email: string;
  displayName: string;
  tenantId: number | null;
  roles: string[];
}

export interface LoginResult {
  requiresTwoFactor: boolean;
  tokenType: string;
  accessToken: string | null;
  expiresAtUtc: string | null;
  user: AuthenticatedUser;
}

export interface CurrentUser extends AuthenticatedUser {
  timeZoneId: string;
  preferredCulture: string;
}

export interface HealthStatus {
  application: string;
  status: string;
  databaseStatus: string;
  checkedAtUtc: string;
}

export function login(loginValue: string, password: string) {
  return apiRequest<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      login: loginValue,
      password
    })
  });
}

export function getCurrentUser(token: string) {
  return apiRequest<CurrentUser>("/auth/me", {}, token);
}

export function getHealth() {
  return apiRequest<HealthStatus>("/health");
}

export function updateCurrentUserPreferences(
  token: string,
  timeZoneId: string,
  preferredCulture: string
) {
  return apiRequest<CurrentUser>(
    "/auth/me/preferences",
    {
      method: "PUT",
      body: JSON.stringify({ timeZoneId, preferredCulture })
    },
    token
  );
}

export function changeCurrentUserPassword(
  token: string,
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
) {
  return apiRequest<Record<string, never>>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmNewPassword
      })
    },
    token
  );
}

export function getCurrentUserAvatar(token: string) {
  return apiBlob("/auth/me/avatar", token);
}

export function uploadCurrentUserAvatar(token: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<Record<string, never>>(
    "/auth/me/avatar",
    { method: "POST", body: form },
    token
  );
}

export function removeCurrentUserAvatar(token: string) {
  return apiRequest<Record<string, never>>(
    "/auth/me/avatar",
    { method: "DELETE" },
    token
  );
}
