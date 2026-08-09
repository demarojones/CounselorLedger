# Beacon — Desktop Application Recreation Prompt (Mac & Windows)

> Use this prompt to recreate the Beacon application as a cross-platform installable desktop application for macOS and Windows.

---

## Prompt

Build me a cross-platform **installable desktop application** called **Beacon** for macOS and Windows. It's a multi-tenant system for K-12 school counselors to track student interactions, manage contacts, schedule via a calendar, generate reports, and handle follow-ups. The app should use **Electron** (or Tauri if you prefer a lighter footprint) to wrap a modern React frontend, with a cloud-synced NoSQL or SQL backend, and also support an **offline-first** mode with local data persistence.

---

## Application Summary

Beacon is a **FERPA-compliant counselor interaction tracking system** used by K-12 school counselors. Each school is a fully isolated tenant. Counselors log their interactions with students and contacts, track follow-ups, and generate analytics reports. Admins manage users, view aggregated organization-wide analytics, and monitor security events.

**Critical privacy rule:** Counselors can only see their own interactions. Admins can see aggregated data across all counselors in their tenant but with audit logging.

---

## Desktop Platform Requirements

### Framework Choice
- **Electron** (recommended for ecosystem maturity) OR **Tauri** (lighter, Rust-based)
- Must produce native installers:
  - macOS: `.dmg` installer + code signing for Gatekeeper
  - Windows: `.exe` installer (NSIS or MSI) + code signing
- Auto-update system (electron-updater or Tauri's built-in updater)
- Publish updates via GitHub Releases or a custom update server

### Desktop-Specific Features
- **System tray icon** with quick actions (new interaction, view follow-ups)
- **Native notifications** for overdue follow-ups and reminders (OS-level, not just in-app)
- **Keyboard shortcuts** for common actions (Cmd/Ctrl+N for new interaction, etc.)
- **Window state persistence** (remember size, position, maximized state)
- **Deep linking** (`beacon://` protocol) for setup tokens and invitation links
- **Offline mode** with local SQLite database that syncs when back online
- **Menu bar** with standard OS menus (File, Edit, View, Help) plus app-specific items
- **Drag-and-drop** file import (CSV/Excel files onto the window)
- **Print support** for reports (native OS print dialog)
- **Dock/Taskbar badge** showing unread notification count

### Offline-First Architecture
- Use a local SQLite database (via `better-sqlite3` or Tauri's built-in SQLite) as the primary data store
- Sync to cloud backend when internet is available
- Conflict resolution strategy: last-write-wins with timestamp comparison
- Queue mutations when offline, replay when connection restored
- Show sync status indicator in the UI (synced / syncing / offline / error)
- All features must work fully offline except: user management, invitations, and initial setup

---

## Tech Stack

### Desktop Shell
- **Electron 30+** with electron-builder for packaging
  - OR **Tauri 2.0** with Rust backend
- electron-store or tauri-plugin-store for local preferences
- electron-updater for auto-updates
- electron-log for desktop logging

### Frontend (Same as web, rendered inside desktop shell)
- React 19 + TypeScript
- Vite for build tooling
- Tailwind CSS + Shadcn/ui component library
- React Router v7 for navigation
- TanStack React Query for server state management
- FullCalendar for calendar/scheduling views
- Recharts for data visualization
- Framer Motion for page transitions
- Zod for form validation
- Lucide React for icons
- Sonner for toast notifications

### Local Database
- SQLite via `better-sqlite3` (Electron) or `sql.js` or Tauri's SQLite plugin
- Migrations managed at app startup
- Encryption at rest for sensitive data (SQLCipher or application-level AES encryption)

### Cloud Backend (Sync Target)
- Choose one: Supabase / Firebase / MongoDB Atlas + custom API / AWS (DynamoDB + Lambda)
- Real-time sync via WebSocket or polling
- Authentication: OAuth2 / JWT-based

### Build & Distribution
- electron-builder (Electron) or tauri-action (Tauri) for CI/CD
- GitHub Actions workflow for automated builds on tag push
- Code signing certificates for macOS (Apple Developer) and Windows (EV certificate)
- Auto-update channel: stable + beta

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
  id: string,
  name: string,
  subdomain: string (unique),
  contactPhone?: string,
  contactAddress?: string,
  contactEmail?: string,
  contactPersonName?: string,
  createdAt: Date,
  updatedAt: Date,
  _syncVersion: number  // for conflict resolution
}
```

### User
```
{
  id: string (matches auth provider user ID),
  tenantId: string,
  email: string (unique within tenant),
  firstName: string,
  lastName: string,
  role: "ADMIN" | "COUNSELOR",
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
  _syncVersion: number
}
```

### Student
```
{
  id: string (UUID),
  tenantId: string,
  studentId: string (optional — auto-generated as "STU-XXXXXXXX" if not provided),
  firstName: string,
  lastName: string,
  gradeLevel: string (enum: "Pre-K", "Kindergarten", "1st Grade" through "12th Grade"),
  email?: string,
  phone?: string,
  needsFollowUp: boolean,
  followUpNotes?: string,
  createdAt: Date,
  updatedAt: Date,
  _syncVersion: number,
  _deleted: boolean  // soft delete for sync
}
```
- `studentId` auto-generation format: `STU-` + 8 random characters from alphabet `23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz`

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
  updatedAt: Date,
  _syncVersion: number,
  _deleted: boolean
}
```

### Reason Category
```
{
  id: string,
  tenantId: string,
  name: string,
  color?: string (hex),
  sortOrder: number,
  createdAt: Date,
  updatedAt: Date,
  _syncVersion: number
}
```

### Reason Subcategory
```
{
  id: string,
  categoryId: string,
  name: string,
  sortOrder: number,
  createdAt: Date,
  updatedAt: Date,
  _syncVersion: number
}
```

### Interaction (PRIVATE — core entity)
```
{
  id: string,
  tenantId: string,
  counselorId: string (the creator/owner),
  studentId?: string (for student interactions),
  contactId?: string (for contact interactions),
  regardingStudentId?: string (for contact interactions — which student is this about),
  categoryId: string,
  subcategoryId?: string,
  customReason?: string,
  startTime: Date,
  durationMinutes: number,
  endTime: Date,
  notes?: string,
  needsFollowUp: boolean,
  followUpDate?: Date,
  followUpNotes?: string,
  isFollowUpComplete: boolean,
  createdAt: Date,
  updatedAt: Date,
  _syncVersion: number,
  _deleted: boolean
}
```
- Must reference either studentId OR contactId (not both, not neither).
- **PRIVACY**: Counselors see ONLY their own interactions.

### Security Event (Audit Log)
```
{
  id: string,
  tenantId?: string,
  eventType: string,
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  userId?: string,
  details?: object,
  createdAt: Date
}
```

### Notification
```
{
  id: string,
  type: "follow_up_due" | "follow_up_overdue" | "crisis_intervention" | "system_alert" | "reminder",
  priority: "low" | "medium" | "high" | "urgent",
  title: string,
  message: string,
  actionUrl?: string,
  relatedId?: string,
  relatedType?: "student" | "interaction" | "contact",
  isRead: boolean,
  createdAt: Date,
  expiresAt?: Date
}
```

### Sync Metadata (Local Only)
```
{
  collection: string,
  lastSyncedAt: Date,
  lastSyncVersion: number,
  pendingChanges: number
}
```

---

## Pages & Features

### 1. Authentication
- **Login page** — email/password with branded split-screen layout
- **Register page** — create account tied to a tenant
- **Initial Setup** — setup token flow for new school onboarding
- **Invitation Accept** — deep link (`beacon://invitation/:token`) opens the app and starts registration
- **Session persistence** — remember login across app restarts (secure token storage in OS keychain)

### 2. Dashboard (`/dashboard`)
- Summary cards: Total Interactions, Total Students, Total Time Spent
- Category breakdown pie chart
- Recent activity list
- Date range filter with presets: 7d, 30d, 90d, this year, custom
- **Desktop:** Shows notification badge in dock/taskbar

### 3. Interactions (`/interactions`)
- Filterable, sortable, paginated list
- Create/Edit modal with: type selector, searchable dropdowns, category/subcategory, datetime picker, duration, notes, follow-up toggle
- Delete with confirmation
- Follow-up list view (pending/overdue)
- Complete follow-up modal
- **Desktop:** Keyboard shortcut `Cmd/Ctrl+N` opens new interaction form

### 4. Calendar (`/calendar`)
- FullCalendar: Month, Week, Day views
- Color-coded events by category
- Click to create, click to view details
- Drag-and-drop reschedule (desktop)
- **Desktop:** Optional mini-calendar in system tray popup

### 5. Students (`/students`)
- Sortable/paginated table with search
- Add Student modal (studentId optional, auto-generated if blank)
- Import Students modal:
  - Download CSV template
  - Upload CSV/Excel via file picker OR drag-and-drop onto window
  - Column header fuzzy matching
  - Grade level normalization
  - Preview with validation
  - Auto-generate `STU-XXXXXXXX` IDs
  - Batch insert
- Student Detail page with profile and interaction history
- Edit/Delete student

### 6. Contacts (`/contacts`)
- List with search, CRUD, detail view with interaction history

### 7. Reports (`/reports`)
- **Counselor reports:** Student Volume, Frequency, Grade Level Distribution, Time Allocation
- **Admin reports:** Cross-counselor performance comparison, category distribution, trends
- Filters: date range, grade, category, student, counselor (admin)
- Export: CSV and PDF
- **Desktop:** Native print dialog (`Cmd/Ctrl+P`) for formatted report output

### 8. Admin (`/admin`) — Admin role only
- User Management, Invitation Management
- Reason Category Management
- Security Event Monitoring
- Privacy Compliance Reports

### 9. Layout & Navigation
- Sidebar navigation (collapsible)
- Header with user info and notification dropdown
- **Desktop:** Native window chrome (title bar with traffic lights on macOS, standard controls on Windows)
- **Desktop:** Menu bar: File (New Interaction, Import Students, Export, Quit), Edit (Undo, Cut, Copy, Paste), View (Reload, Toggle Sidebar, Zoom), Help (About, Check for Updates, Documentation)
- Sync status indicator in the footer/status bar

### 10. Settings (Desktop-specific)
- General: launch at login, default view, date format
- Notifications: enable/disable OS notifications, reminder timing
- Sync: force sync, clear local cache, connection status
- Updates: check for updates, auto-update toggle, update channel (stable/beta)
- Data: export all data, clear local database
- About: version info, licenses, support link

---

## Key Business Rules

1. **Multi-tenant isolation**: All queries filter by tenantId.
2. **Interaction privacy**: Counselors see ONLY their own. Admins see all (logged).
3. **Students/Contacts are shared** within a tenant.
4. **Follow-up tracking**: `needsFollowUp=true` + `followUpDate` → appears in follow-up list. Overdue if past due and incomplete.
5. **Student ID auto-generation**: `STU-` + 8 random alphanumeric chars.
6. **Interaction constraint**: Must reference student OR contact, not both/neither.
7. **Offline-first**: All CRUD operations work offline. Sync when connection available.
8. **Conflict resolution**: Last-write-wins based on `updatedAt` timestamp. Surface conflicts to user if both local and remote changed the same record.
9. **Soft deletes**: Use `_deleted: true` flag for sync-friendly deletions.

---

## Offline Sync Architecture

```
┌─────────────────────────┐
│   React UI (Renderer)    │
├─────────────────────────┤
│   React Query Cache      │
├─────────────────────────┤
│   Local SQLite DB        │  ← All reads/writes go here first
├─────────────────────────┤
│   Sync Engine (Main)     │  ← Background process
├─────────────────────────┤
│   Cloud API              │  ← Syncs when online
└─────────────────────────┘
```

### Sync Flow
1. User performs action → writes to local SQLite immediately
2. UI updates instantly from local data (optimistic)
3. Sync engine detects pending changes → pushes to cloud API
4. Sync engine pulls remote changes → merges into local SQLite
5. React Query cache invalidated → UI re-renders with latest data

### Conflict Handling
- Compare `updatedAt` timestamps
- If remote is newer: accept remote, discard local
- If local is newer: push local to remote
- If same timestamp but different data: prompt user to choose (rare edge case)

---

## Auto-Update System

### Electron (electron-updater)
```javascript
// Check for updates on app launch and every 4 hours
autoUpdater.checkForUpdatesAndNotify();

// Show native notification when update is available
autoUpdater.on('update-available', () => {
  // Notify user, offer to download
});

// Install on quit
autoUpdater.on('update-downloaded', () => {
  // Show "restart to update" prompt
});
```

### Release Channels
- `stable` — production releases
- `beta` — pre-release for testing

### Distribution
- macOS: `.dmg` with code signing + notarization (Apple Developer ID)
- Windows: `.exe` (NSIS installer) with EV code signing certificate
- Auto-update served from GitHub Releases or S3

---

## Installer Behavior

### macOS
- `.dmg` with drag-to-Applications instruction
- First launch: request necessary permissions (notifications, file access)
- Gatekeeper-compatible (signed + notarized)
- Registers `beacon://` URL scheme for deep links

### Windows
- NSIS installer with: install location selection, start menu shortcut, desktop shortcut (optional), launch after install
- Registers `beacon://` URL scheme
- Adds to Windows startup (optional, configurable in settings)
- Uninstaller removes all app data (with confirmation)

---

## Security (Desktop-Specific)

- Store auth tokens in OS keychain (macOS Keychain / Windows Credential Manager) — never in plain files
- Encrypt local SQLite with SQLCipher or application-level encryption
- Lock app after inactivity timeout (configurable: 5/15/30 min)
- App lock screen requires re-authentication (password or biometric on supported devices)
- Clear sensitive data from memory on lock
- No sensitive data in crash reports or logs

---

## UI/UX Design Notes

- Native-feeling window chrome (platform-appropriate)
- Frameless window with custom title bar OR standard OS frame (configurable)
- Blue-600/700 primary color, clean professional aesthetic
- Responsive layout within the window (supports window resizing)
- Dark mode support (follow OS preference + manual toggle)
- Smooth animations (60fps) using Framer Motion
- Loading skeletons, toast notifications, confirmation dialogs
- Accessible: keyboard navigation, screen reader support
- **macOS:** Vibrancy/translucency effects for sidebar (optional)
- **Windows:** Mica/Acrylic backdrop effects (optional, Windows 11)

---

## Project Structure (Electron)

```
beacon-desktop/
├── electron/
│   ├── main.ts              # Main process entry
│   ├── preload.ts           # Preload script (context bridge)
│   ├── ipc/                 # IPC handlers
│   │   ├── database.ts      # SQLite operations
│   │   ├── sync.ts          # Cloud sync logic
│   │   ├── notifications.ts # Native notifications
│   │   └── updates.ts       # Auto-updater
│   ├── database/
│   │   ├── schema.ts        # SQLite schema definitions
│   │   ├── migrations/      # DB migrations
│   │   └── sync-engine.ts   # Sync orchestration
│   ├── menu.ts              # App menu definitions
│   └── tray.ts              # System tray setup
├── src/                     # React frontend (same as web)
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   │   ├── api.ts           # Now talks to local SQLite via IPC
│   │   └── sync.ts          # Sync status service
│   ├── types/
│   └── utils/
├── resources/               # App icons, installer assets
│   ├── icon.icns            # macOS icon
│   ├── icon.ico             # Windows icon
│   ├── icon.png             # Linux/fallback
│   └── dmg-background.png   # macOS DMG background
├── electron-builder.config.js
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Build & CI/CD (GitHub Actions)

```yaml
# On tag push (v*), build for all platforms
jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - Build + sign + notarize .dmg
      - Upload to GitHub Releases

  build-windows:
    runs-on: windows-latest
    steps:
      - Build + sign .exe installer
      - Upload to GitHub Releases
```

---

## Implementation Order

1. Electron/Tauri project scaffolding with Vite + React
2. Window management (native chrome, menu bar, tray icon)
3. Local SQLite database setup with schema and migrations
4. Authentication (login, secure token storage in OS keychain)
5. IPC bridge between main process and renderer
6. Core data layer: read/write local SQLite from React via IPC
7. Students CRUD + Import (CSV/Excel drag-and-drop)
8. Contacts CRUD
9. Reason Categories management
10. Interactions CRUD + Follow-up system
11. Dashboard with stats and charts
12. Calendar integration
13. Reports with CSV/PDF export + native print
14. Admin features
15. Cloud sync engine (background sync, conflict resolution, status indicator)
16. Native notifications (follow-up reminders, overdue alerts)
17. Auto-update system
18. Settings page (preferences, sync, updates)
19. Deep linking (`beacon://` protocol)
20. Installer packaging (DMG + EXE with code signing)
21. Dark mode + platform-specific UI polish
22. CI/CD pipeline for automated builds and releases
