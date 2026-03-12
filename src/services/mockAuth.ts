import type { User } from '../types/user';
import type { LoginCredentials, RegisterCredentials, AuthResponse, RegisterResponse } from './auth';
import { getMockData } from '../mocks/data/seedData';

// Simple in-memory user storage for development
const MOCK_SESSION_KEY = 'mock_session';

interface MockUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'COUNSELOR';
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get users from seed data instead of separate localStorage
function getMockUsers(): MockUser[] {
  console.log('🔍 getMockUsers called');
  const mockData = getMockData();
  console.log('📦 Mock data loaded, users count:', mockData.users?.length || 0);
  
  if (!mockData.users || mockData.users.length === 0) {
    console.error('❌ No users found in mock data!');
    return [];
  }
  
  // Convert seed data users to MockUser format
  // In mock mode, any password is accepted
  const users = mockData.users.map(u => ({
    id: u.id,
    email: u.email,
    password: 'any', // Accept any password in mock mode
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    tenantId: u.tenantId,
    isActive: u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
  
  console.log('✅ Converted users:', users.map(u => u.email));
  return users;
}

// Note: We don't save users in mock mode, they come from seed data

function transformMockUser(mockUser: MockUser): User {
  return {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: mockUser.role,
    tenantId: mockUser.tenantId,
    isActive: mockUser.isActive,
    createdAt: new Date(mockUser.createdAt),
    updatedAt: new Date(mockUser.updatedAt),
  };
}

export async function mockRegisterUser(
  credentials: RegisterCredentials
): Promise<RegisterResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const users = getMockUsers();
  console.log('🔐 Mock registration attempt:', credentials.email);

  // Check if user already exists
  if (users.find(user => user.email === credentials.email)) {
    console.log('❌ User already exists:', credentials.email);
    return {
      success: false,
      error: 'User with this email already exists',
    };
  }

  // In mock mode, we can't actually add users to seed data
  // Just simulate success
  console.log('✅ Mock registration successful (simulated):', credentials.email);
  console.log('⚠️  Note: New users are not persisted in mock mode. Use existing seed data users.');

  return { 
    success: false,
    error: 'Registration is disabled in mock mode. Please use existing test accounts.' 
  };
}

export async function mockSignIn(credentials: LoginCredentials): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log('🔐 Mock sign in attempt:', credentials.email);
  console.log('🔍 Checking VITE_USE_MOCK_DATA:', import.meta.env.VITE_USE_MOCK_DATA);
  
  const users = getMockUsers();
  console.log('📊 Total users loaded:', users.length);
  console.log(
    '📋 Available users:',
    users.map(u => ({ email: u.email, role: u.role }))
  );

  // In mock mode, accept any password - just check if email exists
  const user = users.find(u => u.email === credentials.email);

  if (!user) {
    console.log('❌ User not found:', credentials.email);
    console.log('💡 Available emails:', users.map(u => u.email).join(', '));
    return {
      user: null,
      error: {
        message: 'Invalid email or password',
        name: 'AuthError',
        status: 401,
        code: 'INVALID_CREDENTIALS',
        __isAuthError: true,
      } as any,
    };
  }

  if (!user.isActive) {
    console.log('❌ Account is inactive:', credentials.email);
    return {
      user: null,
      error: {
        message: 'Account is inactive',
        name: 'AuthError',
        status: 403,
        code: 'ACCOUNT_INACTIVE',
        __isAuthError: true,
      } as any,
    };
  }

  // Store session
  const session = {
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  console.log('✅ Mock session created for user:', user.email, `(${user.role})`);

  return {
    user: transformMockUser(user),
    error: null,
  };
}

export async function mockSignOut(): Promise<{ error: null }> {
  localStorage.removeItem(MOCK_SESSION_KEY);
  return { error: null };
}

export async function mockGetCurrentUser(): Promise<AuthResponse> {
  const sessionData = localStorage.getItem(MOCK_SESSION_KEY);
  if (!sessionData) {
    return { user: null, error: null };
  }

  try {
    const session = JSON.parse(sessionData);

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(MOCK_SESSION_KEY);
      return { user: null, error: null };
    }

    const users = getMockUsers();
    const user = users.find(u => u.id === session.userId);

    if (!user) {
      localStorage.removeItem(MOCK_SESSION_KEY);
      return { user: null, error: null };
    }

    return {
      user: transformMockUser(user),
      error: null,
    };
  } catch (error) {
    localStorage.removeItem(MOCK_SESSION_KEY);
    return { user: null, error: null };
  }
}

export function mockOnAuthStateChange(callback: (user: User | null) => void) {
  // For mock implementation, we'll just call the callback immediately with current user
  mockGetCurrentUser().then(({ user }) => {
    callback(user);
  });

  // Return a mock subscription
  return {
    unsubscribe: () => {
      // Mock unsubscribe
    },
  };
}
