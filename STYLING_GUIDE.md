# Styling Guide - School Counselor Ledger

## Design System Overview

This application uses a consistent design system built on Tailwind CSS with custom CSS variables for theming. All components should follow these guidelines to maintain visual consistency.

## Color Palette

### Semantic Colors
- **Primary**: Blue (`hsl(199 89% 48%)`) - Main brand color, used for primary actions and active states
- **Secondary**: Purple (`hsl(271 91% 65%)`) - Accent color for secondary elements
- **Destructive**: Red - Used for delete actions and error states
- **Muted**: Light gray - Used for backgrounds and subtle elements
- **Accent**: Light blue-gray - Used for hover states and highlights

### Usage
```tsx
// Use semantic color classes
<div className="bg-primary text-primary-foreground">Primary Button</div>
<div className="bg-card text-card-foreground">Card Content</div>
<div className="bg-muted text-muted-foreground">Subtle Text</div>
```

## Typography

### Heading Hierarchy
- **heading-1**: `text-3xl font-bold` - Page titles
- **heading-2**: `text-2xl font-semibold` - Section titles
- **heading-3**: `text-xl font-semibold` - Subsection titles
- **heading-4**: `text-lg font-medium` - Card titles

### Body Text
- **body-text**: `text-base` - Standard body text
- **body-text-sm**: `text-sm text-muted-foreground` - Helper text, captions

### Example
```tsx
<h1 className="heading-1">Dashboard</h1>
<h2 className="heading-2">Recent Activity</h2>
<p className="body-text">Main content goes here</p>
<p className="body-text-sm">Helper text or caption</p>
```

## Spacing

### Consistent Spacing Scale
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)

### Page Layout
```tsx
// Page container with consistent padding
<div className="page-container"> {/* p-4 sm:p-6 lg:p-8 */}
  <div className="section-spacing"> {/* space-y-6 */}
    {/* Content sections */}
  </div>
</div>
```

### Component Spacing
- Cards: `p-6` for padding
- Form groups: `space-y-2` between label and input
- Section spacing: `space-y-6` between major sections
- Button groups: `space-x-2` or `gap-2`

## Components

### Cards
```tsx
<div className="card">
  <div className="card-header">
    <h3 className="heading-3">Card Title</h3>
  </div>
  <div className="card-content">
    {/* Content */}
  </div>
</div>
```

### Badges
```tsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-danger">Danger</span>
<span className="badge badge-info">Info</span>
```

### Tables
```tsx
<div className="table-container">
  <table className="w-full">
    <thead className="table-header">
      <tr>
        <th className="table-header-cell">Column</th>
      </tr>
    </thead>
    <tbody>
      <tr className="table-row">
        <td className="table-cell">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Forms
```tsx
<div className="form-group">
  <label className="form-label">Field Label</label>
  <Input placeholder="Enter value" />
  <p className="form-helper">Helper text</p>
  <p className="form-error">Error message</p>
</div>
```

## Focus States (Accessibility)

All interactive elements must have visible focus states for keyboard navigation:

```tsx
// Buttons automatically have focus states via buttonVariants
<Button>Accessible Button</Button>

// Custom interactive elements
<div 
  tabIndex={0}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
>
  Custom Interactive Element
</div>
```

### Focus State Pattern
- Use `focus-visible:outline-none` to remove default outline
- Add `focus-visible:ring-2 focus-visible:ring-ring` for custom ring
- Add `focus-visible:ring-offset-2` for spacing
- This pattern is consistent across all form inputs and buttons

## Interactive States

### Hover Effects
```tsx
// Subtle hover for list items
<div className="interactive-hover">Hover me</div>

// Clickable elements with scale effect
<button className="clickable">Click me</button>

// Table rows
<tr className="table-row">...</tr> {/* Has hover effect built-in */}
```

### Active States
- Buttons have `active:scale-95` for tactile feedback
- Navigation items use `bg-primary/10 text-primary` for active state
- Links use `hover:underline` for text links

## Animations

### Available Animations
- `animate-fade-in`: Fade in effect (0.3s)
- `animate-slide-up`: Slide up from bottom (0.3s)
- `animate-slide-down`: Slide down from top (0.3s)
- `animate-scale-in`: Scale in effect (0.2s)

### Usage
```tsx
<div className="animate-fade-in">Fades in on mount</div>
<Modal className="animate-scale-in">Scales in</Modal>
```

### Transition Classes
- Use `transition-colors duration-200` for color changes
- Use `transition-all duration-200` for multiple properties
- Use `transition-transform` for scale/translate effects

## Status Indicators

### Status Dots
```tsx
<span className="status-dot status-dot-success" />
<span className="status-dot status-dot-warning" />
<span className="status-dot status-dot-danger" />
<span className="status-dot status-dot-info" />
```

### Status Badges
Use badge variants for status indicators:
```tsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Overdue</span>
```

## Responsive Design

### Breakpoints
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach
```tsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="lg:hidden">Mobile only</div>
```

## Best Practices

### DO ✅
- Use semantic color variables (`bg-card`, `text-foreground`)
- Use consistent spacing classes (`p-4`, `space-y-6`)
- Add focus states to all interactive elements
- Use utility classes from the design system
- Follow the component patterns in this guide

### DON'T ❌
- Use arbitrary color values (`bg-[#123456]`)
- Mix spacing scales inconsistently
- Forget focus states for accessibility
- Create custom styles when utility classes exist
- Use inline styles

## Dark Mode Support

The design system includes dark mode support via CSS variables. All semantic colors automatically adapt:

```tsx
// This works in both light and dark mode
<div className="bg-card text-card-foreground">
  Content adapts to theme
</div>
```

## Examples

### Page Layout
```tsx
export function MyPage() {
  return (
    <div className="page-container">
      <div className="section-spacing">
        <h1 className="heading-1">Page Title</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-content">
              <h3 className="heading-4">Card Title</h3>
              <p className="body-text-sm">Card content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Form Layout
```tsx
export function MyForm() {
  return (
    <form className="space-y-6">
      <div className="form-group">
        <label className="form-label">Name</label>
        <Input placeholder="Enter name" />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
```

## Maintenance

When adding new components:
1. Use existing utility classes first
2. Follow the spacing and color patterns
3. Ensure focus states are visible
4. Test in both light and dark mode
5. Verify responsive behavior
6. Document any new patterns in this guide
