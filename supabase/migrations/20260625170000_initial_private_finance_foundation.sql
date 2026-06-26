create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  base_currency text not null default 'ARS' check (base_currency in ('ARS', 'USD')),
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('bank', 'wallet', 'cash', 'investment', 'credit')),
  currency text not null check (currency in ('ARS', 'USD')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('credit_card', 'debit', 'wallet', 'cash', 'bank_transfer', 'other')),
  default_account_id uuid,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name),
  foreign key (default_account_id, user_id) references public.accounts(id, user_id) on delete set null
);

create unique index payment_methods_one_default_per_user
  on public.payment_methods (user_id)
  where is_default;

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payment_method_id uuid not null,
  issuer text not null,
  name text not null,
  currency text not null check (currency in ('ARS', 'USD')),
  closing_day integer check (closing_day between 1 and 31),
  due_day integer check (due_day between 1 and 31),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, issuer, name),
  foreign key (payment_method_id, user_id) references public.payment_methods(id, user_id) on delete restrict
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  scope text not null check (scope in ('expense', 'income', 'saving', 'all')),
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index categories_unique_active_name_scope
  on public.categories (user_id, lower(name), scope)
  where is_active;

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  default_type text not null default 'other',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_file_name text not null,
  source_hash text not null,
  status text not null default 'planned' check (status in ('planned', 'confirmed', 'pending_review', 'canceled')),
  dry_run boolean not null default true,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, source_hash)
);

create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  occurred_on date not null,
  type text not null check (type in ('income', 'expense', 'transfer', 'saving', 'adjustment', 'informational')),
  nature text not null check (nature in ('variable', 'recurring_fixed', 'installment', 'investment', 'internal_transfer', 'other')),
  status text not null default 'confirmed' check (status in ('planned', 'confirmed', 'pending_review', 'canceled')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('ARS', 'USD')),
  description text not null,
  category_id uuid,
  payment_method_id uuid,
  account_id uuid,
  counterparty_account_id uuid,
  income_source_id uuid,
  note text,
  import_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null,
  foreign key (payment_method_id, user_id) references public.payment_methods(id, user_id) on delete set null,
  foreign key (account_id, user_id) references public.accounts(id, user_id) on delete set null,
  foreign key (counterparty_account_id, user_id) references public.accounts(id, user_id) on delete set null,
  foreign key (income_source_id, user_id) references public.income_sources(id, user_id) on delete set null,
  foreign key (import_id, user_id) references public.imports(id, user_id) on delete set null,
  check (account_id is null or counterparty_account_id is null or account_id <> counterparty_account_id),
  check (type <> 'transfer' or (account_id is not null and counterparty_account_id is not null))
);

create table public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  category_id uuid,
  payment_method_id uuid,
  current_amount numeric(14, 2) not null check (current_amount > 0),
  currency text not null check (currency in ('ARS', 'USD')),
  frequency text not null default 'monthly' check (frequency in ('monthly')),
  start_month date not null check (extract(day from start_month) = 1),
  end_month date check (end_month is null or extract(day from end_month) = 1),
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null,
  foreign key (payment_method_id, user_id) references public.payment_methods(id, user_id) on delete set null,
  check (end_month is null or end_month >= start_month)
);

create table public.recurring_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recurring_rule_id uuid not null,
  period_month date not null check (extract(day from period_month) = 1),
  planned_amount numeric(14, 2) not null check (planned_amount > 0),
  status text not null default 'planned' check (status in ('planned', 'confirmed', 'pending_review', 'canceled')),
  movement_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (recurring_rule_id, period_month),
  foreign key (recurring_rule_id, user_id) references public.recurring_rules(id, user_id) on delete cascade,
  foreign key (movement_id, user_id) references public.movements(id, user_id) on delete set null
);

create table public.installment_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  category_id uuid,
  payment_method_id uuid,
  purchase_date date not null,
  first_period_month date not null check (extract(day from first_period_month) = 1),
  total_amount numeric(14, 2) not null check (total_amount > 0),
  installment_amount numeric(14, 2) not null check (installment_amount > 0),
  installment_count integer not null check (installment_count > 0),
  first_installment_number integer not null check (first_installment_number > 0),
  currency text not null check (currency in ('ARS', 'USD')),
  status text not null default 'planned' check (status in ('planned', 'confirmed', 'pending_review', 'canceled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null,
  foreign key (payment_method_id, user_id) references public.payment_methods(id, user_id) on delete set null
);

create table public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  installment_purchase_id uuid not null,
  period_month date not null check (extract(day from period_month) = 1),
  installment_number integer not null check (installment_number > 0),
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'planned' check (status in ('planned', 'confirmed', 'pending_review', 'canceled')),
  movement_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (installment_purchase_id, installment_number),
  foreign key (installment_purchase_id, user_id) references public.installment_purchases(id, user_id) on delete cascade,
  foreign key (movement_id, user_id) references public.movements(id, user_id) on delete set null
);

create table public.investment_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  currency text not null check (currency in ('ARS', 'USD')),
  provider text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.investment_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  occurred_on date not null,
  type text not null check (type in ('opening_balance', 'usd_purchase', 'fund_contribution', 'withdrawal', 'fund_transfer', 'valuation_adjustment')),
  fund_id uuid,
  from_fund_id uuid,
  to_fund_id uuid,
  usd_amount numeric(14, 2) check (usd_amount is null or usd_amount > 0),
  ars_amount numeric(14, 2) check (ars_amount is null or ars_amount > 0),
  exchange_rate numeric(14, 6) check (exchange_rate is null or exchange_rate > 0),
  status text not null default 'confirmed' check (status in ('planned', 'confirmed', 'pending_review', 'canceled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (fund_id, user_id) references public.investment_funds(id, user_id) on delete set null,
  foreign key (from_fund_id, user_id) references public.investment_funds(id, user_id) on delete set null,
  foreign key (to_fund_id, user_id) references public.investment_funds(id, user_id) on delete set null,
  check (from_fund_id is null or to_fund_id is null or from_fund_id <> to_fund_id),
  check (
    (type in ('opening_balance', 'valuation_adjustment') and fund_id is not null and from_fund_id is null and to_fund_id is null and usd_amount is not null and ars_amount is null)
    or (type in ('usd_purchase', 'fund_contribution') and fund_id is not null and from_fund_id is null and to_fund_id is null and usd_amount is not null)
    or (type = 'withdrawal' and fund_id is not null and from_fund_id is null and to_fund_id is null and usd_amount is not null)
    or (type = 'fund_transfer' and fund_id is null and from_fund_id is not null and to_fund_id is not null and usd_amount is not null)
  )
);

create index accounts_user_id_idx on public.accounts (user_id);
create index payment_methods_user_id_idx on public.payment_methods (user_id);
create index payment_methods_default_account_id_idx on public.payment_methods (default_account_id);
create index cards_user_id_idx on public.cards (user_id);
create index cards_payment_method_id_idx on public.cards (payment_method_id);
create index categories_user_id_idx on public.categories (user_id);
create index income_sources_user_id_idx on public.income_sources (user_id);
create index imports_user_id_status_idx on public.imports (user_id, status);
create index movements_user_id_occurred_on_idx on public.movements (user_id, occurred_on);
create index movements_user_id_status_idx on public.movements (user_id, status);
create index movements_category_id_idx on public.movements (category_id);
create index movements_payment_method_id_idx on public.movements (payment_method_id);
create index movements_account_id_idx on public.movements (account_id);
create index movements_counterparty_account_id_idx on public.movements (counterparty_account_id);
create index movements_income_source_id_idx on public.movements (income_source_id);
create index movements_import_id_idx on public.movements (import_id);
create index recurring_rules_user_id_idx on public.recurring_rules (user_id);
create index recurring_rules_category_id_idx on public.recurring_rules (category_id);
create index recurring_rules_payment_method_id_idx on public.recurring_rules (payment_method_id);
create index recurring_instances_user_id_period_month_idx on public.recurring_instances (user_id, period_month);
create index installment_purchases_user_id_idx on public.installment_purchases (user_id);
create index installment_purchases_category_id_idx on public.installment_purchases (category_id);
create index installment_purchases_payment_method_id_idx on public.installment_purchases (payment_method_id);
create index installments_user_id_period_month_idx on public.installments (user_id, period_month);
create index investment_funds_user_id_idx on public.investment_funds (user_id);
create index investment_movements_user_id_occurred_on_idx on public.investment_movements (user_id, occurred_on);
create index investment_movements_fund_id_idx on public.investment_movements (fund_id);
create index investment_movements_from_fund_id_idx on public.investment_movements (from_fund_id);
create index investment_movements_to_fund_id_idx on public.investment_movements (to_fund_id);

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create trigger set_payment_methods_updated_at before update on public.payment_methods for each row execute function public.set_updated_at();
create trigger set_cards_updated_at before update on public.cards for each row execute function public.set_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger set_income_sources_updated_at before update on public.income_sources for each row execute function public.set_updated_at();
create trigger set_imports_updated_at before update on public.imports for each row execute function public.set_updated_at();
create trigger set_movements_updated_at before update on public.movements for each row execute function public.set_updated_at();
create trigger set_recurring_rules_updated_at before update on public.recurring_rules for each row execute function public.set_updated_at();
create trigger set_recurring_instances_updated_at before update on public.recurring_instances for each row execute function public.set_updated_at();
create trigger set_installment_purchases_updated_at before update on public.installment_purchases for each row execute function public.set_updated_at();
create trigger set_installments_updated_at before update on public.installments for each row execute function public.set_updated_at();
create trigger set_investment_funds_updated_at before update on public.investment_funds for each row execute function public.set_updated_at();
create trigger set_investment_movements_updated_at before update on public.investment_movements for each row execute function public.set_updated_at();

create or replace function public.bootstrap_user_defaults(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  icbc_account_id uuid;
  mp_account_id uuid;
  cash_account_id uuid;
  card_method_id uuid;
begin
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  insert into public.accounts (user_id, name, kind, currency) values
    (target_user_id, 'ICBC pesos', 'bank', 'ARS'),
    (target_user_id, 'Mercado Pago', 'wallet', 'ARS'),
    (target_user_id, 'Efectivo', 'cash', 'ARS'),
    (target_user_id, 'Cuenta USD ICBC', 'bank', 'USD'),
    (target_user_id, 'Fondos de inversion USD', 'investment', 'USD')
  on conflict (user_id, name) do nothing;

  select id into icbc_account_id from public.accounts where user_id = target_user_id and name = 'ICBC pesos';
  select id into mp_account_id from public.accounts where user_id = target_user_id and name = 'Mercado Pago';
  select id into cash_account_id from public.accounts where user_id = target_user_id and name = 'Efectivo';
  insert into public.payment_methods (user_id, name, kind, default_account_id, is_default) values
    (target_user_id, 'Tarjeta ICBC', 'credit_card', icbc_account_id, true),
    (target_user_id, 'Mercado Pago', 'wallet', mp_account_id, false),
    (target_user_id, 'Debito o transferencia', 'bank_transfer', icbc_account_id, false),
    (target_user_id, 'Efectivo', 'cash', cash_account_id, false)
  on conflict (user_id, name) do update
    set default_account_id = excluded.default_account_id,
        is_default = public.payment_methods.is_default or excluded.is_default;

  select id into card_method_id from public.payment_methods where user_id = target_user_id and name = 'Tarjeta ICBC';

  insert into public.cards (user_id, payment_method_id, issuer, name, currency) values
    (target_user_id, card_method_id, 'ICBC', 'Tarjeta ICBC', 'ARS')
  on conflict (user_id, issuer, name) do nothing;

  insert into public.categories (user_id, name, scope, color, sort_order) values
    (target_user_id, 'Alimentacion', 'expense', '#0f766e', 10),
    (target_user_id, 'Transporte y moto', 'expense', '#0369a1', 20),
    (target_user_id, 'Deportes', 'expense', '#16a34a', 30),
    (target_user_id, 'Salud y cuidado personal', 'expense', '#db2777', 40),
    (target_user_id, 'Educacion', 'expense', '#7c3aed', 50),
    (target_user_id, 'Entretenimiento y suscripciones', 'expense', '#ea580c', 60),
    (target_user_id, 'Servicios e impuestos', 'expense', '#4b5563', 70),
    (target_user_id, 'Compras y equipamiento', 'expense', '#ca8a04', 80),
    (target_user_id, 'Regalos', 'expense', '#be123c', 90),
    (target_user_id, 'Mascotas', 'expense', '#65a30d', 100),
    (target_user_id, 'Tabaco', 'expense', '#57534e', 110),
    (target_user_id, 'Otros', 'all', '#78716c', 120)
  on conflict (user_id, lower(name), scope) where is_active do nothing;

  insert into public.income_sources (user_id, name, default_type) values
    (target_user_id, 'Trabajo', 'salary'),
    (target_user_id, 'Honorarios', 'fees'),
    (target_user_id, 'Aguinaldo', 'bonus'),
    (target_user_id, 'Venta', 'sale'),
    (target_user_id, 'Reintegro', 'reimbursement'),
    (target_user_id, 'Otro', 'other')
  on conflict (user_id, name) do nothing;

  insert into public.investment_funds (user_id, name, currency, provider) values
    (target_user_id, 'ALPHA RENTA FIJA GLOBAL', 'USD', 'ICBC'),
    (target_user_id, 'Alpha Renta Capital Dolar', 'USD', 'ICBC'),
    (target_user_id, 'Alpha Rta Corpo Dolar', 'USD', 'ICBC')
  on conflict (user_id, name) do nothing;
end;
$$;

create or replace function public.bootstrap_current_user_defaults()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform public.bootstrap_user_defaults(current_user_id);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;

  perform public.bootstrap_user_defaults(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.payment_methods enable row level security;
alter table public.cards enable row level security;
alter table public.categories enable row level security;
alter table public.income_sources enable row level security;
alter table public.imports enable row level security;
alter table public.movements enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.recurring_instances enable row level security;
alter table public.installment_purchases enable row level security;
alter table public.installments enable row level security;
alter table public.investment_funds enable row level security;
alter table public.investment_movements enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_delete_own on public.profiles for delete using (auth.uid() = id);

create policy accounts_select_own on public.accounts for select using (auth.uid() = user_id);
create policy accounts_insert_own on public.accounts for insert with check (auth.uid() = user_id);
create policy accounts_update_own on public.accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy accounts_delete_own on public.accounts for delete using (auth.uid() = user_id);

create policy payment_methods_select_own on public.payment_methods for select using (auth.uid() = user_id);
create policy payment_methods_insert_own on public.payment_methods for insert with check (auth.uid() = user_id);
create policy payment_methods_update_own on public.payment_methods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy payment_methods_delete_own on public.payment_methods for delete using (auth.uid() = user_id);

create policy cards_select_own on public.cards for select using (auth.uid() = user_id);
create policy cards_insert_own on public.cards for insert with check (auth.uid() = user_id);
create policy cards_update_own on public.cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy cards_delete_own on public.cards for delete using (auth.uid() = user_id);

create policy categories_select_own on public.categories for select using (auth.uid() = user_id);
create policy categories_insert_own on public.categories for insert with check (auth.uid() = user_id);
create policy categories_update_own on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy categories_delete_own on public.categories for delete using (auth.uid() = user_id);

create policy income_sources_select_own on public.income_sources for select using (auth.uid() = user_id);
create policy income_sources_insert_own on public.income_sources for insert with check (auth.uid() = user_id);
create policy income_sources_update_own on public.income_sources for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy income_sources_delete_own on public.income_sources for delete using (auth.uid() = user_id);

create policy imports_select_own on public.imports for select using (auth.uid() = user_id);
create policy imports_insert_own on public.imports for insert with check (auth.uid() = user_id);
create policy imports_update_own on public.imports for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy imports_delete_own on public.imports for delete using (auth.uid() = user_id);

create policy movements_select_own on public.movements for select using (auth.uid() = user_id);
create policy movements_insert_own on public.movements for insert with check (auth.uid() = user_id);
create policy movements_update_own on public.movements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy movements_delete_own on public.movements for delete using (auth.uid() = user_id);

create policy recurring_rules_select_own on public.recurring_rules for select using (auth.uid() = user_id);
create policy recurring_rules_insert_own on public.recurring_rules for insert with check (auth.uid() = user_id);
create policy recurring_rules_update_own on public.recurring_rules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy recurring_rules_delete_own on public.recurring_rules for delete using (auth.uid() = user_id);

create policy recurring_instances_select_own on public.recurring_instances for select using (auth.uid() = user_id);
create policy recurring_instances_insert_own on public.recurring_instances for insert with check (auth.uid() = user_id);
create policy recurring_instances_update_own on public.recurring_instances for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy recurring_instances_delete_own on public.recurring_instances for delete using (auth.uid() = user_id);

create policy installment_purchases_select_own on public.installment_purchases for select using (auth.uid() = user_id);
create policy installment_purchases_insert_own on public.installment_purchases for insert with check (auth.uid() = user_id);
create policy installment_purchases_update_own on public.installment_purchases for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy installment_purchases_delete_own on public.installment_purchases for delete using (auth.uid() = user_id);

create policy installments_select_own on public.installments for select using (auth.uid() = user_id);
create policy installments_insert_own on public.installments for insert with check (auth.uid() = user_id);
create policy installments_update_own on public.installments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy installments_delete_own on public.installments for delete using (auth.uid() = user_id);

create policy investment_funds_select_own on public.investment_funds for select using (auth.uid() = user_id);
create policy investment_funds_insert_own on public.investment_funds for insert with check (auth.uid() = user_id);
create policy investment_funds_update_own on public.investment_funds for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy investment_funds_delete_own on public.investment_funds for delete using (auth.uid() = user_id);

create policy investment_movements_select_own on public.investment_movements for select using (auth.uid() = user_id);
create policy investment_movements_insert_own on public.investment_movements for insert with check (auth.uid() = user_id);
create policy investment_movements_update_own on public.investment_movements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy investment_movements_delete_own on public.investment_movements for delete using (auth.uid() = user_id);

revoke execute on function public.bootstrap_user_defaults(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.bootstrap_current_user_defaults() to authenticated;
