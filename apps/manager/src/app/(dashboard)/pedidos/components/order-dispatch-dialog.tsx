"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RiTruckLine, RiCheckLine } from "react-icons/ri";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiClient, ApiError } from "@/lib/api-client";

interface OrderDispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  orderCode?: string;
}

export function OrderDispatchDialog({
  open,
  onOpenChange,
  orderId,
  orderCode,
}: OrderDispatchDialogProps) {
  const queryClient = useQueryClient();
  const [trackingCode, setTrackingCode] = useState("");
  const [carrier, setCarrier] = useState("Correios Sedex");
  const [minShelfLifeDays, setMinShelfLifeDays] = useState(30);

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      if (!orderId) return;
      return apiClient(`/shipping/orders/${orderId}/dispatch`, {
        method: "POST",
        body: JSON.stringify({
          trackingCode: trackingCode.trim(),
          carrier: carrier.trim(),
          minDeliveryShelfLifeDays: minShelfLifeDays,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Pedido expedido com sucesso com validação de lote FEFO!");
      queryClient.invalidateQueries({ queryKey: ["manager-orders"] });
      onOpenChange(false);
      setTrackingCode("");
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao expedir pedido");
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full flex flex-col overflow-hidden bg-zinc-950 p-0 text-zinc-100 sm:rounded-2xl max-w-xl max-h-[90vh]">
        <DialogHeader className="px-6 pt-5 pb-2">
          <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center space-x-2">
            <RiTruckLine className="h-5 w-5 text-emerald-400" />
            <span>Expedição Sanitária de Pedido {orderCode ? `#${orderCode}` : ""}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Informe as credenciais de transporte. A validação de lotes FEFO verificará a margem sanitária de validade antes do despacho.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatchMutation.mutate();
          }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-1 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                Código de Rastreamento
              </label>
              <Input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: BR123456789BR"
                required
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                Transportadora
              </label>
              <Input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="Ex: Loggi / Correios / Frota Própria"
                required
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                Margem de Validade Mínima para Entrega (Dias FEFO)
              </label>
              <Input
                type="number"
                value={minShelfLifeDays}
                onChange={(e) => setMinShelfLifeDays(Number(e.target.value))}
                min={1}
                required
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
              <p className="text-[11px] text-zinc-500">
                Bloqueia a expedição caso algum lote reservado vença antes da margem mínima estabelecida.
              </p>
            </div>
          </div>

          <DialogFooter className="bg-zinc-950 px-6 py-4 border-t border-zinc-800/60 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={dispatchMutation.isPending || !trackingCode.trim()}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
            >
              <RiCheckLine className="h-4 w-4 mr-1.5" />
              <span>{dispatchMutation.isPending ? "Validando FEFO..." : "Confirmar Expedição"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
