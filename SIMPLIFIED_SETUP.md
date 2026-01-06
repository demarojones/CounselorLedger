# Simplified School Counselor Ledger Setup

This is a simplified version of the School Counselor Ledger that removes the complex multi-tenant setup and focuses on basic registration and login functionality.

## What Changed

### Removed Complexity
- ❌ Multi-tenant invitation system
- ❌ Token-based setup process
- ❌ Complex tenant management
- ❌ Email invitation workflows
- ❌ Setup wizards and initial configuration

### Simplified Features
- ✅ Direct user registration
- ✅ Simple email/password login
- ✅ Mock authentication for development
- ✅ Single-tenant architecture (for now)
- ✅ Immediate access after registration

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open http://localhost:5174 (or the port shown in terminal)
   - You'll be redirected to the login page

3. **Create an account:**
   - Click "Create one" on the login page
   - Fill out the registration form
   - Choose your role (Admin or Counselor)
   - Submit to create your account

4. **Sign in:**
   - Use your email and password to sign in
   - You'll be redirected to the dashboard

## Development Mode

The application is currently set to use mock data (`VITE_USE_MOCK_DATA=true` in `.env.local`). This means:

- No real database connection required
- User data is stored in browser localStorage
- Perfect for development and testing
- Includes default demo users:
  - `admin@school.edu` / `password123` (Admin)
  - `counselor@school.edu` / `password123` (Counselor)

## Default Users (Development)

When using mock data, these users are available by default:

| Email | Password | Role |
|-------|----------|------|
| admin@school.edu | password123 | Admin |
| counselor@school.edu | password123 | Counselor |

## Production Setup (Later)

When ready for production:

1. Set up a Supabase project
2. Run the database migrations
3. Update environment variables
4. Set `VITE_USE_MOCK_DATA=false`

## Features Available

All core features work with the simplified setup:
- ✅ Student management
- ✅ Contact management  
- ✅ Interaction logging
- ✅ Calendar view
- ✅ Reports and analytics
- ✅ Dashboard overview
- ✅ Role-based permissions

## Next Steps

This simplified version gives you a working product that you can:
1. **Ship immediately** for testing and feedback
2. **Demonstrate** to stakeholders
3. **Iterate on** based on user needs
4. **Scale up** to multi-tenant later if needed

The multi-tenant architecture can be added back later when you're ready to support multiple schools/districts.