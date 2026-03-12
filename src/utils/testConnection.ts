/**
 * Test Supabase connection and database access
 */
import { supabase } from '../services/supabase';

export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  
  try {
    // Test 1: Check if Supabase client is initialized
    console.log('✓ Supabase client initialized');
    
    // Test 2: Try to get auth session
    console.log('Testing auth session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else {
      console.log('✓ Auth session check:', sessionData.session ? 'Session exists' : 'No session');
    }
    
    // Test 3: Try a simple database query with timeout
    console.log('Testing database connection...');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout (5s)')), 5000);
    });
    
    const queryPromise = supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const result: any = await Promise.race([queryPromise, timeoutPromise]);
    
    if (result.error) {
      console.error('❌ Database query error:', result.error);
      return false;
    }
    
    console.log('✓ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Auto-run in development
if (import.meta.env.DEV) {
  testSupabaseConnection();
}
