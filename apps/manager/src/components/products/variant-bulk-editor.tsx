"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { PriceInput } from "@/components/ui/price-input";
import {
  RiEqualizerLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
} from "react-icons/ri";
import { VariationDraft } from "./variant-matrix-generator";

interface VariantBulkEditorProps {
  variations: VariationDraft[];
  onChangeVariations: (variations: VariationDraft[]) => void;
}

export function VariantBulkEditor({
  variations,
  onChangeVariations,
}: VariantBulkEditorProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

  // Bulk Field Inputs
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkCostPrice, setBulkCostPrice] = useState<number>(0);
  const [bulkStockMode, setBulkStockMode] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  const toggleSelectAll = () => {
    if (selectedIndexes.size === variations.length) {
      setSelectedIndexes(new Set());
    } else {
      setSelectedIndexes(new Set(variations.map((_, idx) => idx)));
    }
  };

  const toggleSelectIndex = (idx: number) => {
    const next = new Set(selectedIndexes);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndexes(next);
  };

  const handleApplyBulkChanges = () => {
    if (selectedIndexes.size === 0) return;

    const updated = variations.map((v, idx) => {
      if (!selectedIndexes.has(idx)) return v;

      return {
        ...v,
        price: bulkPrice > 0 ? bulkPrice : v.price,
        costPrice: bulkCostPrice > 0 ? bulkCostPrice : v.costPrice,
        stockMode: bulkStockMode ? bulkStockMode : v.stockMode,
        status: bulkStatus ? (bulkStatus as "active" | "inactive") : v.status,
      };
    });

    onChangeVariations(updated);
  };

  const handleUpdateItemField = (index: number, field: keyof VariationDraft, value: any) => {
    const updated = [...variations];
    const target = updated[index];
    if (!target) return;

    updated[index] = {
      ...target,
      [field]: value,
    };
    onChangeVariations(updated);
  };

  const handleRemoveVariation = (index: number) => {
    const updated = variations.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((v) => v.isDefault) && updated[0]) {
      updated[0].isDefault = true;
    }
    onChangeVariations(updated);
  };

  const handleSetDefault = (index: number) => {
    const updated = variations.map((v, idx) => ({
      ...v,
      isDefault: idx === index,
    }));
    onChangeVariations(updated);
  };

  if (variations.length === 0) {
    return (
      <div className="text-center p-6 border border-dashed rounded-xl text-stone-400 text-xs">
        Nenhuma variação adicionada ainda. Utilize a Matriz de Variações acima para gerar combinações.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs antialiased">
      {/* Barra de Ações em Massa (Bulk Actions) */}
      <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RiEqualizerLine className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            Edição em Massa ({selectedIndexes.size} selecionadas):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PriceInput
            placeholder="Preço em massa"
            value={bulkPrice}
            onValueChange={setBulkPrice}
            className="w-32 h-8 text-xs"
          />
          <PriceInput
            placeholder="Custo em massa"
            value={bulkCostPrice}
            onValueChange={setBulkCostPrice}
            className="w-32 h-8 text-xs"
          />
          <NativeSelect
            value={bulkStockMode}
            onChange={(e) => setBulkStockMode(e.target.value)}
            className="w-36 h-8 text-xs"
          >
            <option value="">Modo Estoque...</option>
            <option value="SIMPLE">Estoque Simples</option>
            <option value="BATCH">Com Lote</option>
            <option value="BATCH_WITH_EXPIRATION">Com Lote + Validade</option>
            <option value="NOT_TRACKED">Sem Controle</option>
          </NativeSelect>
          <NativeSelect
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="w-28 h-8 text-xs"
          >
            <option value="">Status...</option>
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
          </NativeSelect>
          <Button
            type="button"
            size="sm"
            onClick={handleApplyBulkChanges}
            disabled={selectedIndexes.size === 0}
            className="bg-emerald-700 hover:bg-emerald-800 text-white h-8 text-xs cursor-pointer px-3"
          >
            <RiCheckboxCircleLine className="w-3.5 h-3.5 mr-1" />
            Aplicar às Selecionadas
          </Button>
        </div>
      </div>

      {/* Tabela de Variações */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-x-auto bg-white dark:bg-stone-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 font-semibold text-stone-700 dark:text-stone-300">
              <th className="p-3 w-10 text-center">
                <Checkbox
                  checked={selectedIndexes.size === variations.length && variations.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 w-12 text-center">Padrão</th>
              <th className="p-3">Atributos / Combinação</th>
              <th className="p-3">SKU</th>
              <th className="p-3 w-28">Preço (R$)</th>
              <th className="p-3 w-28">Preço Promocional</th>
              <th className="p-3 w-28">Custo (R$)</th>
              <th className="p-3 w-32">Modo Estoque</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-900">
            {variations.map((item, idx) => (
              <tr key={idx} className={item.isDefault ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}>
                <td className="p-3 text-center">
                  <Checkbox
                    checked={selectedIndexes.has(idx)}
                    onCheckedChange={() => toggleSelectIndex(idx)}
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="radio"
                    name="default-variation-radio"
                    checked={item.isDefault}
                    onChange={() => handleSetDefault(idx)}
                    className="cursor-pointer accent-emerald-700"
                    title="Definir como variação padrão inicial"
                  />
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(item.optionValues).map(([k, v]) => (
                      <Badge key={k} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                        {k}: <span className="font-semibold ml-0.5">{v}</span>
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <Input
                    value={item.sku}
                    onChange={(e) => handleUpdateItemField(idx, "sku", e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </td>
                <td className="p-3">
                  <PriceInput
                    value={item.price}
                    onValueChange={(val) => handleUpdateItemField(idx, "price", val)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="p-3">
                  <PriceInput
                    value={item.promotionalPrice || 0}
                    onValueChange={(val) =>
                      handleUpdateItemField(
                        idx,
                        "promotionalPrice",
                        val || null,
                      )
                    }
                    className="h-8 text-xs"
                    placeholder="R$ 0,00"
                  />
                </td>
                <td className="p-3">
                  <PriceInput
                    value={item.costPrice || 0}
                    onValueChange={(val) =>
                      handleUpdateItemField(
                        idx,
                        "costPrice",
                        val || null,
                      )
                    }
                    className="h-8 text-xs"
                    placeholder="R$ 0,00"
                  />
                </td>
                <td className="p-3">
                  <NativeSelect
                    value={item.stockMode || "SIMPLE"}
                    onChange={(e) => handleUpdateItemField(idx, "stockMode", e.target.value)}
                    className="h-8 text-xs"
                  >
                    <option value="SIMPLE">Simples</option>
                    <option value="BATCH">Com Lote</option>
                    <option value="BATCH_WITH_EXPIRATION">Lote + Validade</option>
                    <option value="NOT_TRACKED">Sem Controle</option>
                  </NativeSelect>
                </td>
                <td className="p-3">
                  <NativeSelect
                    value={item.status}
                    onChange={(e) => handleUpdateItemField(idx, "status", e.target.value)}
                    className="h-8 text-xs"
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                  </NativeSelect>
                </td>
                <td className="p-3 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVariation(idx)}
                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 h-8 w-8 p-0 cursor-pointer"
                  >
                    <RiDeleteBinLine className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
