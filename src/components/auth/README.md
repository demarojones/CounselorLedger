# Authentication System

This directory contains the authentication components for the School Counselor Ledger application.

## Components

### Login

The login page component with email/password form validation using Zod.

### ProtectedRoute

A wrapper component that protects routes from unauthenticated access and enforces role-based permissions.

## Usage

### Basic Protected Route

```tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Role-Based Protected Route

```tsx
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="ADMIN">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

## Development Mode Test Credentials

When `VITE_USE_MOCK_DATA=true`, you can use any of these test accounts:

### Lincoln High School (tenant1)

- **Admin**: admin@lincoln-hs.edu (password: any)
- **Counselor**: mjones@lincoln-hs.edu (password: any)
- **Counselor**: lsmith@lincoln-hs.edu (password: any)

### Washington Middle School (tenant2)

- **Admin**: admin@washington-ms.edu (password: any)
- **Counselor**: ebrown@washington-ms.edu (password: any)

Note: In mock mode, any password will work for authentication.

## Authentication Flow

1. User enters credentials on login page
2. Form validates input using Zod schema
3. Credentials are sent to Supabase (or mock handler in dev mode)
4. On success, user data is stored in AuthContext
5. User is redirected to dashboard
6. Protected routes check authentication status
7. Role-based routes verify user permissions

## Session Management

- Sessions are automatically managed by Supabase
- Tokens are refreshed automatically
- Auth state changes are tracked via `onAuthStateChange`
- Session persists across page refreshes
