import { CreateRequestInput } from "../../services/api/requests";

export type ClientMode = "existing" | "new";

export interface CreateRequestFormValues {
  templateId: string;
  clientMode: ClientMode;
  clientId: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  expiresAt: string;
}

export type CreateRequestValidationError =
  | "template-required"
  | "client-required"
  | "new-client-required"
  | "expiration-in-past";

export function validateCreateRequestForm(
  values: CreateRequestFormValues,
  today = getLocalDateInputValue()
): CreateRequestValidationError | null {
  if (!values.templateId) {
    return "template-required";
  }

  if (values.clientMode === "existing" && !values.clientId) {
    return "client-required";
  }

  if (
    values.clientMode === "new" &&
    (!values.fullName.trim() || !values.cpf.trim())
  ) {
    return "new-client-required";
  }

  if (values.expiresAt && values.expiresAt < today) {
    return "expiration-in-past";
  }

  return null;
}

export function buildCreateRequestInput(
  values: CreateRequestFormValues
): CreateRequestInput {
  const isExistingClient = values.clientMode === "existing";

  return {
    requestTemplateId: Number(values.templateId),
    externalClientId: isExistingClient ? Number(values.clientId) : null,
    clientFullName: isExistingClient ? null : values.fullName.trim(),
    clientCpf: isExistingClient ? null : values.cpf.trim(),
    clientEmail:
      !isExistingClient && values.email.trim() ? values.email.trim() : null,
    clientPhone:
      !isExistingClient && values.phone.trim() ? values.phone.trim() : null,
    expiresAtUtc: values.expiresAt
      ? new Date(`${values.expiresAt}T23:59:59`).toISOString()
      : null
  };
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
