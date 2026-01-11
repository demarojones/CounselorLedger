# Privacy Controls Documentation

## Overview

The School Counselor Ledger implements comprehensive privacy controls to ensure that counselor interactions remain private to the counselor who created them, while still allowing appropriate sharing of student and contact information within the same tenant (school). This document outlines how these privacy controls work and how they protect sensitive counseling data.

## Privacy Architecture

### Data Classification

The system classifies data into three categories:

1. **Shared Data** (Accessible to all counselors within a tenant)
   - Student profiles and basic information
   - Contact information (parents, teachers, administrators)
   - Reason categories and subcategories
   - School-wide settings

2. **Private Data** (Accessible only to the creating counselor)
   - Interaction records and notes
   - Follow-up information
   - Personal counseling observations
   - Session details and outcomes

3. **Admin Aggregated Data** (Accessible to administrators)
   - Anonymized statistics across all counselors
   - System-wide reporting data
   - User management information
   - Audit logs (without private content)

### Privacy Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        TENANT BOUNDARY                       │
│                      (School District)                       │
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

## Implementation Layers

### 1. Database Layer (Row Level Security)

The foundation of privacy controls is implemented through Supabase Row Level Security (RLS) policies:

```sql
-- Counselors see only their interactions, admins see all
CREATE POLICY interactions_select_policy ON interactions
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id() AND
    (counselor_id = auth.uid() OR is_admin())
  );

-- Only interaction owners can update their records
CREATE POLICY interactions_update_policy ON interactions
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id() AND
    counselor_id = auth.uid()
  );
```

**Key Features:**
- Automatic filtering at the database level
- Cannot be bypassed by application code
- Enforced for all database queries
- Tenant isolation prevents cross-school data access

### 2. API Layer (Access Control Validation)

The API layer provides additional validation and error handling:

```typescript
// Example: fetchInteraction with access control
export async function fetchInteraction(id: string) {
  const context = await getTenantContext();
  if (!context) {
    return { data: null, error: { code: 'AUTH_ERROR', message: 'Not authenticated' } };
  }

  // First check basic access
  const accessCheck = await supabase
    .from('interactions')
    .select('id, counselor_id, tenant_id')
    .eq('id', id)
    .single();

  if (accessCheck.data) {
    // Validate tenant boundary
    if (accessCheck.data.tenant_id !== context.tenantId) {
      await logPrivacyViolation(context.userId, 'CROSS_TENANT_ACCESS', id);
      return { data: null, error: { code: 'PRIVACY_VIOLATION', message: 'Access denied: different tenant' } };
    }

    // Validate counselor ownership (unless admin)
    if (context.userRole !== 'ADMIN' && accessCheck.data.counselor_id !== context.userId) {
      await logPrivacyViolation(context.userId, 'CROSS_COUNSELOR_ACCESS', id);
      return { data: null, error: { code: 'CROSS_COUNSELOR_ACCESS_DENIED', message: 'Access denied: another counselor\'s interaction' } };
    }
  }

  // Proceed with full data fetch if access is allowed
  // ... rest of implementation
}
```

**Key Features:**
- Explicit access validation before data operations
- Detailed error messages for different violation types
- Security event logging for audit trails
- Consistent enforcement across all endpoints

### 3. UI Layer (Privacy Indicators)

The user interface provides clear visual indicators of privacy boundaries:

**Privacy Indicators:**
- 🔒 Private interaction indicators in lists
- 👥 Shared data indicators on student/contact profiles
- 🔍 Admin-only aggregated view labels
- ⚠️ Access restriction messages

**Visual Distinctions:**
- Different styling for private vs. shared data sections
- Clear labeling of data ownership
- Contextual help explaining privacy boundaries
- Error messages that don't leak private information

## User Experience

### For Counselors

**What You Can Access:**
- ✅ All students and contacts in your school
- ✅ Your own interaction records and notes
- ✅ Your personal dashboard statistics
- ✅ Reports based on your interactions only
- ✅ Follow-ups for your interactions

**What You Cannot Access:**
- ❌ Other counselors' interaction records
- ❌ Other counselors' private notes
- ❌ Other counselors' follow-up information
- ❌ Detailed statistics from other counselors

**Privacy Features:**
- Your interaction lists show only your records
- Student profiles show shared info but only your interaction history
- Dashboard statistics reflect only your work
- Reports include only your data
- Calendar shows only your appointments

### For Administrators

**What You Can Access:**
- ✅ All students and contacts in your school
- ✅ Aggregated statistics across all counselors
- ✅ System-wide reports and analytics
- ✅ User management and system configuration
- ✅ Audit logs and security events

**What You Cannot Access:**
- ❌ Individual counselor's private notes (in normal reports)
- ❌ Detailed interaction content in audit logs
- ❌ Personal counselor dashboards

**Admin Features:**
- View aggregated data without compromising individual privacy
- Generate school-wide reports with anonymized data
- Monitor system usage and security events
- Manage user accounts and permissions

## Security Features

### Access Control Enforcement

1. **Multi-Layer Validation**
   - Database RLS policies (cannot be bypassed)
   - API layer access checks (explicit validation)
   - UI layer privacy indicators (user awareness)

2. **Tenant Isolation**
   - Complete data separation between schools
   - No cross-tenant data access possible
   - Separate authentication contexts

3. **Role-Based Permissions**
   - Counselor role: Own interactions only
   - Admin role: Aggregated access within tenant
   - No privilege escalation possible

### Audit and Monitoring

1. **Security Event Logging**
   ```typescript
   // Example security events logged:
   - CROSS_COUNSELOR_ACCESS_ATTEMPT
   - CROSS_TENANT_ACCESS_ATTEMPT  
   - BULK_ACCESS_VIOLATION
   - UNAUTHORIZED_INTERACTION_ACCESS
   ```

2. **Privacy-Safe Audit Logs**
   - Log access patterns without content
   - Record security violations with context
   - Track user activities for compliance
   - No private interaction content in logs

3. **Compliance Reporting**
   - Demonstrate privacy controls are working
   - Show access patterns and violations
   - Provide evidence of data protection
   - Generate compliance documentation

### Error Handling

**Privacy-Aware Error Messages:**
- Don't reveal existence of data user can't access
- Provide clear guidance on access boundaries
- Log security events without exposing private data
- Maintain user experience while enforcing security

**Example Error Responses:**
```typescript
// Good: Doesn't reveal if interaction exists
{ code: 'ACCESS_DENIED', message: 'You can only access your own interactions' }

// Bad: Reveals interaction exists
{ code: 'ACCESS_DENIED', message: 'Interaction 123 belongs to another counselor' }
```

## Data Flow Examples

### Counselor Viewing Student Profile

1. **Request:** Counselor clicks on student "John Doe"
2. **Shared Data:** Student profile loads (name, grade, contact info)
3. **Private Data:** Only counselor's interactions with John are shown
4. **UI Indicator:** "Showing your interactions with this student"
5. **Result:** Collaborative student support with privacy protection

### Admin Generating School Report

1. **Request:** Admin generates "Monthly Activity Report"
2. **Data Collection:** System aggregates all counselor interactions
3. **Anonymization:** Individual counselor details are anonymized
4. **Presentation:** Shows school-wide statistics without private details
5. **Result:** Administrative oversight without privacy violations

### Cross-Counselor Access Attempt

1. **Attempt:** Counselor A tries to access Counselor B's interaction
2. **Detection:** API layer validates ownership before database query
3. **Logging:** Security event logged with user ID and attempted resource
4. **Response:** Access denied with appropriate error message
5. **Result:** Privacy violation prevented and documented

## Testing and Validation

### Automated Testing

The system includes comprehensive test suites to validate privacy controls:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test data flow across system layers
3. **Security Tests** - Test access control enforcement
4. **Property-Based Tests** - Test privacy properties across random inputs

**Test Coverage:**
- ✅ Counselor interaction filtering
- ✅ Admin aggregated access
- ✅ Cross-counselor access denial
- ✅ Tenant boundary enforcement
- ✅ Bulk operation access control
- ✅ Error handling and logging

### Manual Validation Checklist

**For Counselors:**
- [ ] Can only see own interactions in lists
- [ ] Student profiles show only own interaction history
- [ ] Dashboard statistics reflect only own data
- [ ] Cannot access other counselors' records
- [ ] Receive clear error messages for access violations

**For Administrators:**
- [ ] Can view aggregated data across counselors
- [ ] Cannot see individual counselor private notes in normal reports
- [ ] Can manage users and system settings
- [ ] Can access audit logs without private content
- [ ] Can generate school-wide reports

**System-Wide:**
- [ ] No cross-tenant data leakage
- [ ] All access violations are logged
- [ ] Error messages don't reveal private information
- [ ] UI clearly indicates data ownership
- [ ] Performance remains good with privacy filtering

## Compliance and Legal

### FERPA Compliance

The privacy controls support FERPA compliance by:
- Restricting access to educational records
- Maintaining audit trails of data access
- Providing appropriate administrative oversight
- Ensuring data is only shared with authorized personnel

### State Privacy Laws

The system supports various state privacy requirements by:
- Implementing role-based access controls
- Providing data isolation between schools
- Maintaining detailed audit logs
- Offering data export and deletion capabilities

### Best Practices

**For School Administrators:**
- Regularly review audit logs for unusual access patterns
- Ensure counselors understand privacy boundaries
- Provide training on appropriate data sharing
- Maintain documentation of privacy controls

**For Counselors:**
- Understand what data is private vs. shared
- Report any suspected privacy violations
- Use appropriate categories and notes
- Follow school policies for data handling

## Troubleshooting

### Common Issues

**"Access Denied" Errors:**
- Verify you're trying to access your own interactions
- Check that you're logged in with the correct account
- Ensure you have the appropriate role permissions
- Contact admin if you believe there's an error

**Missing Interactions:**
- Remember you only see your own interactions
- Check date filters and search criteria
- Verify the interaction was created under your account
- Contact admin if data appears to be missing

**Student Profile Shows No History:**
- This is normal if you haven't worked with the student
- Other counselors' interactions are private
- Create your first interaction to start building history
- Shared student information is still available

### Getting Help

**For Technical Issues:**
1. Check this documentation first
2. Verify your user role and permissions
3. Contact your system administrator
4. Provide specific error messages and steps to reproduce

**For Privacy Questions:**
1. Review the privacy architecture section
2. Understand your role's access levels
3. Contact your administrator for policy questions
4. Report suspected privacy violations immediately

## Future Enhancements

### Planned Features

1. **Enhanced Audit Dashboard**
   - Real-time privacy violation monitoring
   - Detailed access pattern analysis
   - Automated compliance reporting

2. **Granular Permissions**
   - Custom role definitions
   - Department-level access controls
   - Temporary access grants

3. **Data Retention Policies**
   - Automated data archiving
   - Configurable retention periods
   - Secure data deletion

### Feedback and Improvements

We continuously improve privacy controls based on:
- User feedback and suggestions
- Security audits and assessments
- Regulatory requirement changes
- Industry best practices

To suggest improvements or report issues:
1. Document the specific privacy concern
2. Provide examples or use cases
3. Contact your system administrator
4. Include any relevant error messages or logs

---

## Summary

The School Counselor Ledger's privacy controls provide:

- **Complete Interaction Privacy** - Counselors' interactions remain private
- **Collaborative Student Support** - Shared student/contact information
- **Administrative Oversight** - Aggregated data without privacy violations
- **Comprehensive Security** - Multi-layer access control enforcement
- **Audit and Compliance** - Detailed logging without content exposure
- **User-Friendly Design** - Clear indicators and appropriate error handling

These controls ensure that sensitive counseling information remains confidential while supporting effective collaboration and administrative oversight within schools.
