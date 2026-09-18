-- Liên Hoa Connect HR: production HR schema
-- Run this migration in the Supabase SQL editor connected to the project's database.
create extension if not exists pgcrypto;

create type public.hr_role as enum (
  'company_director',
  'branch_director',
  'center_director',
  'mkt',
  'sale',
  'teacher_chinese',
  'teacher_english',
  'teacher_korean',
  'admin'
);

create table if not exists public.hr_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.hr_role not null default 'sale',
  branch text,
  center text,
  employee_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  date_of_birth date,
  title text not null,
  department text not null,
  role public.hr_role not null,
  manager_id uuid references public.hr_employees(id) on delete set null,
  branch text not null,
  center text,
  specialty text,
  employment_type text default 'Chính thức',
  start_date date not null default current_date,
  end_date date,
  status text not null default 'Đang làm' check (status in ('Đang làm','Tạm nghỉ','Nghỉ việc')),
  salary numeric(14,2),
  contract_no text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes integer not null default 60 check (break_minutes >= 0),
  tolerance_minutes integer not null default 10 check (tolerance_minutes >= 0),
  work_days smallint[] not null default '{1,2,3,4,5,6}',
  branch text,
  center text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  work_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  worked_minutes integer,
  status text not null default 'Đang làm' check (status in ('Đang làm','Đã hoàn thành','Vắng','Nghỉ phép')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, work_date)
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  leave_type text not null default 'Phép năm',
  reason text,
  status text not null default 'Chờ duyệt' check (status in ('Chờ duyệt','Đã duyệt','Từ chối','Đã hủy')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_hr_employees_branch on public.hr_employees(branch);
create index if not exists idx_hr_employees_center on public.hr_employees(center);
create index if not exists idx_hr_attendance_date on public.hr_attendance(work_date);
create index if not exists idx_hr_leave_dates on public.hr_leave_requests(start_date,end_date);

create schema if not exists private;

create or replace function private.hr_my_role()
returns public.hr_role
language sql
stable
security definer
set search_path = public, private
as $
  select role from public.hr_profiles where user_id = (select auth.uid());
$;

create or replace function private.hr_my_branch()
returns text
language sql
stable
security definer
set search_path = public, private
as $
  select branch from public.hr_profiles where user_id = (select auth.uid());
$;

create or replace function private.hr_my_center()
returns text
language sql
stable
security definer
set search_path = public, private
as $
  select center from public.hr_profiles where user_id = (select auth.uid());
$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.hr_my_role() from public;
revoke all on function private.hr_my_branch() from public;
revoke all on function private.hr_my_center() from public;
grant execute on function private.hr_my_role() to authenticated;
grant execute on function private.hr_my_branch() to authenticated;
grant execute on function private.hr_my_center() to authenticated;

alter table public.hr_profiles enable row level security;
alter table public.hr_employees enable row level security;
alter table public.hr_shifts enable row level security;
alter table public.hr_attendance enable row level security;
alter table public.hr_leave_requests enable row level security;

drop policy if exists hr_profiles_self on public.hr_profiles;
create policy hr_profiles_self on public.hr_profiles
for select using (user_id = auth.uid() or private.hr_my_role() in ('company_director','admin'));

drop policy if exists hr_employees_select on public.hr_employees;
create policy hr_employees_select on public.hr_employees
for select using (
  private.hr_my_role() in ('company_director','admin')
  or (private.hr_my_role() = 'branch_director' and branch = private.hr_my_branch())
  or (private.hr_my_role() = 'center_director' and center = private.hr_my_center())
  or user_id = auth.uid()
);

drop policy if exists hr_employees_write on public.hr_employees;
create policy hr_employees_write on public.hr_employees
for all using (
  private.hr_my_role() in ('company_director','admin')
  or (private.hr_my_role() = 'branch_director' and branch = private.hr_my_branch())
  or (private.hr_my_role() = 'center_director' and center = private.hr_my_center())
) with check (
  private.hr_my_role() in ('company_director','admin')
  or (private.hr_my_role() = 'branch_director' and branch = private.hr_my_branch())
  or (private.hr_my_role() = 'center_director' and center = private.hr_my_center())
);

drop policy if exists hr_attendance_select on public.hr_attendance;
create policy hr_attendance_select on public.hr_attendance
for select using (
  private.hr_my_role() in ('company_director','admin')
  or exists (
    select 1 from public.hr_employees e
    where e.id = employee_id
      and (
        e.user_id = auth.uid()
        or (private.hr_my_role() = 'branch_director' and e.branch = private.hr_my_branch())
        or (private.hr_my_role() = 'center_director' and e.center = private.hr_my_center())
      )
  )
);

drop policy if exists hr_attendance_write on public.hr_attendance;
create policy hr_attendance_write on public.hr_attendance
for all using (
  private.hr_my_role() in ('company_director','admin')
  or exists (
    select 1 from public.hr_employees e
    where e.id = employee_id
      and (
        e.user_id = auth.uid()
        or (private.hr_my_role() = 'branch_director' and e.branch = private.hr_my_branch())
        or (private.hr_my_role() = 'center_director' and e.center = private.hr_my_center())
      )
  )
) with check (
  private.hr_my_role() in ('company_director','admin')
  or exists (
    select 1 from public.hr_employees e
    where e.id = employee_id
      and (
        e.user_id = auth.uid()
        or (private.hr_my_role() = 'branch_director' and e.branch = private.hr_my_branch())
        or (private.hr_my_role() = 'center_director' and e.center = private.hr_my_center())
      )
  )
);

drop policy if exists hr_shifts_select on public.hr_shifts;
create policy hr_shifts_select on public.hr_shifts
for select using (auth.uid() is not null);

drop policy if exists hr_shifts_write on public.hr_shifts;
create policy hr_shifts_write on public.hr_shifts
for all using (private.hr_my_role() in ('company_director','admin','branch_director','center_director'))
with check (private.hr_my_role() in ('company_director','admin','branch_director','center_director'));

drop policy if exists hr_leave_select on public.hr_leave_requests;
create policy hr_leave_select on public.hr_leave_requests
for select using (
  private.hr_my_role() in ('company_director','admin')
  or exists (
    select 1 from public.hr_employees e
    where e.id = employee_id
      and (
        e.user_id = auth.uid()
        or (private.hr_my_role() = 'branch_director' and e.branch = private.hr_my_branch())
        or (private.hr_my_role() = 'center_director' and e.center = private.hr_my_center())
      )
  )
);

drop policy if exists hr_leave_write on public.hr_leave_requests;
create policy hr_leave_write on public.hr_leave_requests
for all using (
  private.hr_my_role() in ('company_director','admin','branch_director','center_director')
  or exists (select 1 from public.hr_employees e where e.id = employee_id and e.user_id = auth.uid())
) with check (
  private.hr_my_role() in ('company_director','admin','branch_director','center_director')
  or exists (select 1 from public.hr_employees e where e.id = employee_id and e.user_id = auth.uid())
);

insert into public.hr_shifts (name,start_time,end_time,break_minutes,tolerance_minutes)
select 'Ca hành chính','08:00','17:30',60,10
where not exists (select 1 from public.hr_shifts where name='Ca hành chính');

-- Never store passwords or service-role keys in this repository.


grant select on public.hr_profiles, public.hr_employees, public.hr_shifts, public.hr_attendance, public.hr_leave_requests to authenticated;
grant insert, update, delete on public.hr_employees, public.hr_shifts, public.hr_attendance, public.hr_leave_requests to authenticated;
