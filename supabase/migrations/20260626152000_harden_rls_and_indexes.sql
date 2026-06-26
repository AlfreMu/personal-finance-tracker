create or replace function public.bootstrap_current_user_defaults()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  icbc_account_id uuid;
  mp_account_id uuid;
  cash_account_id uuid;
  card_method_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.accounts (user_id, name, kind, currency) values
    (current_user_id, 'ICBC pesos', 'bank', 'ARS'),
    (current_user_id, 'Mercado Pago', 'wallet', 'ARS'),
    (current_user_id, 'Efectivo', 'cash', 'ARS'),
    (current_user_id, 'Cuenta USD ICBC', 'bank', 'USD'),
    (current_user_id, 'Fondos de inversion USD', 'investment', 'USD')
  on conflict (user_id, name) do nothing;

  select id into icbc_account_id from public.accounts where user_id = current_user_id and name = 'ICBC pesos';
  select id into mp_account_id from public.accounts where user_id = current_user_id and name = 'Mercado Pago';
  select id into cash_account_id from public.accounts where user_id = current_user_id and name = 'Efectivo';

  insert into public.payment_methods (user_id, name, kind, default_account_id, is_default) values
    (current_user_id, 'Tarjeta ICBC', 'credit_card', icbc_account_id, true),
    (current_user_id, 'Mercado Pago', 'wallet', mp_account_id, false),
    (current_user_id, 'Debito o transferencia', 'bank_transfer', icbc_account_id, false),
    (current_user_id, 'Efectivo', 'cash', cash_account_id, false)
  on conflict (user_id, name) do update
    set default_account_id = excluded.default_account_id,
        is_default = public.payment_methods.is_default or excluded.is_default;

  select id into card_method_id from public.payment_methods where user_id = current_user_id and name = 'Tarjeta ICBC';

  insert into public.cards (user_id, payment_method_id, issuer, name, currency) values
    (current_user_id, card_method_id, 'ICBC', 'Tarjeta ICBC', 'ARS')
  on conflict (user_id, issuer, name) do nothing;

  insert into public.categories (user_id, name, scope, color, sort_order) values
    (current_user_id, 'Alimentacion', 'expense', '#0f766e', 10),
    (current_user_id, 'Transporte y moto', 'expense', '#0369a1', 20),
    (current_user_id, 'Deportes', 'expense', '#16a34a', 30),
    (current_user_id, 'Salud y cuidado personal', 'expense', '#db2777', 40),
    (current_user_id, 'Educacion', 'expense', '#7c3aed', 50),
    (current_user_id, 'Entretenimiento y suscripciones', 'expense', '#ea580c', 60),
    (current_user_id, 'Servicios e impuestos', 'expense', '#4b5563', 70),
    (current_user_id, 'Compras y equipamiento', 'expense', '#ca8a04', 80),
    (current_user_id, 'Regalos', 'expense', '#be123c', 90),
    (current_user_id, 'Mascotas', 'expense', '#65a30d', 100),
    (current_user_id, 'Tabaco', 'expense', '#57534e', 110),
    (current_user_id, 'Otros', 'all', '#78716c', 120)
  on conflict (user_id, lower(name), scope) where is_active do nothing;

  insert into public.income_sources (user_id, name, default_type) values
    (current_user_id, 'Trabajo', 'salary'),
    (current_user_id, 'Honorarios', 'fees'),
    (current_user_id, 'Aguinaldo', 'bonus'),
    (current_user_id, 'Venta', 'sale'),
    (current_user_id, 'Reintegro', 'reimbursement'),
    (current_user_id, 'Otro', 'other')
  on conflict (user_id, name) do nothing;

  insert into public.investment_funds (user_id, name, currency, provider) values
    (current_user_id, 'ALPHA RENTA FIJA GLOBAL', 'USD', 'ICBC'),
    (current_user_id, 'Alpha Renta Capital Dolar', 'USD', 'ICBC'),
    (current_user_id, 'Alpha Rta Corpo Dolar', 'USD', 'ICBC')
  on conflict (user_id, name) do nothing;
end;
$$;

revoke execute on function public.bootstrap_current_user_defaults() from public, anon;
grant execute on function public.bootstrap_current_user_defaults() to authenticated;

drop policy profiles_select_own on public.profiles;
drop policy profiles_insert_own on public.profiles;
drop policy profiles_update_own on public.profiles;
drop policy profiles_delete_own on public.profiles;

create policy profiles_select_own on public.profiles for select using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles for delete using ((select auth.uid()) = id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'accounts',
    'payment_methods',
    'cards',
    'categories',
    'income_sources',
    'imports',
    'movements',
    'recurring_rules',
    'recurring_instances',
    'installment_purchases',
    'installments',
    'investment_funds',
    'investment_movements'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);

    execute format('create policy %I on public.%I for select using ((select auth.uid()) = user_id)', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert with check ((select auth.uid()) = user_id)', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete using ((select auth.uid()) = user_id)', table_name || '_delete_own', table_name);
  end loop;
end;
$$;

create index payment_methods_default_account_user_idx on public.payment_methods (default_account_id, user_id);
create index cards_payment_method_user_idx on public.cards (payment_method_id, user_id);
create index movements_category_user_idx on public.movements (category_id, user_id);
create index movements_payment_method_user_idx on public.movements (payment_method_id, user_id);
create index movements_account_user_idx on public.movements (account_id, user_id);
create index movements_counterparty_account_user_idx on public.movements (counterparty_account_id, user_id);
create index movements_income_source_user_idx on public.movements (income_source_id, user_id);
create index movements_import_user_idx on public.movements (import_id, user_id);
create index recurring_rules_category_user_idx on public.recurring_rules (category_id, user_id);
create index recurring_rules_payment_method_user_idx on public.recurring_rules (payment_method_id, user_id);
create index recurring_instances_rule_user_idx on public.recurring_instances (recurring_rule_id, user_id);
create index recurring_instances_movement_user_idx on public.recurring_instances (movement_id, user_id);
create index installment_purchases_category_user_idx on public.installment_purchases (category_id, user_id);
create index installment_purchases_payment_method_user_idx on public.installment_purchases (payment_method_id, user_id);
create index installments_purchase_user_idx on public.installments (installment_purchase_id, user_id);
create index installments_movement_user_idx on public.installments (movement_id, user_id);
create index investment_movements_fund_user_idx on public.investment_movements (fund_id, user_id);
create index investment_movements_from_fund_user_idx on public.investment_movements (from_fund_id, user_id);
create index investment_movements_to_fund_user_idx on public.investment_movements (to_fund_id, user_id);
