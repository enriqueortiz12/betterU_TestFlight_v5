create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id text not null,
  original_transaction_id text not null,
  latest_receipt text not null,
  status text not null,
  purchase_date text not null,
  end_date text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Create policies
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role'); 