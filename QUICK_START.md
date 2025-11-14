# Quick Start Guide

## Current Setup

✅ **Mock Data Mode is ENABLED**

The application is configured to use mock data for development, so you don't need a Supabase backend to get started.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at: http://localhost:5173 (or another port if 5173 is in use)

### 3. Login

Use any of these test accounts:

**Lincoln High School:**
- Admin: `admin@lincoln-hs.edu` (any password)
- Counselor: `mjones@lincoln-hs.edu` (any password)
- Counselor: `lsmith@lincoln-hs.edu` (any password)

**Washington Middle School:**
- Admin: `admin@washington-ms.edu` (any password)
- Counselor: `ebrown@washington-ms.edu` (any password)

## What You'll See

- 🟡 Yellow banner at top: "🧪 Development Mode - Using Mock Data"
- Pre-populated data:
  - 250 students
  - 80 contacts
  - 500 interactions
  - Multiple reason categories

## Key Features to Try

1. **Dashboard** - View statistics and recent activity
2. **Interactions** - Create, edit, and delete interactions
3. **Students** - Browse student profiles and interaction history
4. **Contacts** - Manage external contacts
5. **Calendar** - Visual timeline of interactions
6. **Reports** - Generate analytics and export data
7. **Admin** (admin accounts only) - Manage users and categories

## Mock Data Details

- Data persists in browser localStorage
- Changes you make are saved locally
- To reset data: Clear browser localStorage or run `localStorage.clear()` in console

## Switching to Real Supabase

See [MOCK_DATA_SETUP.md](./MOCK_DATA_SETUP.md) for instructions on connecting to a real Supabase backend.

## Documentation

- [Component Documentation](./docs/COMPONENTS.md)
- [Hooks Documentation](./docs/HOOKS.md)
- [Utilities Documentation](./docs/UTILITIES.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Mock Data Setup](./MOCK_DATA_SETUP.md)

## Troubleshooting

### Mock data not loading?

1. Check console for MSW messages:
   - Should see: "🟢 Mock data is ENABLED"
   - Should see: "✅ MSW worker started successfully"

2. Verify `.env.local` has:
   ```
   VITE_USE_MOCK_DATA=true
   ```

3. Restart the dev server

### Need help?

Check the [MOCK_DATA_SETUP.md](./MOCK_DATA_SETUP.md) troubleshooting section.

---

**Happy coding! 🚀**
