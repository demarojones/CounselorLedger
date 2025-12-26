# SaaS Implementation Plan - Single Tenant Model

## Current Architecture ✅
- **One tenant = One school** (e.g., "Mayfield Elementary")
- **Complete data isolation** per school
- **Existing multi-tenant database structure** ready
- **Mock data system** for development

---

## Implementation Phases

### Phase 1: Production Database Setup (Week 1)

#### 1.1 Supabase Production Setup
```bash
# Create production Supabase project
1. Go to supabase.com
2. Create new project: "counselor-ledger-prod"
3. Note: URL and anon key
4. Enable Row Level Security (RLS)
```

#### 1.2 Database Migration
```sql
-- Run existing migrations in production
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rls_policies.sql
3. supabase/migrations/003_seed_data.sql (optional for demo data)
```

#### 1.3 Environment Configuration
```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_DATA=false
```

### Phase 2: Tenant Onboarding System (Week 2)

#### 2.1 Tenant Registration Flow
Create a simple onboarding process:

```typescript
// New tenant registration
interface TenantRegistration {
  schoolName: string;
  subdomain: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  schoolAddress?: string;
  phoneNumber?: string;
}
```

#### 2.2 Admin Account Creation
```typescript
// Automatic admin user creation
const createTenantAdmin = async (registration: TenantRegistration) => {
  // 1. Create tenant record
  // 2. Create admin user
  // 3. Send welcome email
  // 4. Generate temporary password
};
```

### Phase 3: Subdomain Routing (Week 2-3)

#### 3.1 DNS Configuration
```
# Subdomain structure
mayfield.counselorledger.com     → Mayfield Elementary
blythe.counselorledger.com       → Blythe Bower Elementary  
cleveland-high.counselorledger.com → Cleveland High School
```

#### 3.2 Application Routing
```typescript
// Detect tenant from subdomain
const getTenantFromSubdomain = () => {
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  return subdomain !== 'www' ? subdomain : null;
};
```

### Phase 4: Authentication & Authorization (Week 3)

#### 4.1 Tenant-Aware Authentication
```typescript
// Login with tenant context
const signInWithTenant = async (email: string, password: string, tenantSubdomain: string) => {
  // 1. Validate tenant exists
  // 2. Authenticate user
  // 3. Verify user belongs to tenant
  // 4. Set tenant context
};
```

#### 4.2 Row Level Security Policies
```sql
-- Ensure RLS policies are active
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
-- ... for all tables

-- Example policy
CREATE POLICY "Users can only see their tenant's students" 
ON students FOR ALL 
USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### Phase 5: Deployment Infrastructure (Week 4)

#### 5.1 Hosting Options

**Option A: Vercel (Recommended for speed)**
```bash
# Deploy to Vercel
npm install -g vercel
vercel --prod

# Configure custom domain
# Add DNS records for subdomains
```

**Option B: AWS/DigitalOcean**
```bash
# Docker deployment
# Load balancer for subdomain routing
# SSL certificates for all subdomains
```

#### 5.2 Environment Management
```bash
# Production environment
VITE_SUPABASE_URL=prod-url
VITE_SUPABASE_ANON_KEY=prod-key
VITE_USE_MOCK_DATA=false

# Staging environment  
VITE_SUPABASE_URL=staging-url
VITE_SUPABASE_ANON_KEY=staging-key
VITE_USE_MOCK_DATA=false
```

---

## Technical Implementation Details

### 1. Tenant Context Provider
```typescript
// src/contexts/TenantContext.tsx
interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
  switchTenant: (subdomain: string) => Promise<void>;
}

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  
  useEffect(() => {
    const subdomain = getTenantFromSubdomain();
    if (subdomain) {
      loadTenant(subdomain);
    }
  }, []);
  
  // ... implementation
};
```

### 2. Updated Authentication Flow
```typescript
// src/services/auth.ts
export const signIn = async (email: string, password: string) => {
  const subdomain = getTenantFromSubdomain();
  
  if (!subdomain) {
    throw new Error('Invalid subdomain');
  }
  
  // 1. Verify tenant exists
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) {
    throw new Error('School not found');
  }
  
  // 2. Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  // 3. Verify user belongs to this tenant
  const user = await getUserWithTenant(data.user.id);
  if (user.tenantId !== tenant.id) {
    throw new Error('Access denied for this school');
  }
  
  return { user, tenant };
};
```

### 3. Tenant Management API
```typescript
// src/services/tenantService.ts
export const tenantService = {
  async createTenant(data: TenantRegistration) {
    // Create tenant and admin user
  },
  
  async getTenantBySubdomain(subdomain: string) {
    // Fetch tenant info
  },
  
  async updateTenantSettings(tenantId: string, settings: TenantSettings) {
    // Update tenant configuration
  }
};
```

---

## Deployment Checklist

### Pre-Launch (Week 5)
- [ ] **Database**: Production Supabase project configured
- [ ] **Authentication**: Tenant-aware login working
- [ ] **Routing**: Subdomain routing functional
- [ ] **Security**: RLS policies tested
- [ ] **Performance**: Load testing completed
- [ ] **Backup**: Database backup strategy implemented

### Launch Preparation
- [ ] **Domain**: Purchase and configure DNS
- [ ] **SSL**: Wildcard SSL certificate for subdomains
- [ ] **Monitoring**: Error tracking (Sentry) setup
- [ ] **Analytics**: Usage tracking implemented
- [ ] **Documentation**: Admin and user guides ready

### Post-Launch
- [ ] **Support**: Help desk system
- [ ] **Updates**: Deployment pipeline for updates
- [ ] **Scaling**: Monitor performance and scale as needed

---

## School Onboarding Process

### For Cleveland City Schools Rollout

#### Step 1: Pilot School Setup
```bash
# Create first tenant
1. Register: mayfield.counselorledger.com
2. Create admin account: admin@mayfield.edu
3. Import student data (CSV upload)
4. Train counselors
5. Go live with 1-2 counselors
```

#### Step 2: Additional Schools
```bash
# Replicate for each school
1. blythe.counselorledger.com
2. cleveland-high.counselorledger.com
3. Each gets own admin and data
4. Independent operation
```

#### Step 3: District Coordination
```bash
# Manual coordination initially
1. Separate reports from each school
2. Manual data aggregation if needed
3. Shared training materials
4. Common support channel
```

---

## Cost Structure (Per School)

### Infrastructure Costs
- **Hosting**: $20-50/month (Vercel Pro)
- **Database**: $25/month (Supabase Pro per project)
- **Domain**: $12/year
- **SSL**: Free (Let's Encrypt)
- **Monitoring**: $10/month (Sentry)

**Total per school**: ~$65-85/month

### Pricing Strategy
- **Starter**: $99/month (up to 500 students)
- **Professional**: $199/month (up to 1,500 students)  
- **Enterprise**: $399/month (unlimited + support)

---

## Implementation Timeline

### Week 1: Database & Core Setup
- Set up production Supabase
- Run migrations
- Test with real data
- Configure environments

### Week 2: Tenant System
- Build tenant registration
- Implement subdomain detection
- Create admin onboarding flow
- Test multi-tenant isolation

### Week 3: Authentication & Security
- Tenant-aware authentication
- Test RLS policies
- Security audit
- Performance testing

### Week 4: Deployment & DNS
- Deploy to production hosting
- Configure DNS and subdomains
- SSL certificates
- Monitoring setup

### Week 5: Testing & Launch Prep
- End-to-end testing
- Documentation
- Training materials
- Pilot school setup

**Total Timeline: 5 weeks to production-ready SaaS**

---

## Next Immediate Steps

### This Week:
1. **Set up production Supabase project**
2. **Run database migrations**
3. **Test with real data instead of mocks**
4. **Configure production environment variables**

### Next Week:
1. **Implement tenant detection from subdomain**
2. **Build tenant registration flow**
3. **Test authentication with tenant context**

Would you like me to start implementing any of these steps, beginning with the production database setup?