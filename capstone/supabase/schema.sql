-- ---------- Préstamos (activos e historial) ----------
create table public.loans (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Mismo id que usa la app en /libro/:id (ej. OL82563W)
  work_id text not null check (work_id ~ '^OL[0-9]+W$'),
  -- Copia del título y la portada: "Mis préstamos" se lista sin pedirle cada libro a Open Library
  title text not null check (char_length(title) between 1 and 500),
  cover_id integer check (cover_id > 0),
  borrowed_at timestamptz not null default now(),
  due_at timestamptz not null,
  -- null = el libro sigue prestado
  returned_at timestamptz,
  check (due_at > borrowed_at),
  check (returned_at is null or returned_at >= borrowed_at)
);

-- 1 ejemplar por libro: no puede haber dos préstamos sin devolver del mismo work_id
create unique index loans_one_active_per_work on public.loans (work_id) where returned_at is null;
create index loans_user_id_idx on public.loans (user_id);

-- ---------- Reservas (fila de espera de libros prestados) ----------
create table public.reservations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  work_id text not null check (work_id ~ '^OL[0-9]+W$'),
  title text not null check (char_length(title) between 1 and 500),
  cover_id integer check (cover_id > 0),
  -- active = en la fila · fulfilled = se convirtió en préstamo · cancelled = cancelada
  status text not null default 'active' check (status in ('active', 'fulfilled', 'cancelled')),
  -- Orden de llegada en la fila
  created_at timestamptz not null default now()
);

-- Una sola reserva activa por usuario y libro
create unique index reservations_one_active_per_user on public.reservations (user_id, work_id) where status = 'active';
-- Encuentra rápido la fila de un libro, en orden de llegada
create index reservations_queue_idx on public.reservations (work_id, created_at) where status = 'active';
create index reservations_user_id_idx on public.reservations (user_id);

-- ---------- Estado de lectura (incluye la lista de deseos) ----------
create table public.reading_status (
  -- default auth.uid(): el navegador no necesita enviar su propio id
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  work_id text not null check (work_id ~ '^OL[0-9]+W$'),
  title text not null check (char_length(title) between 1 and 500),
  cover_id integer check (cover_id > 0),
  status text not null check (status in ('wishlist', 'reading', 'completed')),
  -- Un solo estado por usuario y libro
  primary key (user_id, work_id)
);

-- ---------- Permisos: qué operaciones existen para cada rol ----------
-- anon = visitante sin sesión · authenticated = usuario con sesión
revoke all on public.loans, public.reservations, public.reading_status from anon, authenticated;
-- Préstamos y reservas: el navegador solo puede LEER. Escribir será solo con las funciones del Paso 2
grant select on public.loans, public.reservations to authenticated;
-- Estado de lectura: lo maneja el propio usuario y no afecta a nadie más
grant select, insert, update, delete on public.reading_status to authenticated;

-- ---------- RLS: de esas operaciones, sobre QUÉ filas ----------
alter table public.loans enable row level security;
alter table public.reservations enable row level security;
alter table public.reading_status enable row level security;

-- (select auth.uid()) entre paréntesis: Postgres lo calcula una vez por consulta, no una vez por fila
create policy "Ver mis préstamos" on public.loans
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Ver mis reservas" on public.reservations
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Ver mi estado de lectura" on public.reading_status
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Agregar a mi estado de lectura" on public.reading_status
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Cambiar mi estado de lectura" on public.reading_status
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Quitar de mi estado de lectura" on public.reading_status
  for delete to authenticated using ((select auth.uid()) = user_id);
