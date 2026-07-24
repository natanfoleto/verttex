export const RESERVED_SLUGS = new Set([
  "produtos",
  "categorias",
  "carrinho",
  "checkout",
  "conta",
  "pedidos",
  "admin",
  "api",
  "login",
  "cadastro",
  "lojas",
  "perfil",
  "busca",
  "ajuda",
  "dashboard",
  "settings",
  "configuracoes",
  "suporte",
  "termos",
  "privacidade",
]);

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isSlugReserved(slug: string): boolean {
  const normalized = normalizeSlug(slug);
  return RESERVED_SLUGS.has(normalized);
}
