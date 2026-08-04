'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'

import { ErrorDialog } from '@/components/ui/error-dialog'
import { ApiError } from '@/lib/api-client'

interface ErrorDialogContextType {
  showError: (
    error: ApiError | Error | string | unknown,
    title?: string,
    description?: string,
  ) => void
  closeError: () => void
}

const ErrorDialogContext = createContext<ErrorDialogContextType | undefined>(
  undefined,
)

export function ErrorDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [errorState, setErrorState] = useState<ApiError | Error | null>(null)
  const [dialogTitle, setDialogTitle] = useState<string | undefined>(undefined)
  const [dialogDescription, setDialogDescription] = useState<
    string | undefined
  >(undefined)

  const showError = useCallback(
    (
      error: ApiError | Error | string | unknown,
      title?: string,
      description?: string,
    ) => {
      let errObj: ApiError | Error

      if (typeof error === 'string') {
        errObj = new Error(error)
      } else if (error instanceof ApiError || error instanceof Error) {
        errObj = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errObj = new Error(String((error as { message: unknown }).message))
      } else {
        errObj = new Error('Ocorreu um erro ao processar a requisição.')
      }

      setErrorState(errObj)
      setDialogTitle(title)
      setDialogDescription(description)
      setIsOpen(true)
    },
    [],
  )

  const closeError = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <ErrorDialogContext.Provider value={{ showError, closeError }}>
      {children}
      <ErrorDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        error={errorState}
        title={dialogTitle}
        description={dialogDescription}
      />
    </ErrorDialogContext.Provider>
  )
}

export function useErrorDialog() {
  const context = useContext(ErrorDialogContext)
  if (!context) {
    throw new Error(
      'useErrorDialog deve ser utilizado dentro de um ErrorDialogProvider',
    )
  }
  return context
}
