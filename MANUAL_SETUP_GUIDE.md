# Manual Database Setup Guide

A step-by-step guide to set up the School Counselor Ledger application with Supabase using manual database operations.

## Prerequisites

- Supabase account (free tier works fine)
- Supabase project created
- Environment variables configured (`.env.local`)
- Database migrations already run (001, 002, 003)

## Step 1: Verify Supabase Setup

### 1.1 Check Environment Variables

Ensure your `.env.local` has:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_DATA=false
```

### 1.2 Verify Migrations Ran

Go to Supabase Dashboard → SQL Editor and run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- `tenants`
- `users`
- `students`
- `contacts`
- `reason_categories`
- `reason_subcategories`
- `interactions`
- `setup_tokens`
- `invitations`
- `security_events`

If tables are missing, run the migrations from `supabase/migrations/` in order:
1. `001_core_schema.sql` - Core database tables and structure
2. `002_security_policies.sql` - Row Level Security policies
3. `003_seed_data.sql` - Default categories (optional)
4. `004_setup_invitations.sql` - Setup and invitation system
5. `005_security_audit.sql` - Security and privacy logging
6. `006_performance.sql` - Performance indexes and analytics

---

## Step 2: Create Your First Tenant (School)

### 2.1 Create Tenant in Database

Go to Supabase Dashboard → SQL Editor and run:

```sql
INSERT INTO tenants (name, subdomain)
VALUES ('Lincoln High School', 'lincoln-hs')
RETURNING id, name, subdomain;
```

**Save the returned `id`** - you'll need it for the next steps.

Example output:
```
id                                   | name                  | subdomain
-------------------------------------|-----------------------|----------
550e8400-e29b-41d4-a716-446655440000 | Lincoln High School   | lincoln-hs
```

---

## Step 3: Create Supabase Auth Users

You need to create auth users in Supabase Auth before creating application users.

### 3.1 Create Admin User

Go to Supabase Dashboard → Authentication → Users → Add User

**Create Admin:**
- Email: `admin@lincoln-hs.edu`
- Password: (set a strong password)
- Auto confirm user: ✓ (check this)

**Save the User ID** from the created user.

### 3.2 Create Counselor Users

Repeat the process for each counselor:

**Counselor 1:**
- Email: `mjones@lincoln-hs.edu`
- Password: (set a strong password)
- Auto confirm user: ✓

**Counselor 2:**
- Email: `lsmith@lincoln-hs.edu`
- Password: (set a strong password)
- Auto confirm user: ✓

Save all the User IDs.

---

## Step 4: Create Application Users

Now link the auth users to your tenant by creating application user records.

### 4.1 Create Admin User Record

Go to Supabase Dashboard → SQL Editor and run:

```sql
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
  'admin@lincoln-hs.edu',
  'John',
  'Smith',
  'ADMIN',
  true
);
```

**Replace:**
- `AUTH_USER_ID_HERE` with the admin's User ID from Supabase Auth
- `TENANT_ID_HERE` with the tenant ID from Step 2.1

### 4.2 Create Counselor User Records

Run for each counselor:

```sql
INSERT INTO users (
  id,
  tenant_id,
  email,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  'COUNSELOR_1_AUTH_ID',
  'TENANT_ID_HERE',
  'mjones@lincoln-hs.edu',
  'Mary',
  'Jones',
  'COUNSELOR',
  true
);

INSERT INTO users (
  id,
  tenant_id,
  email,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  'COUNSELOR_2_AUTH_ID',
  'TENANT_ID_HERE',
  'lsmith@lincoln-hs.edu',
  'Lisa',
  'Smith',
  'COUNSELOR',
  true
);
```

---

## Step 5: Verify Setup

### 5.1 Check Users Were Created

```sql
SELECT id, email, first_name, last_name, role, is_active
FROM users
WHERE tenant_id = 'TENANT_ID_HERE'
ORDER BY created_at;
```

You should see 3 users (1 admin, 2 counselors).

### 5.2 Check Reason Categories

```sql
SELECT id, name, color
FROM reason_categories
WHERE tenant_id = 'TENANT_ID_HERE'
ORDER BY sort_order;
```

You should see 7 default categories (Academic, Behavioral, etc.).

---

## Step 6: Test the Application

### 6.1 Start the Application

```bash
npm run dev
```

### 6.2 Test Admin Login

1. Go to `http://localhost:5173/login`
2. Enter: `admin@lincoln-hs.edu`
3. Enter password: (the password you set in Step 3.1)
4. Click Login

You should be redirected to the dashboard.

### 6.3 Test Admin Features

- Click "User Management" in the sidebar
- You should see all 3 users listed
- Try inviting a new user with the "Invite User" button

### 6.4 Test Counselor Login

1. Log out (click your profile → Logout)
2. Log in with: `mjones@lincoln-hs.edu`
3. Enter password: (the password you set in Step 3.2)

You should see the counselor dashboard (limited to their own data).

---

## Step 7: Add Initial Data (Optional)

### 7.1 Add Students

Go to Supabase Dashboard → SQL Editor:

```sql
INSERT INTO students (tenant_id, student_id, first_name, last_name, grade_level, email)
VALUES
  ('TENANT_ID_HERE', 'STU001', 'Alice', 'Johnson', '9', 'alice.johnson@school.edu'),
  ('TENANT_ID_HERE', 'STU002', 'Bob', 'Williams', '10', 'bob.williams@school.edu'),
  ('TENANT_ID_HERE', 'STU003', 'Carol', 'Brown', '11', 'carol.brown@school.edu');
```

### 7.2 Add Contacts

```sql
INSERT INTO contacts (tenant_id, first_name, last_name, relationship, email, organization)
VALUES
  ('TENANT_ID_HERE', 'Sarah', 'Johnson', 'Parent', 'sarah.johnson@email.com', NULL),
  ('TENANT_ID_HERE', 'Mr.', 'Davis', 'Teacher', 'mdavis@school.edu', 'Lincoln High School');
```

---

## Troubleshooting

### Issue: "User not found" when logging in

**Solution:** Make sure you created the application user record in Step 4. The auth user alone isn't enough.

### Issue: "Permission denied" error

**Solution:** Check that RLS policies are enabled. Run:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

### Issue: Can't see other users as admin

**Solution:** Verify the admin user has `role = 'ADMIN'` in the users table:
```sql
SELECT email, role FROM users WHERE email = 'admin@lincoln-hs.edu';
```

### Issue: Counselor can see all interactions

**Solution:** This shouldn't happen if RLS is working. Check the RLS policy:
```sql
SELECT policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'interactions';
```

---

## Adding More Schools

To add another school (e.g., Washington Middle School):

### 1. Create Tenant
```sql
INSERT INTO tenants (name, subdomain)
VALUES ('Washington Middle School', 'washington-ms')
RETURNING id;
```

### 2. Create Auth Users in Supabase Auth
- `admin@washington-ms.edu`
- `ebrown@washington-ms.edu`

### 3. Create Application Users
```sql
INSERT INTO users (id, tenant_id, email, first_name, last_name, role, is_active)
VALUES
  ('AUTH_ID_1', 'NEW_TENANT_ID', 'admin@washington-ms.edu', 'Jane', 'Doe', 'ADMIN', true),
  ('AUTH_ID_2', 'NEW_TENANT_ID', 'ebrown@washington-ms.edu', 'Emily', 'Brown', 'COUNSELOR', true);
```

Each school is completely isolated - they can't see each other's data.

---

## Quick Reference: SQL Commands

### Get Tenant ID
```sql
SELECT id, name FROM tenants WHERE subdomain = 'lincoln-hs';
```

### Get All Users for a Tenant
```sql
SELECT email, first_name, last_name, role FROM users 
WHERE tenant_id = 'TENANT_ID_HERE';
```

### Get All Interactions for a Tenant
```sql
SELECT COUNT(*) as total_interactions FROM interactions 
WHERE tenant_id = 'TENANT_ID_HERE';
```

### Deactivate a User
```sql
UPDATE users SET is_active = false 
WHERE email = 'user@example.com' AND tenant_id = 'TENANT_ID_HERE';
```

### Change User Role
```sql
UPDATE users SET role = 'ADMIN' 
WHERE email = 'user@example.com' AND tenant_id = 'TENANT_ID_HERE';
```

---

## Next Steps

Once setup is complete:

1. **Admin invites counselors** using the "Invite User" button in User Management
2. **Counselors create students** in the Students page
3. **Counselors log interactions** in the Interactions page
4. **Admin views reports** in the Admin Dashboard

The system is now ready for use!

---

## Support

For issues:
1. Check the Troubleshooting section above
2. Review `SUPABASE_SETUP.md` for Supabase-specific help
3. Check browser console for error messages
4. Verify all environment variables are set correctly
