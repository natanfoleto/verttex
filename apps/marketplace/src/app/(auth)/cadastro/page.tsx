'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function CustomerRegisterPage() {
  useEffect(() => {
    redirect('/?auth=register')
  }, [])

  return null
}
