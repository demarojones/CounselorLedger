# Supabase Setup Guide - Beacon

Complete step-by-step guide to set up Supabase for your application.

---

## Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Configure Database](#2-configure-database)
3. [Run Migrations](#3-run-migrations)
4. [Configure Authentication](#4-configure-authentication)
5. [Get API Credentials](#5-get-api-credentials)
6. [Configure Application](#6-configure-application)
7. [Test Connection](#7-test-connection)
8. [Create First School](#8-create-first-school)
9. [Troubleshooting](#troubleshooting)

---

## 1. Create Supabase Project

### Step 1.1: Sign Up / Log In
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### Step 1.2: Create New Project
1. Click "New Project" button
2. Fill in project details:
   - **Name**: `beacon` (or your preferred name)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development
3. Click "Create new project"
4. Wait 2-3 minutes for project to be provisioned

### Step 1.3: Save Your Credentials
Once the project is ready, you'll see the dashboard. Keep this tab open!

---

## 2. Configure Database

### Step 2.1: Access SQL Editor
1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. You'll see a blank SQL editor

### Step 2.2: Enable Required Extensions
Run this first to ensure UUID support:

```sql
-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Click "Run" or press `Ctrl/Cmd + Enter`

---

## 3. Run Migrations

You need to run all 6 migration files in order. Here's how:

### Step 3.1: Run Migration 001 - Core Schema
1. In SQL Editor, click "New query"
2. Open `supabase/migrations/001_core_schema.sql` from your project
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click "Run" (bottom right)
6. Wait for "Success. No rows returned" message

### Step 3.2: Run Migration 002 - Security Policies
1. Click "New query" again
2. Open `supabase/migrations/002_security_policies.sql`
3. Copy and paste entire contents
4. Click "Run"
5. Verify success

### Step 3.3: Run Migration 003 - Seed Data
1. Click "New query"
2. Open `supabase/migrations/003_seed_data.sql`
3. Copy and paste
4. Click "Run"
5. This creates default categories for the demo tenant

### Step 3.4: Run Migration 004 - Setup & Invitations
1. Click "New query"
2. Open `supabase/migrations/004_setup_invitations.sql`
3. Copy and paste
4. Click "Run"
5. This creates setup token and invitation system

### Step 3.5: Run Migration 005 - Security Audit
1. Click "New query"
2. Open `supabase/migrations/005_security_audit.sql`
3. Copy and paste
4. Click "Run"
5. This creates security event logging

### Step 3.6: Run Migration 006 - Performance
1. Click "New query"
2. Open `supabase/migrations/006_performance.sql`
3. Copy and paste
4. Click "Run"
5. This creates indexes and materialized views

### Step 3.7: Verify Migrations
Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- contacts
- interactions
- invitations
- reason_categories
- reason_subcategories
- security_events
- setup_tokens
- students
- tenants
- users

---

## 4. Configure Authentication

### Step 4.1: Enable Email Authentication
1. Click "Authentication" in left sidebar
2. Click "Providers" tab
3. Find "Email" provider
4. Ensure it's enabled (toggle should be ON)
5. Configure settings:
   - ✅ Enable email confirmations (recommended for production)
   - ✅ Enable email change confirmations
   - ⚠️ For development, you can disable confirmations

### Step 4.2: Configure Email Templates (Optional)
1. Click "Email Templates" tab
2. Customize templates for:
   - Confirmation email
   - Invitation email
   - Password reset
3. Add your branding and styling

### Step 4.3: Configure Site URL
1. Click "URL Configuration" tab
2. Set **Site URL**: `http://localhost:5173` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:5173/**`
   - Add your production URL when ready

---

## 5. Get API Credentials

### Step 5.1: Find Your Credentials
1. Click "Settings" (gear icon) in left sidebar
2. Click "API" under Project Settings
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys**:
     - `anon` `public` key (safe to use in browser)
     - `service_role` key (NEVER expose to browser!)

### Step 5.2: Copy Credentials
Copy these values - you'll need them next:
- Project URL
- anon/public key

---

## 6. Configure Application

### Step 6.1: Update Environment Variables
1. Open `.env.local` in your project root
2. Update with your Supabase credentials:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Development Mode - Set to false for Supabase
VITE_USE_MOCK_DATA=false

# Application Configuration
VITE_APP_NAME=Beacon
VITE_APP_VERSION=1.0.0
```

### Step 6.2: Verify Configuration
Your `.env.local` should look like this:

```bash
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_USE_MOCK_DATA=false
VITE_APP_NAME=Beacon
VITE_APP_VERSION=1.0.0
```

---

## 7. Test Connection

### Step 7.1: Start Development Server
```bash
npm run dev
```

### Step 7.2: Check Console
Open browser console (F12) and look for:
- ✅ No Supabase connection errors
- ✅ No authentication errors
- ❌ If you see errors, check your credentials

### Step 7.3: Test Database Connection
In Supabase SQL Editor, run:

```sql
-- Test query
SELECT COUNT(*) as tenant_count FROM tenants;
```

Should return `1` (the demo tenant from seed data)

---

## 8. Create First School

Now you need to create your first school and admin user.

### Option A: Using SQL (Quick Setup)

#### Step 8.1: Generate Setup Token
In Supabase SQL Editor, run:

```sql
SELECT * FROM create_setup_token(
  'Lincoln High School',           -- School name
  'lincoln-high',                   -- Subdomain (unique)
  'admin@lincolnhigh.edu',         -- Admin email
  24                                -- Expiration hours
);
```

This returns a JSON object with a `token` field. **Copy the token value!**

Example response:
```json
{
  "success": true,
  "token": "abc123def456ghi789jkl012mno345pq",
  "tenant_name": "Lincoln High School",
  "subdomain": "lincoln-high",
  "admin_email": "admin@lincolnhigh.edu",
  "expires_at": "2026-03-11T10:30:00Z"
}
```

#### Step 8.2: Complete Setup via Application
1. In your browser, go to: `http://localhost:5173/setup/{TOKEN}`
   - Replace `{TOKEN}` with the token from Step 8.1
2. Fill in the setup form:
   - First Name: Your first name
   - Last Name: Your last name
   - Password: Create a strong password
   - Confirm Password: Same password
   - Contact Info: Optional
3. Click "Complete Setup"
4. You'll be automatically logged in!

### Option B: Manual Database Setup (For Testing)

If you want to skip the setup flow for testing:

```sql
-- 1. Create tenant
INSERT INTO tenants (id, name, subdomain)
VALUES (
  gen_random_uuid(),
  'Test School',
  'test-school'
) RETURNING id;
-- Copy the returned UUID

-- 2. Create Supabase Auth user
-- Go to Authentication > Users > Add User
-- Email: admin@test.edu
-- Password: (set a password)
-- Auto confirm: YES
-- Copy the User ID

-- 3. Create application user
INSERT INTO users (
  id,                                    -- Use User ID from step 2
  tenant_id,                             -- Use tenant ID from step 1
  email,
  first_name,
  last_name,
  role,
  is_active
) VALUES (
  'c1400d01-47b3-47d0-b32c-bc0b26978f54',
  '00000000-0000-0000-0000-000000000001',
  'email@email.com',
  'Demaro',
  'Jones',
  'ADMIN',
  true
);
```

---

## 9. Verify Everything Works

### Step 9.1: Test Login
1. Go to `http://localhost:5173/login`
2. Enter your admin email and adminpassword
3. Click "Sign In"
4. You should see the dashboard!

### Step 9.2: Test Data Access
1. Click "Students" in sidebar
2. Should load (empty list is fine)
3. Click "Add Student" and create a test student
4. Verify student appears in list

### Step 9.3: Test Interactions
1. Click "Interactions" in sidebar
2. Click "Add Interaction"
3. Create a test interaction
4. Verify it appears in the list

### Step 9.4: Verify RLS is Working
In Supabase SQL Editor, run:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`

---

## Troubleshooting

### Issue: "Failed to fetch" or Connection Errors

**Solution:**
1. Verify your Supabase project is running (check dashboard)
2. Check your `.env.local` has correct URL and key
3. Restart your dev server: `npm run dev`
4. Check browser console for specific error messages

### Issue: "Invalid API key"

**Solution:**
1. Go to Supabase Settings > API
2. Copy the `anon` key (NOT the service_role key)
3. Update `.env.local` with correct key
4. Restart dev server

### Issue: "Row Level Security policy violation"

**Solution:**
1. Verify migration 002 ran successfully
2. Check that RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
3. Re-run migration 002 if needed

### Issue: "User not found" after login

**Solution:**
1. Verify you created an application user (not just auth user)
2. Check users table:
   ```sql
   SELECT * FROM users;
   ```
3. If empty, create user manually (see Option B above)

### Issue: Tables don't exist

**Solution:**
1. Re-run migrations in order (001-006)
2. Check for errors in SQL Editor
3. Verify each migration completed successfully

### Issue: Can't create interactions

**Solution:**
1. Verify reason categories exist:
   ```sql
   SELECT * FROM reason_categories;
   ```
2. If empty, re-run migration 003
3. Check that your user has correct tenant_id

### Issue: Setup token doesn't work

**Solution:**
1. Verify token hasn't expired (24 hours)
2. Check token hasn't been used:
   ```sql
   SELECT * FROM setup_tokens ORDER BY created_at DESC LIMIT 5;
   ```
3. Generate a new token if needed

---

## Production Deployment

When you're ready to deploy to production:

### Step 1: Update Environment Variables
Create `.env.production` with:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_USE_MOCK_DATA=false
```

### Step 2: Configure Production URLs
In Supabase:
1. Settings > API > URL Configuration
2. Add your production domain
3. Update redirect URLs

### Step 3: Enable Email Confirmations
1. Authentication > Providers > Email
2. Enable email confirmations
3. Configure SMTP settings (optional)

### Step 4: Set Up Custom Domain (Optional)
1. Settings > Custom Domains
2. Follow Supabase instructions
3. Update DNS records

### Step 5: Enable Database Backups
1. Settings > Database
2. Enable automatic backups
3. Configure backup schedule

---

## Next Steps

After setup is complete:

1. ✅ **Invite Users**: Use Admin > User Management to invite counselors
2. ✅ **Customize Categories**: Add/edit reason categories for your school
3. ✅ **Import Students**: Add student records (or import via CSV)
4. ✅ **Configure Settings**: Customize school information
5. ✅ **Train Users**: Share the User Guide with your team

---

## Useful SQL Queries

### Check Database Health
```sql
SELECT * FROM get_database_health();
```

### View All Users
```sql
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.is_active,
  t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC;
```

### View Pending Invitations
```sql
SELECT * FROM pending_invitations;
```

### View Security Events
```sql
SELECT 
  event_type,
  severity,
  created_at,
  details
FROM security_events
ORDER BY created_at DESC
LIMIT 20;
```

### Clean Up Expired Tokens
```sql
SELECT cleanup_expired_tokens();
```

### Refresh Analytics
```sql
SELECT refresh_analytics_views();
```

---

## Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Project Documentation**: See COMPREHENSIVE_README.md
- **Migration Review**: See MIGRATION_REVIEW.md

---

## Quick Reference

### Essential Supabase URLs
- Dashboard: `https://app.supabase.com/project/{project-id}`
- SQL Editor: `https://app.supabase.com/project/{project-id}/editor`
- Auth Settings: `https://app.supabase.com/project/{project-id}/auth/users`
- API Settings: `https://app.supabase.com/project/{project-id}/settings/api`

### Essential Commands
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check
```

### Essential SQL Functions
```sql
-- Create setup token
SELECT * FROM create_setup_token('School Name', 'subdomain', 'admin@email.com', 24);

-- Clean up expired tokens
SELECT cleanup_expired_tokens();

-- Get database health
SELECT * FROM get_database_health();

-- Refresh analytics
SELECT refresh_analytics_views();
```

---

**You're all set! Your Supabase backend is ready for the Beacon application.**

If you encounter any issues, refer to the Troubleshooting section or check the Supabase logs in your dashboard.
