'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { RiGridLine } from 'react-icons/ri'

import { apiClient } from '@/lib/api-client'

export interface PublicCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  iconUrl?: string | null
  parentId?: string | null
  productsCount: number
}

export function CategoriesOverviewView() {
  const { data: rawCategories = [], isLoading } = useQuery<PublicCategory[]>({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await apiClient<PublicCategory[]>(
        '/public/catalog/categories',
      )
      return Array.isArray(res)
        ? res
        : ((res as { data?: PublicCategory[] })?.data ?? [])
    },
  })

  // Subcategories with direct products > 0
  const validSubcategories = rawCategories.filter(
    (c) => Boolean(c.parentId) && Number(c.productsCount) > 0,
  )

  // Root categories are shown if they have direct products > 0 OR if any of their subcategories has products > 0
  const rootCategories = rawCategories.filter((c) => {
    if (c.parentId) return false
    const hasDirectProducts = Number(c.productsCount) > 0
    const hasChildWithProducts = rawCategories.some(
      (sub) => sub.parentId === c.id && Number(sub.productsCount) > 0,
    )
    return hasDirectProducts || hasChildWithProducts
  })

  const subcategoriesMap = new Map<string, PublicCategory[]>()
  validSubcategories.forEach((cat) => {
    if (cat.parentId) {
      const existing = subcategoriesMap.get(cat.parentId) || []
      existing.push(cat)
      subcategoriesMap.set(cat.parentId, existing)
    }
  })

  const hasContent = rootCategories.length > 0

  return (
    <div className="min-h-screen py-8 font-sans text-stone-900 antialiased sm:py-12">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Categorias para comprar e vender
          </h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 py-6 pl-4 sm:grid-cols-2 sm:pl-8 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-6 w-3/4 rounded-md bg-stone-200" />
                <div className="h-4 w-1/2 rounded-md bg-stone-100" />
                <div className="h-4 w-2/3 rounded-md bg-stone-100" />
              </div>
            ))}
          </div>
        )}

        {/* Categories Section (Indented Parent Categories) */}
        {!isLoading && hasContent && (
          <div className="space-y-10 pt-2 pl-4 sm:pl-8">
            {rootCategories.map((parent) => {
              const subs = subcategoriesMap.get(parent.id) || []
              return (
                <section
                  key={parent.id}
                  className="space-y-3 border-b border-stone-100 pb-8 last:border-0"
                >
                  <Link
                    href={`/categoria/${parent.slug}`}
                    className="group inline-block cursor-pointer"
                  >
                    <h2 className="text-lg font-bold text-stone-900 transition-colors group-hover:text-emerald-800">
                      {parent.name}
                    </h2>
                  </Link>

                  {/* Indented Subcategories Grid */}
                  <div className="pl-4 sm:pl-6">
                    {subs.length > 0 ? (
                      <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 md:grid-cols-4">
                        {subs.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/categoria/${parent.slug}/${sub.slug}`}
                            className="block cursor-pointer truncate py-0.5 text-sm text-stone-600 transition-colors hover:text-emerald-800 hover:underline"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2 md:grid-cols-4">
                        <Link
                          href={`/categoria/${parent.slug}`}
                          className="block cursor-pointer truncate py-0.5 text-sm text-stone-600 transition-colors hover:text-emerald-800 hover:underline"
                        >
                          Ver produtos em {parent.name}
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasContent && (
          <div className="space-y-3 py-16 text-center">
            <RiGridLine className="mx-auto h-10 w-10 text-stone-300" />
            <p className="text-sm font-medium text-stone-600">
              Nenhuma categoria com produtos disponíveis no momento.
            </p>
            <Link
              href="/produtos"
              className="inline-flex items-center text-xs font-bold text-emerald-800 hover:underline"
            >
              Ver todos os produtos do catálogo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
