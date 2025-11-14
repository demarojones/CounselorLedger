import { faker } from '@faker-js/faker';
import type { MockStudent } from './studentFactory';
import type { MockContact } from './contactFactory';
import type { MockUser } from './userFactory';
import type { MockReasonCategory, MockReasonSubcategory } from './reasonCategoryFactory';

export interface MockInteraction {
  id: string;
  tenantId: string;
  counselorId: string;
  studentId?: string;
  contactId?: string;
  categoryId: string;
  subcategoryId?: string;
  customReason?: string;
  startTime: string;
  durationMinutes: number;
  endTime: string;
  notes?: string;
  needsFollowUp: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  isFollowUpComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

function calculateEndTime(startTime: Date, durationMinutes: number): string {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime.toISOString();
}

export function createInteraction(
  tenantId: string,
  counselorId: string,
  options: {
    studentId?: string;
    contactId?: string;
    categoryId: string;
    subcategoryId?: string;
  },
  overrides?: Partial<MockInteraction>
): MockInteraction {
  const startTime = faker.date.recent({ days: 90 });
  const durationMinutes = faker.helpers.arrayElement([15, 30, 45, 60, 90]);
  const needsFollowUp = faker.datatype.boolean({ probability: 0.25 });
  const isCustomCategory = overrides?.customReason !== undefined;

  return {
    id: faker.string.uuid(),
    tenantId,
    counselorId,
    studentId: options.studentId,
    contactId: options.contactId,
    categoryId: options.categoryId,
    subcategoryId: isCustomCategory ? undefined : options.subcategoryId,
    customReason: overrides?.customReason,
    startTime: startTime.toISOString(),
    durationMinutes,
    endTime: calculateEndTime(startTime, durationMinutes),
    notes: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.7 }),
    needsFollowUp,
    followUpDate: needsFollowUp
      ? faker.date.soon({ days: 14, refDate: startTime }).toISOString()
      : undefined,
    followUpNotes: needsFollowUp
      ? faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.8 })
      : undefined,
    isFollowUpComplete: needsFollowUp ? faker.datatype.boolean({ probability: 0.3 }) : false,
    createdAt: startTime.toISOString(),
    updatedAt: faker.date.recent({ days: 7 }).toISOString(),
    ...overrides,
  };
}

export function createStudentInteraction(
  tenantId: string,
  counselorId: string,
  studentId: string,
  categoryId: string,
  subcategoryId?: string,
  overrides?: Partial<MockInteraction>
): MockInteraction {
  return createInteraction(
    tenantId,
    counselorId,
    { studentId, categoryId, subcategoryId },
    overrides
  );
}

export function createContactInteraction(
  tenantId: string,
  counselorId: string,
  contactId: string,
  categoryId: string,
  subcategoryId?: string,
  overrides?: Partial<MockInteraction>
): MockInteraction {
  return createInteraction(
    tenantId,
    counselorId,
    { contactId, categoryId, subcategoryId },
    overrides
  );
}

export function createInteractionsForStudent(
  tenantId: string,
  counselors: MockUser[],
  student: MockStudent,
  categories: MockReasonCategory[],
  subcategories: MockReasonSubcategory[],
  count: number
): MockInteraction[] {
  return Array.from({ length: count }, () => {
    const counselor = faker.helpers.arrayElement(counselors);
    const category = faker.helpers.arrayElement(categories);
    const categorySubcategories = subcategories.filter(sub => sub.categoryId === category.id);
    const subcategory = faker.helpers.arrayElement(categorySubcategories);

    return createStudentInteraction(
      tenantId,
      counselor.id,
      student.id,
      category.id,
      subcategory.id
    );
  });
}

export function createInteractionsForContact(
  tenantId: string,
  counselors: MockUser[],
  contact: MockContact,
  categories: MockReasonCategory[],
  subcategories: MockReasonSubcategory[],
  count: number
): MockInteraction[] {
  return Array.from({ length: count }, () => {
    const counselor = faker.helpers.arrayElement(counselors);
    const category = faker.helpers.arrayElement(categories);
    const categorySubcategories = subcategories.filter(sub => sub.categoryId === category.id);
    const subcategory = faker.helpers.arrayElement(categorySubcategories);

    return createContactInteraction(
      tenantId,
      counselor.id,
      contact.id,
      category.id,
      subcategory.id
    );
  });
}

export function createRandomInteractions(
  tenantId: string,
  counselors: MockUser[],
  students: MockStudent[],
  contacts: MockContact[],
  categories: MockReasonCategory[],
  subcategories: MockReasonSubcategory[],
  count: number
): MockInteraction[] {
  return Array.from({ length: count }, () => {
    const counselor = faker.helpers.arrayElement(counselors);
    const category = faker.helpers.arrayElement(categories);
    const categorySubcategories = subcategories.filter(sub => sub.categoryId === category.id);
    const subcategory = faker.helpers.arrayElement(categorySubcategories);

    // Randomly choose between student or contact interaction
    const isStudentInteraction = faker.datatype.boolean({ probability: 0.8 });

    if (isStudentInteraction) {
      const student = faker.helpers.arrayElement(students);
      return createStudentInteraction(
        tenantId,
        counselor.id,
        student.id,
        category.id,
        subcategory.id
      );
    } else {
      const contact = faker.helpers.arrayElement(contacts);
      return createContactInteraction(
        tenantId,
        counselor.id,
        contact.id,
        category.id,
        subcategory.id
      );
    }
  });
}
