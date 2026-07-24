import Link from 'next/link'
import { RiCloseLine, RiFilter3Line } from 'react-icons/ri'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface CategoryFilterItem {
  id: string
  name: string
  slug: string
  count?: number
}

export interface FilterSidebarProps {
  categories: CategoryFilterItem[]
  activeCategorySlug?: string
  activeSort?: string
  onSelectCategory?: (slug: string) => void
  onSelectSort?: (sort: string) => void
  onClearAll?: () => void
}

export function FilterSidebar({
  categories,
  activeCategorySlug,
  activeSort = 'relevancia',
  onSelectCategory,
  onSelectSort,
  onClearAll,
}: FilterSidebarProps) {
  const activeCategory = categories.find((c) => c.slug === activeCategorySlug)

  return (
    <div className="w-full space-y-6">
      {/* Active Filters Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <h3 className="flex items-center space-x-2 text-sm font-bold text-stone-900">
          <RiFilter3Line className="h-4 w-4 text-emerald-700" />
          <span>Filtros & Categorias</span>
        </h3>
        {(activeCategorySlug || activeSort !== 'relevancia') && onClearAll && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onClearAll}
            className="p-0 text-rose-600 hover:text-rose-800 hover:underline text-xs font-semibold h-auto"
          >
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {(activeCategory || activeSort !== 'relevancia') && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeCategory && (
            <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span>{activeCategory.name}</span>
              {onSelectCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectCategory('')}
                  className="h-4 w-4 p-0 rounded-full text-emerald-800 hover:bg-emerald-200"
                >
                  <RiCloseLine className="h-3.5 w-3.5" />
                </Button>
              )}
            </span>
          )}

          {activeSort !== 'relevancia' && (
            <span className="inline-flex items-center space-x-1 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              <span>
                {activeSort === 'menor-preco'
                  ? 'Menor Preço'
                  : activeSort === 'maior-preco'
                    ? 'Maior Preço'
                    : 'Mais Vendidos'}
              </span>
              {onSelectSort && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectSort('relevancia')}
                  className="h-4 w-4 p-0 rounded-full text-stone-600 hover:bg-stone-200"
                >
                  <RiCloseLine className="h-3.5 w-3.5" />
                </Button>
              )}
            </span>
          )}
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold tracking-wider text-stone-500 uppercase">
          Categorias de Produtos
        </h4>
        <ul className="space-y-1 text-sm">
          <li>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onSelectCategory && onSelectCategory('')}
              className={`flex w-full justify-between text-left font-medium ${
                !activeCategorySlug
                  ? 'bg-emerald-50 font-bold text-emerald-800'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>Todas as Categorias</span>
            </Button>
          </li>

          {categories.map((cat) => {
            const isSelected = activeCategorySlug === cat.slug
            return (
              <li key={cat.id || cat.slug}>
                {onSelectCategory ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSelectCategory(cat.slug)}
                    className={`flex w-full justify-between text-left ${
                      isSelected
                        ? 'bg-emerald-50 font-bold text-emerald-800'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.count !== undefined && (
                      <span
                        className={`text-xs ${
                          isSelected
                            ? 'font-semibold text-emerald-700'
                            : 'text-stone-400'
                        }`}
                      >
                        ({cat.count})
                      </span>
                    )}
                  </Button>
                ) : (
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 font-bold text-emerald-800'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.count !== undefined && (
                      <span className="text-xs text-stone-400">
                        ({cat.count})
                      </span>
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Sorting Options */}
      {onSelectSort && (
        <div className="space-y-3 border-t border-stone-200 pt-4">
          <h4 className="text-xs font-bold tracking-wider text-stone-500 uppercase">
            Ordenar Por
          </h4>
          <div className="space-y-1">
            {[
              { id: 'relevancia', label: 'Mais Relevantes' },
              { id: 'menor-preco', label: 'Menor Preço' },
              { id: 'maior-preco', label: 'Maior Preço' },
              { id: 'mais-vendidos', label: 'Mais Vendidos' },
            ].map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center space-x-2 rounded-lg px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-100"
              >
                <Input
                  type="radio"
                  name="sort"
                  value={option.id}
                  checked={activeSort === option.id}
                  onChange={(e) => onSelectSort(e.target.value)}
                  className="h-4 w-4 border-stone-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                />
                <span
                  className={
                    activeSort === option.id
                      ? 'font-semibold text-stone-900'
                      : ''
                  }
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
