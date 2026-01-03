import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCK_DATA !== 'true') {
    console.log('🔴 Mock data is DISABLED - using real Supabase backend');
    return;
  }

  console.log('🟢 Mock data is ENABLED - using MSW for API mocking');
  const { worker } = await import('./mocks/browser');

  return worker
    .start({
      onUnhandledRequest: 'bypass',
    })
    .then(() => {
      console.log('✅ MSW worker started successfully');
    });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
