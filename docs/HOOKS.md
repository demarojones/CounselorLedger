# Custom Hooks Documentation

This document provides detailed information about custom React hooks used in the School Counselor Ledger application.

## Table of Contents

- [Data Fetching Hooks](#data-fetching-hooks)
  - [useStudents](#usestudents)
  - [useStudent](#usestudent)
  - [useContacts](#usecontacts)
  - [useContact](#usecontact)
  - [useInteractions](#useinteractions)
- [Mutation Hooks](#mutation-hooks)
  - [useCreateStudent](#usecreatestudent)
  - [useUpdateStudent](#useupdatestudent)
  - [useDeleteStudent](#usedeletestudent)
  - [useCreateContact](#usecreatecontact)
  - [useUpdateContact](#useupdatecontact)
  - [useDeleteContact](#usedeletecontact)
- [Other Hooks](#other-hooks)
  - [useAuth](#useauth)
  - [usePermissions](#usepermissions)
  - [useDashboardStats](#usedashboardstats)
  - [useReasonCategories](#usereasoncategories)

---

## Data Fetching Hooks

These hooks use React Query to fetch and cache data from the Supabase backend.

### useStudents

Fetches all students for the current tenant.

**Location:** `src/hooks/useStudents.ts`

**Returns:** `UseQueryResult<Student[]>`

**Properties:**
- `data` - Array of students
- `isLoading` - Loading state
- `error` - Error object if request failed
- `refetch` - Function to manually refetch data

**Usage Example:**

```tsx
import { useStudents } from '@/hooks/useStudents';

function StudentList() {
  const { data: students, isLoading, error } = useStudents();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading students</div>;

  return (
    <div>
      {students?.map(student => (
        <div key={student.id}>
          {student.firstName} {student.lastName}
        </div>
      ))}
    </div>
  );
}
```

**Features:**
- Automatic caching with React Query
- Automatic refetching on window focus
- Sorted by last name
- Filtered by tenant (via RLS)

---

### useStudent

Fetches a single student by ID.

**Location:** `src/hooks/useStudents.ts`

**Parameters:**
- `id` (string) - Student's unique identifier

**Returns:** `UseQueryResult<Student>`

**Usage Example:**

```tsx
import { useStudent } from '@/hooks/useStudents';

function StudentProfile({ studentId }: { studentId: string }) {
  const { data: student, isLoading } = useStudent(studentId);

  if (isLoading) return <LoadingSpinner />;
  if (!student) return <div>Student not found</div>;

  return (
    <div>
      <h1>{student.firstName} {student.lastName}</h1>
      <p>Grade: {student.gradeLevel}</p>
      <p>Student ID: {student.studentId}</p>
    </div>
  );
}
```

**Features:**
- Only fetches when `id` is provided (enabled: !!id)
- Cached separately from students list
- Automatically updates when student is modified

---

### useContacts

Fetches all contacts for the current tenant.

**Location:** `src/hooks/useContacts.ts`

**Returns:** `UseQueryResult<Contact[]>`

**Usage Example:**

```tsx
import { useContacts } from '@/hooks/useContacts';

function ContactList() {
  const { data: contacts, isLoading } = useContacts();

  return (
    <div>
      {contacts?.map(contact => (
        <div key={contact.id}>
          {contact.firstName} {contact.lastName} - {contact.relationship}
        </div>
      ))}
    </div>
  );
}
```

---

### useContact

Fetches a single contact by ID.

**Location:** `src/hooks/useContacts.ts`

**Parameters:**
- `id` (string) - Contact's unique identifier

**Returns:** `UseQueryResult<Contact>`

**Usage Example:**

```tsx
const { data: contact } = useContact(contactId);
```

---

### useInteractions

Comprehensive hook that fetches interactions and all related data (students, contacts, categories, subcategories).

**Location:** `src/hooks/useInteractions.ts`

**Returns:** `UseInteractionsResult`

```typescript
interface UseInteractionsResult {
  interactions: Interaction[];
  students: Student[];
  contacts: Contact[];
  categories: ReasonCategory[];
  subcategories: ReasonSubcategory[];
  isLoading: boolean;
  error: string | null;
  createInteraction: (data: InteractionFormData) => Promise<void>;
  updateInteraction: (id: string, data: Partial<InteractionFormData>) => Promise<void>;
  deleteInteraction: (id: string) => Promise<void>;
  completeFollowUp: (id: string, completionNotes?: string) => Promise<void>;
  refreshInteractions: () => Promise<void>;
}
```

**Usage Example:**

```tsx
import { useInteractions } from '@/hooks/useInteractions';

function InteractionsPage() {
  const {
    interactions,
    students,
    contacts,
    categories,
    subcategories,
    isLoading,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    completeFollowUp
  } = useInteractions();

  const handleCreate = async (data: InteractionFormData) => {
    await createInteraction(data);
  };

  const handleUpdate = async (id: string, data: Partial<InteractionFormData>) => {
    await updateInteraction(id, data);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this interaction?')) {
      await deleteInteraction(id);
    }
  };

  const handleCompleteFollowUp = async (id: string) => {
    await completeFollowUp(id, 'Follow-up completed successfully');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <InteractionForm
        students={students}
        contacts={contacts}
        categories={categories}
        subcategories={subcategories}
        onSubmit={handleCreate}
      />
      <InteractionList
        interactions={interactions}
        onEdit={handleUpdate}
        onDelete={handleDelete}
        onCompleteFollowUp={handleCompleteFollowUp}
      />
    </div>
  );
}
```

**Features:**
- Fetches all related data in one hook
- Provides CRUD operations
- Follow-up management
- Automatic data refresh after mutations
- Toast notifications for success/error
- Optimistic updates

---

## Mutation Hooks

These hooks use React Query mutations to create, update, and delete data with optimistic updates.

### useCreateStudent

Creates a new student record.

**Location:** `src/hooks/useStudents.ts`

**Returns:** `UseMutationResult`

**Usage Example:**

```tsx
import { useCreateStudent } from '@/hooks/useStudents';

function CreateStudentForm() {
  const createStudent = useCreateStudent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createStudent.mutate({
      studentId: 'S12345',
      firstName: 'John',
      lastName: 'Doe',
      gradeLevel: '10',
      email: 'john.doe@school.edu',
      phone: '555-1234'
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createStudent.isPending}>
        {createStudent.isPending ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  );
}
```

**Features:**
- Automatic cache invalidation
- Success toast notification
- Error handling with toast
- Optimistic cache update

---

### useUpdateStudent

Updates an existing student record.

**Location:** `src/hooks/useStudents.ts`

**Returns:** `UseMutationResult`

**Usage Example:**

```tsx
import { useUpdateStudent } from '@/hooks/useStudents';

function EditStudentForm({ student }: { student: Student }) {
  const updateStudent = useUpdateStudent();

  const handleSubmit = () => {
    updateStudent.mutate({
      id: student.id,
      gradeLevel: '11',
      needsFollowUp: true,
      followUpNotes: 'Check in next week'
    });
  };

  return (
    <button onClick={handleSubmit} disabled={updateStudent.isPending}>
      Update Student
    </button>
  );
}
```

**Features:**
- Optimistic updates (UI updates immediately)
- Automatic rollback on error
- Cache synchronization
- Success/error notifications

---

### useDeleteStudent

Deletes a student record.

**Location:** `src/hooks/useStudents.ts`

**Returns:** `UseMutationResult`

**Usage Example:**

```tsx
import { useDeleteStudent } from '@/hooks/useStudents';

function DeleteStudentButton({ studentId }: { studentId: string }) {
  const deleteStudent = useDeleteStudent();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent.mutate(studentId);
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteStudent.isPending}>
      Delete
    </button>
  );
}
```

**Features:**
- Optimistic removal from list
- Automatic rollback on error
- Invalidates related queries (interactions)
- Confirmation recommended before calling

---

### useCreateContact

Creates a new contact record.

**Location:** `src/hooks/useContacts.ts`

**Usage Example:**

```tsx
const createContact = useCreateContact();

createContact.mutate({
  firstName: 'Jane',
  lastName: 'Smith',
  relationship: 'Parent',
  email: 'jane@example.com',
  phone: '555-5678',
  organization: 'PTA'
});
```

---

### useUpdateContact

Updates an existing contact record.

**Location:** `src/hooks/useContacts.ts`

**Usage Example:**

```tsx
const updateContact = useUpdateContact();

updateContact.mutate({
  id: contactId,
  phone: '555-9999',
  organization: 'School Board'
});
```

---

### useDeleteContact

Deletes a contact record.

**Location:** `src/hooks/useContacts.ts`

**Usage Example:**

```tsx
const deleteContact = useDeleteContact();

deleteContact.mutate(contactId);
```

---

## Other Hooks

### useAuth

Provides authentication state and methods.

**Location:** `src/contexts/AuthContext.tsx`

**Returns:**

```typescript
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**Usage Example:**

```tsx
import { useAuth } from '@/contexts/AuthContext';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <header>
      <span>Welcome, {user?.firstName}</span>
      <button onClick={logout}>Logout</button>
    </header>
  );
}
```

---

### usePermissions

Checks user permissions based on role.

**Location:** `src/hooks/usePermissions.ts`

**Returns:**

```typescript
interface UsePermissionsResult {
  isAdmin: boolean;
  isCounselor: boolean;
  canManageUsers: boolean;
  canManageCategories: boolean;
  canViewAllInteractions: boolean;
}
```

**Usage Example:**

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function AdminPanel() {
  const { isAdmin, canManageUsers } = usePermissions();

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {canManageUsers && <UserManagement />}
    </div>
  );
}
```

---

### useDashboardStats

Fetches dashboard statistics for the current user.

**Location:** `src/hooks/useDashboardStats.ts`

**Parameters:**
- `startDate` (Date) - Start of date range
- `endDate` (Date) - End of date range

**Returns:** `UseQueryResult<DashboardStats>`

**Usage Example:**

```tsx
import { useDashboardStats } from '@/hooks/useDashboardStats';

function Dashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });

  const { data: stats, isLoading } = useDashboardStats(
    dateRange.startDate,
    dateRange.endDate
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Dashboard Statistics</h2>
      <p>Total Interactions: {stats?.totalInteractions}</p>
      <p>Total Students: {stats?.totalStudents}</p>
      <p>Total Time: {stats?.totalTimeSpent} minutes</p>
    </div>
  );
}
```

---

### useReasonCategories

Fetches interaction reason categories and subcategories.

**Location:** `src/hooks/useReasonCategories.ts`

**Returns:**

```typescript
interface UseReasonCategoriesResult {
  categories: ReasonCategory[];
  subcategories: ReasonSubcategory[];
  isLoading: boolean;
  error: Error | null;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}
```

**Usage Example:**

```tsx
import { useReasonCategories } from '@/hooks/useReasonCategories';

function CategoryManagement() {
  const {
    categories,
    subcategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory
  } = useReasonCategories();

  const handleCreate = async () => {
    await createCategory({
      name: 'Academic Support',
      color: '#3b82f6',
      sortOrder: 1
    });
  };

  return (
    <div>
      {categories.map(category => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          <ul>
            {subcategories
              .filter(sub => sub.categoryId === category.id)
              .map(sub => (
                <li key={sub.id}>{sub.name}</li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### Error Handling

All mutation hooks include automatic error handling with toast notifications:

```tsx
const createStudent = useCreateStudent();

// Errors are automatically caught and displayed
createStudent.mutate(data);

// Or handle errors manually
createStudent.mutate(data, {
  onError: (error) => {
    console.error('Failed to create student:', error);
    // Custom error handling
  }
});
```

### Loading States

Always check loading states before rendering data:

```tsx
const { data, isLoading, error } = useStudents();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <StudentList students={data} />;
```

### Optimistic Updates

Mutation hooks use optimistic updates for better UX:

```tsx
// UI updates immediately, then syncs with server
updateStudent.mutate({ id, gradeLevel: '11' });

// If server request fails, changes are automatically rolled back
```

### Cache Invalidation

React Query automatically manages cache invalidation:

```tsx
// After creating a student, the students list is automatically refetched
createStudent.mutate(data);

// Manual refetch if needed
const { refetch } = useStudents();
refetch();
```

### Dependent Queries

Some hooks depend on others being loaded first:

```tsx
// useStudent only runs when id is provided
const { data: student } = useStudent(studentId);

// Disable query until condition is met
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  enabled: !!userId // Only fetch when userId exists
});
```

---

## Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Component Documentation](./COMPONENTS.md)
- [Utility Functions](./UTILITIES.md)
- [API Integration](./API.md)
