-- Create personal_records table
create table if not exists personal_records (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    exercise text not null,
    current_value numeric not null,
    target_value numeric not null,
    unit text not null check (unit in ('kg', 'lbs')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table personal_records enable row level security;

create policy "Users can view their own records"
    on personal_records for select
    using (auth.uid() = user_id);

create policy "Users can insert their own records"
    on personal_records for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own records"
    on personal_records for update
    using (auth.uid() = user_id);

create policy "Users can delete their own records"
    on personal_records for delete
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger update_personal_records_updated_at
    before update on personal_records
    for each row
    execute function update_updated_at_column(); 