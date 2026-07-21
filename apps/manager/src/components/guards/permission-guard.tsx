'use client'

import { Action, Subject } from '@verttex/auth'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

import { useAuth } from '../../providers/auth-provider'

interface PermissionGuardProps {
  action: Action
  subject: Subject
  children: ReactNode
}

export function PermissionGuard({
  action,
  subject,
  children,
}: PermissionGuardProps) {
  const { ability, isLoading } = useAuth()
  const router = useRouter()

  const canAccess = ability.can(action, subject)

  useEffect(() => {
    if (!isLoading && !canAccess) {
      router.push('/acesso-negado')
    }
  }, [isLoading, canAccess, router])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-100" />
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return <>{children}</>
}
