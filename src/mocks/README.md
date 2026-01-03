# Mock Data Infrastructure

This directory contains the mock data infrastructure for local development using Mock Service Worker (MSW) and Faker.js.

## Overview

The mock data system allows you to develop and test the application without connecting to a real Supabase backend. It intercepts API calls and returns realistic mock data that persists across browser sessions using localStorage.

## Structure

```
src/mocks/
├── browser.ts              # MSW worker setup
├── handlers.ts             # API request handlers
├── index.ts                # Public exports
├── data/
│   ├── localStorage.ts     # localStorage persistence utilities
│   └── seedData.ts         # Seed data generation and initialization
└── factories/
    ├── userFactory.ts      # User data factory
    ├── studentFactory.ts   # Student data factory
    ├── contactFactory.ts   # Contact data factory
    ├── interactionFactory.ts # Interaction data factory
    └── reasonCategoryFactory.ts # Reason category/subcategory factory
```

## Configuration

Mock data is controlled by the `VITE_USE_MOCK_DATA` environment variable in `.env.local`:

```bash
# Enable mock data
VITE_USE_MOCK_DATA=true

# Disable mock data (use real Supabase)
VITE_USE_MOCK_DATA=false
```

## Features

### 1. Data Factories

Each factory generates realistic data using Faker.js:

- **userFactory**: Creates admin and counselor users
- **studentFactory**: Generates students with various grade levels
- **contactFactory**: Creates contacts (parents, teachers, etc.)
- **interactionFactory**: Generates interaction records
- **reasonCategoryFactory**: Creates predefined reason categories and subcategories

### 2. Seed Data

The seed data includes:

- **2 tenants**: Lincoln High School and Washington Middle School
- **5 users**: 2 admins and 3 counselors across both tenants
- **250 students**: 150 for tenant 1, 100 for tenant 2
- **80 contacts**: 50 for tenant 1, 30 for tenant 2
- **8 reason categories** with subcategories for each tenant
- **500 interactions**: 300 for tenant 1, 200 for tenant 2

### 3. localStorage Persistence

Mock data is automatically saved to localStorage and restored on page reload. This provides a consistent development experience without needing to regenerate data each time.

### 4. API Handlers

MSW handlers intercept Supabase API calls for:

- Authentication (login, logout, user session)
- Students (CRUD operations)
- Contacts (CRUD operations)
- Interactions (CRUD operations)
- Reason categories and subcategories (read operations)
- Users (read operations)

## Usage

### Default Users

You can log in with any of the mock users. Here are some examples:

**Tenant 1 (Lincoln High School):**

- Admin: `admin@lincoln-hs.edu`
- Counselor: `mjones@lincoln-hs.edu`
- Counselor: `lsmith@lincoln-hs.edu`

**Tenant 2 (Washington Middle School):**

- Admin: `admin@washington-ms.edu`
- Counselor: `ebrown@washington-ms.edu`

Password validation is bypassed in mock mode - any password will work.

### Resetting Mock Data

To reset the mock data to its initial state:

```typescript
import { resetMockData } from './mocks';

// Reset all mock data
resetMockData();
```

Or clear localStorage manually:

```typescript
import { clearMockDataStorage } from './mocks';

// Clear stored mock data
clearMockDataStorage();
```

### Adding Custom Mock Data

You can extend the factories to create custom test scenarios:

```typescript
import { createStudent } from './mocks/factories/studentFactory';
import { createInteraction } from './mocks/factories/interactionFactory';

// Create a specific student
const student = createStudent('tenant-id', {
  firstName: 'John',
  lastName: 'Doe',
  gradeLevel: '10th Grade',
  needsFollowUp: true,
});

// Create an interaction for that student
const interaction = createInteraction('tenant-id', 'counselor-id', {
  studentId: student.id,
  categoryId: 'category-id',
});
```

## Development Workflow

1. **Start development server**: `npm run dev`
2. **Mock data initializes automatically** when `VITE_USE_MOCK_DATA=true`
3. **Data persists** across page reloads via localStorage
4. **Make changes** to the application using mock data
5. **Switch to real backend** by setting `VITE_USE_MOCK_DATA=false`

## Benefits

- ✅ No backend setup required for frontend development
- ✅ Realistic data with proper relationships
- ✅ Fast iteration without network delays
- ✅ Consistent test data across sessions
- ✅ Easy to create specific test scenarios
- ✅ Multi-tenant data isolation testing
- ✅ Offline development capability

## Notes

- Mock data is stored in localStorage with a version key
- If the version changes, old data is automatically cleared
- MSW runs in the browser and intercepts fetch/XHR requests
- Unhandled requests are bypassed (won't cause errors)
- The mock worker script is located in `public/mockServiceWorker.js`
