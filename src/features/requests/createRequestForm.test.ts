import { describe, expect, it } from "vitest";
import {
  buildCreateRequestInput,
  CreateRequestFormValues,
  getLocalDateInputValue,
  validateCreateRequestForm
} from "./createRequestForm";

const validExisting: CreateRequestFormValues = {
  templateId: "10",
  clientMode: "existing",
  clientId: "20",
  fullName: "",
  cpf: "",
  email: "",
  phone: "",
  expiresAt: ""
};

describe("create request form", () => {
  it("requires a template and the selected client mode fields", () => {
    expect(
      validateCreateRequestForm({ ...validExisting, templateId: "" })
    ).toBe("template-required");
    expect(
      validateCreateRequestForm({ ...validExisting, clientId: "" })
    ).toBe("client-required");
    expect(
      validateCreateRequestForm({
        ...validExisting,
        clientMode: "new",
        clientId: "",
        fullName: " ",
        cpf: ""
      })
    ).toBe("new-client-required");
  });

  it("rejects an expiration date before the local current date", () => {
    expect(
      validateCreateRequestForm(
        { ...validExisting, expiresAt: "2026-06-13" },
        "2026-06-14"
      )
    ).toBe("expiration-in-past");
  });

  it("builds a payload for an existing client without new-client data", () => {
    expect(
      buildCreateRequestInput({
        ...validExisting,
        fullName: "Ignored",
        cpf: "Ignored",
        email: "ignored@example.com"
      })
    ).toEqual({
      requestTemplateId: 10,
      externalClientId: 20,
      clientFullName: null,
      clientCpf: null,
      clientEmail: null,
      clientPhone: null,
      expiresAtUtc: null
    });
  });

  it("trims new-client data and omits the existing client id", () => {
    const result = buildCreateRequestInput({
      ...validExisting,
      clientMode: "new",
      clientId: "20",
      fullName: "  Maria Silva  ",
      cpf: "  12345678900 ",
      email: " maria@example.com ",
      phone: " 11999999999 "
    });

    expect(result).toMatchObject({
      requestTemplateId: 10,
      externalClientId: null,
      clientFullName: "Maria Silva",
      clientCpf: "12345678900",
      clientEmail: "maria@example.com",
      clientPhone: "11999999999"
    });
  });

  it("formats the date input using local calendar values", () => {
    const localDate = new Date(2026, 5, 14, 23, 30);
    expect(getLocalDateInputValue(localDate)).toBe("2026-06-14");
  });
});
