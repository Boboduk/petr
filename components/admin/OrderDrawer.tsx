'use client';

import { useState } from 'react';
import { Ban, MapPin, Trash2, User } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Rating } from '@/components/ui/Stars';
import { useAction } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderTimeline } from '@/components/shared/OrderTimeline';
import { EconomicsCard } from '@/components/shared/Economics';
import { MapView } from '@/components/map/MapView';
import { useDB } from '@/hooks/useDB';
import { useNow } from '@/hooks/useNow';
import { driverPosition, findDriver, findOrder, findUser } from '@/lib/store/selectors';
import { adminSetStatus, cancelOrder, deleteOrder } from '@/lib/store/actions';
import { STATUS_FLOW, STATUS_LABEL, SCHEDULE_LABEL, WATER_TYPE_FULL } from '@/lib/status';
import { formatDateTime, formatMoney, formatVolume, maskPlate } from '@/lib/format';

/** Карточка заказа для администратора: клиент, водитель, предложения, статусы */
export function OrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const db = useDB();
  const now = useNow(1000);
  const run = useAction();
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null);
  const order = findOrder(db, orderId ?? undefined);
  if (!order) return null;
  const client = findUser(db, order.clientId);
  const driver = findDriver(db, order.driverId);
  const closed = order.status === 'completed' || order.status === 'cancelled';
  const markers = [
    { id: 'c', kind: 'client' as const, position: order.location },
    ...(driver && !closed ? [{ id: driver.id, kind: 'truck' as const, position: driverPosition(db, driver, now), active: true }] : []),
  ];

  return (
    <>
      <Modal
        open={!!orderId}
        onClose={onClose}
        size="xl"
        title={
          <div className="flex flex-wrap items-center gap-3">
            Заказ №{order.number} <StatusBadge status={order.status} />
            <span className="text-sm font-medium text-ink-400">{formatDateTime(order.createdAt)}</span>
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="h-56 overflow-hidden rounded-2xl">
              <MapView center={order.location} zoom={14} markers={markers} fitTo={markers.length > 1 ? markers.map((m) => m.position) : undefined} fitKey={order.status} zoomControl={false} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-ink-50 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-400">
                  <User className="size-3.5" /> Клиент
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={client?.name ?? '?'} color={client?.avatarColor} size={40} />
                  <div>
                    <div className="font-bold text-ink-900">{client?.name ?? 'Удалён'}</div>
                    <div className="text-sm text-ink-500">{client?.phone}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-ink-50 p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">Водитель</div>
                {driver ? (
                  <div className="flex items-center gap-3">
                    <Avatar name={driver.name} photo={driver.photo} color={driver.avatarColor} size={40} />
                    <div>
                      <div className="font-bold text-ink-900">{driver.name}</div>
                      <div className="text-sm text-ink-500">
                        <Rating value={driver.rating} />
                      </div>
                      <div className="text-xs text-ink-500">
                        {driver.vehicle.brand} · {maskPlate(driver.vehicle.plate)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-ink-500">Не назначен</div>
                )}
              </div>
            </div>
            <div className="divide-y divide-ink-100 rounded-2xl bg-white px-4 ring-1 ring-ink-100 text-sm">
              {[
                ['Адрес', order.address],
                ['Вода', `${formatVolume(order.volume)} · ${WATER_TYPE_FULL[order.waterType]}`],
                ['Тип заказа', order.scheduledAt ? `${SCHEDULE_LABEL[order.scheduleType]} · ${formatDateTime(order.scheduledAt)}` : SCHEDULE_LABEL.now],
                ['Цена клиента', formatMoney(order.clientPrice)],
                ['Цена сделки', formatMoney(order.finalPrice)],
                ['Комментарий', order.comment || '—'],
                ['Оценка', order.rating ? `${'★'.repeat(order.rating)}${order.review ? ` «${order.review}»` : ''}` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <span className="shrink-0 text-ink-500">{k}</span>
                  <span className="text-right font-semibold text-ink-900">{v}</span>
                </div>
              ))}
            </div>
            {order.offers.length > 0 && (
              <div>
                <div className="mb-2 font-bold text-ink-900">Предложения водителей ({order.offers.length})</div>
                <div className="space-y-1.5">
                  {order.offers.map((o) => {
                    const d = findDriver(db, o.driverId);
                    return (
                      <div key={o.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-sm">
                        <span className="font-semibold text-ink-800">
                          {d?.name} · {d?.vehicle.brand} {d && formatVolume(d.vehicle.tankVolume)}
                        </span>
                        <span className="text-ink-600">
                          ≈ {o.etaMin} мин · <b className="text-ink-900">{formatMoney(o.price)}</b>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {order.finalPrice && <EconomicsCard total={order.finalPrice} rate={order.commissionRate} highlight="service" />}
            <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-100">
              <div className="mb-3 font-bold text-ink-900">История статусов</div>
              <OrderTimeline order={order} compact />
            </div>
            <div className="space-y-2 rounded-2xl bg-ink-50 p-4">
              <Select label="Изменить статус" value={order.status} disabled={closed} onChange={(e) => run(() => adminSetStatus(order.id, e.target.value as OrderStatus), 'Статус обновлён')}>
                {[...STATUS_FLOW, 'cancelled' as OrderStatus].map((s, i) => (
                  <option key={s} value={s} disabled={s !== 'cancelled' && STATUS_FLOW.indexOf(s) < STATUS_FLOW.indexOf(order.status)}>
                    {s === 'cancelled' ? '9' : i + 1}. {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" disabled={closed} icon={<Ban className="size-4" />} onClick={() => setConfirm('cancel')}>
                  Отменить
                </Button>
                <Button variant="danger" className="flex-1" icon={<Trash2 className="size-4" />} onClick={() => setConfirm('delete')}>
                  Удалить
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-ink-400">
              <MapPin className="size-3.5 shrink-0" /> Смена статуса вручную запускает те же уведомления, что и действия водителя.
            </div>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        danger
        title={`Отменить заказ №${order.number}?`}
        text="Клиент и водитель получат уведомление об отмене."
        confirmText="Отменить заказ"
        onConfirm={() => run(() => cancelOrder(order.id, 'admin', 'Отменён администратором'), 'Заказ отменён')}
      />
      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        danger
        title={`Удалить заказ №${order.number}?`}
        text="Заказ будет удалён без возможности восстановления."
        confirmText="Удалить"
        onConfirm={() => {
          onClose();
          run(() => deleteOrder(order.id), 'Заказ удалён');
        }}
      />
    </>
  );
}
