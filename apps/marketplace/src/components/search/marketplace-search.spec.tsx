import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addRecentSearch, getRecentSearches } from '../../lib/recent-searches'
import { MarketplaceSearch } from './marketplace-search'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: () => '',
  }),
}))

const mockApiClient = vi.fn()
vi.mock('../../lib/api-client', () => ({
  apiClient: (...args: unknown[]) => mockApiClient(...args),
}))

function renderComponent(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MarketplaceSearch debounceMs={0} {...props} />
    </QueryClientProvider>,
  )
}

describe('MarketplaceSearch Experience Component', () => {
  beforeEach(() => {
    window.localStorage.clear()
    pushMock.mockReset()
    mockApiClient.mockReset()
  })

  it('1. Renderiza o combobox de busca com atributos ARIA corretos (sem aria-controls nem aria-activedescendant quando fechado)', () => {
    renderComponent()

    const input = screen.getByRole('combobox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-controls')
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('2. Exibe pesquisas recentes ao focar no campo vazio e atribui role listbox', async () => {
    addRecentSearch('Mel Silvestre')
    addRecentSearch('Queijo Canastra')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Pesquisas recentes')).toBeInTheDocument()
      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByText('Mel Silvestre')).toBeInTheDocument()
      expect(screen.getByText('Queijo Canastra')).toBeInTheDocument()
    })

    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveAttribute('aria-controls')
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('3. Navega para /busca?q= ao submeter o formulário', async () => {
    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Cachaça Artesanal' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(pushMock).toHaveBeenCalledWith('/busca?q=Cacha%C3%A7a%20Artesanal')
  })

  it('4. Permite navegação por teclado (ArrowDown, ArrowUp e Enter) atualizando aria-activedescendant', async () => {
    addRecentSearch('Item A')
    addRecentSearch('Item B')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const optionB = await screen.findByText('Item B')
    expect(optionB).toBeInTheDocument()

    // ArrowDown seleciona o primeiro item recente (Item B)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      const optB = optionB.closest('[role="option"]')
      expect(optB).toHaveAttribute('aria-selected', 'true')
      expect(input).toHaveAttribute('aria-activedescendant', optB?.id)
    })

    // ArrowDown seleciona o próximo item recente (Item A)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      const optA = screen.getByText('Item A').closest('[role="option"]')
      expect(optA).toHaveAttribute('aria-selected', 'true')
      expect(input).toHaveAttribute('aria-activedescendant', optA?.id)
    })

    // Enter executa Item A
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(pushMock).toHaveBeenCalledWith('/busca?q=Item%20A')
  })

  it('5. Fecha o dropdown ao pressionar Escape e limpa aria-activedescendant e aria-controls', async () => {
    addRecentSearch('Mel')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Pesquisas recentes')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).not.toHaveAttribute('aria-controls')
    expect(input).not.toHaveAttribute('aria-activedescendant')
    expect(screen.queryByText('Pesquisas recentes')).not.toBeInTheDocument()
  })

  it('6. Remove um item individual das recentes ao clicar no botão de remover (que fica fora do role=option)', async () => {
    addRecentSearch('Mel Silvestre')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Mel Silvestre')).toBeInTheDocument()
    })

    const removeBtn = screen.getByLabelText(
      'Remover Mel Silvestre das pesquisas recentes',
    )

    // Confirma que o botão de remover NÃO está dentro do elemento com role="option"
    expect(removeBtn.closest('[role="option"]')).toBeNull()

    fireEvent.click(removeBtn)

    expect(screen.queryByText('Mel Silvestre')).not.toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('7. Chama API de sugestões e renderiza autocomplete para texto >= 2 caracteres', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        suggestions: [
          { text: 'Cachaça Artesanal', type: 'query' },
          { text: 'Cachaça Envelhecida', type: 'query' },
        ],
      },
    })

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'cacha' } })

    const item = await screen.findByText('Cachaça Artesanal')
    expect(item).toBeInTheDocument()
    expect(screen.getByText('Cachaça Envelhecida')).toBeInTheDocument()
  })

  it('8. Exibe mensagem discreta em caso de erro da API sem travar a submissão por Enter', async () => {
    mockApiClient.mockRejectedValueOnce(new Error('Network Error'))

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'queijo' } })

    const errorMsg = await screen.findByText(
      'Não foi possível carregar sugestões',
    )
    expect(errorMsg).toBeInTheDocument()

    // aria-controls fica undefined durante erro (pois o listbox div não é renderizado)
    expect(input).not.toHaveAttribute('aria-controls')

    // Enter ainda executa a busca manual normalmente
    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(pushMock).toHaveBeenCalledWith('/busca?q=queijo')
  })

  it('9. Clicar em uma sugestão executa a busca e adiciona a recentes', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        suggestions: [{ text: 'Queijo Canastra', type: 'query' }],
      },
    })

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'queijo' } })

    const sug = await screen.findByText('Queijo Canastra')
    fireEvent.click(sug)

    expect(pushMock).toHaveBeenCalledWith('/busca?q=Queijo%20Canastra')
    expect(getRecentSearches()).toContain('Queijo Canastra')
  })

  it('10. Clicar em um item de pesquisa recente executa a busca e o move para o topo', async () => {
    addRecentSearch('Mel Silvestre')
    addRecentSearch('Cachaça Ouro')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    const itemMel = await screen.findByText('Mel Silvestre')
    fireEvent.click(itemMel)

    expect(pushMock).toHaveBeenCalledWith('/busca?q=Mel%20Silvestre')
    expect(getRecentSearches()[0]).toBe('Mel Silvestre')
  })

  it('11. Pressionar Tab ou Clicar Fora fecha o dropdown', async () => {
    addRecentSearch('Doce de Leite')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await screen.findByText('Doce de Leite')

    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveAttribute('aria-expanded', 'false')

    // Reabre e testa clique fora
    fireEvent.focus(input)
    await screen.findByText('Doce de Leite')
    fireEvent.pointerDown(document.body)
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('12. Botão de limpar texto (X) limpa o input', async () => {
    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'texto teste' } })

    const clearBtn = screen.getByLabelText('Limpar texto')
    fireEvent.click(clearBtn)

    expect(input).toHaveValue('')
  })

  it('13. Botão "Limpar" remove todas as pesquisas recentes', async () => {
    addRecentSearch('Busca 1')
    addRecentSearch('Busca 2')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await screen.findByText('Pesquisas recentes')

    const clearAllBtn = screen.getByRole('button', { name: 'Limpar' })
    fireEvent.click(clearAllBtn)

    expect(getRecentSearches()).toEqual([])
  })

  it('14. Trata payload inesperado da API sem lançar exceção de UI', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: null,
    })

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'termo' } })

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalled()
    })

    // UI não quebra e não renderiza erros fatais
    expect(input).toBeInTheDocument()
  })
})
