# Animations and Transitions Guide

This guide documents all the animation and transition features implemented in the School Counselor Ledger application.

## Overview

The application uses a combination of:
- **Framer Motion** for complex animations and page transitions
- **Sonner** for toast notifications
- **Tailwind CSS** for simple transitions and hover effects
- **Custom CSS animations** for loading states

## Features Implemented

### 1. Toast Notifications

Toast notifications provide user feedback for actions throughout the application.

#### Usage

```typescript
import { toast } from '@/utils/toast';

// Success notification
toast.success('Success!', 'Your changes have been saved.');

// Error notification
toast.error('Error!', 'Something went wrong.');

// Info notification
toast.info('Information', 'This is an informational message.');

// Warning notification
toast.warning('Warning', 'Please review your input.');

// Promise toast (for async operations)
const promise = fetchData();
toast.promise(promise, {
  loading: 'Loading data...',
  success: 'Data loaded successfully!',
  error: 'Failed to load data'
});
```

#### Configuration

The Toaster component is already added to `App.tsx` and configured with the application's theme colors.

### 2. Page Transitions

Smooth fade and slide animations when navigating between pages.

#### Usage

Wrap your page content with the `PageTransition` component:

```typescript
import { PageTransition } from '@/components/common';

export function MyPage() {
  return (
    <PageTransition>
      <div className="p-6">
        {/* Your page content */}
      </div>
    </PageTransition>
  );
}
```

#### Animation Details
- **Initial state**: Opacity 0, translated 20px down
- **Animate to**: Opacity 1, original position
- **Exit state**: Opacity 0, translated 20px up
- **Duration**: 300ms with easeInOut timing

### 3. Loading Skeletons

Skeleton screens provide visual feedback while data is loading.

#### Available Skeletons

```typescript
import {
  TableSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  ProfileSkeleton,
} from '@/components/common';

// Table skeleton
<TableSkeleton rows={5} />

// Card skeleton
<CardSkeleton />

// Dashboard skeleton (includes stats cards, charts, and activity)
<DashboardSkeleton />

// Form skeleton
<FormSkeleton />

// Profile skeleton
<ProfileSkeleton />
```

#### Example Usage

```typescript
export function MyComponent() {
  const { data, isLoading } = useData();

  if (isLoading) {
    return (
      <PageTransition>
        <div className="p-6">
          <TableSkeleton rows={8} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-6">
        {/* Your content */}
      </div>
    </PageTransition>
  );
}
```

### 4. Modal Animations

Dialogs and modals automatically animate in and out.

#### Features
- Backdrop fades in/out (200ms)
- Content scales from 95% to 100% with fade
- Smooth exit animations
- Automatic body scroll lock when open

#### Usage

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <div>
      {/* Modal content */}
    </div>
  </DialogContent>
</Dialog>
```

No additional configuration needed - animations are built-in!

### 5. Interactive Element Hover Effects

Subtle hover effects enhance the user experience on interactive elements.

#### Buttons
- Smooth color transitions (200ms)
- Shadow on hover for solid buttons
- Scale down slightly on click (active:scale-95)
- Border color change for outline buttons

#### Cards
- Shadow increases on hover
- Smooth transition (200ms)

#### Table Rows
- Background color change on hover
- Subtle shadow on hover
- Smooth transition (200ms)

#### Implementation

These effects are built into the base components:
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/table.tsx`

No additional code needed - just use the components!

### 6. Custom CSS Animations

Additional CSS animations are available in `src/index.css`:

```css
/* Available animation classes */
.animate-fade-in      /* Fade in effect */
.animate-slide-up     /* Slide up with fade */
.animate-slide-down   /* Slide down with fade */
.animate-scale-in     /* Scale in with fade */
```

#### Usage

```typescript
<div className="animate-fade-in">
  Content that fades in
</div>
```

## Best Practices

### When to Use Each Animation Type

1. **Page Transitions**: Use for all main page components
2. **Toast Notifications**: Use for user action feedback (save, delete, error)
3. **Loading Skeletons**: Use while fetching data (prefer over spinners)
4. **Modal Animations**: Automatic - just use Dialog component
5. **Hover Effects**: Automatic - built into UI components

### Performance Considerations

- Page transitions use `AnimatePresence` with `mode="wait"` to prevent layout shifts
- Animations use GPU-accelerated properties (opacity, transform)
- Loading skeletons use CSS animations (more performant than JS)
- Hover effects use CSS transitions (hardware accelerated)

### Accessibility

- Animations respect `prefers-reduced-motion` media query
- Toast notifications are announced to screen readers
- Modal focus is trapped and managed automatically
- Keyboard navigation works with all animated components

## Examples

See `src/components/common/AnimationExamples.tsx` for live examples of all animation features.

To view examples in the app, import and render the `AnimationExamples` component in any page.

## Troubleshooting

### Animations not working?

1. Check that `framer-motion` and `sonner` are installed
2. Verify `Toaster` is added to `App.tsx`
3. Ensure `AnimatePresence` wraps your Routes in `App.tsx`
4. Check browser console for errors

### Page transitions feel janky?

1. Ensure only one `AnimatePresence` wraps your routes
2. Use `mode="wait"` on `AnimatePresence`
3. Keep transition durations short (200-300ms)
4. Avoid animating layout properties (width, height)

### Toast notifications not appearing?

1. Verify `Toaster` component is rendered in `App.tsx`
2. Check that you're importing from `@/utils/toast`, not `sonner` directly
3. Ensure no CSS is hiding the toast container

## Future Enhancements

Potential improvements for future iterations:

- Staggered list animations for table rows
- Micro-interactions for form inputs
- Loading progress indicators
- Skeleton screens that match actual content layout more closely
- Custom animation presets for different user preferences
- Animated charts and data visualizations
