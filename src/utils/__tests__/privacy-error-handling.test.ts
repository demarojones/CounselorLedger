/**
 * Privacy Error Handling Tests
 *
 * Tests for privacy-specific error handling functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ErrorCodes,
  parseSupabaseError,
  createPrivacyViolationError,
  createUnauthorizedAccessError,
  createCrossCounselorAccessError,
  createBulkAccessViolationError,
} from '../errorHandling';

// Mock the security event service
vi.mock('@/services/securityEventService', () => ({
  logSecurityEvent: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

describe('Privacy Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseSupabaseError', () => {
    it('should handle privacy violation errors', () => {
      const error = {
        message: 'privacy_violation: access denied',
      };

      const result = parseSupabaseError(error);

      expect(result.code).toBe(ErrorCodes.PRIVACY_VIOLATION);
      expect(result.message).toBe(
        'Access denied. You can only access your own interaction records.'
      );
    });

    it('should handle cross-counselor access errors', () => {
      const error = {
        message: 'interaction belongs to another counselor',
      };

      const result = parseSupabaseError(error);

      expect(result.code).toBe(ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED);
      expect(result.message).toBe(
        'This interaction belongs to another counselor and cannot be accessed.'
      );
    });

    it('should handle tenant access errors', () => {
      const error = {
        message: 'interaction belongs to different tenant',
      };

      const result = parseSupabaseError(error);

      expect(result.code).toBe(ErrorCodes.TENANT_ACCESS_DENIED);
      expect(result.message).toBe(
        'Access denied. This resource belongs to a different organization.'
      );
    });

    it('should handle direct error codes', () => {
      const error = {
        code: 'PRIVACY_VIOLATION',
        message: 'Direct privacy violation',
      };

      const result = parseSupabaseError(error);

      expect(result.code).toBe(ErrorCodes.PRIVACY_VIOLATION);
      expect(result.message).toBe(
        'Access denied. You can only access your own interaction records.'
      );
    });
  });

  describe('createPrivacyViolationError', () => {
    it('should create privacy violation error with logging', () => {
      const error = createPrivacyViolationError('interaction-123', 'read', 'test-context');

      expect(error.code).toBe(ErrorCodes.PRIVACY_VIOLATION);
      expect(error.message).toBe(
        'Access denied. You can only access your own interaction records.'
      );
      expect(error.details).toEqual({
        interactionId: 'interaction-123',
        operation: 'read',
        context: 'test-context',
      });
    });

    it('should handle missing parameters', () => {
      const error = createPrivacyViolationError();

      expect(error.code).toBe(ErrorCodes.PRIVACY_VIOLATION);
      expect(error.message).toBe(
        'Access denied. You can only access your own interaction records.'
      );
    });
  });

  describe('createUnauthorizedAccessError', () => {
    it('should create unauthorized access error with logging', () => {
      const error = createUnauthorizedAccessError('interaction-456', 'update', 'test-reason');

      expect(error.code).toBe(ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS);
      expect(error.message).toBe('You do not have permission to access this interaction.');
      expect(error.details).toEqual({
        interactionId: 'interaction-456',
        operation: 'update',
      });
    });
  });

  describe('createCrossCounselorAccessError', () => {
    it('should create cross-counselor access error with logging', () => {
      const error = createCrossCounselorAccessError('interaction-789', 'delete');

      expect(error.code).toBe(ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED);
      expect(error.message).toBe(
        'This interaction belongs to another counselor and cannot be accessed.'
      );
      expect(error.details).toEqual({
        interactionId: 'interaction-789',
        operation: 'delete',
      });
    });
  });

  describe('createBulkAccessViolationError', () => {
    it('should create bulk access violation error with logging', () => {
      const interactionIds = ['int-1', 'int-2', 'int-3'];
      const invalidIds = ['int-2', 'int-3'];

      const error = createBulkAccessViolationError(interactionIds, 'bulk_update', invalidIds);

      expect(error.code).toBe(ErrorCodes.BULK_ACCESS_VIOLATION);
      expect(error.message).toBe(
        'Access denied to one or more interactions in the bulk operation.'
      );
      expect(error.details).toEqual({
        interactionIds,
        operation: 'bulk_update',
        invalidIds,
      });
    });

    it('should handle missing invalid IDs', () => {
      const interactionIds = ['int-1', 'int-2'];

      const error = createBulkAccessViolationError(interactionIds, 'bulk_delete');

      expect(error.code).toBe(ErrorCodes.BULK_ACCESS_VIOLATION);
      expect(error.details.invalidIds).toBeUndefined();
    });
  });

  describe('Error message security', () => {
    it('should not expose sensitive information in error messages', () => {
      const sensitiveError = {
        message:
          'User john.doe@school.edu tried to access interaction 12345 belonging to jane.smith@school.edu',
      };

      const result = parseSupabaseError(sensitiveError);

      // Should return generic message, not expose user emails or interaction IDs
      expect(result.message).not.toContain('john.doe@school.edu');
      expect(result.message).not.toContain('jane.smith@school.edu');
      expect(result.message).not.toContain('12345');
    });

    it('should provide user-friendly messages for all privacy errors', () => {
      const privacyErrorCodes = [
        ErrorCodes.PRIVACY_VIOLATION,
        ErrorCodes.UNAUTHORIZED_INTERACTION_ACCESS,
        ErrorCodes.CROSS_COUNSELOR_ACCESS_DENIED,
        ErrorCodes.INTERACTION_NOT_FOUND,
        ErrorCodes.BULK_ACCESS_VIOLATION,
      ];

      privacyErrorCodes.forEach(code => {
        const error = { code };
        const result = parseSupabaseError(error);

        expect(result.message).toBeTruthy();
        expect(result.message.length).toBeGreaterThan(10);
        expect(result.message).not.toContain('undefined');
        expect(result.message).not.toContain('null');
      });
    });
  });
});
