import { faker } from '@faker-js/faker';
import { createAdmin, createCounselor, type MockUser } from '../factories/userFactory';
import { createStudents, type MockStudent } from '../factories/studentFactory';
import { createContacts, type MockContact } from '../factories/contactFactory';
import {
  createPredefinedCategories,
  type MockReasonCategory,
  type MockReasonSubcategory,
} from '../factories/reasonCategoryFactory';
import { createRandomInteractions, type MockInteraction } from '../factories/interactionFactory';
import {
  loadMockDataFromStorage,
  saveMockDataToStorage,
  hasMockDataInStorage,
} from './localStorage';

export interface MockTenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockData {
  tenants: MockTenant[];
  users: MockUser[];
  students: MockStudent[];
  contacts: MockContact[];
  reasonCategories: MockReasonCategory[];
  reasonSubcategories: MockReasonSubcategory[];
  interactions: MockInteraction[];
}

function createTenant(name: string, subdomain: string): MockTenant {
  return {
    id: faker.string.uuid(),
    name,
    subdomain,
    createdAt: faker.date.past({ years: 3 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
  };
}

function generateSeedData(): MockData {
  // Create tenants
  const tenant1 = createTenant('Lincoln High School', 'lincoln-hs');
  const tenant2 = createTenant('Washington Middle School', 'washington-ms');

  const tenants = [tenant1, tenant2];

  // Create users for each tenant
  const tenant1Admin = createAdmin(tenant1.id, {
    email: 'admin@lincoln-hs.edu',
    firstName: 'Sarah',
    lastName: 'Johnson',
  });

  const tenant1Counselors = [
    createCounselor(tenant1.id, {
      email: 'mjones@lincoln-hs.edu',
      firstName: 'Michael',
      lastName: 'Jones',
    }),
    createCounselor(tenant1.id, {
      email: 'lsmith@lincoln-hs.edu',
      firstName: 'Lisa',
      lastName: 'Smith',
    }),
  ];

  const tenant2Admin = createAdmin(tenant2.id, {
    email: 'admin@washington-ms.edu',
    firstName: 'Robert',
    lastName: 'Williams',
  });

  const tenant2Counselors = [
    createCounselor(tenant2.id, {
      email: 'ebrown@washington-ms.edu',
      firstName: 'Emily',
      lastName: 'Brown',
    }),
  ];

  const users = [tenant1Admin, ...tenant1Counselors, tenant2Admin, ...tenant2Counselors];

  // Create students for each tenant
  const tenant1Students = createStudents(tenant1.id, 150);
  const tenant2Students = createStudents(tenant2.id, 100);
  const students = [...tenant1Students, ...tenant2Students];

  // Create contacts for each tenant
  const tenant1Contacts = createContacts(tenant1.id, 50);
  const tenant2Contacts = createContacts(tenant2.id, 30);
  const contacts = [...tenant1Contacts, ...tenant2Contacts];

  // Create reason categories and subcategories for each tenant
  const tenant1Categories = createPredefinedCategories(tenant1.id);
  const tenant2Categories = createPredefinedCategories(tenant2.id);

  const reasonCategories = [...tenant1Categories.categories, ...tenant2Categories.categories];

  const reasonSubcategories = [
    ...tenant1Categories.subcategories,
    ...tenant2Categories.subcategories,
  ];

  // Create interactions for tenant 1
  const tenant1Interactions = createRandomInteractions(
    tenant1.id,
    tenant1Counselors,
    tenant1Students,
    tenant1Contacts,
    tenant1Categories.categories,
    tenant1Categories.subcategories,
    300
  );

  // Create interactions for tenant 2
  const tenant2Interactions = createRandomInteractions(
    tenant2.id,
    tenant2Counselors,
    tenant2Students,
    tenant2Contacts,
    tenant2Categories.categories,
    tenant2Categories.subcategories,
    200
  );

  const interactions = [...tenant1Interactions, ...tenant2Interactions];

  return {
    tenants,
    users,
    students,
    contacts,
    reasonCategories,
    reasonSubcategories,
    interactions,
  };
}

let mockDataInstance: MockData | null = null;

export function initializeMockData(): MockData {
  // Check if data exists in localStorage
  if (hasMockDataInStorage()) {
    const storedData = loadMockDataFromStorage();
    if (storedData) {
      console.log('✅ Loaded mock data from localStorage');
      mockDataInstance = storedData as MockData;
      return mockDataInstance;
    }
  }

  // Generate fresh seed data
  console.log('🌱 Generating fresh mock data...');
  mockDataInstance = generateSeedData();

  // Save to localStorage for persistence
  saveMockDataToStorage(mockDataInstance);
  console.log('💾 Saved mock data to localStorage');

  return mockDataInstance;
}

export function getMockData(): MockData {
  if (!mockDataInstance) {
    mockDataInstance = initializeMockData();
  }
  return mockDataInstance;
}

export function resetMockData(): MockData {
  console.log('🔄 Resetting mock data...');
  mockDataInstance = generateSeedData();
  saveMockDataToStorage(mockDataInstance);
  console.log('✅ Mock data reset complete');
  return mockDataInstance;
}

// Initialize mock data when module is imported
if (import.meta.env.VITE_USE_MOCK_DATA === 'true') {
  initializeMockData();
}
