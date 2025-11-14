import { QueryClient } from '@tanstack/react-query';

// Configure React Query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      
      // Cache time: how long unused data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests up to 2 times
      retry: 2,
      
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      
      // Refetch on reconnect to get latest data
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
});

// Query keys for consistent cache management
export const queryKeys = {
  // Interactions
  interactions: ['interactions'] as const,
  interaction: (id: string) => ['interactions', id] as const,
  interactionsByStudent: (studentId: string) => ['interactions', 'student', studentId] as const,
  interactionsByContact: (contactId: string) => ['interactions', 'contact', contactId] as const,
  interactionsByDateRange: (startDate: string, endDate: string) => 
    ['interactions', 'dateRange', startDate, endDate] as const,
  
  // Students
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  studentSearch: (query: string) => ['students', 'search', query] as const,
  
  // Contacts
  contacts: ['contacts'] as const,
  contact: (id: string) => ['contacts', id] as const,
  contactSearch: (query: string) => ['contacts', 'search', query] as const,
  
  // Reason categories
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  subcategories: (categoryId: string) => ['categories', categoryId, 'subcategories'] as const,
  
  // Users
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  
  // Dashboard
  dashboardStats: (startDate?: string, endDate?: string) => 
    ['dashboard', 'stats', startDate, endDate] as const,
  
  // Follow-ups
  followUps: ['followUps'] as const,
  followUpsByStudent: (studentId: string) => ['followUps', 'student', studentId] as const,
};
