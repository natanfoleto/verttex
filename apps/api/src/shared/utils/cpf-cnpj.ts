/**
 * Sanitizes input string to leave digits only
 */
export function sanitizeDigits(val: string): string {
  return val.replace(/\D/g, '')
}

/**
 * Validates a Brazilian CPF number (11 digits) using checksum algorithm
 */
export function validateCPF(cpfInput: string): boolean {
  const cpf = sanitizeDigits(cpfInput)
  if (cpf.length !== 11) return false

  // Reject known invalid repetitive sequences (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(cpf)) return false

  // Validate 1st check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(9), 10)) return false

  // Validate 2nd check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(10), 10)) return false

  return true
}

/**
 * Validates a Brazilian CNPJ number (14 digits) using checksum algorithm
 */
export function validateCNPJ(cnpjInput: string): boolean {
  const cnpj = sanitizeDigits(cnpjInput)
  if (cnpj.length !== 14) return false

  // Reject known invalid repetitive sequences
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  let size = cnpj.length - 2
  let numbers = cnpj.substring(0, size)
  const digits = cnpj.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0), 10)) return false

  size = size + 1
  numbers = cnpj.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1), 10)) return false

  return true
}

/**
 * Validates either CPF (11 digits) or CNPJ (14 digits)
 */
export function validateCPForCNPJ(input: string): boolean {
  const clean = sanitizeDigits(input)
  if (clean.length === 11) return validateCPF(clean)
  if (clean.length === 14) return validateCNPJ(clean)
  return false
}
