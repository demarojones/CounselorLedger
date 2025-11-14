# React Query Setup Guide

This document describes the React Query implementation for data management in the School Counselor Ledger application.

## Overview

React Query (@tanstack/react-query) has been integrated to provide:
- Efficient data fetching and caching
- Optimistic updates for better UX
- Automatic background refetching
- Query invalidation strategies
- Loading and error states management

## Configuration

### Query Client Setup

The query client is configured in `src/lib/queryClient.ts` with the following defaults:

```typescript
{
  queries: {
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 10 * 60 * 1000,          // 10 minutes
    retry: 2,                         // Retry failed requests twice
    refetchOnWindowFocus: true,       // Refetch on window focus
    refetchOnMount: false,            // Don't refetch if data is fresh
    refetchOnReconnect: true,         // Refetch on reconnect
  },
  mutations: {
    retry: 1,                         // Retry failed mutations once
    retryDelay: 1000,                 // 1 second delay
  }
}
```

### Query Keys

Centralized query keys are defined in `src/lib/queryClient.ts` for consistent cache management:

```typescript
queryKeys.students              // All students
queryKeys.student(id)           // Single student
queryKeys.contacts              // All contacts
queryKeys.contact(id)           // Single contact
queryKeys.interactions          // All interactions
queryKeys.interaction(id)       // Single interaction
queryKeys.categories            // Reason categories
queryKeys.subcategories(catId)  // Subcategories by category
```

## Available Hooks

### Students

**Query Hooks:**
- `useStudents()` - Fetch all students
- `useStudent(id)` - Fetch single student by ID

**Mutation Hooks:**
- `useCreateStudent()` - Create new student
- `useUpdateStudent()` - Update existing student (with optimistic updates)
- `useDeleteStudent()` - Delete student (with optimistic updates)

**Example Usage:**
```typescript
import { useStudents, useCreateStudent } from '@/hooks';

function StudentList() {
  const { data: students, isLoading, error } = useStudents();
  const createStudent = useCreateStudent();

  const handleCreate = async (data) => {
    await createStudent.mutateAsync(data);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* Render students */}</div>;
}
```

### Contacts

**Query Hooks:**
- `useContacts()` - Fetch all contacts
- `useContact(id)` - Fetch single contact by ID

**Mutation Hooks:**
- `useCreateContact()` - Create new contact
- `useUpdateContact()` - Update existing contact (with optimistic updates)
- `useDeleteContact()` - Delete contact (with optimistic updates)

**Example Usage:**
```typescript
import { useContacts, useUpdateContact } from '@/hooks';

function ContactList() {
  const { data: contacts, isLoading } = useContacts();
  const updateContact = useUpdateContact();

  const handleUpdate = async (id, data) => {
    await updateContact.mutateAsync({ id, ...data });
  };

  return <div>{/* Render contacts */}</div>;
}
```

### Interactions

**Query Hooks:**
- `useInteractionsQuery()` - Fetch all interactions with related data
- `useInteractionQuery(id)` - Fetch single interaction by ID

**Mutation Hooks:**
- `useCreateInteraction()` - Create new interaction
- `useUpdateInteraction()` - Update existing interaction (with optimistic updates)
- `useDeleteInteraction()` - Delete interaction (with optimistic updates)
- `useCompleteFollowUp()` - Mark follow-up as complete

**Example Usage:**
```typescript
import { useInteractionsQuery, useCreateInteraction } from '@/hooks';

function InteractionList() {
  const { data: interactions, isLoading } = useInteractionsQuery();
  const createInteraction = useCreateInteraction();

  const handleCreate = async (formData) => {
    await createInteraction.mutateAsync(formData);
  };

  return <div>{/* Render interactions */}</div>;
}
```

### Reason Categories

**Query Hooks:**
- `useReasonCategories()` - Fetch all categories
- `useReasonSubcategories()` - Fetch all subcategories
- `useSubcategoriesByCategory(categoryId)` - Fetch subcategories for specific category

**Mutation Hooks:**
- `useCreateCategory()` - Create new category
- `useUpdateCategory()` - Update existing category
- `useDeleteCategory()` - Delete category
- `useCreateSubcategory()` - Create new subcategory
- `useUpdateSubcategory()` - Update existing subcategory
- `useDeleteSubcategory()` - Delete subcategory

## Features

### Optimistic Updates

Mutations for updates and deletes implement optimistic updates:

1. **Update Flow:**
   - Cancel outgoing queries
   - Snapshot current data
   - Optimistically update cache
   - On success: Update with server response
   - On error: Rollback to snapshot

2. **Delete Flow:**
   - Cancel outgoing queries
   - Snapshot current data
   - Optimistically remove from cache
   - On success: Invalidate related queries
   - On error: Rollback to snapshot

### Automatic Invalidation

Mutations automatically invalidate related queries:

```typescript
// Creating an interaction invalidates:
- queryKeys.interactions
- queryKeys.interactionsByStudent(studentId)
- queryKeys.interactionsByContact(contactId)

// Deleting a student invalidates:
- queryKeys.students
- queryKeys.interactionsByStudent(id)
```

### Error Handling

All hooks integrate with the application's error handling:

```typescript
onError: (error) => {
  const apiError = handleApiError(error, { 
    customMessage: 'Failed to create student' 
  });
  toast.error(apiError.message);
}
```

### Loading States

All query hooks return standard React Query states:

```typescript
const { 
  data,           // Query data
  isLoading,      // Initial loading
  isFetching,     // Background refetching
  error,          // Error object
  refetch,        // Manual refetch function
} = useStudents();
```

### Mutation States

All mutation hooks return standard React Query mutation states:

```typescript
const mutation = useCreateStudent();

mutation.mutate(data);          // Fire and forget
await mutation.mutateAsync(data); // Await result

mutation.isPending              // Mutation in progress
mutation.isSuccess              // Mutation succeeded
mutation.isError                // Mutation failed
mutation.error                  // Error object
```

## Migration Guide

### From useInteractions to React Query

**Before:**
```typescript
const { 
  interactions, 
  isLoading, 
  createInteraction 
} = useInteractions();

await createInteraction(data);
```

**After:**
```typescript
const { 
  data: interactions, 
  isLoading 
} = useInteractionsQuery();

const createInteraction = useCreateInteraction();
await createInteraction.mutateAsync(data);
```

### Key Differences

1. **Data property:** Query results are in `data` property
2. **Mutations are separate:** Use dedicated mutation hooks
3. **Async handling:** Use `mutateAsync()` for promises
4. **Automatic refetch:** No need to manually call refresh functions

## Best Practices

### 1. Use Query Keys Consistently

Always use the centralized query keys from `src/lib/queryClient.ts`:

```typescript
// Good
queryClient.invalidateQueries({ queryKey: queryKeys.students });

// Bad
queryClient.invalidateQueries({ queryKey: ['students'] });
```

### 2. Handle Loading States

Always handle loading and error states:

```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

### 3. Use Optimistic Updates for Better UX

Optimistic updates are already implemented in update/delete mutations. The UI updates immediately while the server request is in flight.

### 4. Invalidate Related Queries

When mutating data, invalidate all related queries:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.students });
  queryClient.invalidateQueries({ queryKey: queryKeys.interactions });
}
```

### 5. Use Enabled Option for Conditional Queries

Prevent queries from running until conditions are met:

```typescript
const { data } = useStudent(studentId, {
  enabled: !!studentId  // Only fetch if studentId exists
});
```

## Performance Considerations

### Caching Strategy

- **Stale Time (5 min):** Data is considered fresh for 5 minutes
- **GC Time (10 min):** Unused data is garbage collected after 10 minutes
- **Background Refetch:** Data refetches on window focus and reconnect

### Reducing Network Requests

1. **Prefetching:** Prefetch data before it's needed
2. **Parallel Queries:** Multiple queries run in parallel automatically
3. **Deduplication:** Identical queries are automatically deduplicated

### Example: Prefetching

```typescript
const queryClient = useQueryClient();

// Prefetch student data on hover
const handleMouseEnter = (studentId: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.student(studentId),
    queryFn: () => fetchStudent(studentId),
  });
};
```

## Debugging

### React Query DevTools

Install React Query DevTools for debugging (development only):

```bash
npm install @tanstack/react-query-devtools
```

Add to App.tsx:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Logging

Enable query logging in development:

```typescript
const queryClient = new QueryClient({
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },
});
```

## Troubleshooting

### Query Not Refetching

Check if data is still fresh (within staleTime). Force refetch:

```typescript
const { refetch } = useStudents();
refetch();
```

### Mutation Not Updating UI

Ensure you're invalidating the correct queries:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.students });
}
```

### Optimistic Update Rollback

If optimistic updates aren't rolling back on error, check that you're returning the context:

```typescript
onMutate: async (data) => {
  const previous = queryClient.getQueryData(queryKeys.students);
  return { previous };  // Must return context
},
onError: (err, variables, context) => {
  if (context?.previous) {
    queryClient.setQueryData(queryKeys.students, context.previous);
  }
}
```

## Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
