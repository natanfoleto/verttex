import { z } from 'zod'

export const searchSuggestionsQuerySchema = z.object({
  q: z
    .string()
    .transform((val) => (val ? val.trim().slice(0, 200) : ''))
    .optional()
    .default(''),
  limit: z.coerce
    .number()
    .min(1, 'limit mínimo é 1')
    .max(10, 'limit máximo é 10')
    .optional()
    .default(8),
})

export type SearchSuggestionsQuery = z.input<
  typeof searchSuggestionsQuerySchema
>

export interface SearchSuggestion {
  text: string
  type: 'query'
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[]
}
