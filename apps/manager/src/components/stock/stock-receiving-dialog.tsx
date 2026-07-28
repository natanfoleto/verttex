"use client";

import React, { useState } from "react";
import { RiInboxArchiveLine, RiFileTextLine, RiCheckLine } from "react-icons/ri";
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

interface StockReceivingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  variationId: string;
  productName: string;
  variationSku: string;
  stockMode: "NOT_TRACKED" | "SIMPLE" | "BATCH" | "BATCH_WITH_EXPIRATION";
  onReceiveSuccess: () => void;
}

export function StockReceivingDialog({
  open,
  onOpenChange,
  storeId,
  variationId,
  productName,
  variationSku,
  stockMode,
  onReceiveSuccess,
}: StockReceivingDialogProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [lotNumber, setLotNumber] = useState<string>("");
  const [manufacturingDate, setManufacturingDate] = useState<string>("");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");
  const [documentReference, setDocumentReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (quantity <= 0) {
      setErrorMessage("Quantidade deve ser maior que zero");
      return;
    }

    if (stockMode === "BATCH_WITH_EXPIRATION" && !expirationDate) {
      setErrorMessage("Data de validade é obrigatória para produtos no modo com validade");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/stock/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          variationId,
          documentReference: documentReference || null,
          lots: [
            {
              lotNumber: lotNumber.trim() || undefined,
              quantity,
              supplier: supplier.trim() || null,
              manufacturingDate: manufacturingDate || null,
              expirationDate: expirationDate || null,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Falha ao registrar recebimento de estoque");
      }

      onReceiveSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocorreu um erro ao processar o recebimento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <RiInboxArchiveLine className="w-5 h-5 text-emerald-600" />
            Recebimento de Estoque & Lote Sanitário
          </DialogTitle>
          <DialogDescription>
            Registre a entrada física de mercadoria para <strong>{productName}</strong> (SKU: {variationSku}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 font-sans antialiased text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="receive-qty" className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Quantidade Recebida <span className="text-rose-600">*</span>
              </label>
              <Input
                id="receive-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="receive-doc" className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                Nota Fiscal / Doc. Origem
              </label>
              <Input
                id="receive-doc"
                placeholder="Ex: NF-e 12345"
                value={documentReference}
                onChange={(e) => setDocumentReference(e.target.value)}
              />
            </div>
          </div>

          {(stockMode === "BATCH" || stockMode === "BATCH_WITH_EXPIRATION") && (
            <div className="space-y-4 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <RiFileTextLine className="w-3.5 h-3.5" />
                Dados do Lote Sanitário
              </div>

              <div className="space-y-1.5">
                <label htmlFor="receive-lot-number" className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Código do Lote
                  {stockMode === "BATCH" && " (deixe em branco para gerar lote interno automático)"}
                </label>
                <Input
                  id="receive-lot-number"
                  placeholder="Ex: LOTE-2026-A1 (ou deixe em branco p/ automático)"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="receive-mfg" className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    Fabricação
                  </label>
                  <Input
                    id="receive-mfg"
                    type="date"
                    value={manufacturingDate}
                    onChange={(e) => setManufacturingDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="receive-exp" className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    Validade {stockMode === "BATCH_WITH_EXPIRATION" && <span className="text-rose-600">*</span>}
                  </label>
                  <Input
                    id="receive-exp"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    required={stockMode === "BATCH_WITH_EXPIRATION"}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="receive-supplier" className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Fornecedor / Produtor
                </label>
                <Input
                  id="receive-supplier"
                  placeholder="Ex: Laticínios Canastra Ltda"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
            >
              <RiCheckLine className="w-4 h-4 mr-1.5" />
              {isSubmitting ? "Confirmando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
