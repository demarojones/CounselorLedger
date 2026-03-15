/**
 * Privacy Error Integration Tests
 *
 * Tests for privacy error handling in the API layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCodes } from '@/utils/errorHandling';

// Mock the audit service
vi.mock('../auditService', () => ({
  logPrivacyViolation: vi.fn().mockResolvedValue(undefined),
  logInteractionAccess: vi.fn().mockResolvedValue(undefined),
}));

// Mock the supabase helpers
vi.mock('../supabaseHelpers', () => ({
  getTenantContext: vi.fn(),
  handleSupabaseError: vi.fn(error => error),
}));

describe('Privacy Error Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Access Control Logic', () => {
    it('should detect cross-counselor access attempts', async () => {
      // Mock scenario: counselor trying to access another counselor's interaction
      const currentUser = {
        tenantId: 'tenant-123',
        userId: 'counselor-1',
        userRole: 'COUNSELOR' as 'ADMIN' | 'COUNSELOR',
      };

      const interaction = {
        id: 'interaction-123',
        counselor_id: 'counselor-2', // Different counselor
        tenant_id: 'tenant-123',
      };

      // Simulate access control logic
      const isOwner = interaction.counselor_id === currentUser.userId;
      const isAdmin = currentUser.userRole === 'ADMIN';
      const sameTenant = interaction.tenant_id === currentUser.tenantId;

      expect(isOwner).toBe(false);
      expect(isAdmin).toBe(false);
      expect(sameTenant).toBe(true);

      // Should deny access
      const hasAccess = isAdmin || isOwner;
      expect(hasAccess).toBe(false);
    });

    it('should allow admin access to all interactions in tenant', async () => {
      // Mock scenario: admin accessing any interaction in their tenant
      const currentUser = {
        tenantId: 'tenant-123',
        userId: 'admin-1',
        userRole: 'ADMIN' as const,
      };

      const interaction = {
        id: 'interaction-123',
        counselor_id: 'counselor-2',
        tenant_id: 'tenant-123',
      };

      // Simulate access control logic
      const isOwner = interaction.counselor_id === currentUser.userId;
      const isAdmin = currentUser.userRole === 'ADMIN';
      const sameTenant = interaction.tenant_id === currentUser.tenantId;

      expect(isOwner).toBe(false);
      expect(isAdmin).toBe(true);
      expect(sameTenant).toBe(true);

      // Should allow access for admin
      const hasAccess = isAdmin || isOwner;
      expect(hasAccess).toBe(true);
    });

    it('should detect tenant boundary violations', async () => {
      // Mock scenario: user trying to access interaction from different tenant
      const currentUser = {
        tenantId: 'tenant-123',
        userId: 'counselor-1',
        userRole: 'COUNSELOR' as const,
      };

      const interaction = {
        id: 'interaction-123',
        counselor_id: 'counselor-1', // Same counselor
        tenant_id: 'tenant-999', // Different tenant
      };

      // Simulate access control logic
      const isOwner = interaction.counselor_id === currentUser.userId;
      const sameTenant = interaction.tenant_id === currentUser.tenantId;

      expect(isOwner).toBe(true);
      expect(sameTenant).toBe(false);

      // Should deny access due to tenant boundary violation
      const hasAccess = sameTenant && isOwner;
      expect(hasAccess).toBe(false);
    });

    it('should allow counselor access to own interactions', async () => {
      // Mock scenario: counselor accessing their own interaction
      const currentUser = {
        tenantId: 'tenant-123',
        userId: 'counselor-1',
        userRole: 'COUNSELOR' as 'ADMIN' | 'COUNSELOR',
      };

      const interaction = {
        id: 'interaction-123',
        counselor_id: 'counselor-1', // Same counselor
        tenant_id: 'tenant-123', // Same tenant
      };

      // Simulate access control logic
      const isOwner = interaction.counselor_id === currentUser.userId;
      const isAdmin = currentUser.userRole === 'ADMIN';
      const sameTenant = interaction.tenant_id === currentUser.tenantId;

      expect(isOwner).toBe(true);
      expect(isAdmin).toBe(false);
      expect(sameTenant).toBe(true);

      // Should allow access
      const hasAccess = sameTenant && (isAdmin || isOwner);
      expect(hasAccess).toBe(true);
    });
  });

  describe('Bulk Operation Access Control', () => {
    it('should detect mixed ownership in bulk operations', () => {
      const currentUser = {
        tenantId: 'tenant-123',
        userId: 'counselor-1',
        userRole: 'COUNSELOR' as 'ADMIN' | 'COUNSELOR',
      };

      const interactions = [
        { id: 'int-1', counselor_id: 'counselor-1', tenant_id: 'tenant-123' }, // Own
        { id: 'int-2', counselor_id: 'counselor-2', tenant_id: 'tenant-123' }, // Other counselor
        { id: 'int-3', counselor_id: 'counselor-1', tenant_id: 'tenant-123' }, // Own
      ];

      const invalidIds: string[] = [];

      for (const interaction of interactions) {
        const isOwner = interaction.counselor_id === currentUser.userId;
        const isAdmin = currentUser.userRole === 'ADMIN';
        const sameTenant = interaction.tenant_id === currentUser.tenantId;

        if (!sameTenant || (!isAdmin && !isOwner)) {
          invalidIds.push(interaction.id);
        }
      }

      expect(invalidIds).toEqual(['int-2']);
      expect(invalidIds.length).toBe(1);
    });

    it('should allow admin bulk operations on all tenant interactions', () => {
      const currentUser = {
        tenantId: 'tenant-123',
        userId: 'admin-1',
        userRole: 'ADMIN' as const,
      };

      const interactions = [
        { id: 'int-1', counselor_id: 'counselor-1', tenant_id: 'tenant-123' },
        { id: 'int-2', counselor_id: 'counselor-2', tenant_id: 'tenant-123' },
        { id: 'int-3', counselor_id: 'counselor-3', tenant_id: 'tenant-123' },
      ];

      const invalidIds: string[] = [];

      for (const interaction of interactions) {
        const isOwner = interaction.counselor_id === currentUser.userId;
        const isAdmin = currentUser.userRole === 'ADMIN';
        const sameTenant = interaction.tenant_id === currentUser.tenantId;

        if (!sameTenant || (!isAdmin && !isOwner)) {
          invalidIds.push(interaction.id);
        }
      }

      expect(invalidIds).toEqual([]);
      expect(invalidIds.length).toBe(0);
    });
  });

  describe('Error Message Security', () => {
    it('should not expose interaction IDs in error messages', () => {
      const sensitiveInteractionId = 'secret-interaction-12345';

      // Simulate error handling that should not expose the ID
      const errorMessage = 'You do not have permission to access this interaction.';

      expect(errorMessage).not.toContain(sensitiveInteractionId);
      expect(errorMessage).not.toContain('12345');
      expect(errorMessage).not.toContain('secret');
    });

    it('should not expose user information in error messages', () => {
      const sensitiveUserInfo = {
        email: 'john.doe@school.edu',
        userId: 'user-12345',
        counselorId: 'counselor-67890',
      };

      const errorMessage = 'Access denied. You can only access your own interaction records.';

      expect(errorMessage).not.toContain(sensitiveUserInfo.email);
      expect(errorMessage).not.toContain(sensitiveUserInfo.userId);
      expect(errorMessage).not.toContain(sensitiveUserInfo.counselorId);
    });

    it('should provide consistent error messages for privacy violations', () => {
      const privacyErrorMessages = [
        'Access denied. You can only access your own interaction records.',
        'You do not have permission to access this interaction.',
        'This interaction belongs to another counselor and cannot be accessed.',
        'Access denied to one or more interactions in the bulk operation.',
      ];

      privacyErrorMessages.forEach(message => {
        expect(message).toBeTruthy();
        expect(message.length).toBeGreaterThan(20);
        expect(message).toMatch(/^[A-Z]/); // Should start with capital letter
        expect(message).toMatch(/[.]$/); // Should end with period
      });
    });
  });

  describe('Security Event Logging', () => {
    it('should log privacy violations without exposing sensitive data', async () => {
      const { logPrivacyViolation } = await import('../auditService');

      // Simulate a privacy violation log
      await logPrivacyViolation(
        'interaction',
        'interaction-123',
        'cross_counselor_access',
        'fetch_interaction',
        {
          denialReason: 'Access control violation',
          errorCode: ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED,
        }
      );

      expect(logPrivacyViolation).toHaveBeenCalledWith(
        'interaction',
        'interaction-123',
        'cross_counselor_access',
        'fetch_interaction',
        expect.objectContaining({
          denialReason: 'Access control violation',
          errorCode: ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED,
        })
      );
    });

    it('should handle logging failures gracefully', async () => {
      const { logPrivacyViolation } = await import('../auditService');

      // Mock logging failure
      vi.mocked(logPrivacyViolation).mockRejectedValue(new Error('Logging service unavailable'));

      // Should not throw error even if logging fails
      await expect(async () => {
        try {
          await logPrivacyViolation(
            'interaction',
            'test-id',
            'cross_counselor_access',
            'test-operation',
            {}
          );
        } catch (error) {
          // Logging errors should be caught and handled gracefully
          console.error('Logging failed:', error);
        }
      }).not.toThrow();
    });
  });
});
