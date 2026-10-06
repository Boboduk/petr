import type { ReactNode } from 'react';
import { DataGate } from '@/components/shared/DataGate';
import { ClientShell } from '@/components/client/ClientShell';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <DataGate role="client">
      <ClientShell>{children}</ClientShell>
    </DataGate>
  );
}
