-- Create a profiles table to store user profile data
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  display_name text,
  billing_address text,
  country text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create security policies to control access
alter table profiles enable row level security;

-- Create a policy that allows users to view and update only their own profile
create policy "Users can view and update their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Create a trigger that automatically creates a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create a profile when a new user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 