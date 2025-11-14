import { faker } from '@faker-js/faker';

export interface MockUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'COUNSELOR';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function createUser(tenantId: string, overrides?: Partial<MockUser>): MockUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const role = overrides?.role || faker.helpers.arrayElement(['ADMIN', 'COUNSELOR'] as const);

  return {
    id: faker.string.uuid(),
    tenantId,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    firstName,
    lastName,
    role,
    isActive: true,
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

export function createAdmin(tenantId: string, overrides?: Partial<MockUser>): MockUser {
  return createUser(tenantId, { role: 'ADMIN', ...overrides });
}

export function createCounselor(tenantId: string, overrides?: Partial<MockUser>): MockUser {
  return createUser(tenantId, { role: 'COUNSELOR', ...overrides });
}

export function createUsers(tenantId: string, count: number): MockUser[] {
  return Array.from({ length: count }, () => createUser(tenantId));
}
