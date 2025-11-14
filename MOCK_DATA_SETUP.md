# Mock Data Setup Guide

This application supports both mock data (for development) and real Supabase backend (for production).

## Current Configuration

The application is currently configured to use **MOCK DATA** for development.

## How It Works

### Mock Service Worker (MSW)

The application uses [MSW (Mock Service Worker)](https://mswjs.io/) to intercept API requests and return mock data. This allows you to develop and test the application without needing a real Supabase backend.

### Environment Variables

The behavior is controlled by the `VITE_USE_MOCK_DATA` environment variable in `.env.local`:

```bash
# Use mock data (development)
VITE_USE_MOCK_DATA=true

# Use real Supabase (production)
VITE_USE_MOCK_DATA=false
```

## Switching Between Mock and Real Data

### To Use Mock Data (Current Setup)

1. Ensure `.env.local` has:
   ```bash
   VITE_USE_MOCK_DATA=true
   VITE_SUPABASE_URL=https://mock.supabase.co
   VITE_SUPABASE_ANON_KEY=mock-anon-key
   ```

2. Restart the development server:
   ```bash
   npm run dev
   ```

3. You should see in the console:
   - `🟢 Mock data is ENABLED - using MSW for API mocking`
   - `✅ MSW worker started successfully`

4. A yellow banner will appear at the top: `🧪 Development Mode - Using Mock Data`

### To Use Real Supabase Backend

1. Update `.env.local`:
   ```bash
   VITE_USE_MOCK_DATA=false
   VITE_SUPABASE_URL=your_actual_supabase_url
   VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   ```

2. Restart the development server:
   ```bash
   npm run dev
   ```

3. You should see in the console:
   - `🔴 Mock data is DISABLED - using real Supabase backend`

## Mock Data Features

### Pre-seeded Data

The mock data includes:

- **2 Tenants** (Lincoln High School, Washington Middle School)
- **5 Users** (2 admins, 3 counselors)
- **250 Students** (150 for tenant 1, 100 for tenant 2)
- **80 Contacts** (50 for tenant 1, 30 for tenant 2)
- **Reason Categories & Subcategories** (Academic, Behavioral, Social-Emotional, etc.)
- **500 Interactions** (300 for tenant 1, 200 for tenant 2)

### Default Login Credentials

For **Lincoln High School** (Tenant 1):
- Admin: `admin@lincoln-hs.edu` / any password
- Counselor 1: `mjones@lincoln-hs.edu` / any password
- Counselor 2: `lsmith@lincoln-hs.edu` / any password

For **Washington Middle School** (Tenant 2):
- Admin: `admin@washington-ms.edu` / any password
- Counselor: `ebrown@washington-ms.edu` / any password

### Data Persistence

Mock data is stored in browser localStorage, so it persists across page refreshes. To reset the data:

1. Open browser console
2. Run: `localStorage.clear()`
3. Refresh the page

Or programmatically:
```javascript
import { resetMockData } from '@/mocks/data/seedData';
resetMockData();
```

## Mock API Endpoints

MSW intercepts the following Supabase endpoints:

### Authentication
- `POST /auth/v1/token` - Login
- `GET /auth/v1/user` - Get current user
- `POST /auth/v1/logout` - Logout

### Students
- `GET /rest/v1/students` - List all students
- `GET /rest/v1/students/:id` - Get single student
- `POST /rest/v1/students` - Create student
- `PATCH /rest/v1/students` - Update student
- `DELETE /rest/v1/students` - Delete student

### Contacts
- `GET /rest/v1/contacts` - List all contacts
- `GET /rest/v1/contacts/:id` - Get single contact
- `POST /rest/v1/contacts` - Create contact
- `PATCH /rest/v1/contacts` - Update contact
- `DELETE /rest/v1/contacts` - Delete contact

### Interactions
- `GET /rest/v1/interactions` - List all interactions
- `GET /rest/v1/interactions/:id` - Get single interaction
- `POST /rest/v1/interactions` - Create interaction
- `PATCH /rest/v1/interactions` - Update interaction
- `DELETE /rest/v1/interactions` - Delete interaction

### Reason Categories
- `GET /rest/v1/reason_categories` - List categories
- `POST /rest/v1/reason_categories` - Create category
- `PATCH /rest/v1/reason_categories` - Update category
- `DELETE /rest/v1/reason_categories` - Delete category

### Reason Subcategories
- `GET /rest/v1/reason_subcategories` - List subcategories
- `POST /rest/v1/reason_subcategories` - Create subcategory
- `PATCH /rest/v1/reason_subcategories` - Update subcategory
- `DELETE /rest/v1/reason_subcategories` - Delete subcategory

### Users
- `GET /rest/v1/users` - List users
- `POST /rest/v1/users` - Create user
- `PATCH /rest/v1/users` - Update user

## Troubleshooting

### Mock data not loading

1. **Check console for errors**
   - Open browser DevTools (F12)
   - Look for MSW initialization messages
   - Check for any red error messages

2. **Verify environment variable**
   ```bash
   # In your terminal
   cat .env.local | grep VITE_USE_MOCK_DATA
   ```
   Should show: `VITE_USE_MOCK_DATA=true`

3. **Restart dev server**
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again
   - Environment variables are only loaded on startup

4. **Check MSW service worker**
   - Verify `public/mockServiceWorker.js` exists
   - If missing, run: `npx msw init public/ --save`

5. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache in DevTools

### "Unsupported grant type" error

If you see this error during login:
1. Make sure `.env.local` has the mock Supabase URL:
   ```bash
   VITE_SUPABASE_URL=https://mock.supabase.co
   ```
2. Restart the dev server
3. Clear browser cache and localStorage
4. The mock handlers now support all Supabase auth methods

### Login not working

If login fails:
1. Check console for auth messages:
   - Should see: `🔐 Mock Auth: Login attempt for [email]`
   - Should see: `✅ Mock Auth: Login successful` on success
2. Use one of the test accounts (any password works):
   - `admin@lincoln-hs.edu`
   - `mjones@lincoln-hs.edu`
3. Check that MSW is intercepting requests (look for `[MSW]` logs in console)

### Data not persisting

If mock data resets on every refresh:
- Check browser localStorage is enabled
- Check for localStorage errors in console
- Try a different browser

### Wrong tenant data showing

The mock system uses the first user in the array as the "current user". To switch tenants:
1. Log out
2. Log in with a different tenant's credentials
3. Or modify `src/mocks/handlers.ts` to change the default user

## Development Tips

### Adding New Mock Data

To add more mock data, edit the factories in `src/mocks/factories/`:
- `userFactory.ts` - Users
- `studentFactory.ts` - Students
- `contactFactory.ts` - Contacts
- `reasonCategoryFactory.ts` - Categories
- `interactionFactory.ts` - Interactions

### Customizing Mock Responses

Edit `src/mocks/handlers.ts` to customize API responses:

```typescript
// Example: Add delay to simulate network latency
http.get(`${SUPABASE_URL}/rest/v1/students`, async () => {
  await delay(1000); // 1 second delay
  return HttpResponse.json(students);
});
```

### Testing Error Scenarios

You can modify handlers to return errors:

```typescript
// Example: Simulate 500 error
http.post(`${SUPABASE_URL}/rest/v1/students`, () => {
  return HttpResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
});
```

## Production Deployment

Before deploying to production:

1. **Set up real Supabase project**
   - Create project at [supabase.com](https://supabase.com)
   - Run database migrations
   - Set up Row Level Security (RLS)

2. **Update environment variables**
   ```bash
   VITE_USE_MOCK_DATA=false
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Deploy**
   - The build will NOT include MSW in production
   - MSW only runs in development mode

## Additional Resources

- [MSW Documentation](https://mswjs.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Current Status:** ✅ Mock data is ENABLED and working
