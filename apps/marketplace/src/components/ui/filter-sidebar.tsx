import { RiCloseLine, RiFilter3Line } from "react-icons/ri";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CategoryFilterItem {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  count?: number;
}

export interface FilterSidebarProps {
  categories: CategoryFilterItem[];
  activeCategorySlug?: string;
  activeSort?: string;
  onSelectCategory?: (slug: string) => void;
  onSelectSort?: (sort: string) => void;
  onClearAll?: () => void;
}

export function FilterSidebar({
  categories,
  activeCategorySlug,
  activeSort = "featured",
  onSelectCategory,
  onSelectSort,
  onClearAll,
}: FilterSidebarProps) {
  const activeCategory = categories.find((c) => c.slug === activeCategorySlug);
  const isDefaultSort = activeSort === "featured" || activeSort === "relevancia";

  // Group categories into parent/child hierarchy for the sidebar
  const rootCategories = categories.filter((c) => !c.parentId);
  const subcategoriesMap = new Map<string, CategoryFilterItem[]>();

  categories.forEach((cat) => {
    if (cat.parentId) {
      const existing = subcategoriesMap.get(cat.parentId) || [];
      existing.push(cat);
      subcategoriesMap.set(cat.parentId, existing);
    }
  });

  const hasHierarchy = rootCategories.length > 0;

  return (
    <div className="w-full space-y-6">
      {/* Active Filters Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <h3 className="flex items-center space-x-2 text-sm font-bold text-stone-900">
          <RiFilter3Line className="h-4 w-4 text-emerald-700" />
          <span>Filtros & Categorias</span>
        </h3>
        {(activeCategorySlug || !isDefaultSort) && onClearAll && (
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
      {(activeCategory || !isDefaultSort) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {activeCategory && (
            <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span>{activeCategory.name}</span>
              {onSelectCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectCategory("")}
                  className="h-4 w-4 p-0 rounded-full text-emerald-800 hover:bg-emerald-200"
                >
                  <RiCloseLine className="h-3.5 w-3.5" />
                </Button>
              )}
            </span>
          )}

          {!isDefaultSort && (
            <span className="inline-flex items-center space-x-1 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              <span>
                {activeSort === "price_asc" || activeSort === "menor-preco"
                  ? "Menor Preço"
                  : activeSort === "price_desc" || activeSort === "maior-preco"
                    ? "Maior Preço"
                    : "Lançamentos"}
              </span>
              {onSelectSort && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectSort("featured")}
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
          Categorias
        </h4>
        <ul className="space-y-1 text-sm">
          <li>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onSelectCategory && onSelectCategory("")}
              className={`flex w-full justify-between text-left font-medium ${
                !activeCategorySlug
                  ? "bg-emerald-50 font-bold text-emerald-800"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              <span>Todas as Categorias</span>
            </Button>
          </li>

          {hasHierarchy ? (
            rootCategories.map((root) => {
              const directCount = Number(root.count || 0);
              const subs = (subcategoriesMap.get(root.id) || []).filter(
                (s) => Number(s.count || 0) > 0,
              );
              const subsTotal = subs.reduce(
                (acc, s) => acc + Number(s.count || 0),
                0,
              );
              const totalCount = directCount + subsTotal;

              // Skip root category if total count is 0
              if (totalCount === 0) return null;

              const isRootSelected = activeCategorySlug === root.slug;

              return (
                <li key={root.id || root.slug} className="space-y-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      onSelectCategory && onSelectCategory(root.slug)
                    }
                    className={`flex w-full justify-between text-left ${
                      isRootSelected
                        ? "bg-emerald-50 font-bold text-emerald-800"
                        : "font-semibold text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    <span>{root.name}</span>
                    {totalCount > 0 && (
                      <span
                        className={`text-xs font-mono ${
                          isRootSelected
                            ? "font-bold text-emerald-700"
                            : "text-stone-400"
                        }`}
                      >
                        ({totalCount})
                      </span>
                    )}
                  </Button>

                  {/* Indented Subcategories */}
                  {subs.length > 0 && (
                    <ul className="pl-3 space-y-0.5">
                      {subs.map((sub) => {
                        const isSubSelected = activeCategorySlug === sub.slug;
                        const subCount = Number(sub.count || 0);
                        return (
                          <li key={sub.id || sub.slug}>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                onSelectCategory && onSelectCategory(sub.slug)
                              }
                              className={`flex w-full justify-between text-left text-xs py-1.5 h-auto ${
                                isSubSelected
                                  ? "bg-emerald-50 text-emerald-800 font-bold"
                                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              {subCount > 0 && (
                                <span
                                  className={`text-[11px] font-mono ml-2 shrink-0 ${
                                    isSubSelected
                                      ? "font-semibold text-emerald-700"
                                      : "text-stone-400"
                                  }`}
                                >
                                  ({subCount})
                                </span>
                              )}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })
          ) : (
            // Fallback for flat category lists
            categories
              .filter((cat) => Number(cat.count || 0) > 0)
              .map((cat) => {
                const isSelected = activeCategorySlug === cat.slug;
                return (
                  <li key={cat.id || cat.slug}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        onSelectCategory && onSelectCategory(cat.slug)
                      }
                      className={`flex w-full justify-between text-left ${
                        isSelected
                          ? "bg-emerald-50 font-bold text-emerald-800"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs text-stone-400">
                        ({cat.count})
                      </span>
                    </Button>
                  </li>
                );
              })
          )}
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
              { id: "featured", label: "Mais Relevantes / Destaques" },
              { id: "price_asc", label: "Menor Preço" },
              { id: "price_desc", label: "Maior Preço" },
              { id: "newest", label: "Lançamentos" },
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
                      ? "font-semibold text-stone-900"
                      : ""
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
  );
}
