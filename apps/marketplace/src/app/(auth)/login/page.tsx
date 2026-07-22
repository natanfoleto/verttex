'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function CustomerLoginPage() {
  useEffect(() => {
    redirect('/?auth=login')
  }, [])

  return null
}
