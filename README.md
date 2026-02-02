# School Counselor Ledger

A comprehensive multi-tenant application for school counselors to track student interactions, manage contacts, and generate reports with enterprise-grade privacy and security.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (or use mock data for development)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd counselor-ledger
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
Access at http://localhost:5173 with demo credentials: `admin@school.edu` / `password123`

**Supabase Mode** (Production):
```bash
# In .env.local
VITE_USE_MOCK_DATA=false
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Features

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

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query
- **Calendar**: FullCalendar
- **Charts**: Recharts
- **Validation**: Zod

## Project Structure

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

supabase/
└── migrations/         # Database migrations
    ├── 001_core_schema.sql
    ├── 002_security_policies.sql
    ├── 003_seed_data.sql
    ├── 004_setup_invitations.sql
    └── 005_security_audit.sql
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

## Onboarding a New School

### Step 1: Generate Setup Token (System Admin)
```sql
SELECT * FROM create_setup_token(
  'School Name',
  'subdomain',
  'admin@school.edu',
  24  -- hours until expiration
);
```

### Step 2: School Admin Completes Setup
- Admin receives email with setup link
- Completes form to create tenant and admin account
- Automatically logged in

### Step 3: Admin Invites Users
- Navigate to Admin → User Management
- Click "Invite User"
- Fill form (email, name, role)
- User receives invitation email

### Step 4: Users Accept Invitations
- Click invitation link
- Create account with password
- Automatically logged in and ready to use

**See TECHNICAL_GUIDE.md for detailed onboarding process**

## Multi-Tenant Architecture

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

## Environment Variables

```bash
# Required for Supabase mode
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development mode
VITE_USE_MOCK_DATA=false  # true for mock data, false for Supabase

# Optional
VITE_APP_NAME=School Counselor Ledger
VITE_SUPPORT_EMAIL=support@example.com
```

## Database Setup

### Run Migrations
```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Run migrations in order: 001, 002, 003, 004, 005
```

### Verify Setup
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

## Development Guidelines

### Code Quality
- ESLint with TypeScript and React rules
- Prettier for consistent formatting
- Strict TypeScript type checking
- Component-based architecture

### Privacy Best Practices
- Always filter by tenant_id
- Use RLS policies for data access
- Log admin access to counselor data
- Display privacy indicators in UI

### Testing
- Test with mock data first
- Verify RLS policies work correctly
- Test cross-tenant isolation
- Validate role-based access

## Common Tasks

### Add a New User (Admin UI)
1. Admin → User Management → Invite User
2. Fill form and send invitation
3. User accepts and creates account

### Change User Role
```sql
UPDATE users SET role = 'ADMIN'  -- or 'COUNSELOR'
WHERE email = 'user@email.com' AND tenant_id = 'TENANT_ID';
```

### Deactivate User
```sql
UPDATE users SET is_active = false
WHERE email = 'user@email.com' AND tenant_id = 'TENANT_ID';
```

### Resend Invitation
1. Admin → User Management → Pending Invitations
2. Find invitation → Click "Resend"
3. New email sent with fresh token

## Troubleshooting

### Can't log in
- Verify account exists in User Management
- Check is_active = true
- Try password reset

### User didn't receive invitation
- Check spam folder
- Verify email address is correct
- Resend invitation from UI

### Data not showing
- Verify RLS policies are enabled
- Check tenant_id matches
- Confirm user role has access

### Setup token expired
- Generate new token with SQL
- Send new link to admin

## Documentation

- **TECHNICAL_GUIDE.md** - Complete technical documentation including:
  - Database schema and migrations
  - Multi-tenant architecture
  - Security and privacy implementation
  - Onboarding process details
  - API reference
  - Troubleshooting guide

## Support

For issues or questions:
1. Check TECHNICAL_GUIDE.md for detailed documentation
2. Review error messages in browser console
3. Verify environment variables are set correctly
4. Check Supabase logs for backend errors

## License

Private - All rights reserved

---

**Built with ❤️ for school counselors**
