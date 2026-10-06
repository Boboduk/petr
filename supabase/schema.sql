-- =====================================================================
-- «Водовоз» — схема БД для перехода с localStorage на Supabase (PostgreSQL).
-- Таблицы повторяют доменные типы из /types/index.ts.
-- Применение: supabase db push  или  вставить в SQL Editor.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "postgis"; -- поиск водителей в радиусе

create type user_role as enum ('client', 'driver', 'admin');
create type water_type as enum ('drinking', 'technical', 'household');
create type schedule_type as enum ('now', 'scheduled', 'regular');
create type order_status as enum (
  'new', 'searching', 'offers', 'driver_selected', 'en_route', 'arrived', 'delivering', 'completed', 'cancelled'
);
create type verification_status as enum ('verified', 'pending', 'rejected');
create type offer_kind as enum ('accept', 'counter');

-- Города (переключение тестового города / подключение новых)
create table cities (
  id text primary key,
  name text not null,
  region text,
  center geography(point) not null,
  zoom int not null default 13
);

-- Профили пользователей (auth.users — от Supabase Auth, телефон + SMS OTP)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  name text not null,
  phone text not null unique,
  email text,
  city_id text references cities(id),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  photo_url text,
  rating numeric(3, 2) not null default 5,
  rating_count int not null default 0,
  orders_count int not null default 0,
  experience_years int not null default 0,
  vehicle_brand text not null,
  vehicle_model text,
  vehicle_plate text not null,
  vehicle_year int,
  vehicle_photo_url text,
  tank_volume numeric(4, 1) not null check (tank_volume > 0),
  location geography(point),
  location_updated_at timestamptz,
  online boolean not null default false,
  verification verification_status not null default 'pending',
  blocked boolean not null default false,
  joined_at timestamptz not null default now()
);
create index drivers_location_idx on drivers using gist (location);
create index drivers_online_idx on drivers (online) where online and not blocked;

create table driver_documents (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  kind text not null, -- license | sts | sanpass | med
  file_url text,
  number text,
  status verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table regular_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  address text not null,
  location geography(point) not null,
  volume numeric(4, 1) not null,
  water_type water_type not null,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  weekday int not null check (weekday between 1 and 7),
  time_of_day time not null,
  price int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence order_number_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('order_number_seq'),
  client_id uuid not null references profiles(id),
  city_id text not null references cities(id),
  address text not null,
  location geography(point) not null,
  volume numeric(4, 1) not null check (volume > 0),
  water_type water_type not null,
  schedule_type schedule_type not null default 'now',
  scheduled_at timestamptz,
  plan_id uuid references regular_plans(id),
  client_price int not null check (client_price > 0),
  comment text not null default '',
  status order_status not null default 'new',
  driver_id uuid references drivers(id),
  final_price int,
  commission_rate numeric(4, 3) not null,
  eta_min int,
  route jsonb, -- [[lat,lng], ...] от сервиса маршрутизации
  en_route_at timestamptz,
  arrived_at timestamptz,
  delivering_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  cancelled_by text,
  rating int check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on orders (status);
create index orders_client_idx on orders (client_id, created_at desc);
create index orders_driver_idx on orders (driver_id, created_at desc);
create index orders_location_idx on orders using gist (location);

create table order_status_events (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  by_role text,
  at timestamptz not null default now()
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  driver_id uuid not null references drivers(id),
  price int not null check (price > 0),
  eta_min int not null,
  distance_km numeric(6, 2),
  kind offer_kind not null,
  created_at timestamptz not null default now(),
  unique (order_id, driver_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  sender text not null check (sender in ('client', 'driver', 'system')),
  text text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  order_id uuid references orders(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

create table settings (
  id int primary key default 1 check (id = 1),
  commission_rate numeric(4, 3) not null default 0.10
);
insert into settings default values;

-- Поиск ближайших свободных водителей для заявки (лента / рассылка)
create or replace function nearby_drivers(p_order uuid, p_radius_m int default 15000)
returns table (driver_id uuid, distance_m double precision)
language sql stable as $$
  select d.id, st_distance(d.location, o.location)
  from orders o
  join drivers d on d.online and not d.blocked and d.verification = 'verified' and d.tank_volume >= o.volume
  where o.id = p_order and st_dwithin(d.location, o.location, p_radius_m)
    and not exists (
      select 1 from orders a where a.driver_id = d.id and a.status in ('driver_selected', 'en_route', 'arrived', 'delivering')
    )
  order by 2;
$$;

-- RLS: клиент видит свои заказы, водитель — открытые рядом и назначенные ему, админ — всё
alter table orders enable row level security;
alter table offers enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

create policy "client own orders" on orders for all using (client_id = auth.uid());
create policy "driver open or assigned" on orders for select using (
  status in ('new', 'searching', 'offers')
  or driver_id in (select id from drivers where user_id = auth.uid())
);
create policy "admin all orders" on orders for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "own notifications" on notifications for all using (user_id = auth.uid());

-- Realtime: подписка UI на изменения (замена storage-событий между вкладками)
alter publication supabase_realtime add table orders, offers, messages, notifications, drivers;
