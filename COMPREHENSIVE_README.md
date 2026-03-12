# Beacon - Complete Documentation

> A comprehensive multi-tenant application for school counselors to track student interactions, manage contacts, and generate reports with enterprise-grade privacy and security.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features Overview](#features-overview)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [User Guide](#user-guide)
6. [Technical Documentation](#technical-documentation)
7. [Privacy & Security](#privacy--security)
8. [Development Guide](#development-guide)
9. [API Reference](#api-reference)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (or use mock data for development)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd beacon
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Start development
npm run dev
```

### Development Modes

**Mock Data Mode** (No backend needed):
```bash
# In .env.local
VITE_USE_MOCK_DATA=true
```
Access at http://localhost:5173 with demo credentials:
- Admin: `admin@mayfield.edu` / any password
- Counselor: `counselor@lincoln-hs.edu` / any password

**Supabase Mode** (Production):
```bash
# In .env.local
VITE_USE_MOCK_DATA=false
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Features Overview

### Core Functionality
- **Interaction Tracking** - Record counseling sessions with students and contacts
- **Student Management** - Comprehensive profiles with interaction history
- **Contact Management** - Track parents, teachers, and external contacts
- **Calendar Integration** - Visual scheduling with FullCalendar
- **Follow-up System** - Automated reminders and task tracking
- **Reporting Suite** - Analytics with CSV/PDF export

### Privacy & Security
- **Multi-Tenant Architecture** - Complete data isolation between schools
- **Counselor Privacy** - Interactions remain private to the creator
- **Admin Oversight** - Aggregated reporting with audit logging
- **Row Level Security** - Database-enforced access control
- **FERPA Compliance** - Educational privacy requirements built-in
- **Security Event Logging** - Comprehensive audit trail

### User Roles
- **Admin** - Organization-wide reports, user management, system configuration
- **Counselor** - Personal interactions, student management, individual reports

---

## Architecture

### Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite
- Tailwind CSS + Shadcn/ui
- React Query for state management
- FullCalendar for scheduling
- Recharts for data visualization

**Backend:**
- Supabase (PostgreSQL + Auth + Real-time)
- Row Level Security (RLS) for access control
- Database functions for complex operations

**Development:**
- Mock Service Worker (MSW) for API mocking
- Faker.js for test data generation
- ESLint + Prettier for code quality

### Multi-Tenant System

Each school is a completely isolated tenant with:
- Separate data (students, interactions, contacts)
- Own admin team and counselors
- Complete privacy via Row Level Security (RLS)
- Independent reporting and analytics

**Key Security Features:**
- Counselors only see their own interactions
- Admins see organization-wide data (with audit logging)
- Cross-tenant access is impossible
- All admin actions are logged

### Privacy Architecture

**Three-Tier Data Classification:**

1. **Shared Data** (All counselors + Admins):
   - Student profiles and basic information
   - Contact information (parents, teachers, etc.)
   - Reason categories and subcategories

2. **Private Data** (Per Counselor):
   - Interaction records and notes
   - Follow-up information
   - Personal counseling observations

3. **Admin Aggregated Data**:
   - Anonymized statistics across counselors
   - System-wide reporting
   - Audit logs (without private content)

---

## Installation & Setup

### Environment Variables

```bash
# Required for Supabase mode
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development mode
VITE_USE_MOCK_DATA=false  # true for mock data, false for Supabase

# Optional
VITE_APP_NAME=Beacon
VITE_SUPPORT_EMAIL=support@example.com
```

### Database Setup

#### Run Migrations
```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Run migrations in order: 001, 002, 003, 004, 005
```

#### Verify Setup
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Onboarding a New School

#### Step 1: Generate Setup Token (System Admin)
```sql
SELECT * FROM create_setup_token(
  'School Name',
  'subdomain',
  'admin@school.edu',
  24  -- hours until expiration
);
```

#### Step 2: School Admin Completes Setup
- Admin receives email with setup link
- Completes form to create tenant and admin account
- Automatically logged in

#### Step 3: Admin Invites Users
- Navigate to Admin → User Management
- Click "Invite User"
- Fill form (email, name, role)
- User receives invitation email

#### Step 4: Users Accept Invitations
- Click invitation link
- Create account with password
- Automatically logged in and ready to use

---

## User Guide

### Getting Started

#### Logging In
1. Navigate to the application URL
2. Enter your email address and password
3. Click "Sign In"

Your role (Admin or Counselor) determines which features you can access.

### Dashboard

The dashboard provides an at-a-glance view of your counseling activities.

**Key Metrics:**
- Total Interactions - Number of interactions in the selected date range
- Total Students - Unique students you've worked with
- Total Time Spent - Cumulative time across all interactions

**Category Breakdown:**
A pie chart shows the distribution of interactions by reason category.

**Recent Activity:**
View your 10 most recent interactions with quick access to details.

**Date Range Filter:**
- Last 7 days
- Last 30 days (default)
- Last 90 days
- This year
- Custom date range

### Managing Interactions

#### Creating an Interaction
1. Click "Add Interaction" from the dashboard or interactions page
2. Select interaction type: Student or Contact
3. Search and select the student or contact
4. Choose a Reason Category
5. Optionally select a Subcategory
6. Set the Start Time using the date/time picker
7. Enter Duration in minutes
8. Add any Notes about the interaction
9. Check "Needs follow-up" if required
   - Set a follow-up date
   - Add follow-up notes
10. Click "Save Interaction"

#### Viewing Interactions
- Filter by date range, category, student/contact, follow-up status
- Sort by clicking column headers
- Click row to view details
- Edit or delete your own interactions

### Student Management

#### Viewing Students
The students page displays all students in your school with:
- Student ID, Name, Grade level
- Number of interactions (yours only)
- Total time spent
- Follow-up needed indicator

#### Student Profile
Click on a student to view:
- Basic information
- Interaction statistics (yours only)
- Follow-up status
- Complete interaction history (yours only)

### Contact Management

Contacts are external people you interact with (parents, teachers, administrators, etc.).

#### Creating a Contact
1. Click "Add Contact"
2. Enter first and last name
3. Select relationship type
4. Add email, phone, and organization (optional)
5. Add notes (optional)
6. Click "Create Contact"

### Calendar View

The calendar provides a visual representation of your interactions.

**Views:**
- Month View - See all interactions for the month
- Week View - Detailed week schedule
- Day View - Hour-by-hour breakdown

**Features:**
- Color-coded by category
- Click date/time to create interaction
- Click event to view details
- Drag and drop to reschedule

### Follow-Up Tracking

#### Creating a Follow-Up
When creating or editing an interaction:
1. Check "This interaction needs follow-up"
2. Set a follow-up date
3. Add follow-up notes

#### Viewing Pending Follow-Ups
Navigate to the Follow-Ups page to see:
- All pending follow-ups
- Overdue follow-ups (highlighted in red)
- Follow-up date and notes
- Related student information

#### Completing a Follow-Up
1. Click "Mark Complete" on a follow-up
2. Add completion notes (optional)
3. Follow-up is marked complete

### Reports

Reports help you analyze your counseling activities and demonstrate impact.

**Available Reports:**
1. Student Volume Report - Total unique students seen
2. Interaction Frequency Report - Students seen most often
3. Grade Level Distribution - Interactions by grade level
4. Time Allocation Report - Time spent by category

**Filtering Reports:**
- Date Range - Custom start and end dates
- Grade Level - Specific grades or all grades
- Category - Specific interaction types
- Counselor - (Admin only) View specific counselor's data

**Exporting Reports:**
- Export to CSV for spreadsheet data
- Export to PDF for formatted document with charts

### Admin Features

#### User Management
- Create user accounts
- Invite users via email
- Deactivate/reactivate users
- Manage user roles
- View pending invitations

#### Reason Category Management
- Create categories
- Add subcategories
- Set category colors
- Reorder categories

#### System-Wide Reports
Admins can view reports across all counselors with anonymized data.

---

## Technical Documentation

### Database Schema

#### Core Tables

**tenants** - School/organization information
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
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

**users** - Application users linked to Supabase Auth
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
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

**students** - Student records
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
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

**interactions** - Counseling interaction records (Privacy Enforced)
```sql
CREATE TABLE interactions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  counselor_id UUID NOT NULL REFERENCES users(id),
  student_id UUID REFERENCES students(id),
  contact_id UUID REFERENCES contacts(id),
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

### Row Level Security (RLS)

**Critical**: All tables have RLS policies to enforce privacy:

```sql
-- Interactions: Counselors see only their interactions, admins see all
CREATE POLICY "interactions_select_policy" ON interactions
  FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) AND
    (counselor_id = auth.uid() OR 
     (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN')
  );

-- Students: Shared within tenant
CREATE POLICY "students_tenant_policy" ON students
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

### Project Structure

```
src/
├── components/          # React components by feature
│   ├── admin/          # Admin-only components
│   ├── calendar/       # Calendar views
│   ├── common/         # Reusable UI components
│   ├── contacts/       # Contact management
│   ├── dashboard/      # Dashboard widgets
│   ├── interactions/   # Interaction tracking
│   ├── layout/         # Layout components
│   ├── reports/        # Reporting components
│   ├── students/       # Student management
│   └── ui/            # Base UI components (Shadcn)
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── services/           # API services and Supabase client
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── mocks/              # Mock data for development
```

### Custom Hooks

**useAuth** - Authentication state and methods
```typescript
const {
  user,              // Current user with tenant_id and role
  isAuthenticated,   // Boolean auth status
  isLoading,         // Auth loading state
  login,             // Login function
  logout,            // Logout function
  refreshSession     // Refresh session function
} = useAuth();
```

**useInteractions** - Comprehensive interaction management
```typescript
const {
  interactions,      // Filtered interactions (counselor's only)
  students,          // All students in tenant
  contacts,          // All contacts in tenant
  categories,        // Reason categories
  subcategories,     // Reason subcategories
  isLoading,
  error,
  createInteraction,
  updateInteraction,
  deleteInteraction,
  completeFollowUp,
  refreshInteractions
} = useInteractions();
```

---

## Privacy & Security

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
- Hashed with SHA-256 and salt before storage
- Single-use only
- Expire after 24 hours
- Cannot be reused after consumption

**Invitation Tokens:**
- Cryptographically secure (64 characters)
- Hashed with SHA-256 and salt before storage
- Single-use only
- Expire after 7 days
- Can be resent (generates new token)

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

## Development Guide

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production (with type checking)
npm run build:skip-types  # Build without type checking
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

### Mock Data Mode

Uses Mock Service Worker (MSW) to intercept API calls:
- No backend setup required
- Realistic test data with Faker.js
- Data persists in localStorage
- Fast iteration

**Mock Credentials:**
- Admin: `admin@mayfield.edu` / any password
- Counselor: `counselor@lincoln-hs.edu` / any password

**Mock Data Includes:**
- 2 tenants (schools)
- 5 users (2 admins, 3 counselors)
- 250 students
- 80 contacts
- 500 interactions

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
```

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
  confirmPassword: 'SecurePass123!'
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

---

## Deployment

### Build for Production

```bash
npm run build:skip-types
```

Output in `dist/` directory.

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

**Can't log in:**
- Verify account exists in `users` table
- Check `is_active = true`
- Verify password is correct
- Check Supabase Auth logs

**User didn't receive email:**
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email settings
- Resend invitation from UI

**Data not showing:**
- Verify RLS policies enabled
- Check tenant_id matches
- Confirm user role has access
- Check browser console for errors

**Token expired:**
- Generate new setup token (SQL)
- Resend invitation (UI)
- Tokens cannot be extended, only regenerated

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

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error messages in browser console
3. Verify environment variables are set correctly
4. Check Supabase logs for backend errors
5. Contact your system administrator

---

## License

Private - All rights reserved

---

**Built with ❤️ for school counselors**

*Last Updated: March 10, 2026*
