# Implementation Plan

- [x] 1. Set up database schema and core data models
  - Create setup_tokens and invitations database tables with proper indexes
  - Add database migration files for the new tables
  - Create TypeScript interfaces for SetupToken and Invitation models
  - _Requirements: 1.1, 2.1, 6.1_

- [ ]* 1.1 Write property test for database schema
  - **Property 18: Token cryptographic security**
  - **Validates: Requirements 7.1**

- [x] 2. Implement core setup and invitation services
- [x] 2.1 Create SetupService with token validation and tenant creation
  - Implement validateSetupToken method with security checks
  - Implement createTenantAndAdmin method with atomic transactions
  - Add proper error handling and logging
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 2.2 Write property test for setup token lifecycle
  - **Property 1: Setup token validation and single use**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 2.3 Write property test for tenant creation atomicity
  - **Property 2: Tenant and admin creation atomicity**
  - **Validates: Requirements 1.2, 1.3**

- [x] 2.4 Create InvitationService with full invitation lifecycle
  - Implement createInvitation method with secure token generation
  - Implement validateInvitationToken and acceptInvitation methods
  - Add invitation management methods (cancel, resend, list pending)
  - _Requirements: 2.1, 2.4, 2.5, 4.1, 4.2, 4.3_

- [ ]* 2.5 Write property test for invitation token lifecycle
  - **Property 4: Invitation token lifecycle management**
  - **Validates: Requirements 2.1, 2.5**

- [ ]* 2.6 Write property test for invitation management operations
  - **Property 9: Invitation management operations**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 3. Implement email service integration
- [x] 3.1 Create EmailService for invitation and setup emails
  - Implement secure email delivery with proper templates
  - Add email queue system for reliability
  - Include proper error handling and retry logic
  - _Requirements: 2.2, 7.3_

- [ ]* 3.2 Write property test for email delivery
  - **Property 5: Invitation email delivery**
  - **Validates: Requirements 2.2**

- [ ]* 3.3 Write property test for secure email delivery
  - **Property 20: Secure email delivery**
  - **Validates: Requirements 7.3**

- [x] 4. Create initial setup UI components
- [x] 4.1 Build InitialSetupPage component
  - Create tenant registration form with validation
  - Implement setup token validation on page load
  - Add proper error handling and user feedback
  - _Requirements: 1.1, 1.5, 6.1, 6.2_

- [ ]* 4.2 Write property test for setup token security
  - **Property 3: Setup token security enforcement**
  - **Validates: Requirements 1.5**

- [ ]* 4.3 Write property test for tenant configuration validation
  - **Property 15: Tenant configuration validation**
  - **Validates: Requirements 6.1, 6.2**

- [x] 4.4 Create form validation schemas for setup
  - Implement Zod schemas for tenant setup form
  - Add subdomain uniqueness validation
  - Include password strength requirements
  - _Requirements: 6.1, 6.2_

- [x] 5. Build user invitation UI components
- [x] 5.1 Create UserInvitationForm component
  - Build invitation creation form with role selection
  - Add email validation and duplicate checking
  - Implement proper success and error feedback
  - _Requirements: 2.1, 5.1_

- [ ]* 5.2 Write property test for duplicate email prevention
  - **Property 11: Duplicate email prevention**
  - **Validates: Requirements 5.1**

- [x] 5.3 Build InvitationManagement component
  - Create pending invitations list view
  - Add cancel and resend invitation functionality
  - Implement invitation status tracking
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.4 Write property test for invitation status synchronization
  - **Property 10: Invitation status synchronization**
  - **Validates: Requirements 4.4, 4.5**

- [x] 6. Implement invitation acceptance flow
- [x] 6.1 Create InvitationAcceptPage component
  - Build user registration form with pre-populated email
  - Implement invitation token validation
  - Add password creation and confirmation
  - _Requirements: 2.3, 3.1, 3.2, 3.5_

- [ ]* 6.2 Write property test for invitation acceptance
  - **Property 6: Invitation acceptance and user creation**
  - **Validates: Requirements 2.3, 2.4, 3.1, 3.2, 3.3**

- [ ]* 6.3 Write property test for invalid invitation handling
  - **Property 8: Invalid invitation handling**
  - **Validates: Requirements 3.5**

- [x] 6.4 Implement user account creation integration
  - Integrate with Supabase Auth for account creation
  - Create application user records after auth success
  - Add proper error handling for auth failures
  - _Requirements: 3.2, 3.3, 3.4_

- [ ]* 6.5 Write property test for post-registration authentication
  - **Property 7: Post-registration authentication**
  - **Validates: Requirements 3.4**

- [x] 7. Add security and validation features
- [x] 7.1 Implement rate limiting middleware
  - Add rate limiting for invitation creation
  - Implement IP-based and user-based limits
  - Include proper error responses for rate limit exceeded
  - _Requirements: 7.5_

- [ ]* 7.2 Write property test for rate limiting protection
  - **Property 22: Rate limiting protection**
  - **Validates: Requirements 7.5**

- [x] 7.3 Add token security enhancements
  - Implement secure token hashing for database storage
  - Add token manipulation detection
  - Include cryptographic token validation
  - _Requirements: 7.1, 7.2_

- [ ]* 7.4 Write property test for sensitive data protection
  - **Property 19: Sensitive data protection**
  - **Validates: Requirements 7.2**

- [ ]* 7.5 Write property test for token single-use enforcement
  - **Property 12: Token single-use enforcement**
  - **Validates: Requirements 5.4**

- [x] 8. Implement background cleanup and maintenance
- [x] 8.1 Create token cleanup service
  - Implement automatic cleanup of expired tokens
  - Add background job scheduling
  - Include cleanup logging and monitoring
  - _Requirements: 7.4_

- [ ]* 8.2 Write property test for automatic cleanup
  - **Property 21: Automatic cleanup of expired tokens**
  - **Validates: Requirements 7.4**

- [x] 8.3 Add invitation token navigation persistence
  - Ensure tokens remain valid during navigation
  - Implement proper session handling
  - Add token validation caching
  - _Requirements: 5.3_

- [ ]* 8.4 Write property test for token navigation persistence
  - **Property 13: Invitation token navigation persistence**
  - **Validates: Requirements 5.3**

- [x] 9. Integrate with existing user management system
- [x] 9.1 Update existing UserManagement component
  - Add pending invitations section to user management
  - Integrate invitation management with existing UI
  - Update user creation flow to use invitation system
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9.2 Add tenant association validation
  - Ensure all new users are properly associated with tenants
  - Add tenant validation to existing user operations
  - Update user queries to respect tenant boundaries
  - _Requirements: 6.3_

- [ ]* 9.3 Write property test for tenant association consistency
  - **Property 16: Tenant association consistency**
  - **Validates: Requirements 6.3**

- [x] 9.4 Implement contact information storage
  - Add contact information fields to tenant setup
  - Create admin interface for viewing contact information
  - Include contact data in tenant management
  - _Requirements: 6.4_

- [ ]* 9.5 Write property test for contact information persistence
  - **Property 17: Contact information persistence**
  - **Validates: Requirements 6.4**

- [x] 10. Add security event logging and monitoring
- [x] 10.1 Implement security event logging system
  - Add logging for suspicious invitation patterns
  - Implement security event storage and retrieval
  - Include admin interface for reviewing security events
  - _Requirements: 5.5_

- [ ]* 10.2 Write property test for security event logging
  - **Property 14: Security event logging**
  - **Validates: Requirements 5.5**

- [x] 10.3 Add comprehensive error handling
  - Implement proper error boundaries for all components
  - Add user-friendly error messages for all failure scenarios
  - Include error logging and monitoring integration
  - _Requirements: 3.5, 5.2_

- [x] 11. Update routing and navigation
- [x] 11.1 Add new routes for setup and invitation flows
  - Create routes for initial setup page (/setup/:token)
  - Add invitation acceptance route (/invite/:token)
  - Update existing routes to handle new authentication states
  - _Requirements: 1.1, 2.3, 3.1_

- [x] 11.2 Update authentication guards and redirects
  - Modify existing auth guards to handle setup and invitation flows
  - Add proper redirects for completed setup
  - Include tenant validation in route protection
  - _Requirements: 1.5, 3.4_

- [-] 12. Final integration and testing
- [x] 12.1 Integrate all components into main application
  - Wire up all services with dependency injection
  - Update main app routing and navigation
  - Add proper error boundaries and loading states
  - _Requirements: All_

- [ ]* 12.2 Write integration tests for complete flows
  - Test complete setup flow from token to admin login
  - Test full invitation cycle from creation to user registration
  - Test error scenarios and edge cases
  - _Requirements: All_

- [x] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.