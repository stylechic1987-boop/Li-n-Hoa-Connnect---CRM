create extension if not exists pgcrypto;

create table if not exists public.class_rooms (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 name text not null,
 course text,
 teacher text,
 branch text,
 schedule text,
 total_sessions integer not null default 30,
 status text not null default 'Đang học',
 created_at timestamptz not null default now()
);

create table if not exists public.class_students (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.class_rooms(id) on delete cascade,
 student_code text,
 full_name text not null,
 phone text,
 status text not null default 'Đang học',
 created_at timestamptz not null default now()
);

create table if not exists public.class_sessions (
 id uuid primary key default gen_random_uuid(),
 class_id uuid not null references public.class_rooms(id) on delete cascade,
 session_no integer not null,
 session_date date not null,
 topic text,
 created_at timestamptz not null default now(),
 unique(class_id, session_no),
 unique(class_id, session_date)
);

create table if not exists public.class_attendance (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.class_sessions(id) on delete cascade,
 student_id uuid not null references public.class_students(id) on delete cascade,
 status text not null check(status in ('Có mặt','Đi muộn','Vắng','Nghỉ phép')),
 note text,
 marked_at timestamptz not null default now(),
 unique(session_id, student_id)
);

create index if not exists idx_class_students_class on public.class_students(class_id);
create index if not exists idx_class_sessions_class_date on public.class_sessions(class_id, session_date);
create index if not exists idx_class_attendance_session on public.class_attendance(session_id);

alter table public.class_rooms enable row level security;
alter table public.class_students enable row level security;
alter table public.class_sessions enable row level security;
alter table public.class_attendance enable row level security;

drop policy if exists class_rooms_auth on public.class_rooms;
create policy class_rooms_auth on public.class_rooms for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists class_students_auth on public.class_students;
create policy class_students_auth on public.class_students for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists class_sessions_auth on public.class_sessions;
create policy class_sessions_auth on public.class_sessions for all using (auth.uid() is not null) with check (auth.uid() is not null);
drop policy if exists class_attendance_auth on public.class_attendance;
create policy class_attendance_auth on public.class_attendance for all using (auth.uid() is not null) with check (auth.uid() is not null);

grant select, insert, update, delete on public.class_rooms, public.class_students, public.class_sessions, public.class_attendance to authenticated;
