# Shadcn/ui Setup Documentation

## Overview
This document describes the Shadcn/ui component library setup for the School Counselor Ledger application.

## Installation & Configuration

### Dependencies Installed
- `class-variance-authority` - For component variant management
- `clsx` - For conditional className management
- `tailwind-merge` - For merging Tailwind CSS classes

### Configuration Files

#### 1. components.json
Shadcn/ui configuration file defining:
- Component style: default
- TypeScript: enabled
- Path aliases for imports
- Tailwind configuration location

#### 2. tailwind.config.js
Extended with:
- CSS variables for theming
- Dark mode support
- Custom color tokens (primary, secondary, destructive, muted, accent, etc.)
- Border radius variables
- Animation keyframes

#### 3. src/index.css
Added CSS variables for:
- Light and dark theme colors
- Consistent design tokens
- Base styles for body and elements

#### 4. tsconfig.app.json & vite.config.ts
Configured path aliases:
- `@/*` maps to `./src/*`
- Enables clean imports like `@/components/ui/button`

## Core UI Components

### Base Components (src/components/ui/)
1. **Button** - Versatile button with multiple variants (default, destructive, outline, secondary, ghost, link)
2. **Input** - Text input with consistent styling
3. **Label** - Form labels with proper accessibility
4. **Select** - Native select dropdown
5. **Textarea** - Multi-line text input
6. **Dialog** - Modal/dialog component with header, footer, and content sections
7. **Table** - Complete table component with header, body, footer, rows, and cells
8. **Card** - Card container with header, content, and footer sections

### Form Components (src/components/common/)
1. **FormInput** - Input with label, error display, and helper text
2. **FormSelect** - Select with label, error display, and helper text
3. **FormTextarea** - Textarea with label, error display, and helper text
4. **DateTimePicker** - Date/time picker with label and validation
5. **SearchableDropdown** - Advanced dropdown with:
   - Real-time filtering
   - Keyboard navigation (Arrow keys, Enter, Escape, Tab)
   - Loading states
   - Empty states
   - Custom filter functions
   - Subtitle support for options
   - Accessibility features (ARIA attributes)

## Usage Examples

### Basic Button
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
```

### Form Input with Validation
```tsx
import { FormInput } from '@/components/common';

<FormInput
  label="Email"
  type="email"
  error={errors.email}
  helperText="Enter a valid email address"
/>
```

### Searchable Dropdown
```tsx
import { SearchableDropdown } from '@/components/common';

<SearchableDropdown
  label="Select Student"
  options={students.map(s => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName}`,
    subtitle: `Grade ${s.gradeLevel}`,
  }))}
  onChange={(value) => setSelectedStudent(value)}
  loading={isLoading}
/>
```

### Dialog/Modal
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <p>Are you sure?</p>
  </DialogContent>
</Dialog>
```

### Table
```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Features

### Theming
- CSS variables for easy theme customization
- Dark mode support (add `dark` class to root element)
- Consistent color palette across all components

### Accessibility
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader friendly

### TypeScript
- Full type safety
- IntelliSense support
- Proper prop types for all components

### Responsive Design
- Mobile-friendly components
- Responsive utilities from Tailwind CSS
- Touch-friendly interactive elements

## Next Steps

The component library is now ready for use in:
- Layout components (Sidebar, Header, Navigation)
- Dashboard components (Stats cards, charts)
- Interaction forms
- Student and contact management
- Calendar interface
- Reports and analytics

## File Structure
```
src/
├── lib/
│   └── utils.ts                    # cn() utility for className merging
├── components/
│   ├── ui/                         # Base Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   └── index.ts
│   └── common/                     # Custom form components
│       ├── FormInput.tsx
│       ├── FormSelect.tsx
│       ├── FormTextarea.tsx
│       ├── DateTimePicker.tsx
│       ├── SearchableDropdown.tsx
│       ├── index.ts
│       └── README.md
```
