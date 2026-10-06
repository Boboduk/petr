'use client';

import { useState } from 'react';
import { Gauge, Percent, RotateCcw, Sparkles } from 'lucide-react';
import { AdminTitle } from '@/components/admin/AdminShell';
import { CitySwitcher } from '@/components/shared/CitySwitcher';
import { EconomicsCard } from '@/components/shared/Economics';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/Modal';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { useDB } from '@/hooks/useDB';
import { updateSettings } from '@/lib/store/actions';
import { resetDatabase } from '@/lib/store/store';

export default function AdminSettingsPage() {
  const db = useDB();
  const toast = useToast();
  const [reset, setReset] = useState(false);
  const pct = Math.round(db.settings.commissionRate * 100);

  return (
    <>
      <AdminTitle title="Настройки" subtitle="Экономика сервиса и демо-режим" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Percent className="size-4.5 text-brand-600" /> Комиссия сервиса
            </span>
          </SectionTitle>
          <div className="flex items-center gap-4">
            <input type="range" min={0} max={30} step={1} value={pct} onChange={(e) => updateSettings({ commissionRate: Number(e.target.value) / 100 })} className="flex-1 accent-brand-600" aria-label="Комиссия, %" />
            <div className="flex items-baseline gap-0.5 rounded-2xl bg-ink-50 px-4 py-2">
              <input
                type="number"
                min={0}
                max={50}
                value={pct}
                onChange={(e) => updateSettings({ commissionRate: Math.min(50, Math.max(0, Number(e.target.value))) / 100 })}
                className="w-10 bg-transparent text-right text-2xl font-extrabold outline-none tabular"
              />
              <span className="text-lg font-bold text-ink-400">%</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-400">Применяется к новым заказам в момент выбора водителя. По умолчанию — 10%.</p>
          <div className="mt-4 text-sm font-semibold text-ink-700">Пример: заказ на 2 700 ₽</div>
          <EconomicsCard className="mt-2" total={2700} rate={db.settings.commissionRate} highlight="service" />
        </Card>

        <Card className="p-5">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Gauge className="size-4.5 text-brand-600" /> Демо-режим
            </span>
          </SectionTitle>
          <div className="text-sm font-semibold text-ink-700">Скорость симуляции</div>
          <Segmented
            className="mt-2"
            value={String(db.settings.demoSpeed)}
            onChange={(v) => updateSettings({ demoSpeed: Number(v) })}
            options={[
              { value: '0.5', label: '0.5×' },
              { value: '1', label: '1× (норма)' },
              { value: '2', label: '2×' },
              { value: '4', label: '4×' },
            ]}
          />
          <p className="mt-2 text-xs text-ink-400">Как быстро демо-водители отвечают, едут и сливают воду. Для презентации удобно 1×–2×.</p>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-ink-50 p-4">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                <Sparkles className="size-4 text-aqua-500" /> Фоновая активность
              </div>
              <div className="text-xs text-ink-500">Тестовые клиенты создают заявки — лента водителя и дашборд «живые»</div>
            </div>
            <Switch checked={db.settings.ambientActivity} onChange={(v) => updateSettings({ ambientActivity: v })} label="Фоновая активность" />
          </div>
          <Button variant="outline" className="mt-5" icon={<RotateCcw className="size-4" />} onClick={() => setReset(true)}>
            Сбросить демо-данные
          </Button>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle>Тестовый город</SectionTitle>
          <CitySwitcher value={db.settings.cityId} />
          <p className="mt-3 text-xs text-ink-400">Чтобы добавить город, допишите его в data/cities.ts: координаты центра, масштаб и список улиц.</p>
        </Card>
      </div>
      <ConfirmModal
        open={reset}
        onClose={() => setReset(false)}
        danger
        title="Сбросить демо-данные?"
        text="Все заказы, водители и настройки вернутся к исходному состоянию."
        confirmText="Сбросить"
        onConfirm={() => {
          resetDatabase(db.settings.cityId);
          toast.success('Демо-данные пересозданы');
        }}
      />
    </>
  );
}
