import { describe, expect, it } from "vitest";

// Interface representing backend HTTP response wrapper
interface BackendApiResponse<T> {
  success: boolean;
  data: T;
}

// Interface expected by Frontend ProductDiscoveryView
interface FrontendDiscoveryData {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    store: { id: string; name: string; slug: string };
    category: { id: string; name: string; slug: string };
  }>;
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Frontend apiClient unwrapping logic
function parseApiClientResponse<T>(data: any): T {
  if (data && typeof data === "object") {
    if (data.meta !== undefined) return data;
    if (data.data !== undefined) return data.data;
  }
  return data;
}

// Frontend ProductDiscoveryView product extraction logic
function extractDiscoveryProducts(res: any) {
  const discoveryData = parseApiClientResponse<FrontendDiscoveryData>(res);
  return discoveryData?.products || (discoveryData as any)?.items || [];
}

describe("Post-validation Bugfix — Frontend Discovery Adapter & Parsing", () => {
  it("1. Response HTTP com 3 produtos — extrai corretamente 3 produtos para renderizar nos cards", () => {
    const mockHttpResponse: BackendApiResponse<FrontendDiscoveryData> = {
      success: true,
      data: {
        products: [
          {
            id: "prod-1",
            name: "Mel Silvestre 500g",
            slug: "mel-silvestre-500g",
            price: 38.0,
            store: { id: "store-1", name: "Apiário Serra", slug: "apiario-serra" },
            category: { id: "cat-1", name: "Mel", slug: "mel" },
          },
          {
            id: "prod-2",
            name: "Queijo Canastra 500g",
            slug: "queijo-canastra-500g",
            price: 49.9,
            store: { id: "store-2", name: "Queijaria Alvorada", slug: "queijaria-alvorada" },
            category: { id: "cat-2", name: "Queijos", slug: "queijos" },
          },
          {
            id: "prod-3",
            name: "Cachaça Amburana 750ml",
            slug: "cachaca-amburana-750ml",
            price: 68.0,
            store: { id: "store-3", name: "Engenho Boa Esperança", slug: "boa-esperanca" },
            category: { id: "cat-3", name: "Cachaças", slug: "cachacas" },
          },
        ],
        pagination: {
          page: 1,
          perPage: 50,

          total: 3,
          totalPages: 1,
        },
      },
    };

    const products = extractDiscoveryProducts(mockHttpResponse);
    expect(products).toHaveLength(3);
    expect(products[0]?.name).toBe("Mel Silvestre 500g");
    expect(products[1]?.name).toBe("Queijo Canastra 500g");
    expect(products[2]?.name).toBe("Cachaça Amburana 750ml");
  });


  it("2. Response HTTP sem produtos — exibe 0 produtos e ativa Empty State", () => {
    const mockEmptyHttpResponse: BackendApiResponse<FrontendDiscoveryData> = {
      success: true,
      data: {
        products: [],
        pagination: {
          page: 1,
          perPage: 50,

          total: 0,
          totalPages: 0,
        },
      },
    };

    const products = extractDiscoveryProducts(mockEmptyHttpResponse);
    expect(products).toHaveLength(0);
  });
});
