import { apiRequest } from "./client";

export interface SystemConfiguration {
  id: number;
  adminEmails: string;
  loginEmail: string;
  emailFrom: string;
  emailNameFrom: string;
  port: number;
  host: string;
  enableSsl: boolean;
  deliveryBy: number;
  useDefaultCredentials: boolean;
  createDate: string;
  updateAt: string;
  hasPasswordEmail: boolean;
}

export interface UpdateSystemConfiguration {
  adminEmails: string;
  loginEmail: string;
  passwordEmail: string | null;
  emailFrom: string;
  emailNameFrom: string;
  port: number;
  host: string;
  enableSsl: boolean;
  deliveryBy: number;
  useDefaultCredentials: boolean;
}

export function getSystemConfiguration(token: string) {
  return apiRequest<SystemConfiguration>("/configurations", {}, token);
}

export function updateSystemConfiguration(
  token: string,
  input: UpdateSystemConfiguration
) {
  return apiRequest<SystemConfiguration>(
    "/configurations",
    { method: "PUT", body: JSON.stringify(input) },
    token
  );
}
