
create table public.exchange_rates (
    code text primary key,
    rate numeric not null,
    markup_percent numeric not null default 0,
    last_updated timestamptz default now()
);

grant select on public.exchange_rates to authenticated, anon;
grant all on public.exchange_rates to service_role;

create table public.exchange_rate_history (
    id uuid primary key default gen_random_uuid(),
    code text not null,
    rate numeric not null,
    created_at timestamptz default now()
);

grant select on public.exchange_rate_history to authenticated;
grant all on public.exchange_rate_history to service_role;

alter table public.exchange_rates enable row level security;
alter table public.exchange_rate_history enable row level security;

create policy "Public read exchange rates" on public.exchange_rates for select using (true);
create policy "Authenticated read history" on public.exchange_rate_history for select to authenticated using (true);

-- Function to update history automatically
create or replace function public.handle_exchange_rate_update()
returns trigger as $$
begin
    if (old.rate is distinct from new.rate) then
        insert into public.exchange_rate_history (code, rate)
        values (new.code, new.rate);
    end if;
    return new;
end;
$$ language plpgsql;

create trigger on_exchange_rate_update
    after update on public.exchange_rates
    for each row
    execute function public.handle_exchange_rate_update();

-- Initial seed with current values
insert into public.exchange_rates (code, rate, markup_percent) values
('USD', 1, 0),
('EUR', 0.90, 0),
('BRL', 5.50, 0),
('MXN', 20.5, -2), -- Start with -2% to "bajar el precio" as requested
('COP', 4500, -5), -- Start with -5% for Colombia
('ARS', 1000, 0),
('GBP', 0.78, 0),
('CAD', 1.35, 0),
('AUD', 1.50, 0),
('NZD', 1.65, 0),
('PEN', 3.75, 0),
('CLP', 940, 0),
('BOB', 6.9, 0),
('CRC', 520, 0),
('DOP', 59, 0),
('GTQ', 7.8, 0),
('HNL', 24.7, 0),
('NIO: 36.6', 36.6, 0),
('CUP', 24, 0),
('PYG', 7500, 0),
('UYU', 40, 0),
('HTG', 130, 0),
('VES', 750.00, 0),
('CHF', 0.88, 0),
('SEK', 10.6, 0),
('NOK', 10.7, 0),
('DKK', 6.9, 0),
('PLN', 4.0, 0),
('CZK', 23, 0),
('JPY', 150, 0),
('KRW', 1360, 0),
('CNY', 7.2, 0),
('INR', 83, 0),
('SGD', 1.34, 0),
('HKD', 7.8, 0),
('TWD', 32, 0)
on conflict (code) do nothing;
