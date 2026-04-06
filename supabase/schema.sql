-- households table
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Home',
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references households(id),
  display_name text not null,
  avatar_letter text generated always as (upper(left(display_name, 1))) stored,
  avatar_color text default '#B5D4F4',
  created_at timestamptz default now()
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  icon text default '📦',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- items
create table items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  tracking_mode text not null check (tracking_mode in ('depletion', 'cycle')),
  unit text not null default 'units',
  -- depletion fields
  current_stock numeric,
  usage_rate numeric, -- per day
  reorder_threshold_days int default 5,
  -- cycle fields
  cycle_days int,
  last_purchase_date date,
  -- purchase info
  product_url text,
  last_price numeric,
  default_buyer uuid references profiles(id),
  alternate_buyer boolean default false,
  next_buyer uuid references profiles(id),
  -- order state
  is_ordered boolean default false,
  ordered_quantity numeric,
  ordered_at timestamptz,
  -- meta
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- check_ins
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  user_id uuid not null references profiles(id),
  stock_amount numeric,
  note text,
  created_at timestamptz default now()
);

-- purchases
create table purchases (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  buyer_id uuid references profiles(id),
  quantity numeric,
  price numeric,
  ordered_at timestamptz default now(),
  arrived_at timestamptz,
  created_at timestamptz default now()
);

-- RLS policies (enable for all tables)
alter table households enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table check_ins enable row level security;
alter table purchases enable row level security;

-- Household members can see their household
create policy "household members" on households for all using (
  id in (select household_id from profiles where id = auth.uid())
);
create policy "own profile" on profiles for all using (id = auth.uid());
create policy "household profiles" on profiles for select using (
  household_id in (select household_id from profiles where id = auth.uid())
);
create policy "household categories" on categories for all using (
  household_id in (select household_id from profiles where id = auth.uid())
);
create policy "household items" on items for all using (
  household_id in (select household_id from profiles where id = auth.uid())
);
create policy "household check_ins" on check_ins for all using (
  item_id in (select id from items where household_id in (select household_id from profiles where id = auth.uid()))
);
create policy "household purchases" on purchases for all using (
  item_id in (select id from items where household_id in (select household_id from profiles where id = auth.uid()))
);
