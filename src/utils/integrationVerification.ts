/**
 * Integration Verification Utility
 *
 * Verifies that core services and components are properly integrated
 * and available in the application.
 */

// Service imports
import * as authService from '@/services/auth';
import * as supabaseHelpers from '@/services/supabaseHelpers';
import * as securityEventService from '@/services/securityEventService';

// Component imports
import { TenantManagement } from '@/components/admin/TenantManagement';
import { SecurityEventManagement } from '@/components/admin/SecurityEventManagement';

export interface IntegrationStatus {
  services: {
    authService: boolean;
    supabaseHelpers: boolean;
    securityEventService: boolean;
  };
  components: {
    tenantManagement: boolean;
    securityEventManagement: boolean;
  };
}

/**
 * Verify that all services are properly integrated
 */
export function verifyServiceIntegration(): IntegrationStatus['services'] {
  return {
    authService: !!(
      typeof authService.signIn === 'function' &&
      typeof authService.registerUser === 'function' &&
      typeof authService.getCurrentUser === 'function'
    ),
    supabaseHelpers: !!(
      typeof supabaseHelpers.validateTenantOperation === 'function' &&
      typeof supabaseHelpers.handleSupabaseError === 'function'
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
    tenantManagement: !!TenantManagement,
    securityEventManagement: !!SecurityEventManagement,
  };
}

/**
 * Run complete integration verification
 */
export function verifyIntegration(): IntegrationStatus {
  return {
    services: verifyServiceIntegration(),
    components: verifyComponentIntegration(),
  };
}

/**
 * Check if all integrations are successful
 */
export function isFullyIntegrated(status: IntegrationStatus): boolean {
  const allServices = Object.values(status.services).every(Boolean);
  const allComponents = Object.values(status.components).every(Boolean);

  return allServices && allComponents;
}

/**
 * Get integration summary for logging
 */
export function getIntegrationSummary(): string {
  const status = verifyIntegration();
  const isComplete = isFullyIntegrated(status);

  const serviceCount = Object.values(status.services).filter(Boolean).length;
  const componentCount = Object.values(status.components).filter(Boolean).length;

  return `Integration Status: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}
Services: ${serviceCount}/3 integrated
Components: ${componentCount}/2 integrated`;
}

// Development helper - log integration status
if (import.meta.env.DEV) {
  console.log('🔧 Core System Integration Status:');
  console.log(getIntegrationSummary());

  const status = verifyIntegration();
  if (!isFullyIntegrated(status)) {
    console.warn('⚠️ Some integrations are missing:', {
      services: Object.entries(status.services).filter(([, integrated]) => !integrated),
      components: Object.entries(status.components).filter(([, integrated]) => !integrated),
    });
  } else {
    console.log('✅ All integrations are complete!');
  }
}
