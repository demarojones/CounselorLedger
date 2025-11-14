/**
 * Animation Examples
 * 
 * This file demonstrates how to use the various animation features
 * implemented in the application. Use these patterns throughout the app.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableSkeleton, CardSkeleton, DashboardSkeleton } from './LoadingSkeletons';

export function AnimationExamples() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Example 1: Toast Notifications
  const showSuccessToast = () => {
    toast.success('Success!', 'Your changes have been saved successfully.');
  };

  const showErrorToast = () => {
    toast.error('Error!', 'Something went wrong. Please try again.');
  };

  const showInfoToast = () => {
    toast.info('Information', 'This is an informational message.');
  };

  const showWarningToast = () => {
    toast.warning('Warning', 'Please review your input before proceeding.');
  };

  // Example 2: Promise Toast (for async operations)
  const showPromiseToast = () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve('Data loaded'), 2000);
    });

    toast.promise(promise, {
      loading: 'Loading data...',
      success: 'Data loaded successfully!',
      error: 'Failed to load data',
    });
  };

  // Example 3: Loading Skeletons
  const toggleLoading = () => {
    setLoading(!loading);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Animation Examples</h1>
        <p className="text-muted-foreground">
          Demonstrations of animations and transitions in the application
        </p>
      </div>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Use toast notifications to provide feedback for user actions.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={showSuccessToast} variant="default">
              Success Toast
            </Button>
            <Button onClick={showErrorToast} variant="destructive">
              Error Toast
            </Button>
            <Button onClick={showInfoToast} variant="outline">
              Info Toast
            </Button>
            <Button onClick={showWarningToast} variant="secondary">
              Warning Toast
            </Button>
            <Button onClick={showPromiseToast} variant="outline">
              Promise Toast
            </Button>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-md">
            <code className="text-sm">
              {`import { toast } from '@/utils/toast';

// Success
toast.success('Success!', 'Description here');

// Error
toast.error('Error!', 'Description here');

// Promise (for async operations)
toast.promise(promise, {
  loading: 'Loading...',
  success: 'Success!',
  error: 'Error!'
});`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Modal Animations */}
      <Card>
        <CardHeader>
          <CardTitle>Modal Animations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Modals automatically animate in and out with fade and scale effects.
          </p>
          <Button onClick={() => setShowModal(true)}>Open Modal</Button>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Animated Modal</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>This modal animates in with a smooth fade and scale effect.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The backdrop also fades in, and the modal scales from 95% to 100%.
                </p>
              </div>
              <Button onClick={() => setShowModal(false)}>Close</Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Loading Skeletons */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Skeletons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Show loading skeletons while data is being fetched.
          </p>
          <Button onClick={toggleLoading}>
            {loading ? 'Hide' : 'Show'} Loading States
          </Button>
          
          {loading && (
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="font-semibold mb-2">Table Skeleton</h3>
                <TableSkeleton rows={3} />
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Card Skeleton</h3>
                <CardSkeleton />
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Dashboard Skeleton</h3>
                <DashboardSkeleton />
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-muted rounded-md">
            <code className="text-sm">
              {`import { TableSkeleton, CardSkeleton, DashboardSkeleton } from '@/components/common';

// In your component
if (loading) {
  return <TableSkeleton rows={5} />;
}

// Or for dashboard
if (loading) {
  return <DashboardSkeleton />;
}`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Button Hover Effects */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Element Hover Effects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Buttons, cards, and table rows have subtle hover effects built-in.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="destructive">Destructive Button</Button>
            <Button variant="ghost">Ghost Button</Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Hover over buttons to see shadow and scale effects. Cards also have hover shadows.
          </p>
        </CardContent>
      </Card>

      {/* Page Transitions */}
      <Card>
        <CardHeader>
          <CardTitle>Page Transitions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Wrap page content with PageTransition for smooth navigation animations.
          </p>
          <div className="p-4 bg-muted rounded-md">
            <code className="text-sm">
              {`import { PageTransition } from '@/components/common';

export function MyPage() {
  return (
    <PageTransition>
      <div className="p-6">
        {/* Your page content */}
      </div>
    </PageTransition>
  );
}`}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
