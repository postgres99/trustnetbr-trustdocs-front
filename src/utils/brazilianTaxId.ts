export function normalizeBrazilianTaxId(value: string | null | undefined) {
  return value?.replace(/\D/g, "").slice(0, 14) ?? "";
}

export function formatCpfOrCnpj(value: string | null | undefined) {
  const digits = normalizeBrazilianTaxId(value);
  return digits.length <= 11 ? formatCpfDigits(digits) : formatCnpjDigits(digits);
}

export function formatCnpj(value: string | null | undefined) {
  return formatCnpjDigits(normalizeBrazilianTaxId(value));
}

export function isValidCpfOrCnpj(value: string | null | undefined) {
  const digits = normalizeBrazilianTaxId(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

export function isEmptyOrValidCpfOrCnpj(value: string | null | undefined) {
  return !value?.trim() || isValidCpfOrCnpj(value);
}

export function isEmptyOrValidCnpj(value: string | null | undefined) {
  const digits = normalizeBrazilianTaxId(value);
  return !value?.trim() || (digits.length === 14 && isValidCnpj(digits));
}

function isValidCpf(digits: string) {
  if (hasRepeatedDigits(digits)) return false;

  const firstDigit = calculateCpfDigit(digits.slice(0, 9), 10);
  const secondDigit = calculateCpfDigit(digits.slice(0, 10), 11);

  return digits[9] === String(firstDigit) && digits[10] === String(secondDigit);
}

function isValidCnpj(digits: string) {
  if (hasRepeatedDigits(digits)) return false;

  const firstDigit = calculateCnpjDigit(digits.slice(0, 12));
  const secondDigit = calculateCnpjDigit(digits.slice(0, 13));

  return digits[12] === String(firstDigit) && digits[13] === String(secondDigit);
}

function calculateCpfDigit(digits: string, firstWeight: number) {
  const sum = [...digits].reduce(
    (total, digit, index) => total + Number(digit) * (firstWeight - index),
    0
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function calculateCnpjDigit(digits: string) {
  const weights =
    digits.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = [...digits].reduce(
    (total, digit, index) => total + Number(digit) * weights[index],
    0
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function hasRepeatedDigits(digits: string) {
  return [...digits].every((digit) => digit === digits[0]);
}

function formatCpfDigits(digits: string) {
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatCnpjDigits(digits: string) {
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}
