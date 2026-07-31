import { prisma } from "../../infrastructure/database/prisma";
import { r2Storage } from "../../infrastructure/storage/r2";

export class MarketplaceService {
  /**
   * Obtém o registro singleton de configurações do marketplace (cria com padrões se não existir)
   */
  async getSettings() {
    let settings = await prisma.marketplaceSettings.findFirst();
    if (!settings) {
      settings = await prisma.marketplaceSettings.create({
        data: {
          publicName: "VERTTEX Marketplace",
          primaryColor: "#0f172a",
          secondaryColor: "#16a34a",
          announcementActive: false,
          announcementBgColor: "#1e293b",
          announcementTextColor: "#ffffff",
          outOfStockBehavior: "show_badge",
          carouselAutoplay: true,
          carouselIntervalSeconds: 5,
        },
      });
    }

    // Resolver URLs dos arquivos se existirem
    const logoUrl = settings.logoFileId ? await this.getFilePublicUrl(settings.logoFileId) : null;
    const faviconUrl = settings.faviconFileId ? await this.getFilePublicUrl(settings.faviconFileId) : null;
    const ogImageUrl = settings.ogImageFileId ? await this.getFilePublicUrl(settings.ogImageFileId) : null;

    return {
      ...settings,
      logoUrl,
      faviconUrl,
      ogImageUrl,
    };
  }

  /**
   * Obtém as configurações públicas seguras para o Marketplace (sem expor campos de auditoria)
   */
  async getPublicSettings() {
    const settings = await this.getSettings();
    return {
      publicName: settings.publicName,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      headerBgColor: settings.headerBgColor,
      headerTextColor: settings.headerTextColor,
      siteBgColor: settings.siteBgColor,
      primaryButtonBgColor: settings.primaryButtonBgColor,
      primaryButtonTextColor: settings.primaryButtonTextColor,
      secondaryButtonBgColor: settings.secondaryButtonBgColor,
      secondaryButtonTextColor: settings.secondaryButtonTextColor,
      primaryTextColor: settings.primaryTextColor,
      secondaryTextColor: settings.secondaryTextColor,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      supportWhatsapp: settings.supportWhatsapp,
      address: settings.address,
      businessHours: settings.businessHours,
      metaTitle: settings.metaTitle,
      metaDescription: settings.metaDescription,
      ogImageUrl: settings.ogImageUrl,
      announcementActive: settings.announcementActive,
      announcementText: settings.announcementText,
      announcementLink: settings.announcementLink,
      announcementBgColor: settings.announcementBgColor,
      announcementTextColor: settings.announcementTextColor,
      announcementDismissible: settings.announcementDismissible,
      outOfStockBehavior: settings.outOfStockBehavior,
      carouselAutoplay: settings.carouselAutoplay,
      carouselIntervalSeconds: settings.carouselIntervalSeconds,
      carouselTitlePosition: settings.carouselTitlePosition,
      carouselTitleHAlign: settings.carouselTitleHAlign,
    };
  }

  /**
   * Atualiza o registro singleton de configurações
   */
  async updateSettings(data: any, userId: string) {
    const current = await this.getSettings();

    // Separar campos virtuais/computados (logoUrl, faviconUrl, ogImageUrl) dos campos persistidos no banco
    const { logoUrl, faviconUrl, ogImageUrl, ...persistableData } = data;

    // Limpeza de arquivos substituídos no R2
    if (persistableData.logoFileId !== undefined && persistableData.logoFileId !== current.logoFileId && current.logoFileId) {
      await this.cleanupFile(current.logoFileId);
    }
    if (persistableData.faviconFileId !== undefined && persistableData.faviconFileId !== current.faviconFileId && current.faviconFileId) {
      await this.cleanupFile(current.faviconFileId);
    }
    if (persistableData.ogImageFileId !== undefined && persistableData.ogImageFileId !== current.ogImageFileId && current.ogImageFileId) {
      await this.cleanupFile(current.ogImageFileId);
    }

    await prisma.marketplaceSettings.update({
      where: { id: current.id },
      data: {
        ...persistableData,
        updatedBy: userId,
      },
    });

    return this.getSettings();
  }

  private async getFilePublicUrl(fileId: string): Promise<string | null> {
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return null;
    return r2Storage.getFileUrl(file.objectKey);
  }

  private async cleanupFile(fileId: string) {
    try {
      const file = await prisma.file.findUnique({ where: { id: fileId } });
      if (file) {
        await r2Storage.deleteFile(file.objectKey);
        await prisma.file.delete({ where: { id: fileId } }).catch(() => null);
      }
    } catch (err) {
      console.warn("Falha ao limpar arquivo substituído nas configurações do marketplace:", err);
    }
  }
}

export const marketplaceService = new MarketplaceService();
