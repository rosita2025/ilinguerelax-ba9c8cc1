-- Standardize local prices rounding
update public.digital_products 
set local_prices = (
  select jsonb_object_agg(key, round(value::numeric, 2))
  from jsonb_each(local_prices)
)
where local_prices is not null and local_prices != '{}'::jsonb;

-- Grant permissions if missing
grant select, insert, update, delete on public.digital_products to authenticated;
grant all on public.digital_products to service_role;
