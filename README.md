# School Counselor Ledger

A comprehensive SaaS application for school counselors to track student interactions, manage contacts, and generate reports.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query
- **Calendar**: FullCalendar
- **Charts**: Recharts
- **UI Components**: Shadcn/ui
- **Form Validation**: Zod

## Project Structure

```
src/
├── components/       # React components organized by feature
│   ├── common/      # Reusable UI components
│   ├── layout/      # Layout components (sidebar, header)
│   ├── dashboard/   # Dashboard components
│   ├── interactions/# Interaction tracking components
│   ├── calendar/    # Calendar view components
│   ├── students/    # Student management components
│   ├── contacts/    # Contact management components
│   ├── reports/     # Reporting components
│   └── admin/       # Admin-only components
├── hooks/           # Custom React hooks
├── services/        # API services and Supabase client
├── mocks/           # Mock data for local development
│   ├── factories/   # Data factories using Faker.js
│   └── data/        # Seed data
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for production) or use mock data for development

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables in `.env.local`:
   - For **mock data development** (recommended for initial setup):
     ```
     VITE_USE_MOCK_DATA=true
     ```
   - For **Supabase backend**:
     ```
     VITE_USE_MOCK_DATA=false
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Development Modes

### Mock Data Mode (Default)

Set `VITE_USE_MOCK_DATA=true` in `.env.local` to use Mock Service Worker (MSW) for API mocking. This allows you to develop without setting up Supabase.

Benefits:
- No backend setup required
- Fast iteration
- Realistic test data with Faker.js
- Data persists in localStorage

### Supabase Mode

Set `VITE_USE_MOCK_DATA=false` and configure Supabase credentials to connect to a real backend.

## Code Quality

- **ESLint**: Configured with TypeScript, React, and Prettier rules
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking enabled

## Multi-Tenant Architecture

The application uses Row Level Security (RLS) in Supabase to ensure complete data isolation between different school tenants.

## License

Private - All rights reserved
