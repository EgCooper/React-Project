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



-- =============================================================
-- Paso 2: funciones con las reglas de préstamos y reservas
-- =============================================================
-- security definer: la función corre con los permisos de su dueño (administrador), no con los del usuario.
--   Así puede escribir en loans/reservations, que el navegador solo puede leer, pero SOLO siguiendo estas reglas.
-- set search_path = '': obliga a escribir public.tabla / auth.uid() completos, para que nadie pueda
--   "colar" una tabla o función con el mismo nombre en otro esquema.
-- raise exception '...': los mensajes de reglas de negocio llevan el código P0001 y la app los muestra tal cual.

-- ---------- Disponibilidad de los libros de una página (también sin sesión) ----------
-- Devuelve solo los libros prestados o con fila de espera; los que no aparecen están disponibles.
-- No revela quién tiene el libro ni quién está en la fila.
create function public.get_availability(work_ids text[])
returns table (work_id text, due_at timestamptz, queue_length integer, my_queue_position integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.work_id,
    l.due_at,
    (select count(*)::integer from public.reservations r
      where r.work_id = w.work_id and r.status = 'active') as queue_length,
    -- Posición del usuario actual en la fila (null si no reservó)
    (select count(*)::integer from public.reservations r
      where r.work_id = w.work_id and r.status = 'active'
        and r.created_at <= mine.created_at) as my_queue_position
  -- [1:100]: como máximo 100 libros por consulta
  from unnest(work_ids[1:100]) as w(work_id)
  left join public.loans l on l.work_id = w.work_id and l.returned_at is null
  left join public.reservations mine
    on mine.work_id = w.work_id and mine.status = 'active' and mine.user_id = auth.uid()
  where l.id is not null
     or exists (select 1 from public.reservations r where r.work_id = w.work_id and r.status = 'active');
$$;

-- ---------- Pedir un libro prestado ----------
create function public.borrow_book(p_work_id text, p_title text, p_cover_id integer default null)
returns public.loans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_first_in_line uuid;
  v_loan public.loans;
begin
  if v_user_id is null then
    raise exception 'Inicia sesión para pedir un libro.';
  end if;

  if exists (select 1 from public.loans
             where work_id = p_work_id and returned_at is null and user_id = v_user_id) then
    raise exception 'Ya tienes este libro prestado.';
  end if;

  if exists (select 1 from public.loans where work_id = p_work_id and returned_at is null) then
    raise exception 'Este libro ya está prestado. Puedes reservarlo.';
  end if;

  -- Máximo 3 préstamos activos por usuario
  if (select count(*) from public.loans where user_id = v_user_id and returned_at is null) >= 3 then
    raise exception 'Ya tienes 3 préstamos activos. Devuelve uno para pedir otro.';
  end if;

  if exists (select 1 from public.loans
             where user_id = v_user_id and returned_at is null and due_at < now()) then
    raise exception 'Tienes un préstamo vencido. Devuélvelo para pedir otro.';
  end if;

  -- Si hay fila de espera, solo puede llevárselo el primero
  select user_id into v_first_in_line
  from public.reservations
  where work_id = p_work_id and status = 'active'
  order by created_at, id
  limit 1;

  if v_first_in_line is not null and v_first_in_line <> v_user_id then
    raise exception 'Este libro está reservado para otra persona. Puedes unirte a la fila.';
  end if;

  begin
    -- Plazo de 14 días; lo calcula el servidor, no el navegador
    insert into public.loans (user_id, work_id, title, cover_id, due_at)
    values (v_user_id, p_work_id, left(trim(p_title), 500), p_cover_id, now() + interval '14 days')
    returning * into v_loan;
  exception when unique_violation then
    -- Otra persona lo pidió en el mismo instante: el índice único lo impidió
    raise exception 'Este libro ya está prestado. Puedes reservarlo.';
  end;

  -- Si el usuario estaba en la fila de este libro, su reserva se cumplió
  update public.reservations
  set status = 'fulfilled'
  where user_id = v_user_id and work_id = p_work_id and status = 'active';

  return v_loan;
end;
$$;

-- ---------- Devolver un libro ----------
create function public.return_book(p_loan_id bigint)
returns public.loans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_loan public.loans;
begin
  update public.loans
  set returned_at = now()
  where id = p_loan_id and user_id = auth.uid() and returned_at is null
  returning * into v_loan;

  if not found then
    raise exception 'No encontramos ese préstamo activo.';
  end if;

  return v_loan;
end;
$$;


-- ---------- Reservar un libro (entrar a la fila) ----------
create function public.reserve_book(p_work_id text, p_title text, p_cover_id integer default null)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_reservation public.reservations;
begin
  if v_user_id is null then
    raise exception 'Inicia sesión para reservar un libro.';
  end if;

  if exists (select 1 from public.loans
             where work_id = p_work_id and returned_at is null and user_id = v_user_id) then
    raise exception 'Ya tienes este libro prestado.';
  end if;

  -- Solo se reserva lo que no está disponible: prestado a otra persona o con fila de espera
  if not exists (select 1 from public.loans where work_id = p_work_id and returned_at is null)
     and not exists (select 1 from public.reservations where work_id = p_work_id and status = 'active') then
    raise exception 'Este libro está disponible: puedes pedirlo prestado.';
  end if;

  begin
    insert into public.reservations (user_id, work_id, title, cover_id)
    values (v_user_id, p_work_id, left(trim(p_title), 500), p_cover_id)
    returning * into v_reservation;
  exception when unique_violation then
    raise exception 'Ya estás en la fila de este libro.';
  end;

  return v_reservation;
end;
$$;

-- ---------- Cancelar una reserva ----------
create function public.cancel_reservation(p_reservation_id bigint)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.reservations;
begin
  update public.reservations
  set status = 'cancelled'
  where id = p_reservation_id and user_id = auth.uid() and status = 'active'
  returning * into v_reservation;

  if not found then
    raise exception 'No encontramos esa reserva activa.';
  end if;

  return v_reservation;
end;
$$;

-- ---------- Quién puede llamar a cada función ----------
-- Por defecto cualquiera (incluido anon) puede ejecutar funciones nuevas: se quita y se da solo lo necesario
revoke execute on function public.get_availability(text[]) from public, anon, authenticated;
grant execute on function public.get_availability(text[]) to anon, authenticated;

revoke execute on function
  public.borrow_book(text, text, integer),
  public.return_book(bigint),
  public.reserve_book(text, text, integer),
  public.cancel_reservation(bigint)
from public, anon, authenticated;

grant execute on function
  public.borrow_book(text, text, integer),
  public.return_book(bigint),
  public.reserve_book(text, text, integer),
  public.cancel_reservation(bigint)
to authenticated;
