create or replace function public.validate_owned_category_id(p_category_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_category_id is not null and not exists (
    select 1 from public.categories where id = p_category_id and user_id = p_user_id and is_active
  ) then
    raise exception 'Invalid category';
  end if;
end;
$$;

create or replace function public.validate_owned_payment_method_id(p_payment_method_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_payment_method_id is not null and not exists (
    select 1 from public.payment_methods where id = p_payment_method_id and user_id = p_user_id and is_active
  ) then
    raise exception 'Invalid payment method';
  end if;
end;
$$;

create or replace function public.validate_owned_income_source_id(p_income_source_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_income_source_id is not null and not exists (
    select 1 from public.income_sources where id = p_income_source_id and user_id = p_user_id and is_active
  ) then
    raise exception 'Invalid income source';
  end if;
end;
$$;

create or replace function public.validate_owned_fund_id(p_fund_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_fund_id is not null and not exists (
    select 1 from public.investment_funds where id = p_fund_id and user_id = p_user_id and is_active
  ) then
    raise exception 'Invalid investment fund';
  end if;
end;
$$;

create or replace function public.update_simple_movement(
  p_movement_id uuid,
  p_occurred_on date,
  p_amount numeric,
  p_description text,
  p_category_id uuid default null,
  p_payment_method_id uuid default null,
  p_income_source_id uuid default null,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing public.movements%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select * into existing
  from public.movements
  where id = p_movement_id and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Movement not found';
  end if;

  if exists (select 1 from public.installments where movement_id = p_movement_id and user_id = current_user_id)
    or exists (select 1 from public.recurring_instances where movement_id = p_movement_id and user_id = current_user_id)
    or exists (select 1 from public.investment_movements where movement_id = p_movement_id and user_id = current_user_id)
  then
    raise exception 'Linked movements must be edited from their source';
  end if;

  perform public.validate_owned_category_id(p_category_id, current_user_id);
  perform public.validate_owned_payment_method_id(p_payment_method_id, current_user_id);
  perform public.validate_owned_income_source_id(p_income_source_id, current_user_id);

  update public.movements
  set occurred_on = p_occurred_on,
      amount = p_amount,
      description = trim(p_description),
      category_id = case when existing.type = 'expense' then p_category_id else null end,
      payment_method_id = case when existing.type = 'expense' then p_payment_method_id else null end,
      income_source_id = case when existing.type = 'income' then p_income_source_id else null end,
      note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_movement_id and user_id = current_user_id;
end;
$$;

create or replace function public.delete_simple_movement(p_movement_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists (select 1 from public.installments where movement_id = p_movement_id and user_id = current_user_id)
    or exists (select 1 from public.recurring_instances where movement_id = p_movement_id and user_id = current_user_id)
    or exists (select 1 from public.investment_movements where movement_id = p_movement_id and user_id = current_user_id)
  then
    raise exception 'Linked movements must be edited from their source';
  end if;

  delete from public.movements
  where id = p_movement_id and user_id = current_user_id;

  if not found then
    raise exception 'Movement not found';
  end if;
end;
$$;

create or replace function public.update_installment_instance(
  p_installment_id uuid,
  p_scope text,
  p_period_month date,
  p_amount numeric,
  p_description text,
  p_category_id uuid,
  p_payment_method_id uuid,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target public.installments%rowtype;
  purchase public.installment_purchases%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if p_scope not in ('single', 'following') then raise exception 'Invalid scope'; end if;
  if extract(day from p_period_month) <> 1 then raise exception 'Period month must be first day of month'; end if;

  select * into target from public.installments where id = p_installment_id and user_id = current_user_id for update;
  if not found then raise exception 'Installment not found'; end if;

  select * into purchase from public.installment_purchases where id = target.installment_purchase_id and user_id = current_user_id for update;
  if not found then raise exception 'Installment purchase not found'; end if;

  perform public.validate_owned_category_id(p_category_id, current_user_id);
  perform public.validate_owned_payment_method_id(p_payment_method_id, current_user_id);

  if target.status = 'confirmed' and p_scope <> 'single' then
    raise exception 'Confirmed installments can only be edited individually';
  end if;

  if target.status = 'confirmed' then
    update public.installments
    set period_month = p_period_month,
        amount = p_amount
    where id = target.id and user_id = current_user_id;

    if target.movement_id is not null then
      update public.movements
      set occurred_on = p_period_month,
          amount = p_amount,
          description = trim(p_description),
          category_id = p_category_id,
          payment_method_id = p_payment_method_id,
          note = nullif(trim(coalesce(p_note, '')), '')
      where id = target.movement_id and user_id = current_user_id;
    end if;
  elsif p_scope = 'single' then
    update public.installments
    set period_month = p_period_month,
        amount = p_amount
    where id = target.id and user_id = current_user_id and status <> 'confirmed';
  else
    update public.installment_purchases
    set description = trim(p_description),
        category_id = p_category_id,
        payment_method_id = p_payment_method_id,
        installment_amount = p_amount,
        note = nullif(trim(coalesce(p_note, '')), '')
    where id = purchase.id and user_id = current_user_id;

    update public.installments
    set amount = p_amount
    where installment_purchase_id = purchase.id
      and user_id = current_user_id
      and status <> 'confirmed'
      and installment_number >= target.installment_number;
  end if;
end;
$$;

create or replace function public.cancel_installment_purchase_from(p_installment_purchase_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  update public.installments
  set status = 'canceled'
  where installment_purchase_id = p_installment_purchase_id
    and user_id = current_user_id
    and status <> 'confirmed';

  update public.installment_purchases
  set status = 'canceled'
  where id = p_installment_purchase_id and user_id = current_user_id;

  if not found then raise exception 'Installment purchase not found'; end if;
end;
$$;

create or replace function public.update_recurring_instance(
  p_recurring_instance_id uuid,
  p_scope text,
  p_period_month date,
  p_amount numeric,
  p_description text,
  p_category_id uuid,
  p_payment_method_id uuid,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target public.recurring_instances%rowtype;
  rule_row public.recurring_rules%rowtype;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  if p_scope not in ('single', 'following') then raise exception 'Invalid scope'; end if;
  if extract(day from p_period_month) <> 1 then raise exception 'Period month must be first day of month'; end if;

  select * into target from public.recurring_instances where id = p_recurring_instance_id and user_id = current_user_id for update;
  if not found then raise exception 'Recurring instance not found'; end if;

  select * into rule_row from public.recurring_rules where id = target.recurring_rule_id and user_id = current_user_id for update;
  if not found then raise exception 'Recurring rule not found'; end if;

  perform public.validate_owned_category_id(p_category_id, current_user_id);
  perform public.validate_owned_payment_method_id(p_payment_method_id, current_user_id);

  if target.status = 'confirmed' and p_scope <> 'single' then
    raise exception 'Confirmed recurring instances can only be edited individually';
  end if;

  if p_scope = 'single' then
    update public.recurring_instances
    set period_month = p_period_month,
        planned_amount = p_amount
    where id = target.id and user_id = current_user_id;

    if target.movement_id is not null then
      update public.movements
      set occurred_on = p_period_month,
          amount = p_amount,
          description = trim(p_description),
          category_id = p_category_id,
          payment_method_id = p_payment_method_id,
          note = nullif(trim(coalesce(p_note, '')), '')
      where id = target.movement_id and user_id = current_user_id;
    end if;
  else
    update public.recurring_rules
    set description = trim(p_description),
        category_id = p_category_id,
        payment_method_id = p_payment_method_id,
        current_amount = p_amount,
        note = nullif(trim(coalesce(p_note, '')), '')
    where id = rule_row.id and user_id = current_user_id;

    update public.recurring_instances
    set planned_amount = p_amount
    where recurring_rule_id = rule_row.id
      and user_id = current_user_id
      and status <> 'confirmed'
      and period_month >= target.period_month;
  end if;
end;
$$;

create or replace function public.deactivate_recurring_rule_from(p_recurring_rule_id uuid, p_from_month date)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if extract(day from p_from_month) <> 1 then raise exception 'From month must be first day of month'; end if;

  update public.recurring_instances
  set status = 'canceled'
  where recurring_rule_id = p_recurring_rule_id
    and user_id = current_user_id
    and status <> 'confirmed'
    and period_month >= p_from_month;

  update public.recurring_rules
  set is_active = false,
      end_month = (p_from_month - interval '1 month')::date
  where id = p_recurring_rule_id and user_id = current_user_id;

  if not found then raise exception 'Recurring rule not found'; end if;
end;
$$;

create or replace function public.update_investment_activity(
  p_investment_movement_id uuid,
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
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing public.investment_movements%rowtype;
  linked_movement_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_usd_amount is null or p_usd_amount <= 0 then raise exception 'USD amount must be positive'; end if;

  select * into existing from public.investment_movements where id = p_investment_movement_id and user_id = current_user_id for update;
  if not found then raise exception 'Investment movement not found'; end if;

  perform public.validate_owned_fund_id(p_fund_id, current_user_id);
  perform public.validate_owned_fund_id(p_from_fund_id, current_user_id);
  perform public.validate_owned_fund_id(p_to_fund_id, current_user_id);

  if p_type = 'fund_transfer' and (p_from_fund_id is null or p_to_fund_id is null or p_from_fund_id = p_to_fund_id) then
    raise exception 'Transfer requires different origin and destination funds';
  end if;

  if p_type <> 'fund_transfer' and p_fund_id is null then
    raise exception 'Fund is required';
  end if;

  linked_movement_id := existing.movement_id;

  if p_type in ('usd_purchase', 'fund_contribution') then
    if p_ars_amount is null or p_ars_amount <= 0 then raise exception 'ARS amount must be positive for contributions'; end if;

    if linked_movement_id is null then
      insert into public.movements (user_id, occurred_on, type, nature, status, amount, currency, description, note)
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
      returning id into linked_movement_id;
    else
      update public.movements
      set occurred_on = p_occurred_on,
          amount = p_ars_amount,
          description = case when p_type = 'usd_purchase' then 'Compra USD' else 'Aporte fondo USD' end,
          note = nullif(trim(coalesce(p_note, '')), '')
      where id = linked_movement_id and user_id = current_user_id;
    end if;
  else
    if linked_movement_id is not null then
      delete from public.movements where id = linked_movement_id and user_id = current_user_id;
      linked_movement_id := null;
    end if;
  end if;

  update public.investment_movements
  set occurred_on = p_occurred_on,
      type = p_type,
      fund_id = case when p_type = 'fund_transfer' then null else p_fund_id end,
      from_fund_id = case when p_type = 'fund_transfer' then p_from_fund_id else null end,
      to_fund_id = case when p_type = 'fund_transfer' then p_to_fund_id else null end,
      usd_amount = p_usd_amount,
      ars_amount = case when p_type in ('usd_purchase', 'fund_contribution') then p_ars_amount else null end,
      exchange_rate = p_exchange_rate,
      note = nullif(trim(coalesce(p_note, '')), ''),
      movement_id = linked_movement_id
  where id = p_investment_movement_id and user_id = current_user_id;
end;
$$;

create or replace function public.delete_investment_activity(p_investment_movement_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  linked_movement_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;

  select movement_id into linked_movement_id
  from public.investment_movements
  where id = p_investment_movement_id and user_id = current_user_id
  for update;

  if not found then raise exception 'Investment movement not found'; end if;

  delete from public.investment_movements
  where id = p_investment_movement_id and user_id = current_user_id;

  if linked_movement_id is not null then
    delete from public.movements where id = linked_movement_id and user_id = current_user_id;
  end if;
end;
$$;

grant execute on function public.update_simple_movement(uuid, date, numeric, text, uuid, uuid, uuid, text) to authenticated;
grant execute on function public.delete_simple_movement(uuid) to authenticated;
grant execute on function public.update_installment_instance(uuid, text, date, numeric, text, uuid, uuid, text) to authenticated;
grant execute on function public.cancel_installment_purchase_from(uuid) to authenticated;
grant execute on function public.update_recurring_instance(uuid, text, date, numeric, text, uuid, uuid, text) to authenticated;
grant execute on function public.deactivate_recurring_rule_from(uuid, date) to authenticated;
grant execute on function public.update_investment_activity(uuid, date, text, uuid, uuid, uuid, numeric, numeric, numeric, text) to authenticated;
grant execute on function public.delete_investment_activity(uuid) to authenticated;
