-- Monthly class attendance: teacher assignment + homework + change notes
alter table public.class_rooms add column if not exists teacher_user_id uuid references auth.users(id) on delete set null;
alter table public.class_rooms add column if not exists center text;
alter table public.class_rooms add column if not exists updated_at timestamptz not null default now();

alter table public.class_students add column if not exists start_date date not null default current_date;
alter table public.class_students add column if not exists updated_at timestamptz not null default now();

alter table public.class_sessions add column if not exists updated_at timestamptz not null default now();

alter table public.class_attendance add column if not exists homework boolean not null default false;
alter table public.class_attendance add column if not exists reason text;
alter table public.class_attendance add column if not exists note_date date;
alter table public.class_attendance add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_class_rooms_teacher on public.class_rooms(teacher_user_id);

drop policy if exists class_rooms_select on public.class_rooms;
create policy class_rooms_select on public.class_rooms for select using (
 private.hr_my_role() in ('company_director','admin')
 or (private.hr_my_role() = 'branch_director' and branch = private.hr_my_branch())
 or (private.hr_my_role() = 'center_director' and center = private.hr_my_center())
 or teacher_user_id = auth.uid()
);

drop policy if exists class_rooms_write on public.class_rooms;
create policy class_rooms_write on public.class_rooms for all using (
 private.hr_my_role() in ('company_director','admin')
 or (private.hr_my_role() = 'branch_director' and branch = private.hr_my_branch())
 or (private.hr_my_role() = 'center_director' and center = private.hr_my_center())
) with check (
 private.hr_my_role() in ('company_director','admin')
 or (private.hr_my_role() = 'branch_director' and branch = private.hr_my_branch())
 or (private.hr_my_role() = 'center_director' and center = private.hr_my_center())
);

drop policy if exists class_students_select on public.class_students;
create policy class_students_select on public.class_students for select using (
 private.hr_my_role() in ('company_director','admin')
 or exists (select 1 from public.class_rooms c where c.id=class_id and (
   c.teacher_user_id=auth.uid()
   or (private.hr_my_role()='branch_director' and c.branch=private.hr_my_branch())
   or (private.hr_my_role()='center_director' and c.center=private.hr_my_center())
 ))
);

drop policy if exists class_students_write on public.class_students;
create policy class_students_write on public.class_students for all using (
 private.hr_my_role() in ('company_director','admin')
 or (private.hr_my_role()='branch_director' and exists(select 1 from public.class_rooms c where c.id=class_id and c.branch=private.hr_my_branch()))
 or (private.hr_my_role()='center_director' and exists(select 1 from public.class_rooms c where c.id=class_id and c.center=private.hr_my_center()))
) with check (
 private.hr_my_role() in ('company_director','admin')
 or (private.hr_my_role()='branch_director' and exists(select 1 from public.class_rooms c where c.id=class_id and c.branch=private.hr_my_branch()))
 or (private.hr_my_role()='center_director' and exists(select 1 from public.class_rooms c where c.id=class_id and c.center=private.hr_my_center()))
);

drop policy if exists class_sessions_select on public.class_sessions;
create policy class_sessions_select on public.class_sessions for select using (
 private.hr_my_role() in ('company_director','admin')
 or exists(select 1 from public.class_rooms c where c.id=class_id and (
   c.teacher_user_id=auth.uid()
   or (private.hr_my_role()='branch_director' and c.branch=private.hr_my_branch())
   or (private.hr_my_role()='center_director' and c.center=private.hr_my_center())
 ))
);

drop policy if exists class_sessions_write on public.class_sessions;
create policy class_sessions_write on public.class_sessions for all using (
 private.hr_my_role() in ('company_director','admin')
 or exists(select 1 from public.class_rooms c where c.id=class_id and (
   c.teacher_user_id=auth.uid()
   or (private.hr_my_role()='branch_director' and c.branch=private.hr_my_branch())
   or (private.hr_my_role()='center_director' and c.center=private.hr_my_center())
 ))
) with check (
 private.hr_my_role() in ('company_director','admin')
 or exists(select 1 from public.class_rooms c where c.id=class_id and (
   c.teacher_user_id=auth.uid()
   or (private.hr_my_role()='branch_director' and c.branch=private.hr_my_branch())
   or (private.hr_my_role()='center_director' and c.center=private.hr_my_center())
 ))
);

drop policy if exists class_attendance_select on public.class_attendance;
create policy class_attendance_select on public.class_attendance for select using (
 private.hr_my_role() in ('company_director','admin')
 or exists(select 1 from public.class_sessions s join public.class_rooms c on c.id=s.class_id where s.id=session_id and (
   c.teacher_user_id=auth.uid()
   or (private.hr_my_role()='branch_director' and c.branch=private.hr_my_branch())
   or (private.hr_my_role()='center_director' and c.center=private.hr_my_center())
 ))
);

drop policy if exists class_attendance_write on public.class_attendance;
create policy class_attendance_write on public.class_attendance for all using (
 private.hr_my_role() in ('company_director','admin')
 or exists(select 1 from public.class_sessions s join public.class_rooms c on c.id=s.class_id where s.id=session_id and (
   c.teacher_user_id=auth.uid()
   or (private.hr_my_role()='branch_director' and c.branch=private.hr_my_branch())
   or (private.hr_my_role()='center_director' and c.center=private.hr_my_center())
 ))
) with check (
 private.hr_my_role() in ('company_director','admin')
 or exists(select 1 from public.class_sessions s join public.class_rooms c on c.id=s.class_id where s.id=session_id and (
   c.teacher_user_id=auth.uid()
   or (private.hr_my_role()='branch_director' and c.branch=private.hr_my_branch())
   or (private.hr_my_role()='center_director' and c.center=private.hr_my_center())
 ))
);

grant select, insert, update, delete on public.class_rooms, public.class_students, public.class_sessions, public.class_attendance to authenticated;
