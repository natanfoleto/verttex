import { prisma } from "../../infrastructure/database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { logAudit } from "../../shared/utils/audit";

export interface CartOwner {
  customerId?: string;
  sessionId?: string;
}

export class CartService {
  /**
   * Helper to find or create an active cart for customer or anonymous session
   */
  static async getOrCreateCart(owner: CartOwner) {
    if (!owner.customerId && !owner.sessionId) {
      throw new AppError("VALIDATION_ERROR", "Proprietário do carrinho não identificado", 400);
    }

    let cart = await prisma.cart.findFirst({
      where: {
        status: "active",
        ...(owner.customerId
          ? { customerId: owner.customerId }
          : { sessionId: owner.sessionId, customerId: null }),
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          customerId: owner.customerId || null,
          sessionId: owner.sessionId || null,
          status: "active",
        },
      });
    }

    return cart;
  }

  /**
   * Get full cart details grouped by Store with subtotals, discounts and totals
   */
  static async getCartSummary(owner: CartOwner) {
    const cart = await this.getOrCreateCart(owner);

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            store: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
            variation: {
              include: {
                product: {
                  select: { id: true, name: true, slug: true },
                },
                medias: {
                  include: {
                    file: { select: { objectKey: true } },
                  },
                },
              },
            },
          },
        },
        coupons: {
          include: {
            coupon: true,
          },
        },
      },
    });

    if (!fullCart) {
      throw new AppError("NOT_FOUND", "Carrinho não encontrado", 404);
    }

    // Group items by Store
    const storesMap = new Map<string, any>();
    let rawSubtotal = 0;

    for (const item of fullCart.items) {
      const storeId = item.storeId;
      if (!storesMap.has(storeId)) {
        storesMap.set(storeId, {
          store: item.store,
          items: [],
          storeSubtotal: 0,
        });
      }

      const itemTotalPrice = Number(item.unitPrice) * item.quantity;
      rawSubtotal += itemTotalPrice;

      const mediaUrl = item.variation.medias[0]?.file?.objectKey || null;

      const storeGroup = storesMap.get(storeId);
      storeGroup.items.push({
        id: item.id,
        variationId: item.variationId,
        productName: item.variation.product.name,
        productSlug: item.variation.product.slug,
        sku: item.variation.sku,
        imageUrl: mediaUrl,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        itemTotal: itemTotalPrice,
      });
      storeGroup.storeSubtotal += itemTotalPrice;
    }

    // Calculate Coupon Discounts
    let totalDiscount = 0;
    const appliedCoupons: any[] = [];

    for (const cartCoupon of fullCart.coupons) {
      const coupon = cartCoupon.coupon;
      if (coupon.status !== "active" || (coupon.expiresAt && coupon.expiresAt < new Date())) {
        continue;
      }

      let eligibleSubtotal = rawSubtotal;
      if (coupon.storeId) {
        const storeGroup = storesMap.get(coupon.storeId);
        eligibleSubtotal = storeGroup ? storeGroup.storeSubtotal : 0;
      }

      if (coupon.minOrderValue && eligibleSubtotal < Number(coupon.minOrderValue)) {
        continue;
      }

      let discountAmount = 0;
      if (coupon.type === "PERCENTAGE") {
        discountAmount = (eligibleSubtotal * Number(coupon.value)) / 100;
        if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
          discountAmount = Number(coupon.maxDiscountAmount);
        }
      } else {
        discountAmount = Number(coupon.value);
        if (discountAmount > eligibleSubtotal) {
          discountAmount = eligibleSubtotal;
        }
      }

      totalDiscount += discountAmount;
      appliedCoupons.push({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        discountAmount,
      });
    }

    const finalTotal = Math.max(0, rawSubtotal - totalDiscount);
    const totalItemsCount = fullCart.items.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0);

    return {
      cartId: fullCart.id,
      itemCount: totalItemsCount,
      stores: Array.from(storesMap.values()),
      subtotal: rawSubtotal,
      discount: totalDiscount,
      total: finalTotal,
      coupons: appliedCoupons,
    };
  }

  /**
   * Add item to cart with stock validation
   */
  static async addItem(owner: CartOwner, variationId: string, quantity: number) {
    const cart = await this.getOrCreateCart(owner);

    // Fetch product variation with product and store
    const variation = await prisma.productVariation.findUnique({
      where: { id: variationId },
      include: {
        product: { select: { storeId: true, status: true, isPublished: true } },
      },
    });

    if (!variation || variation.status !== "active" || !variation.product.isPublished) {
      throw new AppError("NOT_FOUND", "Variação do produto indisponível ou inativa", 404);
    }

    // Check available active stock
    const stockItems = await prisma.stockItem.findMany({
      where: { variationId },
    });
    const totalAvailableStock = stockItems.reduce(
      (acc: number, item: { physicalQuantity: number; reservedQuantity: number }) =>
        acc + (item.physicalQuantity - item.reservedQuantity),
      0,
    );

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, variationId },
    });

    const newQuantity = (existingItem ? existingItem.quantity : 0) + quantity;

    if (totalAvailableStock > 0 && newQuantity > totalAvailableStock) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Quantidade solicitada (${newQuantity}) excede o estoque disponível (${totalAvailableStock})`,
        400,
      );
    }

    // Determine unit price (prefer promotional price if available)
    const unitPrice = variation.promotionalPrice || variation.price;

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variationId,
          storeId: variation.product.storeId,
          quantity,
          unitPrice,
        },
      });
    }

    if (owner.customerId) {
      await logAudit({
        userId: owner.customerId,
        action: "CART_ADD_ITEM",
        entity: "CartItem",
        entityId: variationId,
        newValues: { variationId, quantity },
      });
    }

    return this.getCartSummary(owner);
  }

  /**
   * Update item quantity in cart
   */
  static async updateItemQuantity(owner: CartOwner, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(owner);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new AppError("NOT_FOUND", "Item do carrinho não encontrado", 404);
    }

    // Check available stock
    const stockItems = await prisma.stockItem.findMany({
      where: { variationId: item.variationId },
    });
    const totalAvailableStock = stockItems.reduce(
      (acc: number, s: { physicalQuantity: number; reservedQuantity: number }) =>
        acc + (s.physicalQuantity - s.reservedQuantity),
      0,
    );

    if (totalAvailableStock > 0 && quantity > totalAvailableStock) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Quantidade solicitada (${quantity}) excede o estoque disponível (${totalAvailableStock})`,
        400,
      );
    }

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });

    return this.getCartSummary(owner);
  }

  /**
   * Remove item from cart
   */
  static async removeItem(owner: CartOwner, itemId: string) {
    const cart = await this.getOrCreateCart(owner);

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    return this.getCartSummary(owner);
  }

  /**
   * Clear all items in cart
   */
  static async clearCart(owner: CartOwner) {
    const cart = await this.getOrCreateCart(owner);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await prisma.cartCoupon.deleteMany({
      where: { cartId: cart.id },
    });

    if (owner.customerId) {
      await logAudit({
        userId: owner.customerId,
        action: "CART_CLEAR",
        entity: "Cart",
        entityId: cart.id,
      });
    }

    return this.getCartSummary(owner);
  }

  /**
   * Apply coupon to cart
   */
  static async applyCoupon(owner: CartOwner, code: string) {
    const cart = await this.getOrCreateCart(owner);

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || coupon.status !== "active") {
      throw new AppError("NOT_FOUND", "Cupom inválido ou inativo", 404);
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new AppError("VALIDATION_ERROR", "Este cupom já expirou", 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError("VALIDATION_ERROR", "Este cupom atingiu o limite máximo de utilizações", 400);
    }

    // Attach coupon to cart
    await prisma.cartCoupon.upsert({
      where: {
        cartId_couponId: {
          cartId: cart.id,
          couponId: coupon.id,
        },
      },
      create: {
        cartId: cart.id,
        couponId: coupon.id,
      },
      update: {},
    });

    if (owner.customerId) {
      await logAudit({
        userId: owner.customerId,
        action: "CART_APPLY_COUPON",
        entity: "CartCoupon",
        entityId: coupon.id,
        newValues: { code: coupon.code },
      });
    }

    return this.getCartSummary(owner);
  }

  /**
   * Remove coupon from cart
   */
  static async removeCoupon(owner: CartOwner, code: string) {
    const cart = await this.getOrCreateCart(owner);

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (coupon) {
      await prisma.cartCoupon.deleteMany({
        where: { cartId: cart.id, couponId: coupon.id },
      });
    }

    return this.getCartSummary(owner);
  }

  /**
   * Merge anonymous cart into logged-in customer cart
   */
  static async syncAnonymousCartToCustomer(customerId: string, anonymousSessionId: string) {
    const anonCart = await prisma.cart.findFirst({
      where: { sessionId: anonymousSessionId, status: "active" },
      include: { items: true },
    });

    if (!anonCart || anonCart.items.length === 0) {
      return this.getCartSummary({ customerId });
    }

    const customerCart = await this.getOrCreateCart({ customerId });

    for (const item of anonCart.items) {
      const existing = await prisma.cartItem.findFirst({
        where: { cartId: customerCart.id, variationId: item.variationId },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: customerCart.id,
            variationId: item.variationId,
            storeId: item.storeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          },
        });
      }
    }

    // Mark anonymous cart as completed / merged
    await prisma.cart.update({
      where: { id: anonCart.id },
      data: { status: "completed" },
    });

    return this.getCartSummary({ customerId });
  }
}
