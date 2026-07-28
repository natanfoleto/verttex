"use client";

import React, { useState } from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiStackLine,
  RiDraggable,
} from "react-icons/ri";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ProductOptionDraft {
  id: string;
  name: string;
  position: number;
  values: string[];
}

interface OptionsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ProductOptionDraft[];
  onSaveOptions: (options: ProductOptionDraft[]) => void;
}

export function OptionsManagerDialog({
  open,
  onOpenChange,
  options: initialOptions,
  onSaveOptions,
}: OptionsManagerDialogProps) {
  const [options, setOptions] = useState<ProductOptionDraft[]>(initialOptions);
  const [newOptionName, setNewOptionName] = useState("");
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    if (!newOptionName.trim()) return;
    const newOpt: ProductOptionDraft = {
      id: `opt-${Date.now()}`,
      name: newOptionName.trim(),
      position: options.length,
      values: [],
    };
    setOptions([...options, newOpt]);
    setNewOptionName("");
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleAddValue = (optionId: string) => {
    const valText = newValueInputs[optionId]?.trim();
    if (!valText) return;

    setOptions(
      options.map((opt) => {
        if (opt.id === optionId) {
          if (opt.values.includes(valText)) return opt;
          return { ...opt, values: [...opt.values, valText] };
        }
        return opt;
      }),
    );

    setNewValueInputs((prev) => ({ ...prev, [optionId]: "" }));
  };

  const handleRemoveValue = (optionId: string, valueToRemove: string) => {
    setOptions(
      options.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            values: opt.values.filter((v) => v !== valueToRemove),
          };
        }
        return opt;
      }),
    );
  };

  const handleSave = () => {
    onSaveOptions(options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <RiStackLine className="w-5 h-5 text-emerald-600" />
            Gerenciador de Opções e Valores
          </DialogTitle>
          <DialogDescription>
            Defina os atributos do produto (ex: Cor, Tamanho, Sabor, Voltagem) e adicione os valores disponíveis para criar variações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Adicionar Nova Opção */}
          <div className="flex items-end gap-3 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="new-option-name" className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Nova Opção / Atributo
              </label>
              <Input
                id="new-option-name"
                placeholder="Ex: Cor, Tamanho, Sabor, Peso, Voltagem..."
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOption())}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddOption}
              disabled={!newOptionName.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
            >
              <RiAddLine className="w-4 h-4 mr-1.5" />
              Adicionar Opção
            </Button>
          </div>

          {/* Lista de Opções Cadastradas */}
          {options.length === 0 ? (
            <div className="text-center py-8 text-stone-400 border border-dashed rounded-xl text-xs">
              Nenhuma opção cadastrada ainda. Adicione opções acima para montar suas variações.
            </div>
          ) : (
            <div className="space-y-4">
              {options.map((opt) => (
                <div
                  key={opt.id}
                  className="p-4 rounded-xl border bg-white dark:bg-stone-950 space-y-3 shadow-xs border-stone-200 dark:border-stone-800 transition-all hover:border-emerald-600/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiDraggable className="w-4 h-4 text-stone-400 cursor-grab" />
                      <span className="font-semibold text-base text-stone-900 dark:text-stone-100">{opt.name}</span>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {opt.values.length} valor(es)
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(opt.id)}
                      className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 cursor-pointer"
                    >
                      <RiDeleteBinLine className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Badges de Valores Exibidos */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {opt.values.map((val) => (
                      <Badge
                        key={val}
                        variant="outline"
                        className="bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 py-1 px-2.5 flex items-center gap-1.5 text-xs font-medium"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(opt.id, val)}
                          className="hover:text-rose-600 rounded-full p-0.5 cursor-pointer ml-1 font-bold"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {/* Input para adicionar valor */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder={`Adicionar valor em "${opt.name}" (ex: Azul, P, G, 500g)...`}
                      value={newValueInputs[opt.id] || ""}
                      onChange={(e) =>
                        setNewValueInputs({ ...newValueInputs, [opt.id]: e.target.value })
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), handleAddValue(opt.id))
                      }
                      className="text-xs h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddValue(opt.id)}
                      disabled={!newValueInputs[opt.id]?.trim()}
                      className="cursor-pointer h-9 px-3 text-xs"
                    >
                      <RiAddLine className="w-3.5 h-3.5 mr-1" />
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
            className="bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
          >
            <RiCheckLine className="w-4 h-4 mr-1.5" />
            Salvar Opções
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
