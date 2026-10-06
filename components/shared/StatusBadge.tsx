import type { OrderStatus } from '@/types';
import { Badge, type Tone } from '@/components/ui/Badge';
import { STATUS_SHORT, STATUS_TONE } from '@/lib/status';

const map: Record<string, Tone> = { neutral: 'neutral', info: 'info', progress: 'progress', success: 'success', danger: 'danger' };

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge tone={map[STATUS_TONE[status]]} dot className={className}>
      {STATUS_SHORT[status]}
    </Badge>
  );
}
