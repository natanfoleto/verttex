import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

function renderComponent(debounceMs = 200) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MarketplaceSearch debounceMs={debounceMs} />
    </QueryClientProvider>,
  )
}

describe('MarketplaceSearch Debounce & Race Condition Tests', () => {
  beforeEach(() => {
    window.localStorage.clear()
    pushMock.mockReset()
    mockApiClient.mockReset()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('1. Digitação rápida não dispara chamadas à API antes de decorridos 200ms', async () => {
    renderComponent(200)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'ca' } })
    fireEvent.change(input, { target: { value: 'cac' } })
    fireEvent.change(input, { target: { value: 'cach' } })

    // Antes dos 200ms, a API não deve ter sido chamada
    expect(mockApiClient).not.toHaveBeenCalled()

    // Avança o tempo do debounce
    act(() => {
      vi.advanceTimersByTime(200)
    })

    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledTimes(1)
      expect(mockApiClient.mock.calls[0]?.[0]).toContain('q=cach')
    })
  })

  it('2. Query com 1 caractere não aciona chamada de API nem após o debounce', async () => {
    renderComponent(200)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'c' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(mockApiClient).not.toHaveBeenCalled()
  })

  it('3. Sugestões antigas são ocultadas enquanto nova query aguarda debounce', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        suggestions: [{ text: 'cachaça artesanal', type: 'query' }],
      },
    })

    renderComponent(200)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'cacha' } })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    const suggestionItem = await screen.findByText('cachaça artesanal')
    expect(suggestionItem).toBeInTheDocument()

    // Altera o input para novo texto
    fireEvent.change(input, { target: { value: 'cachaca especial' } })

    // Imediatamente as sugestões antigas da query anterior NÃO aparecem
    expect(screen.queryByText('cachaça artesanal')).not.toBeInTheDocument()
  })

  it('4. Resposta atrasada de query antiga não sobrescreve query mais recente (Deferred Promise)', async () => {
    let resolveFirstQuery: (val: unknown) => void = () => {}

    mockApiClient.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveFirstQuery = resolve
      })
    })

    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        suggestions: [{ text: 'queijo canastra', type: 'query' }],
      },
    })

    renderComponent(200)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    // Primeira query "cacha"
    fireEvent.change(input, { target: { value: 'cacha' } })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Segunda query "queijo"
    fireEvent.change(input, { target: { value: 'queijo' } })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // A segunda query é resolvida primeiro
    await waitFor(() => {
      expect(screen.getByText('queijo canastra')).toBeInTheDocument()
    })

    // Resolve tardiamente a primeira query "cacha"
    act(() => {
      resolveFirstQuery({
        success: true,
        data: {
          suggestions: [{ text: 'cachaça antiga tardia', type: 'query' }],
        },
      })
    })

    // Confirma que a resposta tardia NÃO sobrescreve o resultado da query mais recente
    expect(screen.queryByText('cachaça antiga tardia')).not.toBeInTheDocument()
    expect(screen.getByText('queijo canastra')).toBeInTheDocument()
  })

  it('5. Regressão Obrigatória: Pressionar Enter com input alterado antes do debounce executa a query digitada e NÃO a sugestão anterior', async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        suggestions: [
          { text: 'cachaça artesanal', type: 'query' },
          { text: 'cachaça envelhecida', type: 'query' },
        ],
      },
    })

    renderComponent(200)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'cacha' } })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    const sug1 = await screen.findByText('cachaça artesanal')
    expect(sug1).toBeInTheDocument()

    // ArrowDown seleciona a sugestão 0
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const opt0 = sug1.closest('[role="option"]')
    expect(opt0).toHaveAttribute('aria-selected', 'true')

    // Altera o input para "cachaca" (sem acento)
    fireEvent.change(input, { target: { value: 'cachaca' } })

    // Antes dos 200ms de debounce do novo termo "cachaca", pressiona Enter
    fireEvent.keyDown(input, { key: 'Enter' })

    // Assertion: executa a busca do input digitado 'cachaca', NÃO a sugestão 'cachaça artesanal'
    expect(pushMock).toHaveBeenCalledWith('/busca?q=cachaca')
    expect(pushMock).not.toHaveBeenCalledWith(
      '/busca?q=cacha%C3%A7a%20artesanal',
    )
  })

  it('6. Cancela efetivamente a requisição anterior abortando o AbortSignal ao mudar a query', async () => {
    let firstSignal: AbortSignal | undefined

    mockApiClient.mockImplementationOnce(
      (_url, options?: { signal?: AbortSignal }) => {
        firstSignal = options?.signal
        return new Promise(() => {}) // permanece pendente
      },
    )

    renderComponent(200)

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'cacha' } })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(firstSignal).toBeDefined()
    expect(firstSignal?.aborted).toBe(false)

    // Altera a query para disparar cancelamento
    fireEvent.change(input, { target: { value: 'queijo' } })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // O signal da primeira requisição agora está abortado
    expect(firstSignal?.aborted).toBe(true)
  })

  it('7. Envia limit=6 no mobile (<56rem) e limit=8 no desktop (>=56rem)', async () => {
    // Simula tela Mobile (<56rem)
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false, // < 56rem
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    mockApiClient.mockResolvedValue({
      success: true,
      data: { suggestions: [] },
    })

    const { unmount } = renderComponent(0)
    const inputMobile = screen.getByRole('combobox')
    fireEvent.change(inputMobile, { target: { value: 'mel' } })

    await waitFor(() => {
      expect(mockApiClient.mock.calls[0]?.[0]).toContain('limit=6')
    })

    unmount()
    mockApiClient.mockReset()

    // Simula tela Desktop (>=56rem)
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: true, // >= 56rem
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    renderComponent(0)
    const inputDesktop = screen.getByRole('combobox')
    fireEvent.change(inputDesktop, { target: { value: 'mel' } })

    await waitFor(() => {
      expect(mockApiClient.mock.calls[0]?.[0]).toContain('limit=8')
    })
  })
})
