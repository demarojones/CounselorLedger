import type { User } from '../types/user';
import type { LoginCredentials, RegisterCredentials, AuthResponse, RegisterResponse } from './auth';

// Simple in-memory user storage for development
const MOCK_USERS_KEY = 'mock_users';
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

// Default tenant ID for simplified setup
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Initialize with some default users if none exist
function initializeMockUsers() {
  const existingUsers = localStorage.getItem(MOCK_USERS_KEY);
  if (!existingUsers) {
    const defaultUsers: MockUser[] = [
      {
        id: '1',
        email: 'admin@school.edu',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        tenantId: DEFAULT_TENANT_ID,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        email: 'counselor@school.edu',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Counselor',
        role: 'COUNSELOR',
        tenantId: DEFAULT_TENANT_ID,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
  }
}

function getMockUsers(): MockUser[] {
  initializeMockUsers();
  const users = localStorage.getItem(MOCK_USERS_KEY);
  return users ? JSON.parse(users) : [];
}

function saveMockUsers(users: MockUser[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

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

export async function mockRegisterUser(credentials: RegisterCredentials): Promise<RegisterResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const users = getMockUsers();
  console.log('Mock registration attempt:', credentials.email);
  
  // Check if user already exists
  if (users.find(user => user.email === credentials.email)) {
    console.log('User already exists:', credentials.email);
    return {
      success: false,
      error: 'User with this email already exists',
    };
  }

  // Create new user
  const newUser: MockUser = {
    id: Date.now().toString(),
    email: credentials.email,
    password: credentials.password,
    firstName: credentials.firstName,
    lastName: credentials.lastName,
    role: credentials.role,
    tenantId: credentials.tenantId || DEFAULT_TENANT_ID,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveMockUsers(users);
  console.log('New user created:', newUser.email, 'ID:', newUser.id);

  return { success: true };
}

export async function mockSignIn(credentials: LoginCredentials): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const users = getMockUsers();
  console.log('Mock sign in attempt:', credentials.email);
  console.log('Available users:', users.map(u => ({ email: u.email, id: u.id })));
  
  const user = users.find(
    u => u.email === credentials.email && u.password === credentials.password
  );

  if (!user) {
    console.log('User not found or password mismatch');
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
  console.log('Mock session created for user:', user.email);

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