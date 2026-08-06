import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from './recent-searches'

describe('recent-searches storage manager', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('1. Retorna lista vazia quando localStorage não contém dados', () => {
    expect(getRecentSearches()).toEqual([])
  })

  it('2. Adiciona pesquisa recente e persiste no localStorage', () => {
    const res = addRecentSearch('Mel Silvestre')
    expect(res).toEqual(['Mel Silvestre'])
    expect(getRecentSearches()).toEqual(['Mel Silvestre'])
  })

  it('3. Ignora buscas vazias ou contendo apenas espaços', () => {
    addRecentSearch('   ')
    expect(getRecentSearches()).toEqual([])
  })

  it('4. Realiza deduplicação insensível a caixa e acentos, movendo a busca para o topo', () => {
    addRecentSearch('Cachaça')
    addRecentSearch('Queijo Canastra')
    addRecentSearch('cachaca') // Accent & case insensitive match

    expect(getRecentSearches()).toEqual(['cachaca', 'Queijo Canastra'])
  })

  it('5. Respeita o limite máximo de 6 pesquisas recentes', () => {
    addRecentSearch('item 1')
    addRecentSearch('item 2')
    addRecentSearch('item 3')
    addRecentSearch('item 4')
    addRecentSearch('item 5')
    addRecentSearch('item 6')
    addRecentSearch('item 7')

    const current = getRecentSearches()
    expect(current.length).toBe(6)
    expect(current[0]).toBe('item 7')
    expect(current).not.toContain('item 1')
  })

  it('6. Remove um item individual insensível a acento/caixa', () => {
    addRecentSearch('Mel')
    addRecentSearch('Cachaça')
    removeRecentSearch('cachaca')

    expect(getRecentSearches()).toEqual(['Mel'])
  })

  it('7. Limpa todo o histórico com clearRecentSearches()', () => {
    addRecentSearch('Mel')
    addRecentSearch('Doce de leite')
    clearRecentSearches()

    expect(getRecentSearches()).toEqual([])
  })

  it('8. Trata JSON corrompido no localStorage sem lançar exceção (resiliência)', () => {
    window.localStorage.setItem(
      'verttex:search:recent:v1',
      '{ invalid json format... ',
    )

    expect(getRecentSearches()).toEqual([])
  })

  it('9. Trata tipo não-array no localStorage sem lançar exceção', () => {
    window.localStorage.setItem(
      'verttex:search:recent:v1',
      JSON.stringify({ not: 'an array' }),
    )

    expect(getRecentSearches()).toEqual([])
  })

  it('10. Suporta chamadas sem window (SSR safety)', () => {
    const originalWindow = global.window
    // @ts-expect-error simulating SSR
    delete global.window

    expect(getRecentSearches()).toEqual([])
    expect(addRecentSearch('teste')).toEqual(['teste'])

    global.window = originalWindow
  })
})
