# Manual Database Setup Guide

Quick reference for manually setting up the database without using the automated onboarding flow.

> **Note:** For the recommended automated onboarding process, see TECHNICAL_GUIDE.md

---

## When to Use This Guide

- Testing and development
- Emergency situations
- Direct database access needed
- Bypassing the UI onboarding flow

---

## Prerequisites

- Supabase project created
- Database migrations run (001-005)
- Environment variables configured

---

## Quick Setup Steps

### 1. Verify Migrations

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables: `tenants`, `users`, `students`, `contacts`, `interactions`, `reason_categories`, `reason_subcategories`, `setup_tokens`, `invitations`, `security_events`

### 2. Create Tenant

```sql
INSERT INTO tenants (name, subdomain)
VALUES ('Lincoln High School', 'lincoln-hs')
RETURNING id, name, subdomain;
```

**Save the returned `id`** for next steps.

### 3. Create Supabase Auth Users

Go to Supabase Dashboard → Authentication → Users → Add User

**Admin:**
- Email: `admin@lincolnhigh.edu`
- Password: (set strong password)
- Auto confirm user: ✓

**Counselors:**
- Email: `counselor1@lincolnhigh.edu`
- Password: (set strong password)
- Auto confirm user: ✓

**Save all User IDs** from created users.

### 4. Create Application Users

```sql
-- Admin
INSERT INTO users (
  id,
  tenant_id,
  email,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  'AUTH_USER_ID_HERE',
  'TENANT_ID_HERE',
  'admin@lincolnhigh.edu',
  'John',
  'Smith',
  'ADMIN',
  true
);

-- Counselor
INSERT INTO users (
  id,
  tenant_id,
  email,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  'COUNSELOR_AUTH_ID',
  'TENANT_ID_HERE',
  'counselor1@lincolnhigh.edu',
  'Mary',
  'Jones',
  'COUNSELOR',
  true
);
```

### 5. Verify Setup

```sql
-- Check users
SELECT id, email, first_name, last_name, role, is_active
FROM users
WHERE tenant_id = 'TENANT_ID_HERE'
ORDER BY created_at;

-- Check categories (should have 7 default)
SELECT id, name, color
FROM reason_categories
WHERE tenant_id = 'TENANT_ID_HERE'
ORDER BY sort_order;
```

### 6. Test Login

1. Start app: `npm run dev`
2. Go to http://localhost:5173/login
3. Login with admin credentials
4. Verify dashboard loads

---

## Add Sample Data (Optional)

### Students

```sql
INSERT INTO students (tenant_id, student_id, first_name, last_name, grade_level, email)
VALUES
  ('TENANT_ID', 'STU001', 'Alice', 'Johnson', '9', 'alice.j@school.edu'),
  ('TENANT_ID', 'STU002', 'Bob', 'Williams', '10', 'bob.w@school.edu'),
  ('TENANT_ID', 'STU003', 'Carol', 'Brown', '11', 'carol.b@school.edu');
```

### Contacts

```sql
INSERT INTO contacts (tenant_id, first_name, last_name, relationship, email)
VALUES
  ('TENANT_ID', 'Sarah', 'Johnson', 'Parent', 'sarah.j@email.com'),
  ('TENANT_ID', 'Mr.', 'Davis', 'Teacher', 'mdavis@school.edu');
```

---

## Common SQL Commands

### Get Tenant ID
```sql
SELECT id, name FROM tenants WHERE subdomain = 'lincoln-hs';
```

### List Users
```sql
SELECT email, first_name, last_name, role, is_active
FROM users
WHERE tenant_id = 'TENANT_ID'
ORDER BY created_at;
```

### Activate/Deactivate User
```sql
-- Activate
UPDATE users SET is_active = true
WHERE email = 'user@email.com' AND tenant_id = 'TENANT_ID';

-- Deactivate
UPDATE users SET is_active = false
WHERE email = 'user@email.com' AND tenant_id = 'TENANT_ID';
```

### Change User Role
```sql
UPDATE users SET role = 'ADMIN'  -- or 'COUNSELOR'
WHERE email = 'user@email.com' AND tenant_id = 'TENANT_ID';
```

### Check RLS Status
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

---

## Troubleshooting

### "User not found" when logging in
**Fix:** Verify application user record exists in `users` table (not just auth user).

### "Permission denied" error
**Fix:** Check RLS policies are enabled on all tables.

### Can't see other users as admin
**Fix:** Verify user has `role = 'ADMIN'` in users table.

### Counselor can see all interactions
**Fix:** Check RLS policy on interactions table is working correctly.

---

## Adding More Schools

To add another school:

1. **Create tenant:**
   ```sql
   INSERT INTO tenants (name, subdomain)
   VALUES ('Washington Middle School', 'washington-ms')
   RETURNING id;
   ```

2. **Create auth users** in Supabase Dashboard

3. **Create application users** with new tenant_id

Each school is completely isolated via RLS.

---

## Support

For detailed documentation, see:
- **README.md** - Quick start and overview
- **TECHNICAL_GUIDE.md** - Complete technical documentation
- **Supabase Dashboard** - Logs and monitoring

---

**Note:** This manual process is for development/testing. For production, use the automated onboarding flow described in TECHNICAL_GUIDE.md.
