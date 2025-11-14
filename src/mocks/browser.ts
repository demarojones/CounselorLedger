import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW browser worker with handlers
export const worker = setupWorker(...handlers);
