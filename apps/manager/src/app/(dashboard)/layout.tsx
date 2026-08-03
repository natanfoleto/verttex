import { ReactNode } from 'react'

import { AuthGuard } from '../../components/guards/auth-guard'
import { AdminLayout } from '../../components/layout/admin-layout'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AdminLayout>{children}</AdminLayout>
    </AuthGuard>
  )
}
