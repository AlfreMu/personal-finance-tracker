alter table public.investment_movements
  add column movement_id uuid;

alter table public.investment_movements
  add constraint investment_movements_movement_id_user_id_fkey
  foreign key (movement_id, user_id) references public.movements(id, user_id) on delete set null;

create index investment_movements_movement_user_idx
  on public.investment_movements (movement_id, user_id);

create or replace function public.create_recurring_expense(
  p_description text,
  p_category_id uuid,
  p_payment_method_id uuid,
  p_amount numeric,
  p_currency text,
  p_start_month date,
  p_end_month date default null,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  rule_id uuid;
  movement_id uuid;
  current_month date;
  last_month date;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  if extract(day from p_start_month) <> 1 then
    raise exception 'Start month must be the first day of a month';
  end if;

  if p_end_month is not null and extract(day from p_end_month) <> 1 then
    raise exception 'End month must be the first day of a month';
  end if;

  insert into public.recurring_rules (
    user_id,
    description,
    category_id,
    payment_method_id,
    current_amount,
    currency,
    frequency,
    start_month,
    end_month,
    is_active,
    note
  )
  values (
    current_user_id,
    trim(p_description),
    p_category_id,
    p_payment_method_id,
    p_amount,
    p_currency,
    'monthly',
    p_start_month,
    p_end_month,
    true,
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id into rule_id;

  insert into public.movements (
    user_id,
    occurred_on,
    type,
    nature,
    status,
    amount,
    currency,
    description,
    category_id,
    payment_method_id,
    note
  )
  values (
    current_user_id,
    p_start_month,
    'expense',
    'recurring_fixed',
    'confirmed',
    p_amount,
    p_currency,
    trim(p_description),
    p_category_id,
    p_payment_method_id,
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id into movement_id;

  insert into public.recurring_instances (
    user_id,
    recurring_rule_id,
    period_month,
    planned_amount,
    status,
    movement_id
  )
  values (
    current_user_id,
    rule_id,
    p_start_month,
    p_amount,
    'confirmed',
    movement_id
  );

  last_month := coalesce(p_end_month, (p_start_month + interval '11 months')::date);
  current_month := (p_start_month + interval '1 month')::date;

  while current_month <= last_month loop
    insert into public.recurring_instances (
      user_id,
      recurring_rule_id,
      period_month,
      planned_amount,
      status
    )
    values (
      current_user_id,
      rule_id,
      current_month,
      p_amount,
      'planned'
    )
    on conflict (recurring_rule_id, period_month) do nothing;

    current_month := (current_month + interval '1 month')::date;
  end loop;

  return rule_id;
end;
$$;

create or replace function public.create_installment_purchase(
  p_description text,
  p_category_id uuid,
  p_payment_method_id uuid,
  p_purchase_date date,
  p_first_period_month date,
  p_total_amount numeric,
  p_installment_amount numeric,
  p_installment_count integer,
  p_first_installment_number integer,
  p_currency text,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  purchase_id uuid;
  movement_id uuid;
  installment_id uuid;
  item_index integer;
  item_number integer;
  item_month date;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_total_amount <= 0 or p_installment_amount <= 0 then
    raise exception 'Amounts must be positive';
  end if;

  if p_installment_count <= 0 or p_first_installment_number <= 0 then
    raise exception 'Installment numbers must be positive';
  end if;

  if extract(day from p_first_period_month) <> 1 then
    raise exception 'First period month must be the first day of a month';
  end if;

  insert into public.installment_purchases (
    user_id,
    description,
    category_id,
    payment_method_id,
    purchase_date,
    first_period_month,
    total_amount,
    installment_amount,
    installment_count,
    first_installment_number,
    currency,
    status,
    note
  )
  values (
    current_user_id,
    trim(p_description),
    p_category_id,
    p_payment_method_id,
    p_purchase_date,
    p_first_period_month,
    p_total_amount,
    p_installment_amount,
    p_installment_count,
    p_first_installment_number,
    p_currency,
    'confirmed',
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id into purchase_id;

  for item_index in 0..(p_installment_count - 1) loop
    item_number := p_first_installment_number + item_index;
    item_month := (p_first_period_month + (item_index || ' months')::interval)::date;

    if item_index = 0 then
      insert into public.movements (
        user_id,
        occurred_on,
        type,
        nature,
        status,
        amount,
        currency,
        description,
        category_id,
        payment_method_id,
        note
      )
      values (
        current_user_id,
        p_purchase_date,
        'expense',
        'installment',
        'confirmed',
        p_installment_amount,
        p_currency,
        trim(p_description) || ' - cuota ' || item_number || ' de ' || p_installment_count,
        p_category_id,
        p_payment_method_id,
        nullif(trim(coalesce(p_note, '')), '')
      )
      returning id into movement_id;
    else
      movement_id := null;
    end if;

    insert into public.installments (
      user_id,
      installment_purchase_id,
      period_month,
      installment_number,
      amount,
      status,
      movement_id
    )
    values (
      current_user_id,
      purchase_id,
      item_month,
      item_number,
      p_installment_amount,
      case when item_index = 0 then 'confirmed' else 'planned' end,
      movement_id
    )
    returning id into installment_id;
  end loop;

  return purchase_id;
end;
$$;

create or replace function public.create_investment_activity(
  p_occurred_on date,
  p_type text,
  p_fund_id uuid default null,
  p_from_fund_id uuid default null,
  p_to_fund_id uuid default null,
  p_usd_amount numeric default null,
  p_ars_amount numeric default null,
  p_exchange_rate numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  investment_movement_id uuid;
  saving_movement_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_usd_amount is null or p_usd_amount <= 0 then
    raise exception 'USD amount must be positive';
  end if;

  if p_type in ('usd_purchase', 'fund_contribution') then
    if p_ars_amount is null or p_ars_amount <= 0 then
      raise exception 'ARS amount must be positive for contributions';
    end if;

    insert into public.movements (
      user_id,
      occurred_on,
      type,
      nature,
      status,
      amount,
      currency,
      description,
      note
    )
    values (
      current_user_id,
      p_occurred_on,
      'saving',
      'investment',
      'confirmed',
      p_ars_amount,
      'ARS',
      case when p_type = 'usd_purchase' then 'Compra USD' else 'Aporte fondo USD' end,
      nullif(trim(coalesce(p_note, '')), '')
    )
    returning id into saving_movement_id;
  end if;

  insert into public.investment_movements (
    user_id,
    occurred_on,
    type,
    fund_id,
    from_fund_id,
    to_fund_id,
    usd_amount,
    ars_amount,
    exchange_rate,
    status,
    note,
    movement_id
  )
  values (
    current_user_id,
    p_occurred_on,
    p_type,
    p_fund_id,
    p_from_fund_id,
    p_to_fund_id,
    p_usd_amount,
    p_ars_amount,
    p_exchange_rate,
    'confirmed',
    nullif(trim(coalesce(p_note, '')), ''),
    saving_movement_id
  )
  returning id into investment_movement_id;

  return investment_movement_id;
end;
$$;

grant execute on function public.create_recurring_expense(text, uuid, uuid, numeric, text, date, date, text) to authenticated;
grant execute on function public.create_installment_purchase(text, uuid, uuid, date, date, numeric, numeric, integer, integer, text, text) to authenticated;
grant execute on function public.create_investment_activity(date, text, uuid, uuid, uuid, numeric, numeric, numeric, text) to authenticated;
