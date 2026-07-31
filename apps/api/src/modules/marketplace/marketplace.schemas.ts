import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Formato hexadecimal inválido (ex: #0f172a)");

const safeUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      const lower = val.trim().toLowerCase();
      if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
        return false;
      }
      return true;
    },
    { message: "URL inválida ou contém protocolo não permitido." }
  )
  .optional()
  .nullable();

export const updateMarketplaceSettingsSchema = z
  .object({
    publicName: z.string().min(2, "Nome público é obrigatório").max(100).optional(),
    logoFileId: z.string().nullable().optional(),
    faviconFileId: z.string().nullable().optional(),
    logoUrl: safeUrlSchema,
    faviconUrl: safeUrlSchema,
    ogImageUrl: safeUrlSchema,
    primaryColor: hexColorSchema.optional(),
    secondaryColor: hexColorSchema.optional(),
    headerBgColor: hexColorSchema.optional(),
    headerTextColor: hexColorSchema.optional(),
    siteBgColor: hexColorSchema.optional(),
    primaryButtonBgColor: hexColorSchema.optional(),
    primaryButtonTextColor: hexColorSchema.optional(),
    secondaryButtonBgColor: hexColorSchema.optional(),
    secondaryButtonTextColor: hexColorSchema.optional(),
    primaryTextColor: hexColorSchema.optional(),
    secondaryTextColor: hexColorSchema.optional(),
    supportEmail: z.string().email("E-mail de suporte inválido").nullable().optional().or(z.literal("")),
    supportPhone: z.string().nullable().optional(),
    supportWhatsapp: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    businessHours: z.string().nullable().optional(),
    metaTitle: z.string().max(120).nullable().optional(),
    metaDescription: z.string().max(300).nullable().optional(),
    ogImageFileId: z.string().nullable().optional(),
    announcementActive: z.boolean().optional(),
    announcementText: z.string().max(250).nullable().optional(),
    announcementLink: safeUrlSchema,
    announcementBgColor: hexColorSchema.optional(),
    announcementTextColor: hexColorSchema.optional(),
    announcementDismissible: z.boolean().optional(),
    outOfStockBehavior: z
      .enum(["show_badge", "hide_product", "move_to_end"], {
        errorMap: () => ({ message: "Comportamento inválido. Opções válidas: show_badge, hide_product, move_to_end" }),
      })
      .optional(),
    carouselAutoplay: z.boolean().optional(),
    carouselIntervalSeconds: z.number().int().min(1).max(60).optional(),
    carouselTitlePosition: z
      .enum(["TOP", "CENTER", "BOTTOM", "NONE"], {
        errorMap: () => ({ message: "Posição de título inválida. Opções válidas: TOP, CENTER, BOTTOM, NONE" }),
      })
      .optional(),
    carouselTitleHAlign: z
      .enum(["LEFT", "CENTER", "RIGHT"], {
        errorMap: () => ({ message: "Alinhamento horizontal inválido. Opções válidas: LEFT, CENTER, RIGHT" }),
      })
      .optional(),
  })
  .passthrough();

export type UpdateMarketplaceSettingsInput = z.infer<typeof updateMarketplaceSettingsSchema>;
