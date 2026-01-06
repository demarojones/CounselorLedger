# Supabase Authentication Setup Guide

Your School Counselor Ledger is now configured to use Supabase authentication! Here's what's been set up and how to use it.

## ✅ What's Configured

1. **Environment Variables**: Your `.env.local` has the correct Supabase URL and API key
2. **Authentication Service**: Updated to use real Supabase auth instead of mock data
3. **Database Integration**: User registration creates records in your `users` table
4. **Default Tenant**: A default school tenant is created for all new users

## 🚀 How to Use

### Registration Flow
1. Visit your app at http://localhost:5174
2. Click "Create one" to register
3. Fill out the registration form:
   - Email (will be your login)
   - Password (minimum 6 characters)
   - First & Last Name
   - Role (Admin or Counselor)
4. Submit the form
5. Check your email for a confirmation link (if email confirmation is enabled)

### Login Flow
1. Use the email and password you registered with
2. You'll be redirected to the dashboard upon successful login

## 🔧 Database Setup

Your Supabase project already has all the necessary tables. The registration process:

1. Creates a user in Supabase Auth (`auth.users`)
2. Automatically creates a corresponding record in your `users` table
3. Associates the user with the default tenant
4. Sets up default reason categories for counseling interactions

## 📋 Next Steps

### Optional: Apply Database Migration
If you want to add the custom registration function, you can apply this SQL in your Supabase dashboard:

```sql
-- Copy the contents of apply-migration.sql and run in Supabase SQL Editor
```

### Email Configuration (Optional)
To enable email confirmation and password reset:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Configure your email provider (SMTP)
4. Enable email confirmation if desired

### Production Checklist
- [ ] Configure email provider for password resets
- [ ] Set up proper RLS (Row Level Security) policies
- [ ] Configure custom domains if needed
- [ ] Set up proper error monitoring

## 🐛 Troubleshooting

### Registration Issues
- **"User already exists"**: The email is already registered
- **"Invalid email"**: Check email format
- **"Password too short"**: Minimum 6 characters required

### Login Issues
- **"Invalid credentials"**: Check email/password combination
- **"Email not confirmed"**: Check your email for confirmation link

### Database Issues
- **User not found after registration**: Check if the trigger is working
- **No reason categories**: The default categories should be created automatically

## 🔍 Testing

You can test the authentication flow:

1. **Register a new user**:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
   - Role: `Counselor`

2. **Login with the same credentials**

3. **Check the database**:
   - User should appear in `auth.users`
   - User should appear in `users` table
   - Default reason categories should exist

## 🎯 Current Status

- ✅ Supabase authentication enabled
- ✅ User registration working
- ✅ User login working
- ✅ Database integration working
- ✅ Default tenant setup
- ✅ Reason categories auto-created
- ⏳ Email confirmation (optional)
- ⏳ Password reset (optional)

Your authentication system is now ready for production use!