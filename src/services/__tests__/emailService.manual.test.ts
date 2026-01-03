/**
 * EmailService Tests
 * 
 * This file contains automated tests for the email service functionality.
 */

import { describe, it, expect } from 'vitest';
import { EmailService, sendInvitationEmail, sendSetupConfirmationEmail, getEmailQueueStatus } from '../emailService';

describe('EmailService Tests', () => {
  it('should have email service functions available', async () => {
    // Test that the email service functions exist and are callable
    expect(typeof sendInvitationEmail).toBe('function');
    expect(typeof sendSetupConfirmationEmail).toBe('function');
    expect(typeof getEmailQueueStatus).toBe('function');
    expect(typeof EmailService).toBe('function');
  });

  it('should be able to create EmailService instance', () => {
    const emailService = new EmailService({
      maxRetries: 2,
      retryDelayMs: 500,
      maxRetryDelayMs: 5000,
      queueProcessIntervalMs: 2000,
    });
    
    expect(emailService).toBeDefined();
    expect(typeof emailService.stopQueueProcessor).toBe('function');
    
    // Clean up
    emailService.stopQueueProcessor();
  });

  it('should return queue status', () => {
    const queueStatus = getEmailQueueStatus();
    expect(queueStatus).toBeDefined();
    expect(typeof queueStatus.pending).toBe('number');
    expect(typeof queueStatus.sending).toBe('number');
    expect(typeof queueStatus.total).toBe('number');
  });
});