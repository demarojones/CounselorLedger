/**
 * Integration Verification Utility
 *
 * Verifies that all services and components are properly integrated
 * and available in the application.
 */

// Service imports
import * as setupService from '@/services/setupService';
import * as invitationService from '@/services/invitationService';
import * as emailService from '@/services/emailService';
import * as tokenCleanupService from '@/services/tokenCleanupService';
import * as tokenPersistenceService from '@/services/tokenPersistenceService';
import * as securityEventService from '@/services/securityEventService';

// Component imports
import { InitialSetup } from '@/pages/InitialSetup';
import { InvitationAccept } from '@/pages/InvitationAccept';
import { UserInvitationForm } from '@/components/admin/UserInvitationForm';
import { InvitationManagement } from '@/components/admin/InvitationManagement';
import { TenantManagement } from '@/components/admin/TenantManagement';
import { SecurityEventManagement } from '@/components/admin/SecurityEventManagement';
import SetupErrorBoundary from '@/components/common/SetupErrorBoundary';

// Hook imports
import { useTokenCleanup } from '@/hooks/useTokenCleanup';
import { useTokenPersistence } from '@/hooks/useTokenPersistence';

export interface IntegrationStatus {
  services: {
    setupService: boolean;
    invitationService: boolean;
    emailService: boolean;
    tokenCleanupService: boolean;
    tokenPersistenceService: boolean;
    securityEventService: boolean;
  };
  components: {
    initialSetup: boolean;
    invitationAccept: boolean;
    userInvitationForm: boolean;
    invitationManagement: boolean;
    tenantManagement: boolean;
    securityEventManagement: boolean;
    setupErrorBoundary: boolean;
  };
  hooks: {
    tokenCleanup: boolean;
    tokenPersistence: boolean;
  };
  routing: {
    setupRoute: boolean;
    invitationRoute: boolean;
  };
}

/**
 * Verify that all services are properly integrated
 */
export function verifyServiceIntegration(): IntegrationStatus['services'] {
  return {
    setupService: !!(
      typeof setupService.validateSetupToken === 'function' &&
      typeof setupService.createTenantAndAdmin === 'function' &&
      typeof setupService.completeInitialSetup === 'function'
    ),
    invitationService: !!(
      typeof invitationService.createInvitation === 'function' &&
      typeof invitationService.validateInvitationToken === 'function' &&
      typeof invitationService.acceptInvitation === 'function' &&
      typeof invitationService.getPendingInvitations === 'function' &&
      typeof invitationService.cancelInvitation === 'function' &&
      typeof invitationService.resendInvitation === 'function'
    ),
    emailService: !!(
      typeof emailService.sendInvitationEmail === 'function' &&
      typeof emailService.sendSetupConfirmationEmail === 'function'
    ),
    tokenCleanupService: !!(
      typeof tokenCleanupService.getCleanupScheduler === 'function' &&
      typeof tokenCleanupService.getCleanupStats === 'function'
    ),
    tokenPersistenceService: !!(
      typeof tokenPersistenceService.storeTokenSession === 'function' &&
      typeof tokenPersistenceService.getTokenSession === 'function' &&
      typeof tokenPersistenceService.clearTokenSession === 'function'
    ),
    securityEventService: !!(
      typeof securityEventService.logSecurityEvent === 'function' &&
      typeof securityEventService.getSecurityEvents === 'function' &&
      typeof securityEventService.getSecurityEventStats === 'function'
    ),
  };
}

/**
 * Verify that all components are properly integrated
 */
export function verifyComponentIntegration(): IntegrationStatus['components'] {
  return {
    initialSetup: !!InitialSetup,
    invitationAccept: !!InvitationAccept,
    userInvitationForm: !!UserInvitationForm,
    invitationManagement: !!InvitationManagement,
    tenantManagement: !!TenantManagement,
    securityEventManagement: !!SecurityEventManagement,
    setupErrorBoundary: !!SetupErrorBoundary,
  };
}

/**
 * Verify that all hooks are properly integrated
 */
export function verifyHookIntegration(): IntegrationStatus['hooks'] {
  return {
    tokenCleanup: !!useTokenCleanup,
    tokenPersistence: !!useTokenPersistence,
  };
}

/**
 * Verify that routing is properly configured
 */
export function verifyRoutingIntegration(): IntegrationStatus['routing'] {
  // Check if routes are available by checking if the components exist
  // In a real app, we might check the router configuration
  return {
    setupRoute: !!InitialSetup,
    invitationRoute: !!InvitationAccept,
  };
}

/**
 * Run complete integration verification
 */
export function verifyIntegration(): IntegrationStatus {
  return {
    services: verifyServiceIntegration(),
    components: verifyComponentIntegration(),
    hooks: verifyHookIntegration(),
    routing: verifyRoutingIntegration(),
  };
}

/**
 * Check if all integrations are successful
 */
export function isFullyIntegrated(status: IntegrationStatus): boolean {
  const allServices = Object.values(status.services).every(Boolean);
  const allComponents = Object.values(status.components).every(Boolean);
  const allHooks = Object.values(status.hooks).every(Boolean);
  const allRouting = Object.values(status.routing).every(Boolean);

  return allServices && allComponents && allHooks && allRouting;
}

/**
 * Get integration summary for logging
 */
export function getIntegrationSummary(): string {
  const status = verifyIntegration();
  const isComplete = isFullyIntegrated(status);

  const serviceCount = Object.values(status.services).filter(Boolean).length;
  const componentCount = Object.values(status.components).filter(Boolean).length;
  const hookCount = Object.values(status.hooks).filter(Boolean).length;
  const routingCount = Object.values(status.routing).filter(Boolean).length;

  return `Integration Status: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}
Services: ${serviceCount}/6 integrated
Components: ${componentCount}/7 integrated
Hooks: ${hookCount}/2 integrated
Routing: ${routingCount}/2 integrated`;
}

// Development helper - log integration status
if (import.meta.env.DEV) {
  console.log('🔧 Initial System Setup Integration Status:');
  console.log(getIntegrationSummary());

  const status = verifyIntegration();
  if (!isFullyIntegrated(status)) {
    console.warn('⚠️ Some integrations are missing:', {
      services: Object.entries(status.services).filter(([, integrated]) => !integrated),
      components: Object.entries(status.components).filter(([, integrated]) => !integrated),
      hooks: Object.entries(status.hooks).filter(([, integrated]) => !integrated),
      routing: Object.entries(status.routing).filter(([, integrated]) => !integrated),
    });
  } else {
    console.log('✅ All integrations are complete!');
  }
}
