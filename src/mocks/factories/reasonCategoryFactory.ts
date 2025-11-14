import { faker } from '@faker-js/faker';

export interface MockReasonCategory {
  id: string;
  tenantId: string;
  name: string;
  color?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockReasonSubcategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

// Predefined categories with their subcategories
const PREDEFINED_CATEGORIES = [
  {
    name: 'Academic Support',
    subcategories: [
      'Study Skills',
      'Time Management',
      'Test Anxiety',
      'Course Selection',
      'Academic Planning',
      'Tutoring Referral',
    ],
  },
  {
    name: 'Social-Emotional',
    subcategories: [
      'Peer Relationships',
      'Family Issues',
      'Grief/Loss',
      'Anxiety',
      'Depression',
      'Self-Esteem',
      'Anger Management',
    ],
  },
  {
    name: 'Behavioral',
    subcategories: [
      'Classroom Behavior',
      'Attendance Issues',
      'Conflict Resolution',
      'Bullying',
      'Discipline',
    ],
  },
  {
    name: 'Career/College Planning',
    subcategories: [
      'College Applications',
      'Career Exploration',
      'Financial Aid',
      'Resume Building',
      'Interview Preparation',
    ],
  },
  {
    name: 'Crisis Intervention',
    subcategories: [
      'Safety Concern',
      'Mental Health Crisis',
      'Substance Abuse',
      'Self-Harm',
      'Suicidal Ideation',
    ],
  },
  {
    name: 'Parent/Guardian Consultation',
    subcategories: [
      'Progress Update',
      'Behavior Concerns',
      'Academic Concerns',
      'Resource Referral',
    ],
  },
  {
    name: 'Teacher Consultation',
    subcategories: [
      'Student Support Strategy',
      'Classroom Accommodation',
      'Behavioral Intervention',
    ],
  },
  {
    name: 'Other',
    subcategories: ['Custom'],
  },
];

export function createReasonCategory(
  tenantId: string,
  name: string,
  sortOrder: number,
  overrides?: Partial<MockReasonCategory>
): MockReasonCategory {
  return {
    id: faker.string.uuid(),
    tenantId,
    name,
    color: faker.helpers.arrayElement(CATEGORY_COLORS),
    sortOrder,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

export function createReasonSubcategory(
  categoryId: string,
  name: string,
  sortOrder: number,
  overrides?: Partial<MockReasonSubcategory>
): MockReasonSubcategory {
  return {
    id: faker.string.uuid(),
    categoryId,
    name,
    sortOrder,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  };
}

export function createPredefinedCategories(tenantId: string): {
  categories: MockReasonCategory[];
  subcategories: MockReasonSubcategory[];
} {
  const categories: MockReasonCategory[] = [];
  const subcategories: MockReasonSubcategory[] = [];

  PREDEFINED_CATEGORIES.forEach((categoryDef, categoryIndex) => {
    const category = createReasonCategory(tenantId, categoryDef.name, categoryIndex);
    categories.push(category);

    categoryDef.subcategories.forEach((subName, subIndex) => {
      const subcategory = createReasonSubcategory(category.id, subName, subIndex);
      subcategories.push(subcategory);
    });
  });

  return { categories, subcategories };
}
