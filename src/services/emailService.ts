/**
 * Email Service
 *
 * Handles secure email delivery for invitation and setup emails
 * with proper templates, queue system, and retry logic.
 */

import type { SupabaseResponse } from './supabaseHelpers';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface EmailData {
  to: string;
  template: EmailTemplate;
  variables: Record<string, string>;
}

export interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  createdAt: Date;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
  error?: string;
}

export interface EmailServiceConfig {
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  queueProcessIntervalMs: number;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const INVITATION_TEMPLATE: EmailTemplate = {
  subject: "You're invited to join {{tenantName}} on {{appName}}",
  htmlBody: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to {{tenantName}}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 20px 0; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to {{appName}}</h1>
        <p>You've been invited to join <strong>{{tenantName}}</strong></p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        
        <p>{{inviterName}} has invited you to join <strong>{{tenantName}}</strong> on {{appName}} as a <strong>{{role}}</strong>.</p>
        
        <p>{{appName}} is a comprehensive platform for school counselors to track student interactions, manage contacts, and generate reports.</p>
        
        <p>To accept this invitation and set up your account, click the button below:</p>
        
        <a href="{{invitationUrl}}" class="button">Accept Invitation</a>
        
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="{{invitationUrl}}">{{invitationUrl}}</a></p>
        
        <div class="warning">
          <strong>Important:</strong> This invitation will expire on {{expirationDate}}. Please accept it before then to gain access to your account.
        </div>
        
        <p>If you have any questions or need assistance, please contact your administrator at {{adminEmail}}.</p>
      </div>
      
      <div class="footer">
        <p>This invitation was sent to {{recipientEmail}}. If you received this email in error, please ignore it.</p>
        <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,
  textBody: `
Welcome to {{appName}}

You've been invited to join {{tenantName}}

Hello,

{{inviterName}} has invited you to join {{tenantName}} on {{appName}} as a {{role}}.

{{appName}} is a comprehensive platform for school counselors to track student interactions, manage contacts, and generate reports.

To accept this invitation and set up your account, visit:
{{invitationUrl}}

IMPORTANT: This invitation will expire on {{expirationDate}}. Please accept it before then to gain access to your account.

If you have any questions or need assistance, please contact your administrator at {{adminEmail}}.

This invitation was sent to {{recipientEmail}}. If you received this email in error, please ignore it.

© {{currentYear}} {{appName}}. All rights reserved.
  `,
};

const SETUP_CONFIRMATION_TEMPLATE: EmailTemplate = {
  subject: 'Welcome to {{appName}} - Your {{tenantName}} account is ready!',
  htmlBody: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to {{appName}}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { padding: 20px 0; }
        .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 4px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Welcome to {{appName}}!</h1>
        <p>Your {{tenantName}} account has been successfully set up</p>
      </div>
      
      <div class="content">
        <p>Hello {{adminName}},</p>
        
        <div class="success">
          <strong>Congratulations!</strong> Your {{tenantName}} organization has been successfully set up on {{appName}}.
        </div>
        
        <p>You can now:</p>
        <ul>
          <li>Invite counselors and other administrators to join your organization</li>
          <li>Start tracking student interactions and managing contacts</li>
          <li>Generate comprehensive reports on counseling activities</li>
          <li>Customize your organization's settings and preferences</li>
        </ul>
        
        <p>Ready to get started? Access your dashboard:</p>
        
        <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
        
        <p>Or visit: <a href="{{dashboardUrl}}">{{dashboardUrl}}</a></p>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Complete your profile information</li>
          <li>Invite your team members</li>
          <li>Import or add student and contact information</li>
          <li>Explore the reporting features</li>
        </ol>
        
        <p>If you need help getting started, our documentation and support resources are available in your dashboard.</p>
      </div>
      
      <div class="footer">
        <p>This email was sent to {{adminEmail}} as the administrator of {{tenantName}}.</p>
        <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `,
  textBody: `
Welcome to {{appName}}!

Your {{tenantName}} account has been successfully set up

Hello {{adminName}},

Congratulations! Your {{tenantName}} organization has been successfully set up on {{appName}}.

You can now:
- Invite counselors and other administrators to join your organization
- Start tracking student interactions and managing contacts
- Generate comprehensive reports on counseling activities
- Customize your organization's settings and preferences

Ready to get started? Access your dashboard:
{{dashboardUrl}}

Next Steps:
1. Complete your profile information
2. Invite your team members
3. Import or add student and contact information
4. Explore the reporting features

If you need help getting started, our documentation and support resources are available in your dashboard.

This email was sent to {{adminEmail}} as the administrator of {{tenantName}}.

© {{currentYear}} {{appName}}. All rights reserved.
  `,
};

// ============================================================================
// EMAIL SERVICE CLASS
// ============================================================================

class EmailService {
  private config: EmailServiceConfig;
  private emailQueue: QueuedEmail[] = [];
  private processingQueue = false;
  private queueTimer?: ReturnType<typeof setInterval>;

  constructor(config?: Partial<EmailServiceConfig>) {
    this.config = {
      maxRetries: 3,
      retryDelayMs: 1000, // 1 second
      maxRetryDelayMs: 30000, // 30 seconds
      queueProcessIntervalMs: 5000, // 5 seconds
      ...config,
    };

    // Start queue processing
    this.startQueueProcessor();
  }

  /**
   * Send an invitation email
   */
  async sendInvitationEmail(data: {
    to: string;
    tenantName: string;
    inviterName: string;
    role: string;
    invitationUrl: string;
    expirationDate: string;
    adminEmail: string;
  }): Promise<SupabaseResponse<EmailSendResult>> {
    try {
      const variables = {
        ...data,
        appName: this.getAppName(),
        recipientEmail: data.to,
        currentYear: new Date().getFullYear().toString(),
      };

      const emailData: EmailData = {
        to: data.to,
        template: INVITATION_TEMPLATE,
        variables,
      };

      return await this.queueEmail(emailData);
    } catch (error) {
      return {
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send invitation email',
        },
        error: {
          code: 'EMAIL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send invitation email',
        },
      };
    }
  }

  /**
   * Send a setup confirmation email
   */
  async sendSetupConfirmationEmail(data: {
    to: string;
    tenantName: string;
    adminName: string;
    dashboardUrl: string;
  }): Promise<SupabaseResponse<EmailSendResult>> {
    try {
      const variables = {
        ...data,
        appName: this.getAppName(),
        adminEmail: data.to,
        currentYear: new Date().getFullYear().toString(),
      };

      const emailData: EmailData = {
        to: data.to,
        template: SETUP_CONFIRMATION_TEMPLATE,
        variables,
      };

      return await this.queueEmail(emailData);
    } catch (error) {
      return {
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send setup confirmation email',
        },
        error: {
          code: 'EMAIL_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to send setup confirmation email',
        },
      };
    }
  }

  /**
   * Queue an email for delivery
   */
  private async queueEmail(emailData: EmailData): Promise<SupabaseResponse<EmailSendResult>> {
    try {
      const processedTemplate = this.processTemplate(emailData.template, emailData.variables);

      const queuedEmail: QueuedEmail = {
        id: this.generateEmailId(),
        to: emailData.to,
        subject: processedTemplate.subject,
        htmlBody: processedTemplate.htmlBody,
        textBody: processedTemplate.textBody,
        attempts: 0,
        maxAttempts: this.config.maxRetries,
        nextRetryAt: new Date(),
        createdAt: new Date(),
        status: 'PENDING',
      };

      this.emailQueue.push(queuedEmail);

      // In development mode, immediately process the queue
      if (this.isDevelopmentMode()) {
        await this.processQueue();
      }

      return {
        data: {
          success: true,
          messageId: queuedEmail.id,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to queue email',
        },
        error: {
          code: 'EMAIL_QUEUE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to queue email',
        },
      };
    }
  }

  /**
   * Process the email queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;

    try {
      const now = new Date();
      const emailsToProcess = this.emailQueue.filter(
        email => email.status === 'PENDING' && email.nextRetryAt <= now
      );

      for (const email of emailsToProcess) {
        await this.processEmail(email);
      }

      // Remove successfully sent or permanently failed emails
      this.emailQueue = this.emailQueue.filter(
        email => email.status !== 'SENT' && email.status !== 'FAILED'
      );
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Process a single email
   */
  private async processEmail(email: QueuedEmail): Promise<void> {
    email.status = 'SENDING';
    email.attempts++;

    try {
      const result = await this.sendEmail(email);

      if (result.success) {
        email.status = 'SENT';
        console.log(`Email sent successfully to ${email.to} (ID: ${email.id})`);
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      email.error = errorMessage;

      if (email.attempts >= email.maxAttempts) {
        email.status = 'FAILED';
        console.error(
          `Email permanently failed for ${email.to} (ID: ${email.id}): ${errorMessage}`
        );
      } else {
        email.status = 'PENDING';
        // Exponential backoff with jitter
        const baseDelay = Math.min(
          this.config.retryDelayMs * Math.pow(2, email.attempts - 1),
          this.config.maxRetryDelayMs
        );
        const jitter = Math.random() * 0.1 * baseDelay;
        const delay = baseDelay + jitter;

        email.nextRetryAt = new Date(Date.now() + delay);
        console.warn(
          `Email retry scheduled for ${email.to} (ID: ${email.id}, attempt ${email.attempts}/${email.maxAttempts})`
        );
      }
    }
  }

  /**
   * Send email using the configured provider
   */
  private async sendEmail(email: QueuedEmail): Promise<EmailSendResult> {
    // In development mode, log the email instead of sending
    if (this.isDevelopmentMode()) {
      console.log('=== EMAIL SENT (Development Mode) ===');
      console.log(`To: ${email.to}`);
      console.log(`Subject: ${email.subject}`);
      console.log('--- HTML Body ---');
      console.log(email.htmlBody);
      console.log('--- Text Body ---');
      console.log(email.textBody);
      console.log('=== END EMAIL ===');

      return {
        success: true,
        messageId: `dev-${email.id}`,
      };
    }

    // In production, this would integrate with a real email service
    // For now, we'll simulate the email sending
    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate occasional failures for testing retry logic
        const shouldFail = Math.random() < 0.1; // 10% failure rate

        if (shouldFail) {
          resolve({
            success: false,
            error: 'Simulated email service failure',
          });
        } else {
          resolve({
            success: true,
            messageId: `sim-${email.id}`,
          });
        }
      }, 100); // Simulate network delay
    });
  }

  /**
   * Process email template with variables
   */
  private processTemplate(
    template: EmailTemplate,
    variables: Record<string, string>
  ): EmailTemplate {
    const processString = (str: string): string => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] || match;
      });
    };

    return {
      subject: processString(template.subject),
      htmlBody: processString(template.htmlBody),
      textBody: processString(template.textBody),
    };
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    this.queueTimer = setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Error processing email queue:', error);
      });
    }, this.config.queueProcessIntervalMs);
  }

  /**
   * Stop the queue processor
   */
  public stopQueueProcessor(): void {
    if (this.queueTimer) {
      clearInterval(this.queueTimer);
      this.queueTimer = undefined;
    }
  }

  /**
   * Get queue status for monitoring
   */
  public getQueueStatus(): {
    pending: number;
    sending: number;
    total: number;
  } {
    return {
      pending: this.emailQueue.filter(e => e.status === 'PENDING').length,
      sending: this.emailQueue.filter(e => e.status === 'SENDING').length,
      total: this.emailQueue.length,
    };
  }

  /**
   * Generate a unique email ID
   */
  private generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the application name from environment
   */
  private getAppName(): string {
    return import.meta.env.VITE_APP_NAME || 'School Counselor Ledger';
  }

  /**
   * Check if running in development mode
   */
  private isDevelopmentMode(): boolean {
    return import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_DATA === 'true';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create a singleton instance
const emailService = new EmailService();

// Export the service methods
export const sendInvitationEmail = emailService.sendInvitationEmail.bind(emailService);
export const sendSetupConfirmationEmail =
  emailService.sendSetupConfirmationEmail.bind(emailService);
export const getEmailQueueStatus = emailService.getQueueStatus.bind(emailService);
export const stopEmailService = emailService.stopQueueProcessor.bind(emailService);

// Export the service class for testing
export { EmailService };

// Default export
export default emailService;
