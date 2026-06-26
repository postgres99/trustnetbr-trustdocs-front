import { describe, expect, it } from "vitest";
import {
  formatCnpj,
  formatCpfOrCnpj,
  isEmptyOrValidCnpj,
  isValidCpfOrCnpj,
  normalizeBrazilianTaxId
} from "./brazilianTaxId";

describe("brazilianTaxId", () => {
  it("accepts valid CPF and CNPJ values with or without mask", () => {
    expect(isValidCpfOrCnpj("52998224725")).toBe(true);
    expect(isValidCpfOrCnpj("529.982.247-25")).toBe(true);
    expect(isValidCpfOrCnpj("11222333000181")).toBe(true);
    expect(isValidCpfOrCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("rejects invalid values and repeated digits", () => {
    expect(isValidCpfOrCnpj("123")).toBe(false);
    expect(isValidCpfOrCnpj("00000000000")).toBe(false);
    expect(isValidCpfOrCnpj("11111111111111")).toBe(false);
    expect(isValidCpfOrCnpj("52998224724")).toBe(false);
  });

  it("supports optional CNPJ fields", () => {
    expect(isEmptyOrValidCnpj("")).toBe(true);
    expect(isEmptyOrValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isEmptyOrValidCnpj("529.982.247-25")).toBe(false);
  });

  it("normalizes values to digits only", () => {
    expect(normalizeBrazilianTaxId("11.222.333/0001-81")).toBe("11222333000181");
    expect(normalizeBrazilianTaxId("12345678901234567890")).toBe("12345678901234");
  });

  it("formats values while typing", () => {
    expect(formatCpfOrCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfOrCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});
