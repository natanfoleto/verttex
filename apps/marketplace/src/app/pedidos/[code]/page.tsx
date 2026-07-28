"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";
import {
  RiArrowLeftLine,
  RiFileCopyLine,
  RiMapPinLine,
  RiQrCodeLine,
  RiShoppingBag3Line,
  RiStore2Line,
} from "react-icons/ri";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient } from "../../../lib/api-client";

interface OrderDetailResponse {
  id: string;
  code: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  store: {
    id: string;
    name: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
  };
  address: {
    recipient: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: {
    id: string;
    productName: string;
    variationName: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
    imageUrl?: string;
    ncm?: string;
    itemLots?: {
      id: string;
      quantity: number;
      lot: {
        lotNumber: string;
        expirationDate?: string;
      };
    }[];
  }[];
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = use(params);
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [showReturnModal, setShowReturnModal] = useState(false);

  const { data: order, isLoading } = useQuery<OrderDetailResponse>({
    queryKey: ["order-detail", resolvedParams.code],
    queryFn: async () => apiClient<OrderDetailResponse>(`/orders/${resolvedParams.code}`),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;
      return apiClient(`/orders/${order.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancelReason }),
      });
    },
    onSuccess: () => {
      toast.success("Pedido cancelado e reservas de estoque liberadas.");
      queryClient.invalidateQueries({ queryKey: ["order-detail", resolvedParams.code] });
      setShowCancelModal(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao cancelar pedido");
    },
  });

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!order) return;
      return apiClient("/returns/request", {
        method: "POST",
        body: JSON.stringify({ orderId: order.id, reason: returnReason }),
      });
    },
    onSuccess: () => {
      toast.success("Solicitação de devolução/troca enviada com sucesso! Acompanhe o processo em Devoluções.");
      queryClient.invalidateQueries({ queryKey: ["order-detail", resolvedParams.code] });
      setShowReturnModal(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao solicitar devolução");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 font-sans antialiased">
        <div className="h-6 w-36 bg-stone-200 rounded animate-pulse" />
        <div className="p-8 bg-white rounded-3xl border border-stone-200 space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-stone-200 rounded" />
          <div className="h-32 bg-stone-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center font-sans antialiased">
        <RiShoppingBag3Line className="mx-auto h-16 w-16 text-stone-300" />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">Pedido não encontrado</h1>
        <Link
          href="/pedidos"
          className="mt-6 inline-flex items-center space-x-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 cursor-pointer"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          <span>Voltar aos meus pedidos</span>
        </Link>
      </div>
    );
  }

  const isPending = order.status === "PENDING";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 font-sans text-stone-900 antialiased space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <Link
          href="/pedidos"
          className="flex items-center space-x-2 text-xs font-bold text-stone-500 hover:text-emerald-800 transition-colors"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          <span>Voltar aos Pedidos</span>
        </Link>
        <h1 className="text-lg font-extrabold text-stone-900">Pedido #{order.code}</h1>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Status do Pedido
            </span>
            <span className="text-base font-extrabold text-stone-900">
              {order.status === "PENDING" && "Aguardando Pagamento"}
              {order.status === "CONFIRMED" && "Pedido Confirmado & Em Separação"}
              {order.status === "SHIPPED" && "Pedido Em Transporte"}
              {order.status === "DELIVERED" && "Pedido Entregue"}
              {order.status === "CANCELLED" && "Pedido Cancelado"}
            </span>
          </div>

          {isPending && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
            >
              Cancelar Pedido
            </Button>
          )}

          {order.status === "DELIVERED" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReturnModal(true)}
              className="text-xs text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer font-bold"
            >
              Solicitar Troca / Devolução
            </Button>
          )}
        </div>

        {/* PIX Payment Box if pending & PIX */}
        {isPending && order.paymentMethod === "pix" && (
          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-200 space-y-4 text-center">
            <RiQrCodeLine className="mx-auto h-12 w-12 text-emerald-800" />
            <div>
              <h3 className="font-extrabold text-sm text-emerald-950">Pagamento via PIX</h3>
              <p className="text-xs text-emerald-800">
                Copie a chave abaixo ou escaneie o QR Code no seu aplicativo do banco.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <input
                readOnly
                value="00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-42661417400052040000"
                className="w-full max-w-md rounded-xl border border-emerald-300 bg-white p-2.5 text-[11px] font-mono text-stone-700 select-all"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-42661417400052040000");
                  toast.success("Código PIX copiado para a área de transferência!");
                }}
                className="bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer text-xs"
              >
                <RiFileCopyLine className="h-4 w-4 mr-1" /> Copiar
              </Button>
            </div>
          </div>
        )}

        {/* Store & Delivery Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <RiStore2Line className="h-4 w-4 text-emerald-800" /> Vendedor
            </h3>
            <p className="font-bold text-stone-900 text-sm">{order.store.name}</p>
            {order.store.email && <p className="text-xs text-stone-500">{order.store.email}</p>}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <RiMapPinLine className="h-4 w-4 text-emerald-800" /> Endereço de Entrega
            </h3>
            <p className="font-bold text-stone-900 text-xs">{order.address.recipient}</p>
            <p className="text-xs text-stone-600">
              {order.address.street}, {order.address.number}{" "}
              {order.address.complement && `- ${order.address.complement}`}
            </p>
            <p className="text-xs text-stone-500">
              {order.address.neighborhood} — {order.address.city}/{order.address.state} (CEP:{" "}
              {order.address.zipCode})
            </p>
          </div>
        </div>

        {/* Order Items with Lot Traceability */}
        <div className="space-y-4 border-t border-stone-100 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
            Itens do Pedido (Snapshot do Produto & Lote)
          </h3>

          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-stone-900">{item.productName}</p>
                    <p className="text-[11px] text-stone-500">{item.variationName}</p>
                    <p className="text-[10px] font-mono text-stone-400">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-900">
                      {item.quantity} × R$ {Number(item.price).toFixed(2)}
                    </p>
                    <p className="text-xs font-extrabold text-emerald-900">
                      R$ {Number(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Sanitay Lot Details if available */}
                {item.itemLots && item.itemLots.length > 0 && (
                  <div className="p-2 bg-stone-50 rounded-xl text-[11px] font-mono text-stone-600 flex flex-wrap gap-2">
                    {item.itemLots.map((il) => (
                      <span key={il.id} className="bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                        Lote Reservado FEFO: <strong>{il.lot.lotNumber}</strong> ({il.quantity} un.)
                        {il.lot.expirationDate && (
                          <span> — Val: {new Date(il.lot.expirationDate).toLocaleDateString("pt-BR")}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Financial Summary */}
        <div className="border-t border-stone-100 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>R$ {Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Frete</span>
            <span className="font-bold text-emerald-800">Grátis</span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-3 text-sm font-black text-stone-900">
            <span>Total do Pedido</span>
            <span className="text-lg text-emerald-900">R$ {Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Modal Confirmar Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">Cancelar Pedido #{order.code}</h3>
            <p className="text-xs text-stone-600">
              Esta ação liberará imediatamente a reserva de estoque dos lotes alocados para o catálogo.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">Motivo do Cancelamento</label>
              <textarea
                rows={2}
                placeholder="Ex: Mudei de ideia, endereço incorreto..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-emerald-800 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="cursor-pointer text-xs"
              >
                Manter Pedido
              </Button>
              <Button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs"
              >
                {cancelMutation.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Solicitacão de Devolução / Troca */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">Solicitar Devolução / Troca #{order.code}</h3>
            <p className="text-xs text-stone-600">
              Descreva o motivo da devolução. O item passará por entrada compulsória em Quarentena Sanitária de Inspeção.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">Motivo da Devolução</label>
              <textarea
                rows={3}
                placeholder="Ex: Embalagem danificada no transporte, produto com defeito ou divergência..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full rounded-xl border border-stone-200 p-2.5 text-xs focus:border-emerald-800 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReturnModal(false)}
                className="cursor-pointer text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => returnMutation.mutate()}
                disabled={returnMutation.isPending || !returnReason.trim()}
                className="bg-amber-700 hover:bg-amber-800 text-white cursor-pointer text-xs font-bold"
              >
                {returnMutation.isPending ? "Solicitando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
