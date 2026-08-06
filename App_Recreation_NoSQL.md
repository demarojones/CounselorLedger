# Beacon — Application Recreation Prompt (NoSQL Backend)

> Use this prompt to recreate the Beacon application from scratch with a NoSQL backend (e.g., MongoDB, DynamoDB, Firestore).

---

## Prompt

Build me a full-stack multi-tenant web application called **Beacon** for school counselors to track student interactions, manage contacts, schedule via a calendar, generate reports, and handle follow-ups. The app should use a **NoSQL database** (MongoDB Atlas or AWS DynamoDB or Firebase Firestore — your choice), a modern React frontend, and enforce strict privacy and data isolation between schools (tenants).

---

## Application Summary

Beacon is a **FERPA-compliant counselor interaction tracking system** used by K-12 school counselors. Each school is a fully isolated tenant. Counselors log their interactions with students and contacts, track follow-ups, and generate analytics reports. Admins manage users, view aggregated organization-wide analytics, and monitor security events.

**Critical privacy rule:** Counselors can only see their own interactions. Admins can see aggregated data across all counselors in their tenant but with audit logging.

---

## Tech Stack Requirements

### Frontend
- React 19 + TypeScript
- Vite for build tooling
- Tailwind CSS + Shadcn/ui component library
- React Router v7 for navigation
- TanStack React Query for server state management
- FullCalendar for calendar/scheduling views
- Recharts for data visualization (charts, graphs)
- Framer Motion for page transitions
- Zod for form validation
- Lucide React for icons
- Sonner for toast notifications

### Backend (NoSQL)
- Choose one: MongoDB Atlas / DynamoDB / Firestore
- Authentication service (Firebase Auth, AWS Cognito, or Auth0)
- The database must enforce multi-tenant data isolation
- API layer: Either serverless functions (Lambda/Cloud Functions) or a Node.js/Express API

### Development
- Mock data mode that works without a backend (use MSW or in-memory mocks)
- Faker.js for generating realistic test data
- ESLint + Prettier for code quality

---

## User Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Manage users, invite new users, view all interactions in their tenant (with audit log), manage reason categories, view org-wide reports, monitor security events |
| **COUNSELOR** | CRUD their own interactions, manage shared students/contacts, view their own reports, manage their own follow-ups |

---

## Data Models

### Tenant (School/Organization)
```
{
  id: string (UUID or ObjectId),
  name: string,
  subdomain: string (unique),
  contactPhone?: string,
  contactAddress?: string,
  contactEmail?: string,
  contactPersonName?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### User
```
{
  id: string (matches auth provider user ID),
  tenantId: string (FK to Tenant),
  email: string (unique within tenant),
  firstName: string,
  lastName: string,
  role: "ADMIN" | "COUNSELOR",
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Student
```
{
  id: string (UUID/ObjectId — primary key),
  tenantId: string (FK to Tenant),
  studentId: string (school-assigned external ID, optional — auto-generated as "STU-XXXXXXXX" if not provided),
  firstName: string,
  lastName: string,
  gradeLevel: string (enum: "Pre-K", "Kindergarten", "1st Grade" through "12th Grade"),
  email?: string,
  phone?: string,
  needsFollowUp: boolean,
  followUpNotes?: string,
  createdAt: Date,
  updatedAt: Date
}
```
- `studentId` is optional. If blank, auto-generate using format `STU-` followed by 8 random alphanumeric characters (exclude ambiguous chars like 0/O, 1/l/I).
- Unique constraint: (tenantId + studentId) when studentId is non-null.
- Students are **shared** across all counselors in a tenant.

### Contact
```
{
  id: string,
  tenantId: string,
  firstName: string,
  lastName: string,
  relationship: string (Parent | Guardian | Teacher | Administrator | Counselor | Social Worker | Other),
  email?: string,
  phone?: string,
  organization?: string,
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```
- Contacts are **shared** across all counselors in a tenant.

### Reason Category
```
{
  id: string,
  tenantId: string,
  name: string,
  color?: string (hex),
  sortOrder: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Reason Subcategory
```
{
  id: string,
  categoryId: string (FK to ReasonCategory),
  name: string,
  sortOrder: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Interaction (PRIVATE — core entity)
```
{
  id: string,
  tenantId: string,
  counselorId: string (FK to User — the creator/owner),
  studentId?: string (FK to Student — for student interactions),
  contactId?: string (FK to Contact — for contact interactions),
  regardingStudentId?: string (FK to Student — for contact interactions, which student is this about),
  categoryId: string (FK to ReasonCategory),
  subcategoryId?: string (FK to ReasonSubcategory),
  customReason?: string,
  startTime: Date,
  durationMinutes: number,
  endTime: Date (computed: startTime + durationMinutes),
  notes?: string,
  needsFollowUp: boolean,
  followUpDate?: Date,
  followUpNotes?: string,
  isFollowUpComplete: boolean,
  createdAt: Date,
  updatedAt: Date
}
```
- **CRITICAL**: An interaction must reference either a studentId OR a contactId (not both, not neither).
- **PRIVACY**: Counselors can only read/write their own interactions. Admins can read all interactions in their tenant (logged to audit trail).

### Security Event (Audit Log)
```
{
  id: string,
  tenantId?: string,
  eventType: string (see enum below),
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  email?: string,
  details?: object,
  createdAt: Date
}
```
Event types: `INVITATION_CREATED`, `INVITATION_ACCEPTED`, `INVITATION_FAILED`, `SETUP_TOKEN_USED`, `AUTH_FAILURE`, `INTERACTION_ACCESS`, `INTERACTION_CREATE`, `INTERACTION_UPDATE`, `INTERACTION_DELETE`, `PRIVACY_VIOLATION_ATTEMPT`, `ADMIN_AGGREGATED_ACCESS`, `CROSS_COUNSELOR_ACCESS_DENIED`

### Notification
```
{
  id: string,
  type: "follow_up_due" | "follow_up_overdue" | "crisis_intervention" | "new_interaction" | "system_alert" | "reminder",
  priority: "low" | "medium" | "high" | "urgent",
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string,
  relatedId?: string,
  relatedType?: "student" | "interaction" | "contact",
  isRead: boolean,
  createdAt: Date,
  expiresAt?: Date
}
```

### Setup Token (for onboarding new schools)
```
{
  id: string,
  tokenHash: string (SHA-256 hashed),
  tenantName: string,
  tenantSubdomain: string,
  adminEmail: string,
  expiresAt: Date,
  usedAt?: Date,
  createdAt: Date
}
```

### Invitation (for inviting users to a school)
```
{
  id: string,
  tenantId: string,
  email: string,
  firstName: string,
  lastName: string,
  role: "ADMIN" | "COUNSELOR",
  invitedBy: string (userId),
  tokenHash: string (SHA-256 hashed),
  expiresAt: Date (7 days from creation),
  acceptedAt?: Date,
  createdAt: Date
}
```

---

## Pages & Features

### 1. Authentication
- **Login page** — email/password auth with branded split-screen layout (left: branding + features, right: form)
- **Register page** — create a new account (tied to a tenant)
- **Initial Setup** (`/setup/:token`) — a system admin generates a setup token, the school admin uses it to create their tenant + admin account
- **Invitation Accept** (`/invitation/:token`) — invited users create their account via a token link

### 2. Dashboard (`/dashboard`)
- Summary cards: Total Interactions, Total Students, Total Time Spent (for the selected date range)
- Category breakdown pie chart (interactions by reason category)
- Recent activity list (last 10 interactions)
- Date range filter with presets: 7d, 30d, 90d, this year, custom

### 3. Interactions (`/interactions`)
- List all interactions (counselor sees only theirs) with sorting and pagination
- Filters: date range, category, student/contact, follow-up status
- Create/Edit interaction modal with:
  - Type selector: Student or Contact
  - Searchable student/contact dropdown
  - "Regarding Student" field for contact interactions (which student is this about)
  - Category + Subcategory selection
  - Date/time picker for start time
  - Duration in minutes
  - Notes textarea
  - Follow-up toggle with date and notes
- Delete interaction (with confirmation)
- Follow-up list view showing pending/overdue follow-ups
- Complete follow-up modal

### 4. Calendar (`/calendar`)
- FullCalendar with Month, Week, and Day views
- Events colored by category
- Click date/time to create a new interaction
- Click event to view interaction details
- Drag-and-drop to reschedule (desktop only)
- Responsive: day view on mobile

### 5. Students (`/students`)
- Sortable/paginated table: Student ID, Name, Grade Level, Interaction Count, Time Spent, Follow-up status
- Quick search with autocomplete
- **Add Student** modal (Student ID is optional — auto-generated if blank)
- **Import Students** modal:
  - Download CSV template
  - Upload CSV or Excel (.xlsx) file
  - Drag-and-drop support
  - Column header fuzzy matching (e.g., "firstname" → "first_name")
  - Grade level normalization (e.g., "9" → "9th Grade")
  - Preview table showing valid/invalid rows with per-row errors
  - Auto-generate `STU-XXXXXXXX` IDs for rows without one
  - Batch insert valid rows
- **Student Detail** (`/students/:id`): profile info, interaction history (counselor's only), stats
- Edit student

### 6. Contacts (`/contacts`)
- List with search
- Create/Edit/Delete contact
- Contact detail showing interaction history

### 7. Reports (`/reports`)
- **Counselor view** — four report tabs:
  1. **Student Volume** — unique students seen, breakdown by grade, weekly trend line
  2. **Interaction Frequency** — students seen most often (table + bar chart)
  3. **Grade Level Distribution** — interactions by grade (bar chart)
  4. **Time Allocation** — time spent by category and by grade level (pie + bar charts)
- **Admin view** — organization-wide analytics:
  - Counselor performance comparison (interactions, students, time)
  - Category distribution pie chart
  - Weekly trend line
  - Detailed counselor table
- Filters: date range presets, grade level, category, specific student, counselor (admin only)
- Export: CSV and PDF for all reports

### 8. Admin (`/admin`) — Admin role only
- **Admin Dashboard**: summary stats, counselor comparison charts, activity tables
- **User Management**: list users, create/edit/deactivate, role management
- **Invitation Management**: invite users, view pending invitations, resend/cancel
- **Reason Category Management**: CRUD categories and subcategories with colors and ordering
- **Security Event Monitoring**: view audit trail, filter by type/severity/date, suspicious activity detection
- **Privacy Compliance Reports**: data access patterns, violation attempts

### 9. Layout
- Responsive sidebar navigation (collapsible on mobile)
- Header with user info and notification dropdown
- Notification badge showing unread count
- Page transitions (fade/slide with Framer Motion)

---

## Key Business Rules

1. **Multi-tenant isolation**: All queries must filter by tenantId. A user in Tenant A can never see Tenant B's data.
2. **Interaction privacy**: Counselors see ONLY their own interactions. Admins can see all interactions in their tenant but this access is logged to the audit trail.
3. **Students and Contacts are shared** within a tenant — all counselors can see and edit them.
4. **Follow-up tracking**: Interactions with `needsFollowUp=true` and a `followUpDate` appear in the follow-up list. Overdue if `followUpDate < today` and `isFollowUpComplete=false`.
5. **Student ID auto-generation**: If `studentId` is blank when creating a student, generate `STU-` + 8 random characters (alphabet: `23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz`).
6. **Interaction constraint**: Must reference either a student OR a contact, never both, never neither.
7. **Setup token flow**: System generates a token → hashed and stored → admin uses token URL to create tenant + first admin account → token marked as used.
8. **Invitation flow**: Admin invites user by email → token generated and hashed → user clicks link → creates password → account created in tenant with specified role.
9. **Audit logging**: All sensitive operations (admin accessing interactions, invitation creation/acceptance, privacy violations) are logged to security events.

---

## NoSQL-Specific Considerations

Since the original app used PostgreSQL with Row Level Security, you'll need to handle these differently with NoSQL:

1. **Tenant isolation**: Every document must include a `tenantId` field. All queries must filter by it. Consider using it as a partition key (DynamoDB) or collection-level separation (Firestore).
2. **Access control**: Implement in your API layer (middleware that checks `req.user.tenantId` and `req.user.role` before returning data). For Firestore, use Security Rules.
3. **Counselor privacy**: For interactions, always filter by `counselorId = currentUser.id` unless the user is an admin. Log admin access.
4. **Relationships**: Denormalize where beneficial (e.g., embed student name on interaction documents for display without joins). Keep canonical data in separate collections.
5. **Uniqueness constraints**: Enforce `(tenantId, studentId)` uniqueness in your API layer since NoSQL databases don't natively support compound unique constraints (or use conditional writes in DynamoDB).
6. **Aggregation for reports**: Pre-compute or use aggregation pipelines (MongoDB) / scan with filters (DynamoDB) / Cloud Functions (Firestore).

### Suggested Collection Structure (MongoDB example)
```
tenants
users
students
contacts
reason_categories
reason_subcategories
interactions
security_events
notifications
setup_tokens
invitations
```

### Suggested Index Strategy (MongoDB)
```javascript
// students
{ tenantId: 1, lastName: 1, firstName: 1 }
{ tenantId: 1, studentId: 1 } // unique sparse

// interactions
{ tenantId: 1, counselorId: 1, startTime: -1 }
{ tenantId: 1, studentId: 1 }
{ tenantId: 1, needsFollowUp: 1, isFollowUpComplete: 1, followUpDate: 1 }

// security_events
{ tenantId: 1, createdAt: -1 }
{ tenantId: 1, eventType: 1, createdAt: -1 }
```

---

## UI/UX Design Notes

- Clean, professional aesthetic suitable for educational institutions
- Blue-600/700 as the primary brand color
- Cards with white backgrounds and subtle borders
- Responsive: works on desktop, tablet, and mobile
- Loading skeletons for data fetching states
- Toast notifications for success/error feedback
- Confirmation dialogs for destructive actions
- Accessible: proper labels, focus management, keyboard navigation
- Page transitions for smooth navigation feel

---

## Development Mode

Include a mock data mode that works without any backend:
- Toggle with environment variable: `VITE_USE_MOCK_DATA=true`
- Generate realistic test data (250 students, 80 contacts, 500 interactions, multiple counselors)
- Mock authentication (skip real auth, use hardcoded users)
- All features work identically in mock mode

---

## Deployment

- Frontend: Deploy to Netlify or Vercel (SPA with `/* → /index.html` redirect)
- Backend: Serverless functions or a containerized Node.js API
- Database: Managed NoSQL service (MongoDB Atlas free tier / DynamoDB / Firestore)

---

## Implementation Order

1. Project setup (Vite + React + TypeScript + Tailwind + Shadcn)
2. Routing and layout (sidebar, header, protected routes)
3. Authentication (login, register, auth context)
4. Data models and API service layer
5. Students CRUD + Import feature
6. Contacts CRUD
7. Reason Categories management
8. Interactions CRUD + Follow-up system
9. Dashboard with stats and charts
10. Calendar integration
11. Reports (Volume, Frequency, Grade Level, Time Allocation)
12. Admin features (user management, invitations, security events)
13. Notifications system
14. Setup/Onboarding flow (tokens, invitations)
15. Export features (CSV, PDF)
16. Polish: loading states, error boundaries, transitions, responsive design
