# Supabase Migrations

Consolidated migration files for the School Counselor Ledger application.

## Migration Files

Run these migrations in order on a fresh Supabase database:

### 1. Core Schema (`001_core_schema.sql`)
**Purpose:** Creates all core database tables and structure

**Creates:**
- `tenants` - School/district information
- `users` - Application users (linked to Supabase Auth)
- `students` - Student records
- `contacts` - External contacts (parents, teachers)
- `reason_categories` - Interaction categories
- `reason_subcategories` - Detailed subcategories
- `interactions` - Counseling interaction records

**Features:**
- Automatic `updated_at` timestamps
- Automatic `end_time` calculation
- Views for statistics and follow-ups
- Full multi-tenant support

### 2. Security Policies (`002_security_policies.sql`)
**Purpose:** Implements Row Level Security for data isolation

**Creates:**
- RLS policies for all tables
- Helper functions for tenant/role checking
- Tenant boundary enforcement
- Role-based access control (ADMIN vs COUNSELOR)

**Security:**
- Counselors see only their own interactions
- Admins see all data within their tenant
- Complete tenant isolation

### 3. Seed Data (`003_seed_data.sql`)
**Purpose:** Provides default categories and demo tenant

**Creates:**
- Demo tenant (optional)
- 8 default reason categories
- 40+ subcategories

**Note:** Skip this if you want to start with an empty database.

### 4. Setup & Invitations (`004_setup_invitations.sql`)
**Purpose:** Enables tenant setup and user invitation workflows

**Creates:**
- `setup_tokens` - For initial tenant creation
- `invitations` - For user invitations
- Functions for setup and invitation acceptance
- Views for pending invitations

**Functions:**
- `complete_initial_setup()` - Create tenant and admin
- `accept_invitation()` - Accept user invitation
- `cleanup_expired_tokens()` - Remove old tokens

### 5. Security & Audit (`005_security_audit.sql`)
**Purpose:** Comprehensive security logging and privacy compliance

**Creates:**
- `security_events` - Security and privacy event log
- Functions for logging and compliance reporting
- Views for suspicious activity detection

**Features:**
- Privacy compliance tracking
- Audit trails for interactions
- Violation detection and reporting

### 6. Performance (`006_performance.sql`)
**Purpose:** Optimizes query performance and provides analytics

**Creates:**
- Composite indexes for fast queries
- Materialized views for analytics
- Maintenance functions
- Health check functions

**Features:**
- Optimized for counselor privacy filtering
- Daily analytics refresh
- Automatic cleanup tasks

## Quick Start

### Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run each migration file in order (001 → 006)
4. Verify tables were created

### Using Supabase CLI

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Verification

After running all migrations:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check materialized views
SELECT matviewname FROM pg_matviews 
WHERE schemaname = 'public';
```

## Next Steps

After running migrations:
1. Follow `MANUAL_SETUP_GUIDE.md` to create your first tenant
2. Create admin and counselor users
3. Start using the application

## Maintenance

### Daily Tasks (Automated)
```sql
-- Run daily maintenance (cleanup + analytics refresh)
SELECT daily_maintenance();
```

### Manual Refresh
```sql
-- Refresh analytics views
SELECT refresh_analytics_views();

-- Clean up expired tokens
SELECT cleanup_expired_tokens();

-- Check database health
SELECT * FROM get_database_health();
```

## Troubleshooting

### Migration Fails
- Check Supabase logs for specific error
- Ensure migrations run in order
- Verify no existing tables conflict

### RLS Issues
- Ensure user has proper tenant_id
- Check user role is set correctly
- Verify RLS policies are enabled

### Performance Issues
- Run `ANALYZE` on large tables
- Check index usage with `performance_stats` view
- Refresh materialized views

## Documentation

- **Setup Guide:** `../MANUAL_SETUP_GUIDE.md`
- **Consolidation Details:** `../MIGRATION_CONSOLIDATION_COMPLETE.md`
- **Archived Migrations:** `../migrations_archive/`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the setup guide
3. Check Supabase documentation: https://supabase.com/docs
