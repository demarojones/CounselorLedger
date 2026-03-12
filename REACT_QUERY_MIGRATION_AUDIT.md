# React Query Migration Audit

## Executive Summary

This document audits all data mutation and fetching operations across the application to identify which components need to be migrated to React Query hooks with optimistic updates.

## Status Legend
- ✅ **DONE** - Already using React Query hooks
- 🔴 **CRITICAL** - Needs immediate migration (user-facing CRUD operations)
- 🟡 **MEDIUM** - Should be migrated (admin operations, less frequent)
- 🟢 **LOW** - Optional migration (read-only or infrequent operations)

---

## Pages Audit

### ✅ Students Page (`src/pages/Students.tsx`)
**Status:** DONE (Just migrated)
- Uses `useStudents()` and `useInteractions()` hooks
- Automatic cache invalidation
- Optimistic updates implemented

### 🔴 Contacts Page (`src/pages/Contacts.tsx`)
**Status:** CRITICAL - Needs Migration
**Current State:**
- Uses manual `useState` + `useEffect` with `fetchContacts()`, `fetchInteractions()`
- Manual state updates after create/update/delete operations
- No optimistic updates

**Operations:**
- Create contact
- Update contact
- Delete contact
- Fetch contact interactions

**Recommended Actions:**
1. Create `useContacts.ts` hook with:
   - `useContacts()` - fetch all contacts
   - `useContact(id)` - fetch single contact
   - `useCreateContact()` - with optimistic update
   - `useUpdateContact()` - with optimistic update
   - `useDeleteContact()` - with optimistic update
   - `useContactInteractions(contactId)` - fetch contact interactions
2. Update Contacts page to use these hooks
3. Remove manual state management

### ✅ Calendar Page (`src/pages/Calendar.tsx`)
**Status:** DONE
- Already uses `useInteractions()` hook
- Properly integrated with React Query

### ✅ Dashboard Page (`src/pages/Dashboard.tsx`)
**Status:** DONE
- Uses `useInteractions()` and `useDashboardStats()` hooks
- Read-only operations, no mutations needed

### ✅ Interactions Page (`src/pages/Interactions.tsx`)
**Status:** MOSTLY DONE - Needs Minor Improvement
**Current State:**
- Uses `useInteractions()` hook for data fetching
- BUT: Still uses manual API calls for mutations (`createInteraction`, `updateInteraction`, `deleteInteraction`)
- Calls `refreshInteractions()` after mutations

**Recommended Actions:**
1. Create mutation hooks in `useInteractions.ts`:
   - `useCreateInteraction()` - with optimistic update
   - `useUpdateInteraction()` - with optimistic update
   - `useDeleteInteraction()` - with optimistic update
   - `useCompleteFollowUp()` - with optimistic update
2. Update Interactions page to use mutation hooks instead of direct API calls
3. Remove `refreshInteractions()` calls (automatic with cache invalidation)

### 🔴 StudentDetail Page (`src/pages/StudentDetail.tsx`)
**Status:** CRITICAL - Needs Migration
**Current State:**
- Uses manual `useState` + `useEffect` with multiple fetch operations
- Complex data fetching with parallel requests
- No cache management

**Operations:**
- Fetch student details
- Fetch student interactions
- Fetch categories, students, contacts, counselors

**Recommended Actions:**
1. Use existing `useStudent(id)` hook
2. Use `useInteractionsByStudent(studentId)` hook (needs to be created)
3. Use existing `useCategories()` hook (if exists, or create)
4. Remove manual state management

### 🟢 Reports Page (`src/pages/Reports.tsx`)
**Status:** LOW PRIORITY
- Likely read-only operations
- Less frequent usage
- Can be migrated later

---

## Admin Components Audit

### 🟡 UserManagement (`src/components/admin/UserManagement.tsx`)
**Status:** MEDIUM - Should Migrate
**Current State:**
- Uses manual `useState` + `useEffect` with Supabase queries
- Manual state updates after operations
- Fetches users and interaction statistics

**Operations:**
- Fetch users with stats
- Create user (via UserForm)
- Update user (via UserForm)
- Deactivate user
- Invite user (via UserInvitationForm)

**Recommended Actions:**
1. Create `useUsers.ts` hook with:
   - `useUsers()` - fetch all users with stats
   - `useCreateUser()` - with optimistic update
   - `useUpdateUser()` - with optimistic update
   - `useDeactivateUser()` - with optimistic update
2. Update UserManagement to use these hooks
3. Update UserForm to use mutation hooks

### 🟡 ReasonManagement (`src/components/admin/ReasonManagement.tsx`)
**Status:** MEDIUM - Should Migrate
**Current State:**
- Uses manual `useState` + `useEffect` with Supabase queries
- Manual state updates after operations
- Fetches categories and subcategories

**Operations:**
- Fetch categories
- Create/update/delete category
- Fetch subcategories
- Create/update/delete subcategory

**Recommended Actions:**
1. Create `useReasons.ts` hook with:
   - `useCategories()` - fetch all categories
   - `useSubcategories()` - fetch all subcategories
   - `useCreateCategory()` - with optimistic update
   - `useUpdateCategory()` - with optimistic update
   - `useDeleteCategory()` - with optimistic update
   - `useCreateSubcategory()` - with optimistic update
   - `useUpdateSubcategory()` - with optimistic update
   - `useDeleteSubcategory()` - with optimistic update
2. Update ReasonManagement to use these hooks
3. Update CategoryForm and SubcategoryForm to use mutation hooks

### 🟡 InvitationManagement (`src/components/admin/InvitationManagement.tsx`)
**Status:** MEDIUM - Should Migrate
**Current State:**
- Uses manual `useState` + `useEffect`
- Manual state updates after operations
- Fetches pending invitations

**Operations:**
- Fetch pending invitations
- Cancel invitation
- Resend invitation

**Recommended Actions:**
1. Create `useInvitations.ts` hook with:
   - `useInvitations()` - fetch pending invitations
   - `useCancelInvitation()` - with optimistic update
   - `useResendInvitation()` - with optimistic update
2. Update InvitationManagement to use these hooks

### 🟢 SecurityEventManagement (`src/components/admin/SecurityEventManagement.tsx`)
**Status:** LOW PRIORITY
- Admin-only, read-heavy operations
- Less frequent usage
- Can be migrated later

### 🟢 AdminDashboard, AdminReports (`src/components/admin/`)
**Status:** LOW PRIORITY
- Mostly read-only operations
- Admin-only features
- Can be migrated later

---

## Migration Priority Order

### Phase 1: Critical User-Facing Operations (Week 1)
1. ✅ **Students Page** - DONE
2. 🔴 **Contacts Page** - Create `useContacts.ts` hook
3. 🔴 **Interactions Page** - Add mutation hooks to existing `useInteractions.ts`
4. 🔴 **StudentDetail Page** - Use existing hooks + create missing ones

### Phase 2: Admin Operations (Week 2)
5. 🟡 **UserManagement** - Create `useUsers.ts` hook
6. 🟡 **ReasonManagement** - Create `useReasons.ts` hook
7. 🟡 **InvitationManagement** - Create `useInvitations.ts` hook

### Phase 3: Optional Improvements (Week 3+)
8. 🟢 **Reports** - Optimize with React Query if needed
9. 🟢 **Admin Dashboard/Reports** - Optimize with React Query if needed
10. 🟢 **SecurityEventManagement** - Optimize with React Query if needed

---

## Benefits of Migration

### User Experience
- **Instant feedback** - Optimistic updates show changes immediately
- **No loading delays** - Cached data displays instantly
- **Automatic sync** - All components stay in sync automatically
- **Better error handling** - Automatic rollback on failures

### Developer Experience
- **Less code** - No manual state management
- **Automatic caching** - Built-in cache management
- **Automatic refetching** - Background updates
- **Better debugging** - React Query DevTools

### Performance
- **Reduced API calls** - Smart caching reduces redundant requests
- **Background updates** - Stale-while-revalidate pattern
- **Request deduplication** - Multiple components share same request
- **Optimistic updates** - UI updates before server response

---

## Implementation Template

### Hook Structure
```typescript
// src/hooks/useContacts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as api from '@/services/api';

export function useContacts() {
  return useQuery({
    queryKey: queryKeys.contacts,
    queryFn: async () => {
      const response = await api.fetchContacts();
      if (response.error) throw new Error(response.error.message);
      return response.data || [];
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      const response = await api.createContact(data);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onMutate: async (newContact) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts });
      
      // Snapshot previous value
      const previousContacts = queryClient.getQueryData(queryKeys.contacts);
      
      // Optimistically update
      queryClient.setQueryData(queryKeys.contacts, (old: Contact[]) => [
        ...old,
        { ...newContact, id: `temp-${Date.now()}` }
      ]);
      
      return { previousContacts };
    },
    onSuccess: (newContact, _, context) => {
      // Replace optimistic with real data
      queryClient.setQueryData(queryKeys.contacts, (old: Contact[]) => 
        old.filter(c => !c.id.startsWith('temp-')).concat(newContact)
      );
      toast.success('Contact created successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKeys.contacts, context.previousContacts);
      }
      toast.error('Failed to create contact');
    },
  });
}
```

### Page Usage
```typescript
// Before
const [contacts, setContacts] = useState<Contact[]>([]);
useEffect(() => { loadData(); }, []);

// After
const { data: contacts = [], isLoading } = useContacts();
const createContact = useCreateContact();

// Usage
await createContact.mutateAsync(formData);
// No need to manually update state - automatic!
```

---

## Query Keys Structure

Ensure consistent query keys in `src/lib/queryClient.ts`:

```typescript
export const queryKeys = {
  // Students
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  
  // Contacts
  contacts: ['contacts'] as const,
  contact: (id: string) => ['contacts', id] as const,
  contactInteractions: (id: string) => ['contacts', id, 'interactions'] as const,
  
  // Interactions
  interactions: ['interactions'] as const,
  interaction: (id: string) => ['interactions', id] as const,
  interactionsByStudent: (studentId: string) => ['interactions', 'student', studentId] as const,
  
  // Categories
  categories: ['categories'] as const,
  subcategories: ['subcategories'] as const,
  
  // Users (Admin)
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  
  // Invitations (Admin)
  invitations: ['invitations'] as const,
};
```

---

## Testing Checklist

For each migrated component:
- [ ] Create operation shows item immediately
- [ ] Update operation shows changes immediately
- [ ] Delete operation removes item immediately
- [ ] Error shows toast and rolls back changes
- [ ] Multiple tabs/windows stay in sync
- [ ] Page refresh loads from cache first
- [ ] Background refetch updates stale data
- [ ] Loading states work correctly
- [ ] Error states work correctly

---

## Estimated Effort

- **Phase 1 (Critical):** 2-3 days
  - Contacts: 4-6 hours
  - Interactions mutations: 2-3 hours
  - StudentDetail: 2-3 hours

- **Phase 2 (Admin):** 2-3 days
  - UserManagement: 3-4 hours
  - ReasonManagement: 3-4 hours
  - InvitationManagement: 2-3 hours

- **Phase 3 (Optional):** 1-2 days
  - Reports and other optimizations

**Total:** 5-8 days for complete migration
