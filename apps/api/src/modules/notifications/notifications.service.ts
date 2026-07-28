import { prisma } from "../../infrastructure/database/prisma";
import { logAudit } from "../../shared/utils/audit";
import { ListNotificationsQueryInput, ExpirationCheckInput } from "./notifications.schemas";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "TRANSACTIONAL" | "EXPIRATION_ALERT" | "SECURITY" | "SYSTEM";
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const notificationsStore = new Map<string, NotificationItem>([
  [
    "notif-1",
    {
      id: "notif-1",
      userId: "system-manager",
      title: "Alerta Sanitário de Validade — Lote L-2026-CAN-02",
      message:
        "Aviso: O lote L-2026-CAN-02 do produto 'Queijo Canastra Meia Cura 500g' atinge a faixa de aviso de 30 dias para vencimento.",
      type: "EXPIRATION_ALERT",
      isRead: false,
      createdAt: new Date(),
    },
  ],
  [
    "notif-2",
    {
      id: "notif-2",
      userId: "system-manager",
      title: "Pedido Expedido com Sucesso",
      message: "O pedido VTX-9822 foi expedido com validação sanitária FEFO.",
      type: "TRANSACTIONAL",
      isRead: true,
      createdAt: new Date(),
    },
  ],
  [
    "notif-3",
    {
      id: "notif-3",
      userId: "system-manager",
      title: "Alerta Sanitário de Validade — Lote L-2026-CAN-03",
      message:
        "ATENÇÃO: O lote L-2026-CAN-03 do produto 'Queijo Canastra Meia Cura 500g' VENCEU há 6 dias. Ação de recolhimento/quarentena requerida.",
      type: "EXPIRATION_ALERT",
      isRead: false,
      createdAt: new Date(),
    },
  ],
]);
const triggeredAlerts = new Set<string>(); // Unique key format: `${lotId}:${bracketDay}`

export class NotificationsService {
  /**
   * Creates and stores a user notification.
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationItem["type"] = "TRANSACTIONAL",
    metadata?: Record<string, unknown>,
  ) {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const notification: NotificationItem = {
      id,
      userId,
      title,
      message,
      type,
      isRead: false,
      metadata,
      createdAt: new Date(),
    };

    notificationsStore.set(id, notification);
    return notification;
  }

  /**
   * Lists notifications for a specific user.
   */
  static async listUserNotifications(userId: string, query: ListNotificationsQueryInput) {
    const userNotifications = Array.from(notificationsStore.values())
      .filter((n) => n.userId === userId || n.userId === "system-manager")
      .filter((n) => (query.unreadOnly ? !n.isRead : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const unreadCount = Array.from(notificationsStore.values()).filter(
      (n) => (n.userId === userId || n.userId === "system-manager") && !n.isRead,
    ).length;

    return {
      unreadCount,
      notifications: userNotifications,
    };
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = notificationsStore.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notificação não encontrada ou não pertence ao usuário");
    }

    notification.isRead = true;
    return notification;
  }

  /**
   * Scans product lots and generates sanitary expiration notifications by day brackets:
   * (180, 90, 60, 30, 15, 7, 1 day, and EXPIRED <= 0).
   * Prevents duplicate alerts via `triggeredAlerts` set.
   */
  static async checkLotExpirations(input: ExpirationCheckInput) {
    const lots = await prisma.productLot.findMany({
      where: input.storeId ? { storeId: input.storeId } : {},
      include: {
        product: true,
      },
    });

    const now = new Date();
    const brackets = [180, 90, 60, 30, 15, 7, 1, 0];
    const generatedAlerts: NotificationItem[] = [];

    for (const lot of lots) {
      if (!lot.expirationDate) continue;

      const diffTime = lot.expirationDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      for (const bracket of brackets) {
        let isMatch = false;
        let bracketLabel = "";

        if (bracket === 0 && diffDays <= 0) {
          isMatch = true;
          bracketLabel = "VENCIDO";
        } else if (bracket > 0 && diffDays > 0 && diffDays <= bracket) {
          isMatch = true;
          bracketLabel = `${bracket} dia(s)`;
        }

        if (isMatch) {
          const deduplicationKey = `${lot.id}:${bracket}`;
          if (!triggeredAlerts.has(deduplicationKey)) {
            triggeredAlerts.add(deduplicationKey);

            const title = `Alerta Sanitário de Validade — Lote ${lot.lotNumber}`;
            const message = bracket === 0
              ? `ATENÇÃO: O lote ${lot.lotNumber} do produto '${lot.product.name}' VENCEU em ${lot.expirationDate.toISOString().split("T")[0]}. Ação de recolhimento/quarentena requerida`
              : `Aviso: O lote ${lot.lotNumber} do produto '${lot.product.name}' atinge a faixa de aviso de ${bracketLabel} para vencimento (${lot.expirationDate.toISOString().split("T")[0]})`;

            // Broadcast notification to store managers / system
            const alert = await this.createNotification(
              "system-manager",
              title,
              message,
              "EXPIRATION_ALERT",
              {
                lotId: lot.id,
                lotNumber: lot.lotNumber,
                productName: lot.product.name,
                expirationDate: lot.expirationDate,
                bracketDay: bracket,
              },
            );

            generatedAlerts.push(alert);

            await logAudit({
              action: "LOT_EXPIRATION_ALERT",
              entity: "ProductLot",
              entityId: lot.id,
              newValues: {
                lotNumber: lot.lotNumber,
                bracketDay: bracket,
                expirationDate: lot.expirationDate,
              },
            });
          }
          break; // Process highest matching bracket for this lot in this turn
        }
      }
    }

    return {
      scannedLots: lots.length,
      newAlertsCount: generatedAlerts.length,
      alerts: generatedAlerts,
    };
  }
}
