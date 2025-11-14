import { faker } from '@faker-js/faker';

export interface MockStudent {
  id: string;
  tenantId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email?: string;
  phone?: string;
  needsFollowUp: boolean;
  followUpNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const GRADE_LEVELS = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
];

export function createStudent(tenantId: string, overrides?: Partial<MockStudent>): MockStudent {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const needsFollowUp = faker.datatype.boolean({ probability: 0.2 });

  return {
    id: faker.string.uuid(),
    tenantId,
    studentId: faker.string.numeric(7),
    firstName,
    lastName,
    gradeLevel: faker.helpers.arrayElement(GRADE_LEVELS),
    email: faker.helpers.maybe(() => faker.internet.email({ firstName, lastName }), {
      probability: 0.7,
    }),
    phone: faker.helpers.maybe(() => faker.phone.number(), { probability: 0.5 }),
    needsFollowUp,
    followUpNotes: needsFollowUp
      ? faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.8 })
      : undefined,
    createdAt: faker.date.past({ years: 3 }).toISOString(),
    updatedAt: faker.date.recent({ days: 60 }).toISOString(),
    ...overrides,
  };
}

export function createStudents(tenantId: string, count: number): MockStudent[] {
  return Array.from({ length: count }, () => createStudent(tenantId));
}

export function createStudentsByGrade(
  tenantId: string,
  gradeLevel: string,
  count: number
): MockStudent[] {
  return Array.from({ length: count }, () => createStudent(tenantId, { gradeLevel }));
}
