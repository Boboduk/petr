import type { ReactNode } from 'react';
import { DataGate } from '@/components/shared/DataGate';
import { DriverShell } from '@/components/driver/DriverShell';

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <DataGate role="driver">
      <DriverShell>{children}</DriverShell>
    </DataGate>
  );
}
