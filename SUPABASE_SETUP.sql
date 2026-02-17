-- Create the bookmarks table
create table public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  url text not null,
  title text not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Set up Row Level Security (RLS)
alter table public.bookmarks enable row level security;

-- Policy: Users can see only their own bookmarks
create policy "Users can view their own bookmarks"
on public.bookmarks for select
using ( auth.uid() = user_id );

-- Policy: Users can insert their own bookmarks
create policy "Users can insert their own bookmarks"
on public.bookmarks for insert
with check ( auth.uid() = user_id );

-- Policy: Users can delete their own bookmarks
create policy "Users can delete their own bookmarks"
on public.bookmarks for delete
using ( auth.uid() = user_id );

-- Enable Realtime for the bookmarks table
alter publication supabase_realtime add table bookmarks;
