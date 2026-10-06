import type { ReactNode } from 'react';
import { DataGate } from '@/components/shared/DataGate';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DataGate role="admin">
      <AdminShell>{children}</AdminShell>
    </DataGate>
  );
}
