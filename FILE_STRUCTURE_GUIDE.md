# File Structure Guide

## New Files Created

### API Layer
```
src/services/
├── api.ts                    ← NEW: Main API service
├── API_USAGE_GUIDE.md        ← NEW: Complete documentation
├── supabase.ts               (existing: Supabase client)
├── supabaseHelpers.ts        (existing: Helper functions)
└── ...
```

### Form Utilities
```
src/utils/
├── formSubmission.ts         ← NEW: Form handling utilities
├── toast.ts                  (existing: Toast notifications)
├── validation.ts             (existing: Validation helpers)
└── ...
```

## File Descriptions

### `src/services/api.ts` (NEW)
**Purpose**: High-level API for Supabase operations
**Size**: ~600 lines
**Exports**:
- Students: `fetchStudents`, `fetchStudent`, `createStudent`, `updateStudent`, `deleteStudent`
- Contacts: `fetchContacts`, `fetchContact`, `createContact`, `updateContact`, `deleteContact`
- Interactions: `fetchInteractions`, `fetchInteraction`, `createInteraction`, `updateInteraction`, `deleteInteraction`, `completeFollowUp`

**Key Features**:
- Automatic tenant context management
- Data transformation (snake_case ↔ camelCase)
- Consistent error handling
- Type-safe responses

### `src/utils/formSubmission.ts` (NEW)
**Purpose**: Form submission and validation utilities
**Size**: ~150 lines
**Exports**:
- `handleFormSubmission()` - Generic form submission handler
- `validateFormData()` - Validate required fields
- `sanitizeFormData()` - Clean and trim data
- `prepareFormData()` - Combined validation and sanitization

**Key Features**:
- Error handling with user-friendly messages
- Toast notifications
- Success/error callbacks
- Form data validation

### `src/services/API_USAGE_GUIDE.md` (NEW)
**Purpose**: Complete API documentation
**Size**: ~400 lines
**Contents**:
- Overview and basic usage patterns
- Students API examples
- Contacts API examples
- Interactions API examples
- Form submission examples
- Error handling patterns
- Best practices

## Integration Points

### Existing Files That Will Use the New API

```
src/pages/
├── Contacts.tsx              ← Will use: createContact, updateContact, deleteContact, fetchContacts
├── Students.tsx              ← Will use: createStudent, updateStudent, deleteStudent, fetchStudents
├── Interactions.tsx          ← Will use: createInteraction, updateInteraction, deleteInteraction, fetchInteractions
└── ...

src/components/
├── contacts/
│   ├── ContactForm.tsx       ← Will use: createContact, updateContact
│   └── ...
├── students/
│   ├── StudentFormModal.tsx  ← Will use: createStudent, updateStudent
│   └── ...
├── interactions/
│   ├── InteractionForm.tsx   ← Will use: createInteraction, updateInteraction
│   └── ...
└── ...
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Form Component                            │
│  (Contacts.tsx, Students.tsx, Interactions.tsx, etc.)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              handleFormSubmission()                          │
│  (src/utils/formSubmission.ts)                              │
│  - Validates form data                                      │
│  - Shows loading state                                      │
│  - Handles errors                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              API Functions                                   │
│  (src/services/api.ts)                                      │
│  - createContact, updateContact, deleteContact              │
│  - createStudent, updateStudent, deleteStudent              │
│  - createInteraction, updateInteraction, deleteInteraction  │
│  - Automatic tenant context                                 │
│  - Data transformation                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Client                                 │
│  (src/services/supabase.ts)                                 │
│  - Sends requests to Supabase                               │
│  - Handles authentication                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Backend                                │
│  - PostgreSQL Database                                      │
│  - Row Level Security (RLS)                                 │
│  - Multi-tenant isolation                                   │
└─────────────────────────────────────────────────────────────┘
```

## Usage Pattern

### Before (Direct Supabase)
```typescript
// In component
const { data, error } = await supabase
  .from('contacts')
  .insert({ first_name: 'John', ... })
  .select()
  .single();

if (error) {
  // Handle error
  toast.error(error.message);
} else {
  // Update state
  setContacts([...contacts, data]);
}
```

### After (Using API Layer)
```typescript
// In component
const result = await handleFormSubmission(
  () => createContact({ firstName: 'John', ... }),
  {
    onSuccess: (newContact) => {
      setContacts([...contacts, newContact]);
    },
  }
);
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Code Length** | 10+ lines | 5 lines |
| **Error Handling** | Manual | Automatic |
| **Notifications** | Manual | Automatic |
| **Tenant Context** | Manual | Automatic |
| **Data Transform** | Manual | Automatic |
| **Type Safety** | Partial | Full |
| **Validation** | Manual | Built-in |
| **Reusability** | Low | High |

## Getting Started

1. **Read Documentation**
   ```
   src/services/API_USAGE_GUIDE.md
   CONTACTS_PAGE_EXAMPLE.md
   API_INTEGRATION_SUMMARY.md
   ```

2. **Review Examples**
   - See `CONTACTS_PAGE_EXAMPLE.md` for before/after
   - See `API_USAGE_GUIDE.md` for complete examples

3. **Integrate into Your Pages**
   - Start with Contacts page
   - Then Students page
   - Then Interactions page

4. **Test**
   - Test with mock data
   - Test with real Supabase
   - Test error scenarios

## File Locations Quick Reference

| What | Where |
|------|-------|
| API Functions | `src/services/api.ts` |
| Form Utilities | `src/utils/formSubmission.ts` |
| API Documentation | `src/services/API_USAGE_GUIDE.md` |
| Integration Example | `CONTACTS_PAGE_EXAMPLE.md` |
| Quick Reference | `API_INTEGRATION_SUMMARY.md` |
| This Guide | `FILE_STRUCTURE_GUIDE.md` |

## Next Steps

1. ✅ API layer created
2. ✅ Form utilities created
3. ✅ Documentation created
4. ⏳ Integrate into Contacts page
5. ⏳ Integrate into Students page
6. ⏳ Integrate into Interactions page
7. ⏳ Test with real Supabase
8. ⏳ Update other components

Ready to integrate! 🚀
