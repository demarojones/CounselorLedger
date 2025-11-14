import { faker } from '@faker-js/faker';

export interface MockContact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone?: string;
  organization?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const RELATIONSHIPS = [
  'Parent',
  'Guardian',
  'Teacher',
  'Administrator',
  'Social Worker',
  'Therapist',
  'Coach',
  'Mentor',
  'Other',
];

const ORGANIZATIONS = [
  'School District Office',
  'Community Mental Health',
  'Youth Services',
  'Family Services',
  'Local Hospital',
  'Community Center',
  null, // Some contacts won't have an organization
];

export function createContact(tenantId: string, overrides?: Partial<MockContact>): MockContact {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const relationship = faker.helpers.arrayElement(RELATIONSHIPS);

  return {
    id: faker.string.uuid(),
    tenantId,
    firstName,
    lastName,
    relationship,
    email: faker.helpers.maybe(() => faker.internet.email({ firstName, lastName }), {
      probability: 0.8,
    }),
    phone: faker.helpers.maybe(() => faker.phone.number(), { probability: 0.9 }),
    organization: faker.helpers.maybe(
      () => faker.helpers.arrayElement(ORGANIZATIONS.filter(Boolean) as string[]),
      { probability: 0.4 }
    ),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 90 }).toISOString(),
    ...overrides,
  };
}

export function createContacts(tenantId: string, count: number): MockContact[] {
  return Array.from({ length: count }, () => createContact(tenantId));
}

export function createContactByRelationship(
  tenantId: string,
  relationship: string,
  count: number
): MockContact[] {
  return Array.from({ length: count }, () => createContact(tenantId, { relationship }));
}
