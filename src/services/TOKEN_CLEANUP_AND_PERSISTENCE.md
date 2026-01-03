# Token Cleanup and Persistence Implementation

This document describes the implementation of background token cleanup and navigation persistence features for the School Counselor Ledger application.

## Overview

The implementation consists of two main components:

1. **Token Cleanup Service** - Automatic cleanup of expired tokens
2. **Token Persistence Service** - Session handling and navigation persistence for tokens

## Token Cleanup Service

### Features

- **Automatic Cleanup**: Removes expired setup tokens and invitations from the database
- **Background Scheduling**: Runs cleanup operations at configurable intervals
- **Statistics Tracking**: Maintains cleanup statistics in localStorage
- **Logging and Monitoring**: Comprehensive logging of cleanup operations

### Usage

```typescript
import { startAutomaticCleanup, forceCleanup } from '@/services/tokenCleanupService';

// Start automatic cleanup with 1-hour intervals
const scheduler = startAutomaticCleanup(60 * 60 * 1000);

// Force immediate cleanup
const result = await forceCleanup();
console.log(
  `Cleaned up ${result.setupTokensDeleted} setup tokens and ${result.invitationsDeleted} invitations`
);
```

### React Hook Integration

```typescript
import { useTokenCleanup } from '@/hooks/useTokenCleanup';

function AdminPanel() {
  const {
    isRunning,
    stats,
    lastResult,
    runCleanup,
    start,
    stop
  } = useTokenCleanup({
    intervalMs: 60 * 60 * 1000, // 1 hour
    autoStart: true,
  });

  return (
    <div>
      <p>Cleanup Status: {isRunning ? 'Running' : 'Stopped'}</p>
      <p>Total Cleaned: {stats?.totalSetupTokensDeleted + stats?.totalInvitationsDeleted}</p>
      <button onClick={runCleanup}>Run Cleanup Now</button>
    </div>
  );
}
```

## Token Persistence Service

### Features

- **Validation Caching**: Caches token validation results to avoid repeated API calls
- **Session Persistence**: Maintains token session data across navigation
- **Navigation Tracking**: Tracks user navigation with tokens
- **Automatic Expiration**: Handles cache and session expiration

### Usage

```typescript
import {
  cacheTokenValidation,
  getCachedTokenValidation,
  storeTokenSession,
  handleTokenNavigation,
} from '@/services/tokenPersistenceService';

// Cache validation result
cacheTokenValidation(token, {
  isValid: true,
  email: 'user@example.com',
  role: 'ADMIN',
  expiresAt: new Date(),
});

// Handle navigation
handleTokenNavigation(token, 'invitation');
```

### React Hook Integration

```typescript
import { useTokenPersistence } from '@/hooks/useTokenPersistence';

function InvitationPage() {
  const { session, cachedValidation, hasActiveSession, cacheValidation, handleNavigation } =
    useTokenPersistence({
      token: invitationToken,
      type: 'invitation',
      autoUpdateOnNavigation: true,
    });

  // Use cached validation if available
  if (cachedValidation?.isValid) {
    // Skip API call, use cached data
  }
}
```

## Integration Points

### Application Startup

The cleanup service is automatically started in `App.tsx`:

```typescript
function App() {
  // Initialize automatic token cleanup
  useTokenCleanup({
    intervalMs: 60 * 60 * 1000, // 1 hour
    autoStart: true,
    runOnMount: false,
  });

  return <AppContent />;
}
```

### Token Pages

Both `InvitationAccept.tsx` and `InitialSetup.tsx` use token persistence:

- Cache validation results to avoid repeated API calls
- Maintain session data during navigation
- Clear session data after successful completion

## Configuration

### Cleanup Service Configuration

- **Default Interval**: 1 hour (3,600,000 ms)
- **Cache Duration**: 5 minutes for validation cache
- **Session Duration**: 30 minutes for token sessions

### Storage

- **Cleanup Statistics**: localStorage (`token_cleanup_stats`)
- **Validation Cache**: sessionStorage (`token_validation_cache`)
- **Session Data**: sessionStorage (`token_session_data`)

## Security Considerations

1. **Automatic Cleanup**: Expired tokens are automatically removed from the database
2. **Session Expiration**: Token sessions expire after 30 minutes of inactivity
3. **Cache Expiration**: Validation cache expires after 5 minutes
4. **Secure Storage**: Uses sessionStorage for temporary data, localStorage for statistics only

## Monitoring

### Cleanup Statistics

```typescript
import { getCleanupStats } from '@/services/tokenCleanupService';

const stats = await getCleanupStats();
console.log({
  lastCleanup: stats.lastCleanup,
  totalSetupTokensDeleted: stats.totalSetupTokensDeleted,
  totalInvitationsDeleted: stats.totalInvitationsDeleted,
  cleanupCount: stats.cleanupCount,
});
```

### Session Statistics

```typescript
import { getSessionStats } from '@/services/tokenPersistenceService';

const stats = getSessionStats();
console.log({
  hasActiveSession: stats.hasActiveSession,
  sessionType: stats.sessionType,
  navigationCount: stats.navigationCount,
  sessionAge: stats.sessionAge,
});
```

## Error Handling

Both services include comprehensive error handling:

- Failed cleanup operations are logged but don't crash the application
- Invalid or expired sessions are automatically cleaned up
- Network errors during token validation are handled gracefully
- All errors are logged to the console for debugging

## Performance Considerations

1. **Caching**: Reduces API calls by caching validation results
2. **Background Processing**: Cleanup runs in the background without blocking UI
3. **Efficient Storage**: Uses browser storage APIs efficiently
4. **Automatic Cleanup**: Prevents memory leaks by cleaning up expired data

## Future Enhancements

Potential improvements for future versions:

1. **Server-Side Cleanup**: Move cleanup to server-side cron jobs for better reliability
2. **Real-Time Updates**: Use WebSocket connections for real-time cleanup status
3. **Advanced Monitoring**: Add metrics and alerting for cleanup operations
4. **Configurable Settings**: Allow users to configure cleanup intervals
5. **Batch Operations**: Optimize cleanup for large numbers of expired tokens
