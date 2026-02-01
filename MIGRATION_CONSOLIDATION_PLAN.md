# Migration Consolidation Plan

## Current State Analysis

You have **15 migration files** with significant redundancy and incremental fixes. Many migrations update the same functions multiple times.

### Current Migrations:
1. `001_initial_schema.sql` - Core schema ✅ **KEEP**
2. `002_rls_policies.sql` - Security policies ✅ **KEEP**
3. `003_seed_data.sql` - Default categories ✅ **KEEP**
4. `004_add_regarding_student.sql` - Small schema addition ⚠️ **MERGE**
5. `005_setup_and_invitations.sql` - Setup/invitation tables ⚠️ **MERGE**
6. `006_setup_functions.sql` - Setup functions ❌ **REDUNDANT**
7. `007_fix_invitation_auth_integration.sql` - Function update ❌ **REDUNDANT**
8. `008_update_accept_invitation_auth_integration.sql` - Function update ❌ **REDUNDANT**
9. `009_add_tenant_contact_info.sql` - Tenant fields ❌ **REDUNDANT**
10. `010_update_setup_function_contact_info.sql` - Function update ❌ **REDUNDANT**
11. `011_security_events.sql` - Security logging ⚠️ **MERGE**
12. `020_simplified_auth.sql` - Auth simplification ❌ **REMOVE** (conflicts with manual setup)
13. `021_simple_registration.sql` - Registration function ❌ **REMOVE** (not needed)
14. `022_privacy_audit_events.sql` - Privacy logging ⚠️ **MERGE**
15. `023_performance_indexes.sql` - Performance indexes ⚠️ **MERGE**
16. `024_database_improvements.sql` - Comprehensive improvements ⚠️ **MERGE**

---

## Consolidation Strategy

### Recommended Structure (5 Files):

```
supabase/migrations/
├── 001_core_schema.sql          # Core tables + regarding_student
├── 002_security_policies.sql    # All RLS policies
├── 003_setup_invitations.sql    # Setup/invitation system (complete)
├── 004_security_audit.sql       # Security + privacy events
├── 005_performance.sql          # All indexes + materialized views
```

---

## Detailed Consolidation Plan

### ✅ File 1: `001_core_schema.sql`
**Merge:** 001 + 004
- Keep all core tables
- Add `regarding_student_id` column
- Add tenant contact fields (phone, address, email, person_name)
- Keep all views and triggers

### ✅ File 2: `002_security_policies.sql`
**Keep:** 002 (no changes needed)
- All RLS policies are correct
- No redundancy

### ✅ File 3: `003_setup_invitations.sql`
**Merge:** 005 + 006 + 007 + 008 + 009 + 010
- Setup tokens table
- Invitations table
- **Final versions** of functions:
  - `complete_initial_setup()` (with all contact fields)
  - `accept_invitation()` (with auth integration)
  - `cleanup_expired_tokens()`
- Views for pending invitations
- RLS policies for setup/invitation tables

### ✅ File 4: `004_security_audit.sql`
**Merge:** 011 + 022
- Security events table (with all event types)
- Privacy audit functions
- Security views
- Audit trail functions

### ✅ File 5: `005_performance.sql`
**Merge:** 023 + 024
- All performance indexes
- Materialized views
- Maintenance functions
- Health check functions

### ❌ Remove: 020, 021
- These add auto-registration which conflicts with manual setup
- Not needed for your use case

---

## Benefits of Consolidation

### Before:
- 15 files
- Multiple function redefinitions
- Confusing order
- Hard to understand what's current

### After:
- 5 files
- Clear purpose for each
- No redundancy
- Easy to understand and maintain

---

## Migration Path

### Option A: Fresh Start (Recommended for New Projects)
1. Delete all existing migrations
2. Create 5 new consolidated files
3. Run on fresh database

### Option B: Keep History (For Existing Databases)
1. Keep all existing migrations (001-024)
2. Add new migration `025_consolidation_cleanup.sql` that:
   - Drops and recreates functions with final versions
   - Adds any missing indexes
   - Documents the consolidation

---

## Consolidated File Contents

### 1. Core Schema (001_core_schema.sql)
```sql
-- Core tables: tenants, users, students, contacts, 
-- reason_categories, reason_subcategories, interactions
-- PLUS: regarding_student_id, tenant contact fields
-- Views: student_stats, contact_stats, pending_follow_ups
-- Triggers: updated_at, end_time calculation
```

### 2. Security Policies (002_security_policies.sql)
```sql
-- RLS policies for all tables
-- Helper functions: get_user_tenant_id(), is_admin(), is_counselor()
-- Tenant isolation enforcement
```

### 3. Setup & Invitations (003_setup_invitations.sql)
```sql
-- Tables: setup_tokens, invitations
-- Functions: complete_initial_setup(), accept_invitation(), cleanup_expired_tokens()
-- Views: pending_invitations, setup_token_status
-- RLS policies for setup/invitation tables
```

### 4. Security & Audit (004_security_audit.sql)
```sql
-- Table: security_events (all event types)
-- Functions: log_security_event(), get_privacy_compliance_stats(), 
--            get_interaction_audit_trail(), get_privacy_violation_summary()
-- Views: security_event_summary, suspicious_activity
-- Indexes for audit queries
```

### 5. Performance (005_performance.sql)
```sql
-- All composite indexes for interactions, students, contacts
-- Materialized views: tenant_statistics, interaction_analytics
-- Functions: refresh_analytics_views(), daily_maintenance(), get_database_health()
-- Maintenance and cleanup functions
```

---

## Seed Data

Keep `003_seed_data.sql` separate OR merge into `001_core_schema.sql` at the end.

**Recommendation:** Keep separate for flexibility (can skip in production if you want empty start).

---

## Implementation Steps

### If Starting Fresh:

1. **Backup** existing migrations folder
2. **Create** new consolidated files
3. **Test** on local Supabase instance
4. **Verify** all tables, functions, and policies work
5. **Update** MANUAL_SETUP_GUIDE.md to reference new files

### If Database Already Exists:

1. **Keep** all existing migrations (001-024)
2. **Create** `025_consolidation_note.sql` with documentation
3. **Future migrations** follow the 5-file pattern

---

## Recommendation

**For your use case (manual setup, single/multi-tenant):**

✅ **Create consolidated migrations** (5 files)
✅ **Remove** 020, 021 (auto-registration not needed)
✅ **Keep** seed data separate
✅ **Update** setup guide to reference new structure

This will make the system much cleaner and easier to maintain!

---

## Next Steps

Would you like me to:
1. ✅ Create the 5 consolidated migration files
2. ✅ Update the MANUAL_SETUP_GUIDE.md
3. ✅ Create a migration from old to new structure
4. ✅ Test the consolidated migrations

Let me know and I'll proceed!
