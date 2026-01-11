# Design Document: Counselor Interaction Privacy

## Overview

The counselor interaction privacy feature implements role-based data access controls to ensure that counselor interactions remain private to the counselor who created them, while maintaining appropriate sharing of student and contact information within the same tenant. This design leverages existing Supabase Row Level Security (RLS) policies and extends the current architecture to enforce privacy boundaries consistently across all application layers.

The system maintains a clear separation between shared data (students, contacts, reason categories) and private data (interactions) while allowing administrators to access aggregated data for reporting and management purposes.

## Architecture

### Current Architecture Assessment

The existing system already implements the core privacy controls through:

1. **Database Layer**: Supabase RLS policies on the `interactions` table that filter by `counselor_id = auth.uid()`
2. **API Layer**: Tenant-based filtering in `src/services/api.ts` with proper context validation
3. **Authentication**: User context management through `src/services/auth.ts` with role-based access

### Privacy Boundary Design

```
┌─────────────────────────────────────────────────────────────┐
│                        TENANT BOUNDARY                       │
├─────────────────────────────────────────────────────────────┤
│  SHARED DATA (All Counselors + Admins)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  Students   │ │  Contacts   │ │ Reason Categories   │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  PRIVATE DATA (Per Counselor)                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              COUNSELOR A INTERACTIONS                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              COUNSELOR B INTERACTIONS                   │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ADMIN ACCESS (Aggregated View)                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         ALL INTERACTIONS (Anonymized/Aggregated)        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Layer (Already Implemented)

The existing RLS policies provide the foundation:

```sql
-- Counselors see only their interactions, admins see all
CREATE POLICY interactions_select_policy ON interactions
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id() AND
    (counselor_id = auth.uid() OR is_admin())
  );
```

### API Layer Enhancements

The current `src/services/api.ts` already implements proper tenant filtering. Key functions that enforce privacy:

1. **fetchInteractions()**: Returns all interactions with RLS filtering applied
2. **fetchStudentInteractions()**: Filters by student but respects counselor ownership
3. **createInteraction()**: Automatically assigns `counselor_id` to current user

### Hook Layer Consistency

The `useInteractions` hook in `src/hooks/useInteractions.ts` relies on the API layer, which ensures privacy is maintained through the data flow.

### UI Layer Adaptations

Components that need privacy-aware behavior:
- Dashboard statistics calculations
- Report generation and filtering
- Calendar event display
- Follow-up list management
- Student/Contact interaction history views

## Data Models

### Interaction Ownership Model

```typescript
interface InteractionPrivacyContext {
  counselorId: string;        // Owner of the interaction
  tenantId: string;          // Shared boundary
  isAdmin: boolean;          // Admin override capability
  canAccess: boolean;        // Computed access permission
}
```

### Shared vs Private Data Classification

```typescript
interface DataAccessLevel {
  SHARED_WITHIN_TENANT: 'students' | 'contacts' | 'reason_categories';
  PRIVATE_TO_COUNSELOR: 'interactions';
  ADMIN_AGGREGATED: 'interaction_statistics' | 'audit_logs';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all identified properties, several can be consolidated:

- Properties 2.1, 2.3, 3.1, 3.3 all test the same concept: shared data visibility within tenant
- Properties 4.1, 4.2, 4.3, 4.4, 4.5 all test the same concept: counselor-specific data filtering in UI components
- Properties 1.2, 1.3 can be combined: interaction access filtering
- Properties 6.1, 6.2, 6.3 can be combined: consistent access control enforcement

### Core Properties

**Property 1: Interaction Ownership Assignment**
*For any* interaction creation request, the system should assign the counselor_id to the currently authenticated user
**Validates: Requirements 1.1**

**Property 2: Counselor Interaction Access Filtering**
*For any* counselor user, all interaction queries should return only interactions where counselor_id matches the user's ID
**Validates: Requirements 1.2, 1.3**

**Property 3: Interaction Access Control**
*For any* interaction access attempt, the system should verify the requesting user is either the owner or an admin before allowing access
**Validates: Requirements 1.4**

**Property 4: Shared Data Tenant Visibility**
*For any* counselor within a tenant, student and contact queries should return all records within that tenant regardless of who created them
**Validates: Requirements 2.1, 2.3, 3.1, 3.3**

**Property 5: Mixed Access Student Profiles**
*For any* student profile access, the system should show student information to all tenant counselors but filter interaction history to only the requesting counselor's interactions
**Validates: Requirements 2.2, 3.2**

**Property 6: Counselor Statistics Isolation**
*For any* counselor dashboard or report, statistics should be calculated using only interactions owned by that counselor
**Validates: Requirements 2.5, 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 7: Admin Aggregated Access**
*For any* admin user, interaction queries should return all interactions within their tenant for reporting and management purposes
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

**Property 8: Consistent Access Control Enforcement**
*For any* data access method (API, database query, bulk operation), the same counselor ownership rules should be applied consistently
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

**Property 9: Audit Logging Without Content Exposure**
*For any* data access event, audit logs should record access patterns and security events without including private interaction content
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

## Error Handling

### Access Denial Scenarios

1. **Unauthorized Interaction Access**: Return 403 Forbidden with clear privacy boundary message
2. **Cross-Counselor Data Leakage**: Log security event and deny access
3. **Invalid Tenant Context**: Return 401 Unauthorized and require re-authentication

### Error Response Format

```typescript
interface PrivacyError {
  code: 'PRIVACY_VIOLATION' | 'UNAUTHORIZED_ACCESS' | 'INVALID_CONTEXT';
  message: string;
  counselorId?: string;
  resourceId?: string;
  timestamp: Date;
}
```

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions including:
- Specific counselor access scenarios
- Admin override functionality
- Error handling for privacy violations
- UI component behavior with filtered data

**Property-Based Tests**: Verify universal properties across all inputs using **fast-check** for TypeScript:
- Generate random counselor/admin users and verify access patterns
- Test interaction ownership assignment across various scenarios
- Validate consistent filtering across different data access methods
- Verify audit logging behavior across different access patterns

**Property-Based Testing Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference the corresponding design property
- Tag format: `**Feature: counselor-interaction-privacy, Property {number}: {property_text}**`

### Integration Testing

- Cross-component data flow validation
- Database RLS policy verification
- API endpoint permission enforcement
- UI component privacy boundary respect

### Security Testing

- Attempted unauthorized access logging
- Cross-tenant data isolation verification
- Admin privilege escalation testing
- Audit trail completeness validation