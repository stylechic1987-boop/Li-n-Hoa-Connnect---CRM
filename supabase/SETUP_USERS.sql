-- LIÊN HOA CONNECT: tạo tài khoản đăng nhập và phân quyền giáo viên/giám đốc
-- 1) Tạo user trong Supabase Dashboard > Authentication > Users.
-- 2) Lấy UUID của user vừa tạo.
-- 3) Chạy các lệnh mẫu dưới đây, thay UUID và thông tin thực tế.

insert into public.hr_profiles (user_id, role, branch, center, employee_id)
values ('USER_UUID', 'teacher_chinese', 'Lạng Sơn', 'Lạng Sơn', 'LH-GV001')
on conflict (user_id) do update set role=excluded.role, branch=excluded.branch, center=excluded.center, employee_id=excluded.employee_id;

update public.hr_employees
set user_id='USER_UUID'
where employee_code='LH-GV001';

-- Gắn giáo viên vào lớp:
update public.class_rooms
set teacher_user_id='USER_UUID', teacher='Tên giáo viên'
where code='LH-TQ-01';

-- Giám đốc công ty:
insert into public.hr_profiles (user_id, role, branch, center, employee_id)
values ('DIRECTOR_UUID', 'company_director', 'Toàn công ty', 'Trụ sở', null)
on conflict (user_id) do update set role=excluded.role, branch=excluded.branch, center=excluded.center, employee_id=excluded.employee_id;

-- Sau khi đăng nhập, giáo viên sẽ chỉ thấy lớp được gắn teacher_user_id.

-- GIÁM ĐỐC CHI NHÁNH LẠNG SƠN:
insert into public.hr_profiles (user_id, role, branch, center, employee_id)
values ('LS_DIRECTOR_UUID', 'branch_director', 'Lạng Sơn', 'Lạng Sơn', null)
on conflict (user_id) do update set role=excluded.role, branch=excluded.branch, center=excluded.center, employee_id=excluded.employee_id;

-- GIÁM ĐỐC TRUNG TÂM BẮC NINH:
insert into public.hr_profiles (user_id, role, branch, center, employee_id)
values ('BN_CENTER_UUID', 'center_director', 'Bắc Ninh', 'Bắc Ninh', null)
on conflict (user_id) do update set role=excluded.role, branch=excluded.branch, center=excluded.center, employee_id=excluded.employee_id;
