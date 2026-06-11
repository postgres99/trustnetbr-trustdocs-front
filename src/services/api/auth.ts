import { apiRequest } from "./client";

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
