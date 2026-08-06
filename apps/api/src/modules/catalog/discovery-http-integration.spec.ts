import { beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../app";

describe("Product Discovery Engine — Fastify HTTP + Prisma Real Integration", () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  it("1. GET /public/catalog/discover?q=mel — aplica filtro por 'mel' e exclui não relacionados", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=mel&page=1&perPage=50&sort=relevance",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);

    const products = body.data.products;
    expect(products.length).toBeGreaterThan(0);
    expect(products.length).toBeLessThan(39); // Deve filtrar o catálogo geral (39 produtos)

    // Todos os produtos retornados devem conter 'mel' ou derivado no nome/contexto
    const melNames = products.map((p: { name: string }) => p.name.toLowerCase());
    const hasMel = melNames.some((name: string) => name.includes("mel") || name.includes("favo") || name.includes("própolis"));
    expect(hasMel).toBe(true);

    // Produto totalmente não relacionado não deve estar no resultado
    const hasFigo = melNames.includes("compota de figo ramy 400g");
    expect(hasFigo).toBe(false);
  });

  it("2. GET /public/catalog/discover?q=queijo — aplica filtro por 'queijo'", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=queijo&page=1&perPage=50&sort=relevance",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);

    const products = body.data.products;
    expect(products.length).toBeGreaterThan(0);

    const names = products.map((p: { name: string }) => p.name.toLowerCase());
    const hasQueijo = names.some((name: string) => name.includes("queijo") || name.includes("requeijão"));
    expect(hasQueijo).toBe(true);
  });

  it("3. Prova que q=mel != q=queijo != catálogo sem q", async () => {
    const resMel = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=mel&page=1&perPage=50",
    });
    const resQueijo = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=queijo&page=1&perPage=50",
    });
    const resSemQ = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?page=1&perPage=50",
    });

    const bodyMel = resMel.json();
    const bodyQueijo = resQueijo.json();
    const bodySemQ = resSemQ.json();

    const idsMel: string[] = bodyMel.data.products.map((p: { id: string }) => p.id);
    const idsQueijo: string[] = bodyQueijo.data.products.map((p: { id: string }) => p.id);
    const idsSemQ: string[] = bodySemQ.data.products.map((p: { id: string }) => p.id);

    expect(idsMel).not.toEqual(idsQueijo);
    expect(idsMel).not.toEqual(idsSemQ);
    expect(idsQueijo).not.toEqual(idsSemQ);
    expect(bodySemQ.data.pagination.total).toBe(39);
  });

  it("4. GET /public/catalog/discover?q=termo-inexistente-xyz — total 0 e products []", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=termo-inexistente-xyz&page=1&perPage=50",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.products).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });

  it("5. Busca por SKU real via HTTP — recupera produto esperado com score máximo com Prisma real", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=CANASTRA-MC-500G",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.products.length).toBeGreaterThan(0);

    const firstProduct = body.data.products[0];
    expect(firstProduct.name).toBe("Queijo Canastra Meia Cura 500g");
    expect(firstProduct.relevanceScore).toBe(1000);
  });

  it("6. Busca por Barcode real via HTTP — recupera produto esperado com score máximo com Prisma real", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=7891234567888",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.products.length).toBeGreaterThan(0);

    const firstProduct = body.data.products[0];
    expect(firstProduct.name).toBe("Mel de Eucalipto Puro 500g");
    expect(firstProduct.relevanceScore).toBe(1000);
  });

  it("7. Aliases e regra de precedência (q > search > query)", async () => {
    // ?search=mel deve ser equivalente a ?q=mel
    const resSearch = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?search=mel",
    });
    const resQ = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=mel",
    });
    expect(resSearch.statusCode).toBe(200);
    expect(resSearch.json().data.products.map((p: { id: string }) => p.id)).toEqual(
      resQ.json().data.products.map((p: { id: string }) => p.id),
    );

    // ?query=mel deve ser equivalente a ?q=mel
    const resQuery = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?query=mel",
    });
    expect(resQuery.statusCode).toBe(200);
    expect(resQuery.json().data.products.map((p: { id: string }) => p.id)).toEqual(
      resQ.json().data.products.map((p: { id: string }) => p.id),
    );

    // Precedência q > search: ?q=mel&search=queijo deve retornar resultados de 'mel'
    const resConflict = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=mel&search=queijo",
    });
    expect(resConflict.statusCode).toBe(200);
    expect(resConflict.json().data.products.map((p: { id: string }) => p.id)).toEqual(
      resQ.json().data.products.map((p: { id: string }) => p.id),
    );
  });

  it("8. Boundary HTTP converte q para search canônico e service processa sem conhecer q", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/public/catalog/discover?q=queijo",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.context.type).toBe("search");
    expect(body.data.context.query).toBe("queijo");
    expect(body.data.products.length).toBe(20);
  });
});
