/**
 * Validates EAN-8, EAN-13, UPC-A (12 digits), and GTIN-14 barcodes using GS1 Modulo 10 Checksum Algorithm.
 */
export function isValidGtin(barcode: string | null | undefined): boolean {
  if (!barcode) return true // Barcode is optional
  const cleanBarcode = barcode.trim()
  if (!cleanBarcode) return true

  // Must contain only digits and be 8, 12, 13, or 14 digits long
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode)) {
    return false
  }

  const digits = cleanBarcode.split('').map(Number)
  const checkDigit = digits[digits.length - 1]
  const payload = digits.slice(0, digits.length - 1)

  let sum = 0
  // Calculate modulo 10 checksum from right to left
  for (let i = 0; i < payload.length; i++) {
    const digit = payload[payload.length - 1 - i] ?? 0
    const weight = i % 2 === 0 ? 3 : 1
    sum += digit * weight
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10
  return checkDigit === calculatedCheckDigit
}
