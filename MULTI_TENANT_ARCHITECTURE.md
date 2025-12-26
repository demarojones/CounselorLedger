# Multi-Level Tenancy Architecture Analysis & Proposal

## Current Architecture Assessment

### Current Structure ✅
The application currently has a **single-level tenancy** model:
- **Tenant** = Individual School (e.g., "Lincoln High School")
- **Users** belong to one tenant
- **Data isolation** via `tenant_id` on all tables
- **Row Level Security (RLS)** enforces tenant boundaries

### Current Limitations ❌
- No organization-level hierarchy
- No cross-school reporting for districts
- No centralized management for school districts
- Each school operates in complete isolation

---

## Proposed Multi-Level Tenancy Architecture

### Hierarchy Structure
```
Organization (Cleveland City Schools)
├── School (Mayfield Elementary)
│   ├── Users (Counselors, Admins)
│   ├── Students
│   └── Interactions
├── School (Blythe Bower Elementary)
│   ├── Users (Counselors, Admins)
│   ├── Students
│   └── Interactions
└── School (Cleveland High School)
    ├── Users (Counselors, Admins)
    ├── Students
    └── Interactions
```

### User Roles Hierarchy
```
SUPER_ADMIN (Platform Level)
└── ORG_ADMIN (Organization Level - Cleveland City Schools)
    ├── SCHOOL_ADMIN (School Level - Individual Schools)
    └── COUNSELOR (School Level - Individual Schools)
```

---

## Implementation Approaches

### Option 1: Database Schema Evolution (Recommended)

#### New Tables Structure
```sql
-- Organizations table (new)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools table (replaces current tenants)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  school_code TEXT,
  address TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  school_id UUID REFERENCES schools(id), -- NULL for org-level users
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ORG_ADMIN', 'SCHOOL_ADMIN', 'COUNSELOR')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Migration Strategy
1. **Phase 1**: Add organization layer
2. **Phase 2**: Migrate existing tenants to schools
3. **Phase 3**: Update all foreign keys
4. **Phase 4**: Update RLS policies

### Option 2: Tenant Hierarchy (Alternative)

Keep current structure but add hierarchy within tenants:
```sql
-- Add to existing tenants table
ALTER TABLE tenants ADD COLUMN parent_tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tenants ADD COLUMN tenant_type TEXT CHECK (tenant_type IN ('ORGANIZATION', 'SCHOOL'));
```

---

## Deployment Models

### Model 1: Single Instance Multi-Tenant (Recommended)
**Architecture**: One application instance serves all organizations
```
app.counselorledger.com
├── cleveland.counselorledger.com (Organization)
│   ├── mayfield.cleveland.counselorledger.com (School)
│   ├── blythe.cleveland.counselorledger.com (School)
│   └── cleveland-high.cleveland.counselorledger.com (School)
└── columbus.counselorledger.com (Organization)
    ├── north.columbus.counselorledger.com (School)
    └── south.columbus.counselorledger.com (School)
```

**Benefits**:
- ✅ Cost-effective (single infrastructure)
- ✅ Easy maintenance and updates
- ✅ Cross-organization analytics possible
- ✅ Shared feature development

**Challenges**:
- ⚠️ Data isolation complexity
- ⚠️ Performance scaling
- ⚠️ Customization limitations

### Model 2: Organization-Level Instances
**Architecture**: Separate instance per organization
```
cleveland.counselorledger.com (Cleveland City Schools)
├── Database: cleveland_schools
├── Schools: Mayfield, Blythe, Cleveland High
└── Users: All Cleveland district users

columbus.counselorledger.com (Columbus City Schools)
├── Database: columbus_schools
├── Schools: North, South
└── Users: All Columbus district users
```

**Benefits**:
- ✅ Complete data isolation
- ✅ Organization-specific customization
- ✅ Independent scaling
- ✅ Easier compliance

**Challenges**:
- ❌ Higher infrastructure costs
- ❌ Complex deployment pipeline
- ❌ Duplicate maintenance effort

### Model 3: Hybrid Approach
**Architecture**: Single app with organization-level databases
```
app.counselorledger.com
├── Database: cleveland_db (Cleveland City Schools)
├── Database: columbus_db (Columbus City Schools)
└── Routing: Based on subdomain/organization
```

---

## Feature Implications

### Organization-Level Features
```typescript
// New organization admin features
interface OrganizationFeatures {
  // Cross-school reporting
  districtWideReports: boolean;
  
  // School management
  schoolManagement: boolean;
  
  // User management across schools
  crossSchoolUserManagement: boolean;
  
  // Policy enforcement
  districtPolicies: boolean;
  
  // Resource sharing
  sharedResources: boolean;
}
```

### School-Level Features (Current)
- Student management
- Counselor interactions
- School-specific reporting
- Local user management

### Permission Matrix
```typescript
interface PermissionMatrix {
  SUPER_ADMIN: {
    organizations: ['create', 'read', 'update', 'delete'];
    schools: ['create', 'read', 'update', 'delete'];
    users: ['create', 'read', 'update', 'delete'];
    data: ['read']; // Platform analytics only
  };
  
  ORG_ADMIN: {
    organization: ['read', 'update'];
    schools: ['create', 'read', 'update', 'delete'];
    users: ['create', 'read', 'update', 'delete'];
    reports: ['cross-school'];
  };
  
  SCHOOL_ADMIN: {
    school: ['read', 'update'];
    users: ['create', 'read', 'update'] // School-level only
    students: ['create', 'read', 'update', 'delete'];
    reports: ['school-level'];
  };
  
  COUNSELOR: {
    students: ['create', 'read', 'update'];
    interactions: ['create', 'read', 'update', 'delete'];
    reports: ['own-data'];
  };
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)
- [ ] Design new database schema
- [ ] Create migration scripts
- [ ] Update TypeScript types
- [ ] Implement organization management

### Phase 2: User Management (2 weeks)
- [ ] Add new user roles
- [ ] Update authentication flow
- [ ] Implement permission system
- [ ] Create organization admin UI

### Phase 3: School Management (2 weeks)
- [ ] School creation/management UI
- [ ] User assignment to schools
- [ ] School-level settings
- [ ] Data migration tools

### Phase 4: Cross-School Features (3 weeks)
- [ ] District-wide reporting
- [ ] Cross-school user management
- [ ] Resource sharing
- [ ] Policy enforcement

### Phase 5: Deployment & Testing (2 weeks)
- [ ] Subdomain routing
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation

---

## Technical Considerations

### Database Changes Required
```sql
-- Migration script outline
BEGIN;

-- 1. Create organizations table
CREATE TABLE organizations (...);

-- 2. Create schools table (rename from tenants)
CREATE TABLE schools (...);

-- 3. Update all existing tables
ALTER TABLE users ADD COLUMN organization_id UUID;
ALTER TABLE users ADD COLUMN school_id UUID;
-- ... update all other tables

-- 4. Migrate existing data
INSERT INTO organizations (name, subdomain) 
SELECT DISTINCT 'Default Org', 'default';

INSERT INTO schools (organization_id, name, subdomain)
SELECT org.id, t.name, t.subdomain
FROM tenants t, organizations org;

-- 5. Update foreign keys
-- ... complex migration logic

COMMIT;
```

### Application Changes Required
1. **Authentication**: Update to handle organization/school context
2. **Routing**: Subdomain-based routing for organizations
3. **UI**: New admin interfaces for organization management
4. **API**: New endpoints for cross-school operations
5. **Permissions**: Role-based access control system

### Current Code Compatibility
**Good News**: The current architecture is well-structured for this evolution:
- ✅ Already uses tenant-based isolation
- ✅ RLS policies can be extended
- ✅ Component architecture is modular
- ✅ TypeScript types are well-defined

**Changes Needed**:
- Update all `tenant_id` references to include organization context
- Add organization/school selection in UI
- Update all database queries
- Extend permission checking

---

## Recommended Approach

### For Cleveland City Schools Rollout

**Phase 1: Pilot (Single School)**
1. Deploy current single-tenant version to one school
2. Gather feedback and refine features
3. Document deployment process

**Phase 2: Multi-School (Same Organization)**
1. Implement Option 1 (Database Schema Evolution)
2. Deploy to 2-3 schools under Cleveland City Schools
3. Test cross-school reporting and management

**Phase 3: Full District Rollout**
1. Deploy to all Cleveland City Schools
2. Train organization administrators
3. Implement district-wide policies

**Phase 4: Multi-Organization**
1. Onboard additional school districts
2. Implement organization-level isolation
3. Scale infrastructure as needed

### Estimated Timeline: 3-4 months for full implementation

---

## Cost Implications

### Development Costs
- **Database redesign**: 40-60 hours
- **Backend updates**: 80-120 hours  
- **Frontend updates**: 60-80 hours
- **Testing & QA**: 40-60 hours
- **Documentation**: 20-30 hours

**Total**: 240-350 development hours

### Infrastructure Costs
- **Single Instance**: Current costs + 20-30% for additional complexity
- **Per-Organization**: 3-5x current costs (separate instances)
- **Hybrid**: 2-3x current costs (shared app, separate DBs)

---

## Conclusion

The current application architecture **can support** the multi-level tenancy model with significant but manageable changes. The **Database Schema Evolution** approach is recommended as it provides the best balance of features, cost, and maintainability.

The rollout should be **phased** starting with a pilot school, then expanding to the full district, and finally supporting multiple organizations.

**Next Steps**:
1. Validate this approach with stakeholders
2. Create detailed technical specifications
3. Begin Phase 1 implementation
4. Plan pilot deployment with Cleveland City Schools

Would you like me to elaborate on any specific aspect or begin implementing any part of this architecture?