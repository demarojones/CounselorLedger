// Debug utility for mock authentication
// Use in browser console: window.debugAuth

const MOCK_USERS_KEY = 'mock_users';
const MOCK_SESSION_KEY = 'mock_session';

export const debugAuth = {
  // View all registered users
  getUsers: () => {
    const users = localStorage.getItem(MOCK_USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  // View current session
  getSession: () => {
    const session = localStorage.getItem(MOCK_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },

  // Clear all auth data
  clearAll: () => {
    localStorage.removeItem(MOCK_USERS_KEY);
    localStorage.removeItem(MOCK_SESSION_KEY);
    console.log('All auth data cleared');
  },

  // Add a test user
  addTestUser: (email: string, password: string = 'password123') => {
    const users = debugAuth.getUsers();
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      firstName: 'Test',
      lastName: 'User',
      role: 'COUNSELOR',
      tenantId: '00000000-0000-0000-0000-000000000001',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    console.log('Test user added:', email);
    return newUser;
  },

  // Check if user exists
  findUser: (email: string) => {
    const users = debugAuth.getUsers();
    return users.find((u: any) => u.email === email);
  },
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
