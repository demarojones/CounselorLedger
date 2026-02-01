# Archived Migrations

This folder contains the original migration files that have been consolidated for better maintainability.

## Archive Date
January 2026

## Why Archived?
The original 15+ migration files contained significant redundancy:
- Multiple files updated the same functions 3-4 times
- Incremental fixes spread across many files
- Difficult to understand the current state
- Confusing migration order

## Consolidated Structure
The migrations have been consolidated into 6 clean files:

1. **001_core_schema.sql** - All core tables + schema additions
2. **002_security_policies.sql** - All RLS policies
3. **003_seed_data.sql** - Default categories and seed data
4. **004_setup_invitations.sql** - Complete setup/invitation system
5. **005_security_audit.sql** - Security + privacy event logging
6. **006_performance.sql** - All indexes + materialized views + maintenance

## Original Files (Archived)

### Core Schema (Kept)
- `001_initial_schema.sql` - Original core schema
- `002_rls_policies.sql` - Original RLS policies
- `003_seed_data.sql` - Original seed data

### Schema Additions (Merged into 001)
- `004_add_regarding_student.sql` - Added regarding_student_id column

### Setup & Invitations (Merged into 004)
- `005_setup_and_invitations.sql` - Setup/invitation tables
- `006_setup_functions.sql` - Initial setup functions
- `007_fix_invitation_auth_integration.sql` - Auth integration fix
- `008_update_accept_invitation_auth_integration.sql` - Auth update
- `009_add_tenant_contact_info.sql` - Tenant contact fields
- `010_update_setup_function_contact_info.sql` - Function update

### Security & Audit (Merged into 005)
- `011_security_events.sql` - Security events table
- `022_privacy_audit_events.sql` - Privacy audit extensions

### Performance (Merged into 006)
- `023_performance_indexes.sql` - Performance indexes
- `024_database_improvements.sql` - Comprehensive improvements

### Removed (Not Needed)
- `020_simplified_auth.sql` - Auto-registration (conflicts with manual setup)
- `021_simple_registration.sql` - Registration function (not needed)

## Migration Path

### For New Databases
Use the new consolidated migrations in `supabase/migrations/`

### For Existing Databases
If your database already has these migrations applied, no action needed.
The consolidated migrations produce the same final state.

## Restoration
If you need to reference the original migrations, they are preserved here.
Do not run these migrations on new databases - use the consolidated versions instead.

## Documentation
See `MIGRATION_CONSOLIDATION_PLAN.md` in the project root for detailed consolidation strategy.
