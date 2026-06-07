-- Parking SV Supabase RLS baseline.
-- This migration is conservative: it uses the email claim from Supabase Auth so the
-- current app can keep matching auth users with the existing public.users table.

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
  select nullif(lower(auth.jwt() ->> 'email'), '');
$$;

-- users
alter table public.users enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users
for select
using (lower(email) = public.current_auth_email());

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using (lower(email) = public.current_auth_email())
with check (lower(email) = public.current_auth_email());

-- parkings
alter table public.parkings enable row level security;

drop policy if exists "Public can read active parkings" on public.parkings;
create policy "Public can read active parkings"
on public.parkings
for select
using (
  status = 'activo'
  or exists (
    select 1
    from public.users u
    where u.id = owner_id
      and lower(u.email) = public.current_auth_email()
  )
);

drop policy if exists "Owners can insert parkings" on public.parkings;
create policy "Owners can insert parkings"
on public.parkings
for insert
with check (
  exists (
    select 1
    from public.users u
    where u.id = owner_id
      and lower(u.email) = public.current_auth_email()
  )
);

drop policy if exists "Owners can update parkings" on public.parkings;
create policy "Owners can update parkings"
on public.parkings
for update
using (
  exists (
    select 1
    from public.users u
    where u.id = owner_id
      and lower(u.email) = public.current_auth_email()
  )
)
with check (
  exists (
    select 1
    from public.users u
    where u.id = owner_id
      and lower(u.email) = public.current_auth_email()
  )
);

drop policy if exists "Owners can delete parkings" on public.parkings;
create policy "Owners can delete parkings"
on public.parkings
for delete
using (
  exists (
    select 1
    from public.users u
    where u.id = owner_id
      and lower(u.email) = public.current_auth_email()
  )
);

-- locations
alter table public.locations enable row level security;

drop policy if exists "Anyone can read locations for visible parkings" on public.locations;
create policy "Anyone can read locations for visible parkings"
on public.locations
for select
using (
  exists (
    select 1
    from public.parkings p
    left join public.users u on u.id = p.owner_id
    where p.location_id = id
      and (
        p.status = 'activo'
        or lower(u.email) = public.current_auth_email()
      )
  )
);

drop policy if exists "Owners can write locations" on public.locations;
create policy "Owners can write locations"
on public.locations
for insert
with check (true);

drop policy if exists "Owners can update locations" on public.locations;
create policy "Owners can update locations"
on public.locations
for update
using (
  exists (
    select 1
    from public.parkings p
    join public.users u on u.id = p.owner_id
    where p.location_id = id
      and lower(u.email) = public.current_auth_email()
  )
)
with check (
  exists (
    select 1
    from public.parkings p
    join public.users u on u.id = p.owner_id
    where p.location_id = id
      and lower(u.email) = public.current_auth_email()
  )
);

drop policy if exists "Owners can delete locations" on public.locations;
create policy "Owners can delete locations"
on public.locations
for delete
using (
  exists (
    select 1
    from public.parkings p
    join public.users u on u.id = p.owner_id
    where p.location_id = id
      and lower(u.email) = public.current_auth_email()
  )
);

-- parking children
do $$
begin
  if to_regclass('public.parking_images') is not null then
    execute 'alter table public.parking_images enable row level security';
    execute 'drop policy if exists "Anyone can read parking images for visible parkings" on public.parking_images';
    execute $policy$
      create policy "Anyone can read parking images for visible parkings"
      on public.parking_images
      for select
      using (
        exists (
          select 1
          from public.parkings p
          left join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and (
              p.status = ''activo''
              or lower(u.email) = public.current_auth_email()
            )
        )
      )
    $policy$;
    execute 'drop policy if exists "Owners can write parking images" on public.parking_images';
    execute $policy$
      create policy "Owners can write parking images"
      on public.parking_images
      for all
      using (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.parking_capacities') is not null then
    execute 'alter table public.parking_capacities enable row level security';
    execute 'drop policy if exists "Anyone can read parking capacities for visible parkings" on public.parking_capacities';
    execute $policy$
      create policy "Anyone can read parking capacities for visible parkings"
      on public.parking_capacities
      for select
      using (
        exists (
          select 1
          from public.parkings p
          left join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and (
              p.status = ''activo''
              or lower(u.email) = public.current_auth_email()
            )
        )
      )
    $policy$;
    execute 'drop policy if exists "Owners can write parking capacities" on public.parking_capacities';
    execute $policy$
      create policy "Owners can write parking capacities"
      on public.parking_capacities
      for all
      using (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.parking_vehicle_capacities') is not null then
    execute 'alter table public.parking_vehicle_capacities enable row level security';
    execute 'drop policy if exists "Anyone can read parking vehicle capacities for visible parkings" on public.parking_vehicle_capacities';
    execute $policy$
      create policy "Anyone can read parking vehicle capacities for visible parkings"
      on public.parking_vehicle_capacities
      for select
      using (
        exists (
          select 1
          from public.parkings p
          left join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and (
              p.status = ''activo''
              or lower(u.email) = public.current_auth_email()
            )
        )
      )
    $policy$;
    execute 'drop policy if exists "Owners can write parking vehicle capacities" on public.parking_vehicle_capacities';
    execute $policy$
      create policy "Owners can write parking vehicle capacities"
      on public.parking_vehicle_capacities
      for all
      using (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.parking_fees') is not null then
    execute 'alter table public.parking_fees enable row level security';
    execute 'drop policy if exists "Anyone can read parking fees for visible parkings" on public.parking_fees';
    execute $policy$
      create policy "Anyone can read parking fees for visible parkings"
      on public.parking_fees
      for select
      using (
        exists (
          select 1
          from public.parkings p
          left join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and (
              p.status = ''activo''
              or lower(u.email) = public.current_auth_email()
            )
        )
      )
    $policy$;
    execute 'drop policy if exists "Owners can write parking fees" on public.parking_fees';
    execute $policy$
      create policy "Owners can write parking fees"
      on public.parking_fees
      for all
      using (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.parking_services') is not null then
    execute 'alter table public.parking_services enable row level security';
    execute 'drop policy if exists "Anyone can read parking services for visible parkings" on public.parking_services';
    execute $policy$
      create policy "Anyone can read parking services for visible parkings"
      on public.parking_services
      for select
      using (
        exists (
          select 1
          from public.parkings p
          left join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and (
              p.status = ''activo''
              or lower(u.email) = public.current_auth_email()
            )
        )
      )
    $policy$;
    execute 'drop policy if exists "Owners can write parking services" on public.parking_services';
    execute $policy$
      create policy "Owners can write parking services"
      on public.parking_services
      for all
      using (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.parking_restrictions') is not null then
    execute 'alter table public.parking_restrictions enable row level security';
    execute 'drop policy if exists "Anyone can read parking restrictions for visible parkings" on public.parking_restrictions';
    execute $policy$
      create policy "Anyone can read parking restrictions for visible parkings"
      on public.parking_restrictions
      for select
      using (
        exists (
          select 1
          from public.parkings p
          left join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and (
              p.status = ''activo''
              or lower(u.email) = public.current_auth_email()
            )
        )
      )
    $policy$;
    execute 'drop policy if exists "Owners can write parking restrictions" on public.parking_restrictions';
    execute $policy$
      create policy "Owners can write parking restrictions"
      on public.parking_restrictions
      for all
      using (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.parking_restriction_items') is not null then
    execute 'alter table public.parking_restriction_items enable row level security';
    execute 'drop policy if exists "Anyone can read parking restriction items for visible parkings" on public.parking_restriction_items';
    execute $policy$
      create policy "Anyone can read parking restriction items for visible parkings"
      on public.parking_restriction_items
      for select
      using (
        exists (
          select 1
          from public.parkings p
          left join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and (
              p.status = ''activo''
              or lower(u.email) = public.current_auth_email()
            )
        )
      )
    $policy$;
    execute 'drop policy if exists "Owners can write parking restriction items" on public.parking_restriction_items';
    execute $policy$
      create policy "Owners can write parking restriction items"
      on public.parking_restriction_items
      for all
      using (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.favorites') is not null then
    execute 'alter table public.favorites enable row level security';
    execute 'drop policy if exists "Users can read own favorites" on public.favorites';
    execute $policy$
      create policy "Users can read own favorites"
      on public.favorites
      for select
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
    execute 'drop policy if exists "Users can write own favorites" on public.favorites';
    execute $policy$
      create policy "Users can write own favorites"
      on public.favorites
      for all
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.favorite_folders') is not null then
    execute 'alter table public.favorite_folders enable row level security';
    execute 'drop policy if exists "Users can read own favorite folders" on public.favorite_folders';
    execute $policy$
      create policy "Users can read own favorite folders"
      on public.favorite_folders
      for select
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
    execute 'drop policy if exists "Users can write own favorite folders" on public.favorite_folders';
    execute $policy$
      create policy "Users can write own favorite folders"
      on public.favorite_folders
      for all
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.reservations') is not null then
    execute 'alter table public.reservations enable row level security';
    execute 'drop policy if exists "Users can read own or owned reservations" on public.reservations';
    execute $policy$
      create policy "Users can read own or owned reservations"
      on public.reservations
      for select
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
        or exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
    execute 'drop policy if exists "Users can write own reservations" on public.reservations';
    execute $policy$
      create policy "Users can write own reservations"
      on public.reservations
      for all
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
        or exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
        or exists (
          select 1
          from public.parkings p
          join public.users u on u.id = p.owner_id
          where p.id = parking_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.reviews') is not null then
    execute 'alter table public.reviews enable row level security';
    execute 'drop policy if exists "Anyone can read reviews" on public.reviews';
    execute 'create policy "Anyone can read reviews" on public.reviews for select using (true)';
    execute 'drop policy if exists "Users can write own reviews" on public.reviews';
    execute $policy$
      create policy "Users can write own reviews"
      on public.reviews
      for all
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;

  if to_regclass('public.notifications') is not null then
    execute 'alter table public.notifications enable row level security';
    execute 'drop policy if exists "Users can read own notifications" on public.notifications';
    execute $policy$
      create policy "Users can read own notifications"
      on public.notifications
      for select
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
    execute 'drop policy if exists "Users can update own notifications" on public.notifications';
    execute $policy$
      create policy "Users can update own notifications"
      on public.notifications
      for update
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
      with check (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
    execute 'drop policy if exists "Users can delete own notifications" on public.notifications';
    execute $policy$
      create policy "Users can delete own notifications"
      on public.notifications
      for delete
      using (
        exists (
          select 1
          from public.users u
          where u.id = user_id
            and lower(u.email) = public.current_auth_email()
        )
      )
    $policy$;
  end if;
end $$;
