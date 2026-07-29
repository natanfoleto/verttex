/**
 * price.ts — Utilitários de Formatação e Máscara de Preço BRL
 *
 * Regra: Todos os campos monetários do sistema devem usar estas funções
 * em conjunto com o componente <PriceInput> (src/components/ui/price-input.tsx).
 * Nunca use <Input type="number"> para campos de preço.
 */

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formata um número para o padrão BRL visual.
 * @example formatPriceBRL(105) → "R$ 105,00"
 * @example formatPriceBRL(10500.99) → "R$ 10.500,99"
 */
export function formatPriceBRL(value: number): string {
  return BRL_FORMATTER.format(value);
}

/**
 * Extrai o valor numérico de uma string formatada em BRL.
 * Remove o símbolo de moeda, separadores de milhar e converte vírgula decimal.
 * @example parsePriceMask("R$ 105,00") → 105
 * @example parsePriceMask("R$ 10.500,99") → 10500.99
 * @example parsePriceMask("") → 0
 */
export function parsePriceMask(formatted: string): number {
  if (!formatted) return 0;
  // Remove tudo que não seja dígito ou vírgula decimal
  const cleaned = formatted.replace(/[^\d,]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Aplica a máscara de preço BRL a partir de uma string de dígitos brutos.
 * A lógica acumula os dígitos e divide por 100 para posicionar os centavos.
 *
 * @example maskPriceFromDigits("1")     → "R$ 0,01"
 * @example maskPriceFromDigits("10")    → "R$ 0,10"
 * @example maskPriceFromDigits("105")   → "R$ 1,05"
 * @example maskPriceFromDigits("10500") → "R$ 105,00"
 * @example maskPriceFromDigits("")      → "R$ 0,00"
 */
export function maskPriceFromDigits(digits: string): string {
  const onlyDigits = digits.replace(/\D/g, "");
  if (!onlyDigits) return formatPriceBRL(0);
  const numericValue = parseInt(onlyDigits, 10) / 100;
  return formatPriceBRL(numericValue);
}

/**
 * Extrai apenas os dígitos de uma string formatada BRL.
 * Útil para obter os dígitos acumulados de um campo já formatado.
 * @example extractDigits("R$ 105,00") → "10500"
 */
export function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

/**
 * Converte um valor numérico (float) em dígitos acumulados para a máscara.
 * Necessário para inicializar o estado interno do PriceInput quando
 * o valor vem de uma prop externa (ex: ao editar um produto existente).
 * @example numericToDigits(105) → "10500"
 * @example numericToDigits(10.5) → "1050"
 * @example numericToDigits(0) → ""
 */
export function numericToDigits(value: number | string | null | undefined): string {
  const num = Number(value);
  if (!num || isNaN(num)) return "";
  return Math.round(num * 100).toString();
}
