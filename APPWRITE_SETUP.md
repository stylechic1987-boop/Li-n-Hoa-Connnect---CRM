# Liên Hoa Connect — Appwrite setup

Backend mới của ứng dụng dùng Appwrite Cloud Web SDK.

## Biến môi trường

- `VITE_APPWRITE_ENDPOINT`: `https://cloud.appwrite.io/v1` hoặc endpoint vùng của Appwrite
- `VITE_APPWRITE_PROJECT_ID`: Project ID Appwrite
- `VITE_APPWRITE_DATABASE_ID`: Database ID, mặc định là `lienhoa`

## Tables cần tạo

Tạo các table với ID đúng như sau:

- `profiles`
- `employees`
- `attendance`
- `classes`
- `students`
- `sessions`
- `classAttendance`

Các cột đang được giao diện sử dụng:

### profiles
`user_id`, `role`, `branch`, `center`, `employee_id`

### employees
`employee_code`, `full_name`, `title`, `department`, `role`, `branch`, `center`, `specialty`, `start_date`, `status`, `user_id`

### attendance
`user_id`, `employee_code`, `date`, `check_in`, `check_out`, `status`

### classes
`code`, `name`, `course`, `teacher`, `teacher_user_id`, `branch`, `center`, `schedule`, `total_sessions`, `status`

### students
`class_id`, `student_code`, `full_name`, `phone`, `start_date`

### sessions
`class_id`, `session_no`, `session_date`, `topic`

### classAttendance
`class_id`, `session_id`, `student_id`, `status`, `homework`, `reason`, `note_date`

## Web platform / CORS

Trong Appwrite Console, thêm domain GitHub Pages của app vào Web platform. Không dùng server API key ở frontend.

## Quyền dữ liệu

Cấu hình quyền read/write tại table/row level trong Appwrite. Không cho client tự thay đổi trường `role` trong `profiles`; việc cấp vai trò nhân sự nên thực hiện bởi admin/backend.

## Tài khoản

Tạo tài khoản nhân viên trong Appwrite Authentication. Sau khi có User ID, tạo row tương ứng trong `profiles` với role, branch, center và employee_id.
