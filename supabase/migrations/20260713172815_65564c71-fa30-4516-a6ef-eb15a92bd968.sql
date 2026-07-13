create table if not exists public.client_error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  message text,
  stack text,
  component_stack text,
  url text,
  route text,
  user_agent text,
  viewport text,
  release text,
  extra jsonb
);

create index if not exists client_error_logs_created_at_idx
  on public.client_error_logs (created_at desc);

grant insert on public.client_error_logs to anon, authenticated;
grant all on public.client_error_logs to service_role;

alter table public.client_error_logs enable row level security;

create policy "anyone can insert client errors"
  on public.client_error_logs
  for insert
  to anon, authenticated
  with check (true);