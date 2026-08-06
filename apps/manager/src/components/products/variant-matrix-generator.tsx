'use client'

import React, { useMemo, useState } from 'react'
import {
  RiCheckboxBlankLine,
  RiCheckboxLine,
  RiGridLine,
  RiMagicLine,
} from 'react-icons/ri'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

import { ProductOptionDraft } from './options-manager-dialog'

export interface VariationDraft {
  sku: string
  price: number
  promotionalPrice?: number | null
  costPrice?: number | null
  stockMode?: string | null
  status: 'active' | 'inactive'
  isDefault: boolean
  optionValues: Record<string, string>
}

interface VariantMatrixGeneratorProps {
  options: ProductOptionDraft[]
  baseSkuPrefix: string
  basePrice: number
  onGenerateVariations: (selectedVariations: VariationDraft[]) => void
}

export function VariantMatrixGenerator({
  options,
  baseSkuPrefix,
  basePrice,
  onGenerateVariations,
}: VariantMatrixGeneratorProps) {
  const allCombinations = useMemo(() => {
    if (options.length === 0 || options.some((o) => o.values.length === 0)) {
      return []
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
        [[]],
      )
    }

    const valueArrays = options.map((o) => o.values)
    const rawCombos = cartesian(valueArrays)

    return rawCombos.map((combo) => {
      const optionValuesObj: Record<string, string> = {}
      options.forEach((opt, idx) => {
        optionValuesObj[opt.name] = combo[idx] || ''
      })

      const comboSlug = combo
        .map((v) =>
          v
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, ''),
        )
        .join('-')

      const sku = `${baseSkuPrefix.toUpperCase() || 'VAR'}-${comboSlug.toUpperCase()}`

      return {
        sku,
        price: basePrice || 0,
        status: 'active' as const,
        isDefault: false,
        optionValues: optionValuesObj,
      }
    })
  }, [options, baseSkuPrefix, basePrice])

  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(
    new Set(allCombinations.map((c) => c.sku)),
  )

  const toggleSelectAll = () => {
    if (selectedSkus.size === allCombinations.length) {
      setSelectedSkus(new Set())
    } else {
      setSelectedSkus(new Set(allCombinations.map((c) => c.sku)))
    }
  }

  const toggleSku = (sku: string) => {
    const next = new Set(selectedSkus)
    if (next.has(sku)) {
      next.delete(sku)
    } else {
      next.add(sku)
    }
    setSelectedSkus(next)
  }

  const handleConfirmMatrix = () => {
    const chosen = allCombinations.filter((c) => selectedSkus.has(c.sku))
    if (chosen.length > 0 && chosen[0]) {
      chosen[0].isDefault = true
    }
    onGenerateVariations(chosen)
  }

  if (options.length === 0 || allCombinations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-xs text-stone-400">
        Cadastre pelo menos uma opção com valores no Gerenciador de Opções para
        gerar a matriz de variações.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiGridLine className="h-5 w-5 text-emerald-600" />
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Matriz de Combinações de Variações (Sparse Matrix)
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSelectAll}
            className="cursor-pointer text-xs"
          >
            {selectedSkus.size === allCombinations.length ? (
              <>
                <RiCheckboxBlankLine className="mr-1 h-3.5 w-3.5" /> Desmarcar
                Todas
              </>
            ) : (
              <>
                <RiCheckboxLine className="mr-1 h-3.5 w-3.5" /> Selecionar Todas
              </>
            )}
          </Button>
          <Badge variant="outline" className="text-xs">
            {selectedSkus.size} de {allCombinations.length} selecionadas
          </Badge>
        </div>
      </div>

      <p className="text-xs text-stone-500">
        Selecione apenas as variações que a sua loja realmente produz ou
        comercializa. Combinações não marcadas não serão geradas.
      </p>

      {/* Grid de combinações */}
      <div className="grid max-h-60 grid-cols-1 gap-2.5 overflow-y-auto p-1 sm:grid-cols-2 md:grid-cols-3">
        {allCombinations.map((combo) => {
          const isSelected = selectedSkus.has(combo.sku)
          return (
            <div
              key={combo.sku}
              onClick={() => toggleSku(combo.sku)}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                isSelected
                  ? 'border-emerald-600/80 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
                  : 'border-stone-200 bg-white opacity-60 hover:opacity-100 dark:border-stone-800 dark:bg-stone-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(combo.optionValues).map(([optKey, val]) => (
                    <Badge
                      key={optKey}
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] font-normal"
                    >
                      {optKey}:{' '}
                      <span className="ml-0.5 font-semibold">{val}</span>
                    </Badge>
                  ))}
                </div>
                <div className="font-mono text-[11px] text-stone-500">
                  {combo.sku}
                </div>
              </div>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSku(combo.sku)}
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleConfirmMatrix}
          disabled={selectedSkus.size === 0}
          className="cursor-pointer bg-emerald-700 text-white hover:bg-emerald-800"
        >
          <RiMagicLine className="mr-1.5 h-4 w-4" />
          Gerar {selectedSkus.size} Variações Selecionadas
        </Button>
      </div>
    </div>
  )
}
