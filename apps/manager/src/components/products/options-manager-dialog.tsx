'use client'

import React, { useState } from 'react'
import {
  RiAddLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiDraggable,
  RiStackLine,
} from 'react-icons/ri'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export interface ProductOptionDraft {
  id: string
  name: string
  position: number
  values: string[]
}

interface OptionsManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ProductOptionDraft[]
  onSaveOptions: (options: ProductOptionDraft[]) => void
}

export function OptionsManagerDialog({
  open,
  onOpenChange,
  options: initialOptions,
  onSaveOptions,
}: OptionsManagerDialogProps) {
  const [options, setOptions] = useState<ProductOptionDraft[]>(initialOptions)
  const [newOptionName, setNewOptionName] = useState('')
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>(
    {},
  )

  const handleAddOption = () => {
    if (!newOptionName.trim()) return
    const newOpt: ProductOptionDraft = {
      id: `opt-${Date.now()}`,
      name: newOptionName.trim(),
      position: options.length,
      values: [],
    }
    setOptions([...options, newOpt])
    setNewOptionName('')
  }

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id))
  }

  const handleAddValue = (optionId: string) => {
    const valText = newValueInputs[optionId]?.trim()
    if (!valText) return

    setOptions(
      options.map((opt) => {
        if (opt.id === optionId) {
          if (opt.values.includes(valText)) return opt
          return { ...opt, values: [...opt.values, valText] }
        }
        return opt
      }),
    )

    setNewValueInputs((prev) => ({ ...prev, [optionId]: '' }))
  }

  const handleRemoveValue = (optionId: string, valueToRemove: string) => {
    setOptions(
      options.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            values: opt.values.filter((v) => v !== valueToRemove),
          }
        }
        return opt
      }),
    )
  }

  const handleSave = () => {
    onSaveOptions(options)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RiStackLine className="h-5 w-5 text-emerald-600" />
            Gerenciador de Opções e Valores
          </DialogTitle>
          <DialogDescription>
            Defina os atributos do produto (ex: Cor, Tamanho, Sabor, Voltagem) e
            adicione os valores disponíveis para criar variações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Adicionar Nova Opção */}
          <div className="flex items-end gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="new-option-name"
                className="block text-xs font-semibold tracking-wider text-stone-500 uppercase"
              >
                Nova Opção / Atributo
              </label>
              <Input
                id="new-option-name"
                placeholder="Ex: Cor, Tamanho, Sabor, Peso, Voltagem..."
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddOption())
                }
              />
            </div>
            <Button
              type="button"
              onClick={handleAddOption}
              disabled={!newOptionName.trim()}
              className="cursor-pointer bg-emerald-700 text-white hover:bg-emerald-800"
            >
              <RiAddLine className="mr-1.5 h-4 w-4" />
              Adicionar Opção
            </Button>
          </div>

          {/* Lista de Opções Cadastradas */}
          {options.length === 0 ? (
            <div className="rounded-xl border border-dashed py-8 text-center text-xs text-stone-400">
              Nenhuma opção cadastrada ainda. Adicione opções acima para montar
              suas variações.
            </div>
          ) : (
            <div className="space-y-4">
              {options.map((opt) => (
                <div
                  key={opt.id}
                  className="space-y-3 rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition-all hover:border-emerald-600/50 dark:border-stone-800 dark:bg-stone-950"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiDraggable className="h-4 w-4 cursor-grab text-stone-400" />
                      <span className="text-base font-semibold text-stone-900 dark:text-stone-100">
                        {opt.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {opt.values.length} valor(es)
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Badges de Valores Exibidos */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {opt.values.map((val) => (
                      <Badge
                        key={val}
                        variant="outline"
                        className="flex items-center gap-1.5 border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        {val}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveValue(opt.id, val)}
                          className="ml-1 h-4 w-4 cursor-pointer rounded-full p-0 text-xs font-bold hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60"
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  {/* Input para adicionar valor */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder={`Adicionar valor em "${opt.name}" (ex: Azul, P, G, 500g)...`}
                      value={newValueInputs[opt.id] || ''}
                      onChange={(e) =>
                        setNewValueInputs({
                          ...newValueInputs,
                          [opt.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), handleAddValue(opt.id))
                      }
                      className="h-9 text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddValue(opt.id)}
                      disabled={!newValueInputs[opt.id]?.trim()}
                      className="h-9 cursor-pointer px-3 text-xs"
                    >
                      <RiAddLine className="mr-1 h-3.5 w-3.5" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="cursor-pointer bg-emerald-700 text-white hover:bg-emerald-800"
          >
            <RiCheckLine className="mr-1.5 h-4 w-4" />
            Salvar Opções
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
