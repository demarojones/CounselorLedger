export { worker } from './browser';
export { handlers } from './handlers';
export {
  getMockData,
  initializeMockData,
  resetMockData,
  type MockData,
  type MockTenant,
} from './data/seedData';
export {
  saveMockDataToStorage,
  loadMockDataFromStorage,
  clearMockDataStorage,
  hasMockDataInStorage,
} from './data/localStorage';

// Re-export factory types for convenience
export type { MockUser } from './factories/userFactory';
export type { MockStudent } from './factories/studentFactory';
export type { MockContact } from './factories/contactFactory';
export type { MockInteraction } from './factories/interactionFactory';
export type { MockReasonCategory, MockReasonSubcategory } from './factories/reasonCategoryFactory';
