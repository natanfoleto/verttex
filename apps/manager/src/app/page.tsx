'use client'

import { Button } from '@verttex/ui'
import * as React from 'react'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-4">Verttex Manager</h1>
      </div>
      <div className="flex flex-col gap-4 mt-8">
        <p className="text-lg">
          Aplicação de Backoffice inicializada com sucesso!
        </p>
        <Button
          variant="default"
          onClick={() => alert('Integração com @verttex/ui funcionando!')}
        >
          Testar Componente Compartilhado
        </Button>
      </div>
    </main>
  )
}
