'use client'

/**
 * PriceInput — Componente de entrada de preço com máscara automática BRL
 *
 * Uso obrigatório em TODOS os campos monetários do sistema (preço de venda,
 * preço promocional, preço de custo, etc.). Nunca use <Input type="number">
 * para campos de preço — use este componente.
 *
 * @example
 * ```tsx
 * const [price, setPrice] = useState<number>(0);
 *
 * <PriceInput
 *   value={price}
 *   onValueChange={setPrice}
 *   placeholder="R$ 0,00"
 * />
 * ```
 *
 * O componente exibe "R$ 105,00" enquanto o usuário digita e retorna
 * o valor numérico limpo (105.00) via onValueChange.
 */

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

import {
  extractDigits,
  formatPriceBRL,
  maskPriceFromDigits,
  numericToDigits,
} from '@/lib/price'

export interface PriceInputProps {
  /** Valor numérico atual (float). Ex: 105.00 */
  value: number | string | null | undefined
  /**
   * Chamado quando o usuário digita, retornando o valor numérico limpo.
   * Ex: ao exibir "R$ 105,00", retorna 105.
   */
  onValueChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  /** Se true, campo em branco retorna 0 via onValueChange. Default: true */
  zeroOnEmpty?: boolean
}

export function PriceInput({
  value,
  onValueChange,
  placeholder = 'R$ 0,00',
  disabled = false,
  required = false,
  className,
  id,
  zeroOnEmpty = true,
}: PriceInputProps) {
  // Estado interno: string de dígitos acumulados (ex: "10500" para R$105,00)
  const [digits, setDigits] = useState<string>(() => numericToDigits(value))
  // Estado de exibição: string formatada (ex: "R$ 105,00")
  const [displayValue, setDisplayValue] = useState<string>(() => {
    const initial = numericToDigits(value)
    return initial ? maskPriceFromDigits(initial) : ''
  })

  const isInternalChange = useRef(false)

  // Sincroniza quando a prop `value` muda externamente (ex: ao abrir modal de edição)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false
      return
    }
    const newDigits = numericToDigits(value)
    setDigits(newDigits)
    setDisplayValue(newDigits ? maskPriceFromDigits(newDigits) : '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    // Se o campo for limpo completamente
    if (!raw || raw === '') {
      setDigits('')
      setDisplayValue('')
      isInternalChange.current = true
      onValueChange(zeroOnEmpty ? 0 : 0)
      return
    }

    // Extrai somente os dígitos do que o usuário digitou/apagou
    const newDigits = extractDigits(raw)

    // Sem dígitos (usuário apagou o "R$" ou similar)
    if (!newDigits) {
      setDigits('')
      setDisplayValue('')
      isInternalChange.current = true
      onValueChange(0)
      return
    }

    const masked = maskPriceFromDigits(newDigits)
    const numeric = parseInt(newDigits, 10) / 100

    setDigits(newDigits)
    setDisplayValue(masked)
    isInternalChange.current = true
    onValueChange(numeric)
  }

  const handleBlur = () => {
    // Garante formatação completa ao sair do campo
    if (digits) {
      setDisplayValue(maskPriceFromDigits(digits))
    } else {
      setDisplayValue('')
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleciona todo o conteúdo ao focar para facilitar substituição
    e.target.select()
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={cn('font-mono tabular-nums', className)}
      autoComplete="off"
    />
  )
}

/**
 * Utilitário de exibição: formata um valor numérico para exibição em tabelas/listas.
 * @example displayPrice(105) → "R$ 105,00"
 * @example displayPrice(null) → "—"
 */
export function displayPrice(
  value: number | string | null | undefined,
): string {
  const num = Number(value)
  if (!value || isNaN(num)) return '—'
  return formatPriceBRL(num)
}
