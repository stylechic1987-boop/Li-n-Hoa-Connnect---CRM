# Liên Hoa Connect — HR & CRM

React/Vite application for Liên Hoa Global Education.

## HR production layer

The HR module now has:
- Supabase email/password login with persistent sessions.
- Role model: Giám đốc công ty → Giám đốc chi nhánh → Giám đốc trung tâm → MKT/Sale/giáo viên.
- PostgreSQL tables for employees, shifts, attendance and leave requests.
- Row Level Security policies for company/branch/center/self scope.
- Real check-in/check-out persistence when Supabase is configured.
- Local demo mode when Supabase variables are not present.

## Database setup

Run `supabase/migrations/001_hr_schema.sql` in the target Supabase project's SQL editor.

Then configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Create Auth users in Supabase Authentication and create a matching row in `hr_profiles` for each user. Do not put passwords, service-role keys, or other secrets in GitHub.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
