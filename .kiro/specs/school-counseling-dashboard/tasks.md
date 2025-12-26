# Implementation Plan

- [x] 1. Initialize project structure and development environment
  - Create Vite + React + TypeScript project with proper configuration
  - Set up Tailwind CSS with custom theme configuration
  - Configure ESLint and Prettier for code quality
  - Set up folder structure for components, hooks, services, types, and mocks
  - Create environment variable configuration files (.env.example, .env.local)
  - _Requirements: 7.1, 7.5_

- [x] 2. Set up mock data infrastructure for local development
  - [x] 2.1 Install and configure Mock Service Worker (MSW)
    - Set up MSW browser worker
    - Create handlers structure for intercepting Supabase API calls
    - Configure MSW to activate based on environment variable
    - _Requirements: 11.1_
  
  - [x] 2.2 Create data factories with Faker.js
    - Implement userFactory for generating admin and counselor users
    - Implement studentFactory for generating student records with various grade levels
    - Implement contactFactory for generating parent, teacher, and other contacts
    - Implement interactionFactory for generating realistic interaction records
    - Implement reasonCategoryFactory for interaction reason categories and subcategories
    - _Requirements: 2.1, 4.1, 5.1_
  
  - [x] 2.3 Create seed data and localStorage persistence
    - Generate seed data for multiple tenants with users, students, contacts, and interactions
    - Implement localStorage utilities for persisting mock data across sessions
    - Create data initialization logic that runs on app startup in mock mode
    - _Requirements: 9.1, 9.3_

- [x] 3. Implement TypeScript types and interfaces
  - Define User, AuthState, and role types
  - Define Student interface with computed fields
  - Define Contact interface with relationship types
  - Define Interaction and InteractionFormData interfaces
  - Define ReasonCategory and ReasonSubcategory interfaces
  - Define DashboardStats and ReportFilters interfaces
  - Create database response types matching Supabase schema
  - _Requirements: 1.1, 2.1, 4.2, 5.1, 6.1_

- [x] 4. Build authentication system with mock support
  - [x] 4.1 Create Supabase client service
    - Initialize Supabase client with environment variables
    - Create wrapper functions for auth operations
    - Implement session management utilities
    - _Requirements: 11.1, 11.4_
  
  - [x] 4.2 Implement authentication context and hooks
    - Create AuthContext with user state and auth methods
    - Implement useAuth hook for accessing auth state
    - Create login, logout, and session refresh functions
    - Handle authentication errors and token expiration
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [x] 4.3 Build login page and protected route wrapper
    - Create Login component with email/password form
    - Implement form validation with Zod
    - Create ProtectedRoute component that checks authentication
    - Implement automatic redirect to login for unauthenticated users
    - _Requirements: 11.1, 11.5_

- [x] 5. Create core UI components with Shadcn/ui
  - [x] 5.1 Set up Shadcn/ui component library
    - Initialize Shadcn/ui configuration
    - Install core components (Button, Input, Select, Modal, Table)
    - Customize theme colors and design tokens
    - _Requirements: 7.1, 7.5_
  
  - [x] 5.2 Build reusable form components
    - Create FormInput component with validation feedback
    - Create FormSelect component with error states
    - Create FormTextarea for notes and long text
    - Create DateTimePicker component
    - _Requirements: 7.2_
  
  - [x] 5.3 Implement SearchableDropdown component
    - Create dropdown with real-time filtering
    - Implement keyboard navigation
    - Add loading and empty states
    - Make it reusable for students, contacts, and other entities
    - _Requirements: 4.1, 5.5_

- [x] 6. Build application layout and navigation
  - [x] 6.1 Create main layout components
    - Implement AppLayout with sidebar and header
    - Create Sidebar with role-based navigation items
    - Build Header with user info and logout button
    - Implement responsive mobile menu
    - _Requirements: 7.1, 7.3_
  
  - [x] 6.2 Set up React Router with role-based routes
    - Configure routes for dashboard, interactions, calendar, students, contacts, reports, admin
    - Implement role-based route protection (admin vs counselor)
    - Create navigation guards that check user permissions
    - Add 404 and unauthorized pages
    - _Requirements: 1.1, 1.5, 11.2_

- [x] 7. Implement student management features
  - [x] 7.1 Create student list view
    - Build StudentList component with table display
    - Show student ID, name, grade level, interaction count, total time spent, follow-up status
    - Implement sorting by columns
    - Add pagination for large datasets
    - _Requirements: 4.5_
  
  - [x] 7.2 Build student profile page
    - Create StudentProfile component displaying basic information
    - Show interaction count, total time spent, and follow-up status
    - Display follow-up indicator when needed
    - Add "Add Interaction" button that pre-populates student field
    - _Requirements: 4.2, 4.4, 8.4_
  
  - [x] 7.3 Implement student interaction history
    - Create InteractionHistory component for student profile
    - Display all interactions ordered by most recent first
    - Show interaction details (date, time, duration, category, notes)
    - Add filtering by date range and category
    - _Requirements: 4.3, 2.5_
  
  - [x] 7.4 Add student search functionality
    - Integrate SearchableDropdown for student search
    - Implement real-time filtering as user types
    - Display student ID, name, and grade level in results
    - Navigate to student profile on selection
    - _Requirements: 4.1_

- [x] 8. Implement contact management features
  - [x] 8.1 Create contact list view
    - Build ContactList component with table display
    - Show name, relationship, email, phone, organization, interaction count
    - Implement sorting and filtering
    - Add "View" and "Edit" action buttons
    - _Requirements: 5.1_
  
  - [x] 8.2 Build contact detail modal
    - Create ContactDetail component showing full contact information
    - Display interaction history with the contact
    - Show interaction count and recent interactions
    - Add "Add Interaction" button
    - _Requirements: 5.2_
  
  - [x] 8.3 Implement contact form for create/edit
    - Create ContactForm component with all contact fields
    - Implement validation for required fields
    - Handle create and update operations
    - Show success/error feedback
    - _Requirements: 5.3_
  
  - [x] 8.4 Add contact search functionality
    - Integrate SearchableDropdown for contact search
    - Implement filtering by name, relationship, or organization
    - Display contact details in search results
    - _Requirements: 5.5_

- [x] 9. Build interaction tracking system
  - [x] 9.1 Create interaction form component
    - Build InteractionForm with student/contact selection
    - Implement reason category and subcategory dropdowns
    - Add custom reason text field for "Other | Custom" option
    - Create start time picker and duration input
    - Automatically calculate and display end time
    - Add notes textarea and follow-up checkbox
    - Implement conditional follow-up date and notes fields
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 9.2 Implement interaction list view
    - Create InteractionList component with table display
    - Show student/contact, category, date/time, duration, counselor
    - Display interactions ordered by most recent first
    - Add filtering by date range, category, and student/contact
    - Implement "View" and "Edit" actions
    - _Requirements: 2.5_
  
  - [x] 9.3 Build interaction detail modal
    - Create InteractionDetail component showing all interaction information
    - Display calculated end time
    - Show follow-up status and details if applicable
    - Add "Edit" and "Delete" buttons
    - _Requirements: 2.1, 8.1_
  
  - [x] 9.4 Implement interaction CRUD operations
    - Create useInteractions hook with React Query
    - Implement create, read, update, delete functions
    - Handle optimistic updates for better UX
    - Show loading states and error handling
    - _Requirements: 2.4_

- [x] 10. Implement calendar interface
  - [x] 10.1 Set up FullCalendar component
    - Install and configure FullCalendar with React
    - Set up month, week, and day views
    - Configure time grid and event display
    - Style calendar to match application theme
    - _Requirements: 3.1_
  
  - [x] 10.2 Display interactions as calendar events
    - Fetch interactions and transform to calendar events
    - Color-code events by interaction category
    - Display event details (student/contact name, time, duration)
    - Implement event tooltips on hover
    - _Requirements: 3.1, 3.5_
  
  - [x] 10.3 Implement calendar event interactions
    - Add click handler to open interaction detail modal
    - Implement date click to create new interaction with pre-filled date
    - Enable drag-and-drop to reschedule interactions
    - Update interaction start time on drag
    - Show confirmation for rescheduling
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [x] 10.4 Add calendar filters and controls
    - Create CalendarFilters component for category filtering
    - Add view switcher (month/week/day)
    - Implement date navigation controls
    - Add "Today" button to jump to current date
    - _Requirements: 3.1_

- [x] 11. Build dashboard with analytics
  - [x] 11.1 Create dashboard statistics cards
    - Build DashboardStats component with key metrics
    - Display total interactions, total students, total time spent
    - Show metrics for last 30 days by default
    - Implement role-based stats (counselor sees own data, admin sees all)
    - _Requirements: 6.1, 6.4_
  
  - [x] 11.2 Implement interaction category breakdown chart
    - Create InteractionChart component using Recharts
    - Display pie chart of interaction reason category percentages
    - Show category names and percentages
    - Make chart interactive with tooltips
    - _Requirements: 6.1, 6.2_
  
  - [x] 11.3 Add recent activity feed
    - Create RecentActivity component showing latest interactions
    - Display student/contact name, category, date, and time
    - Limit to 10 most recent interactions
    - Add "View All" link to interactions page
    - _Requirements: 6.1_
  
  - [x] 11.4 Implement date range filter for dashboard
    - Add date range picker to dashboard
    - Update all statistics and charts when date range changes
    - Provide preset options (last 7 days, 30 days, 90 days, year)
    - _Requirements: 6.3_

- [x] 12. Implement follow-up tracking system
  - [x] 12.1 Create follow-up list view
    - Build component showing all pending follow-ups
    - Display student name, interaction date, follow-up date, notes
    - Show overdue follow-ups with visual indicators
    - Sort by follow-up date (overdue first)
    - _Requirements: 8.2, 8.5_
  
  - [x] 12.2 Implement follow-up completion workflow
    - Add "Mark Complete" button to follow-up items
    - Create modal for adding completion notes
    - Update interaction record with completion status
    - Remove from pending follow-ups list
    - _Requirements: 8.3_
  
  - [x] 12.3 Add follow-up indicators throughout app
    - Show follow-up badge on student profiles
    - Display follow-up count in student list
    - Add follow-up filter to interaction list
    - Highlight overdue follow-ups in red
    - _Requirements: 8.1, 8.4, 8.5_

- [-] 13. Build reporting system
  - [x] 13.1 Create report filters component
    - Build ReportFilters with date range picker
    - Add grade level multi-select filter
    - Add interaction type/category filter
    - Add counselor filter (admin only)
    - Implement "Apply Filters" and "Reset" buttons
    - _Requirements: 10.1_
  
  - [x] 13.2 Implement student volume report
    - Create VolumeReport component
    - Calculate total unique students seen in date range
    - Show breakdown by grade level
    - Display trend chart over time
    - _Requirements: 10.2_
  
  - [x] 13.3 Build interaction frequency report
    - Create FrequencyReport component
    - Identify students seen most often with interaction counts
    - Display as sortable table
    - Show total time spent with each student
    - _Requirements: 10.3_
  
  - [x] 13.4 Implement grade level distribution report
    - Create GradeLevelReport component
    - Show interaction count by grade level
    - Display as bar chart
    - Include percentage breakdown
    - _Requirements: 10.4_
  
  - [x] 13.5 Build time allocation report
    - Create TimeAllocationReport component
    - Show total time spent by category
    - Display time spent by grade level
    - Show time spent with individual students (top 20)
    - Use combination of charts and tables
    - _Requirements: 10.5_
  
  - [x] 13.6 Implement report export functionality
    - Add export buttons to each report
    - Implement CSV export for tabular data
    - Implement PDF export with charts and tables
    - Use libraries like jsPDF and html2canvas for PDF generation
    - _Requirements: 10.6, 6.5_

- [x] 14. Implement admin features
  - [x] 14.1 Build user management interface
    - Create UserManagement component with user table
    - Display email, name, role, status for all users in tenant
    - Add "Create User", "Edit", and "Deactivate" buttons
    - Show only users within current tenant
    - _Requirements: 1.2, 9.4_
  
  - [x] 14.2 Implement user creation and editing
    - Create UserForm modal for adding/editing users
    - Include fields for email, first name, last name, role
    - Implement validation for email format and required fields
    - Handle user creation and updates
    - Send invitation email (mock in development)
    - _Requirements: 1.2_
  
  - [x] 14.3 Build reason category management
    - Create ReasonManagement component
    - Display categories and subcategories in hierarchical view
    - Add "Create Category", "Edit", "Delete" actions
    - Implement drag-and-drop for reordering
    - Allow setting category colors for calendar
    - _Requirements: 1.3_
  
  - [x] 14.4 Implement admin-specific reports
    - Create admin dashboard showing system-wide analytics
    - Display metrics across all counselors
    - Show counselor activity comparison
    - Add filters for viewing specific counselor data
    - _Requirements: 1.4_
  
  - [x] 14.5 Add role-based access control checks
    - Implement permission checking utilities
    - Add guards to admin routes
    - Hide admin navigation items from counselors
    - Show error message when counselor tries to access admin features
    - _Requirements: 1.5, 11.2_

- [-] 15. Implement responsive design and mobile optimization
  - [x] 15.1 Make layout responsive
    - Implement mobile-friendly sidebar (hamburger menu)
    - Adjust header for mobile screens
    - Make tables horizontally scrollable on mobile
    - Stack dashboard cards vertically on small screens
    - _Requirements: 7.3_
  
  - [x] 15.2 Optimize forms for mobile
    - Ensure form inputs are touch-friendly
    - Adjust date/time pickers for mobile
    - Make modals full-screen on mobile
    - Improve keyboard handling on mobile devices
    - _Requirements: 7.2, 7.3_
  
  - [x] 15.3 Optimize calendar for mobile
    - Switch to day view by default on mobile
    - Make calendar events tappable with larger touch targets
    - Simplify event details on small screens
    - Disable drag-and-drop on mobile (use edit modal instead)
    - _Requirements: 7.3_

- [x] 16. Add animations and transitions
  - Create smooth page transitions using React Router
  - Add loading skeletons for data fetching states
  - Implement toast notifications for success/error messages
  - Add subtle hover effects on interactive elements
  - Implement modal enter/exit animations
  - _Requirements: 7.4_

- [x] 17. Implement error handling and loading states
  - [x] 17.1 Create error boundary component
    - Build ErrorBoundary to catch React rendering errors
    - Display user-friendly error message
    - Add "Reload" button to recover
    - Log errors to console in development
    - _Requirements: 11.5_
  
  - [x] 17.2 Add loading states throughout app
    - Create LoadingSpinner component
    - Show loading indicators during data fetching
    - Implement skeleton screens for lists and tables
    - Add loading state to buttons during form submission
    - _Requirements: 7.2_
  
  - [x] 17.3 Implement error handling for API calls
    - Create error handling utilities
    - Display toast notifications for errors
    - Handle authentication errors (redirect to login)
    - Handle permission errors (show access denied message)
    - Handle network errors (show retry option)
    - _Requirements: 11.5_

- [x] 18. Set up React Query for data management
  - Configure React Query client with default options
  - Create custom hooks for each data entity (useStudents, useContacts, useInteractions)
  - Implement query invalidation strategies
  - Set up optimistic updates for better UX
  - Configure caching and refetch policies
  - _Requirements: 2.4, 4.2, 5.2_

- [x] 19. Implement data validation with Zod
  - Create Zod schemas for all form data types
  - Implement validation for interaction form
  - Add validation for student and contact forms
  - Create validation for user management forms
  - Implement validation for report filters
  - Display validation errors in forms
  - _Requirements: 7.2, 11.1_

- [x] 20. Add utility functions and helpers
  - Create date formatting utilities (format display dates, calculate durations)
  - Implement time calculation helpers (calculate end time from start + duration)
  - Create name formatting utilities (full name, initials)
  - Build data aggregation helpers for reports
  - Implement export utilities (CSV generation, data formatting)
  - _Requirements: 2.3, 10.6_

- [x] 21. Prepare for Supabase integration
  - [x] 21.1 Create Supabase migration files
    - Write SQL migration for initial schema (tenants, users, students, contacts, etc.)
    - Create migration for RLS policies
    - Add migration for seed data (reason categories, sample tenant)
    - _Requirements: 9.1, 9.3_
  
  - [x] 21.2 Document Supabase setup process
    - Create README with Supabase project setup instructions
    - Document environment variables needed
    - Provide instructions for running migrations
    - Add guide for switching from mock to real data
    - _Requirements: 9.1_
  
  - [x] 21.3 Create Supabase service layer
    - Implement wrapper functions for common Supabase operations
    - Create helper for handling Supabase errors
    - Add utilities for real-time subscriptions
    - Implement tenant context helpers
    - _Requirements: 9.2, 9.3_

- [-] 22. Final integration and polish
  - [x] 22.1 Connect all features end-to-end
    - Verify data flows correctly between all components
    - Test navigation between all pages
    - Ensure role-based access works throughout app
    - Verify mock data works for all features
    - _Requirements: 7.5, 9.3_
  
  - [x] 22.2 Implement consistent styling
    - Apply consistent spacing and typography
    - Ensure color scheme is applied throughout
    - Verify all components match design system
    - Add consistent focus states for accessibility
    - _Requirements: 7.1, 7.5_
  
  - [x] 22.3 Add documentation
    - Create component documentation with usage examples
    - Document custom hooks and their parameters
    - Add JSDoc comments to utility functions
    - Create user guide for key features
    - _Requirements: 7.1_

- [x] 23. Implement "Regarding" field for contact interactions
  - [x] 23.1 Update data models and types
    - Add `regardingStudentId` field to Interaction interface
    - Update InteractionFormData interface to include regarding student
    - Add `regardingStudent` relation to populated Interaction type
    - Update mock data factories to include regarding student associations
    - _Requirements: 11.4_
  
  - [x] 23.2 Create RegardingStudentSelector component
    - Build searchable dropdown component for selecting students
    - Implement real-time filtering of student list
    - Add "Add New Student" option when no match found
    - Handle loading and error states
    - Make component reusable for other contexts
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 23.3 Update InteractionForm to include regarding field
    - Add regarding student selector to contact interaction form
    - Show/hide regarding field based on interaction type (contact only)
    - Integrate with existing form validation
    - Handle form submission with regarding student data
    - _Requirements: 11.1, 11.4_
  
  - [x] 23.4 Update interaction display components
    - Modify InteractionList to show regarding student for contact interactions
    - Update InteractionDetail modal to display regarding student information
    - Add regarding student info to calendar event tooltips
    - Show regarding student in interaction history views
    - _Requirements: 11.4_
  
  - [x] 23.5 Update student interaction history
    - Modify student profile to include contact interactions where student is "regarding"
    - Update interaction history query to include regarding interactions
    - Add visual distinction between direct and regarding interactions
    - Update interaction count calculations to include regarding interactions
    - _Requirements: 11.5_
  
  - [x] 23.6 Update reporting system for regarding field
    - Add regarding student filter to report filters component
    - Update contact interaction reports to include regarding student data
    - Modify report queries to filter by regarding student when selected
    - Update export functionality to include regarding student information
    - _Requirements: 11.6_
  
  - [x] 23.7 Update mock data and API handlers
    - Modify MSW handlers to support regarding student field
    - Update seed data to include realistic regarding student associations
    - Add regarding student to interaction factory
    - Update localStorage persistence to handle new field
    - _Requirements: 11.4_

- [ ]* 23.8 Write property-based tests for regarding functionality
  - [ ]* 23.8.1 Test regarding student dropdown completeness
    - **Feature: contact-interaction-regarding-field, Property 5: Regarding student dropdown completeness**
    - Generate random student lists and verify dropdown shows all students with working search
    - **Validates: Requirements 11.2**
  
  - [ ]* 23.8.2 Test contact interaction regarding persistence
    - **Feature: contact-interaction-regarding-field, Property 6: Contact interaction regarding persistence**
    - Generate random contact interactions with regarding students and verify persistence
    - **Validates: Requirements 11.4**
  
  - [ ]* 23.8.3 Test student history inclusion
    - **Feature: contact-interaction-regarding-field, Property 7: Student history inclusion**
    - Generate random interactions and verify student history includes both direct and regarding interactions
    - **Validates: Requirements 11.5**
  
  - [ ]* 23.8.4 Test regarding student report filtering
    - **Feature: contact-interaction-regarding-field, Property 8: Regarding student report filtering**
    - Generate random report data and verify filtering by regarding student works correctly
    - **Validates: Requirements 11.6**

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
