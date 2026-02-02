# Technical Guide - School Counselor Ledger

Complete technical documentation for developers, system administrators, and technical staff.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Multi-Tenant System](#multi-tenant-system)
4. [Security & Privacy](#security--privacy)
5. [Onboarding Process](#onboarding-process)
6. [API Reference](#api-reference)
7. [Development Guide](#development-guide)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React App)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │ Interactions │  │   Reports    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │  PostgreSQL  │  │   Real-time  │     │
│  │   (Users)    │  │   (Data)     │  │  (Updates)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Row Level Security (RLS) Policies            │  │
│  │  • Tenant Isolation  • Counselor Privacy             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui for components
- React Query for state management
- FullCalendar for scheduling
- Recharts for data visualization

**Backend:**
- Supabase (PostgreSQL 15+)
- Supabase Auth for authentication
- Supabase Real-time for live updates
- Row Level Security (RLS) for access control

**Development:**
- Mock Service Worker (MSW) for API mocking
- Faker.js for test data generation
- ESLint + Prettier for code quality
- TypeScript strict mode

---

## Database Schema

### Core Tables

#### tenants
Stores school/organization information.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  contact_phone TEXT,
  contact_address TEXT,
  contact_email TEXT,
  contact_person_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### users
Application users linked to Supabase Auth.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'COUNSELOR')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);
```

**Important:** Email must be unique per tenant AND globally unique in Supabase Auth.

#### students
Student records for counseling interactions.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  needs_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, student_id)
);
```

#### contacts
External contacts (parents, teachers, etc.).

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  organization TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### interactions
Counseling interaction records.

```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  regarding_student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES reason_categories(id),
  subcategory_id UUID REFERENCES reason_subcategories(id),
  custom_reason TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  needs_follow_up BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  is_follow_up_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (student_id IS NOT NULL OR contact_id IS NOT NULL)
);
```

#### setup_tokens
Tokens for initial school setup.

```sql
CREATE TABLE setup_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,  -- Hashed
  tenant_name TEXT NOT NULL,
  tenant_subdomain TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### invitations
User invitation tokens.

```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'COUNSELOR')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,  -- Hashed
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### security_events
Audit log for security events.

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Functions

#### create_setup_token
Generates a setup token for new school onboarding.

```sql
SELECT * FROM create_setup_token(
  'School Name',
  'subdomain',
  'admin@school.edu',
  24  -- expiration hours
);
```

#### complete_initial_setup
Completes initial setup (creates tenant and admin user).

```sql
SELECT * FROM complete_initial_setup(
  p_token TEXT,
  p_auth_user_id UUID,
  p_tenant_name TEXT,
  p_subdomain TEXT,
  p_admin_email TEXT,
  p_admin_first_name TEXT,
  p_admin_last_name TEXT,
  p_contact_phone TEXT,
  p_contact_address TEXT,
  p_contact_email TEXT,
  p_contact_person_name TEXT
);
```

#### accept_invitation
Accepts user invitation and creates application user.

```sql
SELECT * FROM accept_invitation(
  p_token TEXT,
  p_auth_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT
);
```

---

## Multi-Tenant System

### Tenant Isolation

Each school (tenant) is completely isolated:
- Separate data in all tables
- Cannot access other tenants' data
- Enforced at database level via RLS

### Row Level Security (RLS)

All tables have RLS policies that automatically filter by tenant_id:

```sql
-- Example: Students table RLS policy
CREATE POLICY "Users can only access students in their tenant"
ON students
FOR ALL
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

### Counselor Privacy

Interactions are private to the counselor who created them:

```sql
-- Counselors can only see their own interactions
CREATE POLICY "Counselors can only access their own interactions"
ON interactions
FOR ALL
USING (
  counselor_id = auth.uid() OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
);
```

Admins can see all interactions in their tenant (with audit logging).

### Shared Data

Students and contacts are shared within a tenant:
- All counselors in a school can see all students
- All counselors can see all contacts
- Prevents duplicate records
- Enables collaboration

---

## Security & Privacy

### Authentication Flow

1. User enters email/password
2. Supabase Auth validates credentials
3. JWT token issued with user ID
4. Application fetches user record from `users` table
5. User context includes: id, email, role, tenant_id

### Authorization Levels

**Counselor:**
- Read/write own interactions
- Read/write students (shared)
- Read/write contacts (shared)
- Read own reports
- Cannot access admin features

**Admin:**
- All counselor permissions
- Read all interactions in tenant (logged)
- Invite/manage users
- View organization reports
- Access security events
- Manage categories

### Token Security

**Setup Tokens:**
- Cryptographically secure (32+ characters)
- Hashed with bcrypt before storage
- Single-use only
- Expire after 24 hours
- Cannot be reused after consumption

**Invitation Tokens:**
- Cryptographically secure (32+ characters)
- Hashed with bcrypt before storage
- Single-use only
- Expire after 7 days
- Can be resent (generates new token)

### Rate Limiting

**Invitation Creation:**
- 10 per hour per user
- 20 per hour per IP address

**Invitation Resend:**
- 5 per 15 minutes per IP
- 10 per hour per user

**Authentication:**
- Supabase default limits apply

### Audit Logging

All admin actions are logged to `security_events`:
- User invitations
- Invitation acceptance
- Access to counselor data
- Role changes
- User activation/deactivation
- Failed authentication attempts
- Token manipulation attempts

---

## Onboarding Process

### Phase 1: Setup Token Generation

**Who:** System Administrator

**Process:**
```sql
-- Generate setup token
SELECT * FROM create_setup_token(
  'Lincoln High School',
  'lincoln-high',
  'admin@lincolnhigh.edu',
  24
);
```

**Result:** Returns plain token to send to school admin.

**Email Template:**
```
Subject: Welcome to School Counselor Ledger - Complete Your Setup

Hi [Admin Name],

Welcome! Your organization "Lincoln High School" has been registered.

Setup Link: https://app.counselorledger.com/setup/{token}

This link expires in 24 hours.

Best regards,
School Counselor Ledger Team
```

### Phase 2: Initial Setup

**Who:** School Administrator

**Process:**
1. Click setup link from email
2. System validates token (exists, not expired, not used)
3. Form pre-fills organization name and admin email
4. Admin fills:
   - Subdomain (e.g., "lincoln-high")
   - First/Last name
   - Password
   - Contact info (optional)
5. Click "Complete Setup"

**Backend Process:**
1. Create Supabase Auth user
2. Create tenant record
3. Create application user record
4. Mark token as used
5. Auto-login admin
6. Send confirmation email
7. Redirect to dashboard

**Result:** School is set up with one admin user.

### Phase 3: User Invitations

**Who:** School Administrator

**Process:**
1. Navigate to Admin → User Management
2. Click "Invite User"
3. Fill form:
   - Email
   - First/Last name
   - Role (Admin or Counselor)
4. Click "Send Invitation"

**Backend Process:**
1. Validate email not already in use
2. Check no pending invitation exists
3. Generate secure invitation token
4. Create invitation record (expires in 7 days)
5. Send invitation email
6. Log security event

**Email Template:**
```
Subject: You've been invited to join Lincoln High School

Hi [First Name],

[Inviter Name] has invited you to join Lincoln High School on 
School Counselor Ledger as a [Role].

Accept Invitation: https://app.counselorledger.com/invite/{token}

This invitation expires on [Date].

Best regards,
School Counselor Ledger Team
```

### Phase 4: Invitation Acceptance

**Who:** Invited User

**Process:**
1. Click invitation link from email
2. System validates token (exists, not expired, not accepted)
3. Form shows email and role (read-only)
4. User fills:
   - First/Last name
   - Password
   - Confirm password
5. Click "Create Account"

**Backend Process:**
1. Create Supabase Auth user
2. Create application user record
3. Link to tenant
4. Mark invitation as accepted
5. Auto-login user
6. Log security event
7. Redirect to dashboard

**Result:** User account created and active.

### Invitation Management

**Resend Invitation:**
1. Admin → User Management → Pending Invitations
2. Find invitation → Click "Resend"
3. New token generated (7-day expiration)
4. New email sent

**Cancel Invitation:**
1. Admin → User Management → Pending Invitations
2. Find invitation → Click "Cancel"
3. Invitation deleted (user cannot accept)

---

## API Reference

### Authentication

**Login:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@email.com',
  password: 'password'
});
```

**Logout:**
```typescript
const { error } = await supabase.auth.signOut();
```

**Get Current User:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Setup Service

**Validate Setup Token:**
```typescript
import { validateSetupToken } from '@/services/setupService';

const { data, error } = await validateSetupToken(token);
// Returns: { isValid, tenantName, adminEmail, expiresAt }
```

**Complete Initial Setup:**
```typescript
import { completeInitialSetup } from '@/services/setupService';

const { data, error } = await completeInitialSetup(token, {
  tenantName: 'School Name',
  subdomain: 'subdomain',
  adminFirstName: 'John',
  adminLastName: 'Doe',
  adminEmail: 'admin@school.edu',
  adminPassword: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  // Optional fields
  contactPhone: '(555) 123-4567',
  contactEmail: 'contact@school.edu',
  contactAddress: '123 Main St',
  contactPersonName: 'Jane Smith, Principal'
});
```

### Invitation Service

**Create Invitation:**
```typescript
import { createInvitation } from '@/services/invitationService';

const { data, error } = await createInvitation({
  email: 'user@email.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'COUNSELOR'  // or 'ADMIN'
});
```

**Validate Invitation Token:**
```typescript
import { validateInvitationToken } from '@/services/invitationService';

const { data, error } = await validateInvitationToken(token);
// Returns: { isValid, email, role, tenantId, expiresAt }
```

**Accept Invitation:**
```typescript
import { acceptInvitation } from '@/services/invitationService';

const { data, error } = await acceptInvitation(token, {
  firstName: 'John',
  lastName: 'Doe',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!'
});
```

**Get Pending Invitations:**
```typescript
import { getPendingInvitations } from '@/services/invitationService';

const { data, error } = await getPendingInvitations();
// Returns array of pending invitations for current tenant
```

**Resend Invitation:**
```typescript
import { resendInvitation } from '@/services/invitationService';

const { data, error } = await resendInvitation(invitationId);
// Generates new token and sends new email
```

**Cancel Invitation:**
```typescript
import { cancelInvitation } from '@/services/invitationService';

const { data, error } = await cancelInvitation(invitationId);
```

### Data Services

**Fetch Interactions:**
```typescript
import { useInteractions } from '@/hooks/useInteractions';

const {
  interactions,
  students,
  contacts,
  categories,
  isLoading,
  error,
  createInteraction,
  updateInteraction,
  deleteInteraction
} = useInteractions();
```

**Create Interaction:**
```typescript
await createInteraction({
  studentId: 'uuid',
  categoryId: 'uuid',
  subcategoryId: 'uuid',
  startTime: new Date().toISOString(),
  durationMinutes: 30,
  notes: 'Meeting notes',
  needsFollowUp: true,
  followUpDate: '2024-01-15',
  followUpNotes: 'Follow up notes'
});
```

---

## Development Guide

### Local Development Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd counselor-ledger
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **For mock data development:**
   ```bash
   # In .env.local
   VITE_USE_MOCK_DATA=true
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Mock Data Mode

Uses Mock Service Worker (MSW) to intercept API calls:
- No backend setup required
- Realistic test data with Faker.js
- Data persists in localStorage
- Fast iteration

**Mock Credentials:**
- Admin: `admin@school.edu` / `password123`
- Counselor: `counselor@school.edu` / `password123`

### Supabase Mode

1. **Create Supabase project**
2. **Run migrations** in order (001-005)
3. **Configure .env.local:**
   ```bash
   VITE_USE_MOCK_DATA=false
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Code Style

**ESLint Configuration:**
- TypeScript strict mode
- React hooks rules
- Prettier integration

**Run linting:**
```bash
npm run lint
npm run lint:fix
```

**Format code:**
```bash
npm run format
npm run format:check
```

**Type checking:**
```bash
npm run type-check
```

### Component Structure

```typescript
// Example component structure
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onAction();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <h2>{title}</h2>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Click Me'}
      </Button>
    </Card>
  );
}
```

### Custom Hooks

```typescript
// Example custom hook
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('last_name');

        if (error) throw error;
        setStudents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStudents();
  }, []);

  return { students, isLoading, error };
}
```

---

## Deployment

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Environment Variables

**Required:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_DATA=false
```

**Optional:**
```bash
VITE_APP_NAME=School Counselor Ledger
VITE_SUPPORT_EMAIL=support@example.com
```

### Deployment Checklist

- [ ] All migrations run successfully
- [ ] RLS policies enabled on all tables
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Email service configured
- [ ] Test admin login
- [ ] Test counselor login
- [ ] Verify data isolation
- [ ] Test invitation flow
- [ ] Check security event logging

### Hosting Options

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Static Hosting:**
- Upload `dist/` contents to any static host
- Configure redirects for SPA routing

---

## Troubleshooting

### Common Issues

**Issue: Can't log in**
- Verify account exists in `users` table
- Check `is_active = true`
- Verify password is correct
- Check Supabase Auth logs

**Issue: User didn't receive email**
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email settings
- Resend invitation from UI

**Issue: Token expired**
- Generate new setup token (SQL)
- Resend invitation (UI)
- Tokens cannot be extended, only regenerated

**Issue: Subdomain already taken**
- Choose different subdomain
- Add location identifier (e.g., "lincoln-high-ca")

**Issue: Data not showing**
- Verify RLS policies enabled
- Check tenant_id matches
- Confirm user role has access
- Check browser console for errors

**Issue: Cross-tenant data visible**
- This should never happen if RLS is working
- Verify RLS policies are enabled
- Check policy definitions
- Test with different tenant users

### Debugging

**Check RLS Status:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Test Tenant Isolation:**
```sql
-- As user from Tenant A, try to access Tenant B data
-- Should return 0 rows
SELECT COUNT(*) FROM interactions
WHERE tenant_id = 'TENANT_B_ID';
```

**Check User Context:**
```sql
SELECT 
  id,
  email,
  role,
  tenant_id,
  is_active
FROM users
WHERE id = auth.uid();
```

**View Security Events:**
```sql
SELECT 
  event_type,
  severity,
  description,
  created_at
FROM security_events
WHERE tenant_id = 'YOUR_TENANT_ID'
ORDER BY created_at DESC
LIMIT 50;
```

### Performance Optimization

**Database Indexes:**
- All foreign keys have indexes
- Composite indexes on frequently queried columns
- Partial indexes for filtered queries

**Query Optimization:**
- Use `select()` to fetch only needed columns
- Implement pagination for large datasets
- Use React Query for caching

**Frontend Optimization:**
- Code splitting with React.lazy()
- Memoization with useMemo/useCallback
- Virtual scrolling for long lists

### Support Resources

**Documentation:**
- README.md - Quick start and overview
- TECHNICAL_GUIDE.md - This document
- Supabase Docs - https://supabase.com/docs

**Logs:**
- Browser console for frontend errors
- Supabase Dashboard → Logs for backend errors
- Security events table for audit trail

**Common SQL Queries:**
```sql
-- Get tenant ID
SELECT id, name FROM tenants WHERE subdomain = 'subdomain';

-- List all users in tenant
SELECT email, first_name, last_name, role, is_active
FROM users
WHERE tenant_id = 'TENANT_ID'
ORDER BY created_at;

-- Check pending invitations
SELECT email, role, expires_at, is_expired
FROM pending_invitations
WHERE tenant_id = 'TENANT_ID'
ORDER BY created_at DESC;

-- View recent security events
SELECT event_type, severity, description, created_at
FROM security_events
WHERE tenant_id = 'TENANT_ID'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Appendix

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Specifications

**Setup Token:**
- Length: 32+ characters
- Format: Alphanumeric
- Hashing: bcrypt
- Expiration: 24 hours (configurable)
- Usage: Single-use

**Invitation Token:**
- Length: 32+ characters
- Format: Alphanumeric
- Hashing: bcrypt
- Expiration: 7 days
- Usage: Single-use

### Rate Limits

| Action | Limit |
|--------|-------|
| Invitation Creation | 10/hour per user, 20/hour per IP |
| Invitation Resend | 5/15min per IP, 10/hour per user |
| Login Attempts | Supabase defaults |

### Database Constraints

- Email must be unique per tenant
- Email must be globally unique (Supabase Auth)
- Student ID must be unique per tenant
- Subdomain must be globally unique
- Interaction must have student OR contact (not both null)

---

**Last Updated:** 2024
**Version:** 1.0
