# Supabase Setup Guide

This guide will walk you through setting up Supabase for the School Counselor Ledger application, including creating a project, running migrations, and configuring your environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create a Supabase Project](#create-a-supabase-project)
3. [Install Supabase CLI](#install-supabase-cli)
4. [Configure Environment Variables](#configure-environment-variables)
5. [Run Database Migrations](#run-database-migrations)
6. [Verify Setup](#verify-setup)
7. [Switching from Mock to Real Data](#switching-from-mock-to-real-data)
8. [Local Development with Supabase](#local-development-with-supabase)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Git (for version control)

## Create a Supabase Project

### Step 1: Sign Up / Log In

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Create an account or log in with GitHub, GitLab, or email

### Step 2: Create a New Project

1. Click "New Project" from your dashboard
2. Fill in the project details:
   - **Name**: `school-counselor-ledger` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select "Free" for development or "Pro" for production
3. Click "Create new project"
4. Wait 2-3 minutes for your project to be provisioned

### Step 3: Get Your Project Credentials

Once your project is ready:

1. Go to **Settings** → **API** in the left sidebar
2. You'll need these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: Your public API key (starts with `eyJ...`)
   - **service_role key**: Your service role key (keep this secret!)

## Install Supabase CLI

The Supabase CLI allows you to manage migrations and run a local development environment.

### macOS / Linux

```bash
# Using Homebrew
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Windows

```bash
# Using npm
npm install -g supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verify Installation

```bash
supabase --version
```

## Configure Environment Variables

### Step 1: Copy Environment Template

```bash
cp .env.example .env.local
```

### Step 2: Update Environment Variables

Edit `.env.local` and add your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Application Mode
# Set to 'false' to use real Supabase backend
# Set to 'true' to use mock data (for development without Supabase)
VITE_USE_MOCK_DATA=false

# Optional: For local Supabase development
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Run Database Migrations

### Option 1: Using Supabase Dashboard (Recommended for First-Time Setup)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click **Run** to execute the migration
6. Repeat for `002_rls_policies.sql` and `003_seed_data.sql`

### Option 2: Using Supabase CLI

First, link your local project to your Supabase project:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-id
```

Then run the migrations:

```bash
# Push all migrations to your Supabase project
supabase db push

# Or run migrations individually
supabase db execute --file supabase/migrations/001_initial_schema.sql
supabase db execute --file supabase/migrations/002_rls_policies.sql
supabase db execute --file supabase/migrations/003_seed_data.sql
```

## Verify Setup

### Check Database Tables

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `tenants`
   - `users`
   - `students`
   - `contacts`
   - `reason_categories`
   - `reason_subcategories`
   - `interactions`

### Check Seed Data

1. Click on the `reason_categories` table
2. You should see 8 default categories (Academic, Behavioral, etc.)
3. Click on the `tenants` table
4. You should see the "Demo High School" tenant

### Test Authentication

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **Add user** → **Create new user**
3. Create a test user with:
   - Email: `admin@demo.school`
   - Password: Choose a secure password
   - Auto Confirm User: ✓ (checked)

4. Go to **SQL Editor** and run this query to add the user to your tenant:

```sql
-- Replace 'user-uuid-here' with the actual UUID from the auth.users table
-- Replace 'admin@demo.school' with your test user's email
INSERT INTO users (id, tenant_id, email, first_name, last_name, role, is_active)
VALUES (
  'user-uuid-here',
  '00000000-0000-0000-0000-000000000001',
  'admin@demo.school',
  'Admin',
  'User',
  'ADMIN',
  true
);
```

## Switching from Mock to Real Data

The application supports both mock data (for development) and real Supabase data.

### Currently Using Mock Data?

If you've been developing with mock data, here's how to switch:

1. **Update Environment Variable**:
   ```env
   # In .env.local
   VITE_USE_MOCK_DATA=false
   ```

2. **Restart Development Server**:
   ```bash
   npm run dev
   ```

3. **Create Test Users**:
   - Use the Supabase dashboard to create test users
   - Add them to the `users` table with appropriate roles
   - Use the seed data tenant or create your own

4. **Test Login**:
   - Navigate to `http://localhost:5173`
   - Log in with your test user credentials
   - Verify that you can access the dashboard

### Switching Back to Mock Data

To switch back to mock data for testing:

```env
# In .env.local
VITE_USE_MOCK_DATA=true
```

Then restart your development server.

## Local Development with Supabase

For a complete local development environment, you can run Supabase locally using Docker.

### Prerequisites

- Docker Desktop installed and running
- Supabase CLI installed

### Start Local Supabase

```bash
# Start local Supabase (first time will download Docker images)
supabase start

# This will output your local credentials:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Anon key: eyJ... (your local anon key)
```

### Configure for Local Development

Update `.env.local` for local development:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key-from-supabase-start
VITE_USE_MOCK_DATA=false
```

### Run Migrations Locally

```bash
# Apply migrations to local database
supabase db reset

# Or push specific migrations
supabase db push
```

### Access Local Studio

Open [http://localhost:54323](http://localhost:54323) to access the local Supabase Studio (similar to the cloud dashboard).

### Stop Local Supabase

```bash
supabase stop
```

## Troubleshooting

### Issue: "Invalid API key" Error

**Solution**: 
- Verify your `VITE_SUPABASE_ANON_KEY` is correct
- Make sure you're using the **anon/public** key, not the service_role key
- Check that there are no extra spaces or line breaks in your `.env.local`

### Issue: "Cross-origin request blocked" Error

**Solution**:
- Ensure your Supabase project URL is correct
- Check that your project is not paused (free tier projects pause after inactivity)
- Verify CORS settings in Supabase dashboard under **Settings** → **API**

### Issue: "Row Level Security policy violation"

**Solution**:
- Ensure you're logged in with a valid user
- Verify the user exists in the `users` table (not just `auth.users`)
- Check that the user has the correct `tenant_id`
- Review RLS policies in `002_rls_policies.sql`

### Issue: "Cannot read property 'tenant_id' of null"

**Solution**:
- The authenticated user doesn't exist in the `users` table
- After creating a user in Supabase Auth, you must also insert them into the `users` table
- Use the SQL query from the "Test Authentication" section above

### Issue: Migrations Fail to Run

**Solution**:
- Check for syntax errors in migration files
- Ensure migrations are run in order (001, 002, 003)
- Try running migrations individually through the SQL Editor
- Check the Supabase logs for detailed error messages

### Issue: "No rows returned" When Querying Data

**Solution**:
- Verify RLS policies are correctly configured
- Check that your user has the correct `tenant_id`
- Ensure seed data was inserted successfully
- Try querying with RLS disabled (for debugging only):
  ```sql
  -- In SQL Editor (for debugging only)
  SET LOCAL ROLE postgres;
  SELECT * FROM students;
  ```

### Getting Help

- **Supabase Documentation**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **Project Issues**: Check the GitHub repository issues page

## Next Steps

After completing the setup:

1. ✅ Create additional test users with different roles (ADMIN and COUNSELOR)
2. ✅ Add sample students and contacts through the application UI
3. ✅ Create test interactions to verify the full workflow
4. ✅ Test the calendar view and reporting features
5. ✅ Configure Row Level Security policies for your specific needs
6. ✅ Set up automated backups in Supabase dashboard
7. ✅ Review and customize reason categories for your school

## Production Deployment

When deploying to production:

1. Use environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Never expose your `service_role` key in the frontend
3. Enable email confirmations in Supabase Auth settings
4. Set up proper SMTP for email delivery
5. Configure custom domain for your Supabase project (Pro plan)
6. Enable database backups and point-in-time recovery
7. Set up monitoring and alerts
8. Review and tighten RLS policies for production use

---

**Need Help?** If you encounter issues not covered in this guide, please open an issue on the project repository or consult the Supabase documentation.
