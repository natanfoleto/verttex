const FIELD_LABELS: Record<string, string> = {
  price: 'Preço',
  sku: 'SKU',
  stock: 'Estoque',
  name: 'Nome',
  description: 'Descrição',
  categoryId: 'Categoria',
  categoryIds: 'Categorias',
  storeId: 'Loja',
  brandId: 'Marca',
  type: 'Tipo',
  images: 'Imagens',
}

/**
 * Sanitiza e formata mensagens de erro brutas retornadas pela API da aplicação.
 * Remove prefixos de caminhos de schema (ex: "body/variations/0/price" ou "variations/0/price")
 * e transforma em descrições amigáveis para exibição ao usuário final nos Toasts.
 */
export function formatApiErrorMessage(message: string): string {
  if (!message) return 'Ocorreu um erro ao processar a requisição'

  // Identifica delimitadores entre múltiplas mensagens
  const delimiter = message.includes(' | ')
    ? ' | '
    : message.includes(', ')
      ? ', '
      : null
  const parts = delimiter ? message.split(delimiter) : [message]

  const formattedParts = parts.map((part) => {
    let clean = part.trim()

    // 1. Remove prefixo inicial "body/" se existir
    clean = clean.replace(/^(body\/)?/i, '')

    // 2. Trata caminhos de variações: "variations/0/price" ou "variations.0.price" -> "Variação #1 (Preço)"
    clean = clean.replace(
      /(?:body\/)?variations[\/\.](\d+)[\/\.](\w+)/gi,
      (_, index, field) => {
        const itemNumber = Number(index) + 1
        const label = FIELD_LABELS[field] || field
        return `Variação #${itemNumber} (${label})`
      },
    )

    // 3. Trata campos simples no início: "name: ..." -> "Nome: ..."
    clean = clean.replace(/^([\w\.]+):\s*/i, (match, field) => {
      if (field.startsWith('Variação')) return match
      const label = FIELD_LABELS[field] || field
      return `${label}: `
    })

    return clean.trim()
  })

  return formattedParts.filter(Boolean).join(' | ')
}
