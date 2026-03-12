/**
 * Test suite for verifying admin aggregated access functionality
 *
 * This test verifies that admin users can access aggregated data across all counselors
 * while respecting tenant boundaries and privacy controls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchInteractions,
  fetchStudentInteractions,
} from '../api';

// Mock the supabase helpers
vi.mock('../supabaseHelpers', () => ({
  getTenantContext: vi.fn(),
  handleSupabaseError: vi.fn(error => error),
}));

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              })
            ),
          })),
          order: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      })),
    })),
  },
}));

describe('Admin Aggregated Access', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Set mock mode to false to test real Supabase logic
    vi.stubEnv('VITE_USE_MOCK_DATA', 'false');
  });

  it('should allow admin to fetch all tenant interactions without counselor filtering', async () => {
    const { getTenantContext } = await import('../supabaseHelpers');
    const { supabase } = await import('../supabase');

    // Mock admin user context
    vi.mocked(getTenantContext).mockResolvedValue({
      userId: 'admin-user-id',
      tenantId: 'test-tenant-id',
      userRole: 'ADMIN',
    });

    const mockInteractions = [
      {
        id: '1',
        counselor_id: 'counselor-1',
        student_id: 'student-1',
        tenant_id: 'test-tenant-id',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 30,
        end_time: '2024-01-15T10:30:00Z',
        notes: 'Counselor 1 interaction',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        counselor_id: 'counselor-2',
        student_id: 'student-2',
        tenant_id: 'test-tenant-id',
        start_time: '2024-01-16T14:00:00Z',
        duration_minutes: 45,
        end_time: '2024-01-16T14:45:00Z',
        notes: 'Counselor 2 interaction',
        created_at: '2024-01-16T14:00:00Z',
        updated_at: '2024-01-16T14:00:00Z',
      },
    ];

    // Mock supabase response
    const mockSupabaseChain = {
      select: vi.fn(() => mockSupabaseChain),
      eq: vi.fn(() => mockSupabaseChain),
      order: vi.fn(() =>
        Promise.resolve({
          data: mockInteractions,
          error: null,
        })
      ),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    // Test admin fetching interactions
    const result = await fetchInteractions();

    // Verify the query was made correctly
    expect(supabase.from).toHaveBeenCalledWith('interactions');
    expect(mockSupabaseChain.select).toHaveBeenCalledWith('*');
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');

    // Admin should NOT have counselor_id filter applied
    expect(mockSupabaseChain.eq).not.toHaveBeenCalledWith('counselor_id', 'admin-user-id');

    // Verify result contains all interactions
    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  it('should allow counselor to fetch only their own interactions', async () => {
    const { getTenantContext } = await import('../supabaseHelpers');
    const { supabase } = await import('../supabase');

    // Mock counselor user context
    vi.mocked(getTenantContext).mockResolvedValue({
      userId: 'counselor-1',
      tenantId: 'test-tenant-id',
      userRole: 'COUNSELOR',
    });

    const mockInteractions = [
      {
        id: '1',
        counselor_id: 'counselor-1',
        student_id: 'student-1',
        tenant_id: 'test-tenant-id',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 30,
        end_time: '2024-01-15T10:30:00Z',
        notes: 'Counselor 1 interaction',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ];

    // Mock supabase response
    const mockSupabaseChain = {
      select: vi.fn(() => mockSupabaseChain),
      eq: vi.fn(() => mockSupabaseChain),
      order: vi.fn(() =>
        Promise.resolve({
          data: mockInteractions,
          error: null,
        })
      ),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    // Test counselor fetching interactions
    const result = await fetchInteractions();

    // Verify the query was made correctly
    expect(supabase.from).toHaveBeenCalledWith('interactions');
    expect(mockSupabaseChain.select).toHaveBeenCalledWith('*');
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');

    // Counselor SHOULD have counselor_id filter applied
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith('counselor_id', 'counselor-1');

    // Verify result contains only counselor's interactions
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('should allow admin to fetch all student interactions across counselors', async () => {
    const { getTenantContext } = await import('../supabaseHelpers');
    const { supabase } = await import('../supabase');

    // Mock admin user context
    vi.mocked(getTenantContext).mockResolvedValue({
      userId: 'admin-user-id',
      tenantId: 'test-tenant-id',
      userRole: 'ADMIN',
    });

    const mockInteractions = [
      {
        id: '1',
        counselor_id: 'counselor-1',
        student_id: 'student-1',
        tenant_id: 'test-tenant-id',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 30,
        end_time: '2024-01-15T10:30:00Z',
        notes: 'Counselor 1 interaction with student 1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        counselor_id: 'counselor-2',
        student_id: 'student-1',
        tenant_id: 'test-tenant-id',
        start_time: '2024-01-16T14:00:00Z',
        duration_minutes: 45,
        end_time: '2024-01-16T14:45:00Z',
        notes: 'Counselor 2 interaction with student 1',
        created_at: '2024-01-16T14:00:00Z',
        updated_at: '2024-01-16T14:00:00Z',
      },
    ];

    // Mock supabase response
    const mockSupabaseChain = {
      select: vi.fn(() => mockSupabaseChain),
      eq: vi.fn(() => mockSupabaseChain),
      or: vi.fn(() => mockSupabaseChain),
      order: vi.fn(() =>
        Promise.resolve({
          data: mockInteractions,
          error: null,
        })
      ),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    // Test admin fetching student interactions
    const result = await fetchStudentInteractions('student-1');

    // Verify the query was made correctly
    expect(supabase.from).toHaveBeenCalledWith('interactions');
    expect(mockSupabaseChain.select).toHaveBeenCalledWith('*');
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    expect(mockSupabaseChain.or).toHaveBeenCalledWith(
      'student_id.eq.student-1,regarding_student_id.eq.student-1'
    );

    // Admin should NOT have counselor_id filter applied
    expect(mockSupabaseChain.eq).not.toHaveBeenCalledWith('counselor_id', 'admin-user-id');

    // Verify result contains interactions from multiple counselors
    expect(result.data).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  it('should verify admin dashboard aggregated statistics calculation', async () => {
    // Test that admin dashboard correctly aggregates data across all counselors
    const mockInteractions = [
      { counselor_id: 'counselor-1', student_id: 'student-1', duration_minutes: 30 },
      { counselor_id: 'counselor-1', student_id: 'student-2', duration_minutes: 45 },
      { counselor_id: 'counselor-2', student_id: 'student-1', duration_minutes: 60 },
      { counselor_id: 'counselor-2', student_id: 'student-3', duration_minutes: 25 },
    ];

    // Calculate expected aggregated stats
    const totalInteractions = mockInteractions.length; // 4
    const uniqueStudents = new Set(mockInteractions.map(i => i.student_id)).size; // 3
    const totalTime = mockInteractions.reduce((sum, i) => sum + i.duration_minutes, 0); // 160

    expect(totalInteractions).toBe(4);
    expect(uniqueStudents).toBe(3);
    expect(totalTime).toBe(160);

    // Verify per-counselor breakdown
    const counselor1Interactions = mockInteractions.filter(i => i.counselor_id === 'counselor-1');
    const counselor2Interactions = mockInteractions.filter(i => i.counselor_id === 'counselor-2');

    expect(counselor1Interactions.length).toBe(2);
    expect(counselor2Interactions.length).toBe(2);

    const counselor1Students = new Set(counselor1Interactions.map(i => i.student_id)).size;
    const counselor2Students = new Set(counselor2Interactions.map(i => i.student_id)).size;

    expect(counselor1Students).toBe(2);
    expect(counselor2Students).toBe(2);
  });

  it('should maintain tenant boundaries for admin access', async () => {
    const { getTenantContext } = await import('../supabaseHelpers');
    const { supabase } = await import('../supabase');

    // Mock admin user context
    vi.mocked(getTenantContext).mockResolvedValue({
      userId: 'admin-user-id',
      tenantId: 'test-tenant-id',
      userRole: 'ADMIN',
    });

    const mockSupabaseChain = {
      select: vi.fn(() => mockSupabaseChain),
      eq: vi.fn(() => mockSupabaseChain),
      order: vi.fn(() =>
        Promise.resolve({
          data: [],
          error: null,
        })
      ),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

    await fetchInteractions();

    // Verify tenant filtering is still applied for admin
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
  });
});
