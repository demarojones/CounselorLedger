# Supabase Service Layer

This directory contains the Supabase service layer for the School Counselor Ledger application. The service layer provides a clean abstraction over Supabase operations with built-in error handling, tenant context management, and real-time subscription utilities.

## Files Overview

### `supabase.ts`
Core Supabase client initialization and configuration. This file creates the Supabase client instance used throughout the application.

**Key Features:**
- Initializes Supabase client with environment variables
- Configures authentication settings (auto-refresh, session persistence)
- Exports Supabase types for TypeScript support

### `auth.ts`
Authentication service with functions for user login, logout, session management, and auth state monitoring.

**Key Functions:**
- `signIn(credentials)` - Authenticate user with email/password
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get currently authenticated user
- `getSession()` - Get current session data
- `refreshSession()` - Refresh authentication token
- `onAuthStateChange(callback)` - Subscribe to auth state changes

### `supabaseHelpers.ts`
Comprehensive helper functions for common Supabase operations, error handling, tenant context, and real-time subscriptions.

**Key Features:**

#### Error Handling
- `handleSupabaseError()` - Transform Supabase errors to application format
- `getUserFriendlyErrorMessage()` - Get user-friendly error messages
- `isRLSError()` - Check for Row Level Security violations
- `isAuthError()` - Check for authentication errors
- `isUniqueConstraintError()` - Check for duplicate record errors
- `isForeignKeyError()` - Check for foreign key violations

#### Tenant Context
- `getTenantContext()` - Get current user's tenant information
- `verifyTenantAccess()` - Verify user belongs to specified tenant
- `isCurrentUserAdmin()` - Check if current user has admin role

#### Query Helpers
- `selectFromTable()` - Generic SELECT query with ordering and pagination
- `selectSingleFromTable()` - Fetch single record by ID
- `insertIntoTable()` - Generic INSERT query
- `updateInTable()` - Generic UPDATE query
- `deleteFromTable()` - Generic DELETE query
- `batchInsert()` - Insert multiple records at once
- `batchUpdate()` - Update multiple records matching condition

#### Real-time Subscriptions
- `subscribeToTable()` - Subscribe to real-time changes on any table
- `unsubscribeFromChannel()` - Clean up subscription
- `subscribeToUserInteractions()` - Subscribe to interaction changes
- `subscribeToStudents()` - Subscribe to student changes
- `subscribeToContacts()` - Subscribe to contact changes

#### Utility Functions
- `isSupabaseConfigured()` - Check if Supabase is properly configured
- `isMockDataMode()` - Check if mock data mode is enabled
- `checkDatabaseConnection()` - Verify database connectivity

### `supabaseExamples.ts`
Comprehensive examples demonstrating how to use the Supabase helper functions in various scenarios.

**Includes Examples For:**
- Fetching data with error handling
- Creating, updating, and deleting records
- Real-time subscriptions
- Complex queries with joins
- Tenant context filtering
- Configuration checking
- React Query integration
- Batch operations

### `apiClient.ts`
Legacy API client (may be used for non-Supabase endpoints or future extensions).

## Usage Examples

### Basic Query

```typescript
import { selectFromTable, getUserFriendlyErrorMessage } from '../services/supabase';
import { Student } from '../types/student';

async function fetchStudents() {
  const { data, error } = await selectFromTable<Student>('students', '*', {
    orderBy: { column: 'last_name', ascending: true },
    limit: 50,
  });

  if (error) {
    console.error(getUserFriendlyErrorMessage(error));
    return [];
  }

  return data || [];
}
```

### Creating a Record

```typescript
import { insertIntoTable, getTenantContext } from '../services/supabase';
import { Student } from '../types/student';

async function createStudent(studentData: Partial<Student>) {
  const context = await getTenantContext();
  
  const { data, error } = await insertIntoTable<Student>('students', {
    ...studentData,
    tenant_id: context?.tenantId,
  });

  if (error) {
    throw new Error(getUserFriendlyErrorMessage(error));
  }

  return data;
}
```

### Real-time Subscription

```typescript
import { subscribeToTable, unsubscribeFromChannel } from '../services/supabase';
import { Interaction } from '../types/interaction';

function setupInteractionSubscription(onNewInteraction: (interaction: Interaction) => void) {
  const channel = subscribeToTable<Interaction>({
    table: 'interactions',
    event: 'INSERT',
    callback: (payload) => {
      if (payload.new) {
        onNewInteraction(payload.new);
      }
    },
  });

  // Return cleanup function
  return () => unsubscribeFromChannel(channel);
}
```

### Using with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { selectFromTable, insertIntoTable, getTenantContext } from '../services/supabase';

function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await selectFromTable<Student>('students');
      if (error) throw new Error(getUserFriendlyErrorMessage(error));
      return data || [];
    },
  });
}

function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newStudent: Partial<Student>) => {
      const context = await getTenantContext();
      const { data, error } = await insertIntoTable<Student>('students', {
        ...newStudent,
        tenant_id: context?.tenantId,
      });
      if (error) throw new Error(getUserFriendlyErrorMessage(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
```

## Error Handling Best Practices

1. **Always check for errors** after Supabase operations
2. **Use `getUserFriendlyErrorMessage()`** to display errors to users
3. **Check specific error types** for custom handling:
   - RLS errors → redirect to login or show permission denied
   - Unique constraint errors → show validation message
   - Foreign key errors → explain dependencies
4. **Log errors** for debugging but show friendly messages to users

## Tenant Context

All queries automatically respect Row Level Security (RLS) policies that filter data by tenant. The service layer provides helpers to:

- Get current user's tenant context
- Verify tenant access before operations
- Check user roles for authorization

## Real-time Features

The service layer provides easy-to-use real-time subscription helpers:

- Subscribe to table changes (INSERT, UPDATE, DELETE, or all)
- Filter subscriptions by specific records
- Automatic cleanup with unsubscribe functions
- Type-safe payload handling

## Configuration

The service layer checks for proper Supabase configuration:

```typescript
import { isSupabaseConfigured, isMockDataMode } from '../services/supabase';

if (isMockDataMode()) {
  // Use mock data
} else if (isSupabaseConfigured()) {
  // Use real Supabase
} else {
  // Show configuration error
}
```

## Migration from Mock Data

When switching from mock data to real Supabase:

1. Set `VITE_USE_MOCK_DATA=false` in `.env.local`
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run database migrations (see `SUPABASE_SETUP.md`)
4. Create test users in Supabase Auth
5. Add users to the `users` table with proper tenant assignment

## Security Considerations

- **Never expose service_role key** in frontend code
- **Always use anon/public key** for client-side operations
- **Rely on RLS policies** for data isolation
- **Validate user permissions** before sensitive operations
- **Use tenant context helpers** to ensure proper data access

## Performance Tips

1. **Use pagination** for large datasets (`limit` and `offset` options)
2. **Select only needed columns** instead of `*`
3. **Use indexes** on frequently queried columns (defined in migrations)
4. **Batch operations** when creating/updating multiple records
5. **Cache queries** with React Query for better performance
6. **Unsubscribe from real-time channels** when components unmount

## Troubleshooting

### "Row Level Security policy violation"
- Ensure user is authenticated
- Verify user exists in `users` table (not just `auth.users`)
- Check user has correct `tenant_id`
- Review RLS policies in migration files

### "Invalid API key"
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check for extra spaces or line breaks in `.env.local`
- Ensure using anon key, not service_role key

### Real-time subscriptions not working
- Check Supabase project has real-time enabled
- Verify subscription channel name is unique
- Ensure proper cleanup with `unsubscribeFromChannel()`
- Check browser console for WebSocket errors

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- Project Setup Guide: `SUPABASE_SETUP.md`
