import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addRecentSearch } from '../../lib/recent-searches'
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

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MarketplaceSearch debounceMs={0} />
    </QueryClientProvider>,
  )
}

describe('MarketplaceSearch Experience Component', () => {
  beforeEach(() => {
    window.localStorage.clear()
    pushMock.mockReset()
    mockApiClient.mockReset()
  })

  it('1. Renderiza o combobox de busca com atributos ARIA corretos', () => {
    renderComponent()

    const input = screen.getByRole('combobox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('2. Exibe pesquisas recentes ao focar no campo vazio', async () => {
    addRecentSearch('Mel Silvestre')
    addRecentSearch('Queijo Canastra')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Pesquisas recentes')).toBeInTheDocument()
      expect(screen.getByText('Mel Silvestre')).toBeInTheDocument()
      expect(screen.getByText('Queijo Canastra')).toBeInTheDocument()
    })

    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('3. Navega para /busca?q= ao submeter o formulário', async () => {
    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Cachaça Artesanal' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(pushMock).toHaveBeenCalledWith('/busca?q=Cacha%C3%A7a%20Artesanal')
  })

  it('4. Permite navegação por teclado (ArrowDown, ArrowUp e Enter)', async () => {
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
      expect(optionB.closest('[role="option"]')).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    // ArrowDown seleciona o próximo item recente (Item A)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(
        screen.getByText('Item A').closest('[role="option"]'),
      ).toHaveAttribute('aria-selected', 'true')
    })

    // Enter executa Item A
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(pushMock).toHaveBeenCalledWith('/busca?q=Item%20A')
  })

  it('5. Fecha o dropdown ao pressionar Escape', async () => {
    addRecentSearch('Mel')

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Pesquisas recentes')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Pesquisas recentes')).not.toBeInTheDocument()
  })

  it('6. Remove um item individual das recentes ao clicar no botão de remover', async () => {
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
    fireEvent.click(removeBtn)

    expect(screen.queryByText('Mel Silvestre')).not.toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('7. Chama API de sugestões e renderiza autocomplete para texto >= 2 caracteres', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        suggestions: [
          { text: 'cachaça artesanal', type: 'query' },
          { text: 'cachaça envelhecida', type: 'query' },
        ],
      },
    })

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'cacha' } })

    const item = await screen.findByText('cachaça artesanal')
    expect(item).toBeInTheDocument()
    expect(screen.getByText('cachaça envelhecida')).toBeInTheDocument()
  })

  it('8. Trata erro de API graciosamente sem travar a interface ao buscar', async () => {
    mockApiClient.mockRejectedValueOnce(new Error('Network Error'))

    renderComponent()

    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'queijo' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(pushMock).toHaveBeenCalledWith('/busca?q=queijo')
  })
})
