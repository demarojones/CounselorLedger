/**
 * Client Information Utilities
 *
 * Provides utilities to get client information for rate limiting and security purposes.
 */

/**
 * Get a client identifier for rate limiting purposes.
 * Since this is a frontend application, we use a combination of available browser information
 * to create a reasonably unique identifier per client session.
 */
export function getClientIdentifier(): string {
  // In a real-world scenario with a backend, you'd get the actual IP address
  // For a frontend-only app, we create a session-based identifier

  let identifier = sessionStorage.getItem('client_identifier');

  if (!identifier) {
    // Create a unique identifier based on available browser information
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const screenInfo = `${screen.width}x${screen.height}`;

    // Create a hash-like identifier (not cryptographically secure, but sufficient for rate limiting)
    const combined = `${userAgent}-${language}-${timezone}-${screenInfo}-${Date.now()}-${Math.random()}`;
    identifier = btoa(combined).substring(0, 32);

    sessionStorage.setItem('client_identifier', identifier);
  }

  return identifier;
}

/**
 * Get a more persistent client fingerprint for security purposes.
 * This creates a fingerprint that persists across sessions but not across browsers/devices.
 */
export function getClientFingerprint(): string {
  let fingerprint = localStorage.getItem('client_fingerprint');

  if (!fingerprint) {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const screenInfo = `${screen.width}x${screen.height}`;
    const colorDepth = screen.colorDepth;
    const pixelRatio = window.devicePixelRatio;

    // Create a more stable fingerprint
    const combined = `${userAgent}-${language}-${timezone}-${screenInfo}-${colorDepth}-${pixelRatio}`;
    fingerprint = btoa(combined).substring(0, 32);

    localStorage.setItem('client_fingerprint', fingerprint);
  }

  return fingerprint;
}

/**
 * Clear client identifiers (useful for testing or privacy)
 */
export function clearClientIdentifiers(): void {
  sessionStorage.removeItem('client_identifier');
  localStorage.removeItem('client_fingerprint');
}

/**
 * Get basic client information for logging purposes
 */
export function getClientInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    timestamp: new Date().toISOString(),
  };
}
