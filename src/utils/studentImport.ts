import Papa from 'papaparse';
import { read, utils } from 'xlsx';
import { customAlphabet } from 'nanoid';

// Nanoid alphabet excluding ambiguous characters (0/O, 1/l/I)
const generateId = customAlphabet(
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz',
  8
);

/**
 * Generate a system-assigned student ID with STU- prefix.
 * Format: STU-XXXXXXXX (12 chars total, fits within 20-char limit)
 */
export function generateStudentId(): string {
  return `STU-${generateId()}`;
}

// Valid grade levels matching the Zod schema
const VALID_GRADE_LEVELS = [
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

// Map common grade level variations to canonical form
const GRADE_LEVEL_ALIASES: Record<string, string> = {
  'pre-k': 'Pre-K',
  'prek': 'Pre-K',
  'pre k': 'Pre-K',
  'pk': 'Pre-K',
  'kindergarten': 'Kindergarten',
  'kinder': 'Kindergarten',
  'k': 'Kindergarten',
  '1': '1st Grade',
  '1st': '1st Grade',
  '1st grade': '1st Grade',
  '2': '2nd Grade',
  '2nd': '2nd Grade',
  '2nd grade': '2nd Grade',
  '3': '3rd Grade',
  '3rd': '3rd Grade',
  '3rd grade': '3rd Grade',
  '4': '4th Grade',
  '4th': '4th Grade',
  '4th grade': '4th Grade',
  '5': '5th Grade',
  '5th': '5th Grade',
  '5th grade': '5th Grade',
  '6': '6th Grade',
  '6th': '6th Grade',
  '6th grade': '6th Grade',
  '7': '7th Grade',
  '7th': '7th Grade',
  '7th grade': '7th Grade',
  '8': '8th Grade',
  '8th': '8th Grade',
  '8th grade': '8th Grade',
  '9': '9th Grade',
  '9th': '9th Grade',
  '9th grade': '9th Grade',
  '10': '10th Grade',
  '10th': '10th Grade',
  '10th grade': '10th Grade',
  '11': '11th Grade',
  '11th': '11th Grade',
  '11th grade': '11th Grade',
  '12': '12th Grade',
  '12th': '12th Grade',
  '12th grade': '12th Grade',
};

// Column header aliases for flexible mapping
const COLUMN_ALIASES: Record<string, string> = {
  student_id: 'student_id',
  studentid: 'student_id',
  'student id': 'student_id',
  id: 'student_id',
  sid: 'student_id',
  first_name: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  first: 'first_name',
  last_name: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  last: 'last_name',
  grade_level: 'grade_level',
  gradelevel: 'grade_level',
  'grade level': 'grade_level',
  grade: 'grade_level',
  email: 'email',
  'email address': 'email',
  phone: 'phone',
  'phone number': 'phone',
  telephone: 'phone',
};

export interface ImportRow {
  rowNumber: number;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  email: string;
  phone: string;
  isAutoId: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedRow extends ImportRow {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ImportParseResult {
  rows: ValidatedRow[];
  validCount: number;
  errorCount: number;
  totalCount: number;
}

/**
 * Normalize a column header to a known field name
 */
function normalizeColumnHeader(header: string): string | null {
  const key = header.trim().toLowerCase();
  return COLUMN_ALIASES[key] || null;
}

/**
 * Normalize a grade level string to the canonical form
 */
function normalizeGradeLevel(value: string): string | null {
  const key = value.trim().toLowerCase();
  // Check direct match first
  if (VALID_GRADE_LEVELS.map(g => g.toLowerCase()).includes(key)) {
    return VALID_GRADE_LEVELS.find(g => g.toLowerCase() === key) || null;
  }
  return GRADE_LEVEL_ALIASES[key] || null;
}

/**
 * Validate a single row of import data
 */
function validateRow(row: ImportRow, existingIds: Set<string>, seenIds: Set<string>): ValidatedRow {
  const errors: ValidationError[] = [];

  // Validate firstName
  if (!row.firstName.trim()) {
    errors.push({ field: 'first_name', message: 'First name is required' });
  } else if (row.firstName.length > 50) {
    errors.push({ field: 'first_name', message: 'First name must be less than 50 characters' });
  }

  // Validate lastName
  if (!row.lastName.trim()) {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  } else if (row.lastName.length > 50) {
    errors.push({ field: 'last_name', message: 'Last name must be less than 50 characters' });
  }

  // Validate gradeLevel
  if (!row.gradeLevel) {
    errors.push({ field: 'grade_level', message: 'Grade level is required' });
  } else if (!VALID_GRADE_LEVELS.includes(row.gradeLevel)) {
    errors.push({
      field: 'grade_level',
      message: `Invalid grade level. Must be one of: ${VALID_GRADE_LEVELS.join(', ')}`,
    });
  }

  // Validate studentId length
  if (row.studentId && row.studentId.length > 20) {
    errors.push({ field: 'student_id', message: 'Student ID must be less than 20 characters' });
  }

  // Check for duplicate IDs within the file
  if (row.studentId && !row.isAutoId) {
    if (seenIds.has(row.studentId.toLowerCase())) {
      errors.push({ field: 'student_id', message: 'Duplicate student ID in file' });
    } else {
      seenIds.add(row.studentId.toLowerCase());
    }
  }

  // Check for duplicate IDs against existing students
  if (row.studentId && existingIds.has(row.studentId.toLowerCase())) {
    errors.push({ field: 'student_id', message: 'Student ID already exists in the system' });
  }

  // Validate email format if provided
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate phone format if provided
  if (row.phone && !/^[\d\s\-()+ ]*$/.test(row.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }

  return {
    ...row,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse raw rows from CSV/Excel into ImportRow objects
 */
function mapRawRows(
  rawRows: Record<string, string>[],
  headerMap: Record<string, string>
): ImportRow[] {
  return rawRows
    .map((raw, index) => {
      const getValue = (field: string): string => {
        const sourceCol = Object.entries(headerMap).find(([, mapped]) => mapped === field)?.[0];
        if (!sourceCol) return '';
        return (raw[sourceCol] || '').trim();
      };

      const rawGrade = getValue('grade_level');
      const gradeLevel = normalizeGradeLevel(rawGrade) || rawGrade;

      const studentId = getValue('student_id');
      const isAutoId = !studentId;

      return {
        rowNumber: index + 2, // +2 because row 1 is the header, and index is 0-based
        studentId: studentId || generateStudentId(),
        firstName: getValue('first_name'),
        lastName: getValue('last_name'),
        gradeLevel,
        email: getValue('email'),
        phone: getValue('phone'),
        isAutoId,
      };
    })
    .filter(row => {
      // Skip completely empty rows
      return row.firstName || row.lastName || row.gradeLevel;
    });
}

/**
 * Parse a CSV file and return validated rows
 */
export function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        resolve(results.data as Record<string, string>[]);
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Parse an Excel file and return raw rows
 */
export function parseExcel(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = utils.sheet_to_json<Record<string, string>>(worksheet, {
          defval: '',
          raw: false,
        });
        resolve(rows);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse and validate a student import file (CSV or Excel)
 */
export async function parseImportFile(
  file: File,
  existingStudentIds: string[]
): Promise<ImportParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let rawRows: Record<string, string>[];

  if (extension === 'csv') {
    rawRows = await parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    rawRows = await parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please use CSV or Excel (.xlsx/.xls) files.');
  }

  if (rawRows.length === 0) {
    return { rows: [], validCount: 0, errorCount: 0, totalCount: 0 };
  }

  // Build header map from first row's keys
  const originalHeaders = Object.keys(rawRows[0]);
  const headerMap: Record<string, string> = {};

  for (const header of originalHeaders) {
    const mapped = normalizeColumnHeader(header);
    if (mapped) {
      headerMap[header] = mapped;
    }
  }

  // Check required columns are present
  const mappedFields = new Set(Object.values(headerMap));
  const requiredFields = ['first_name', 'last_name', 'grade_level'];
  const missingFields = requiredFields.filter(f => !mappedFields.has(f));

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required columns: ${missingFields.join(', ')}. ` +
        `Found columns: ${originalHeaders.join(', ')}`
    );
  }

  // Parse rows
  const importRows = mapRawRows(rawRows, headerMap);

  // Build existing IDs set (case-insensitive)
  const existingIds = new Set(existingStudentIds.map(id => id.toLowerCase()));
  const seenIds = new Set<string>();

  // Validate all rows
  const validatedRows = importRows.map(row => validateRow(row, existingIds, seenIds));

  const validCount = validatedRows.filter(r => r.isValid).length;
  const errorCount = validatedRows.filter(r => !r.isValid).length;

  return {
    rows: validatedRows,
    validCount,
    errorCount,
    totalCount: validatedRows.length,
  };
}
