/**
 * Name formatting utility functions for handling person names
 * @module nameHelpers
 */

/**
 * Format a full name from first, last, and optional middle name
 * @param {string} firstName - The person's first name
 * @param {string} lastName - The person's last name
 * @param {string} [middleName] - Optional middle name
 * @returns {string} Formatted full name
 * @example
 * formatFullName('John', 'Doe') // "John Doe"
 * formatFullName('John', 'Doe', 'Michael') // "John Michael Doe"
 */
export function formatFullName(firstName: string, lastName: string, middleName?: string): string {
  if (!firstName && !lastName) {
    return 'Unknown';
  }
  
  if (middleName) {
    return `${firstName} ${middleName} ${lastName}`.trim();
  }
  
  return `${firstName} ${lastName}`.trim();
}

/**
 * Format name in "Last, First" format (useful for alphabetical sorting)
 * @param {string} firstName - The person's first name
 * @param {string} lastName - The person's last name
 * @returns {string} Name in "Last, First" format
 * @example
 * formatLastFirst('John', 'Doe') // "Doe, John"
 */
export function formatLastFirst(firstName: string, lastName: string): string {
  if (!firstName && !lastName) {
    return 'Unknown';
  }
  
  if (!firstName) {
    return lastName;
  }
  
  if (!lastName) {
    return firstName;
  }
  
  return `${lastName}, ${firstName}`;
}

/**
 * Get initials from a name (first letter of each name part)
 * @param {string} firstName - The person's first name
 * @param {string} lastName - The person's last name
 * @param {string} [middleName] - Optional middle name
 * @returns {string} Uppercase initials
 * @example
 * getInitials('John', 'Doe') // "JD"
 * getInitials('John', 'Doe', 'Michael') // "JMD"
 */
export function getInitials(firstName: string, lastName: string, middleName?: string): string {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  
  if (parts.length === 0) {
    return '?';
  }
  
  return parts
    .map(part => part ? part.charAt(0).toUpperCase() : '')
    .filter(Boolean)
    .join('');
}

/**
 * Get first name initial and full last name (e.g., "J. Smith")
 * @param {string} firstName - The person's first name
 * @param {string} lastName - The person's last name
 * @returns {string} Initial and last name format
 * @example
 * formatInitialLastName('John', 'Doe') // "J. Doe"
 */
export function formatInitialLastName(firstName: string, lastName: string): string {
  if (!firstName && !lastName) {
    return 'Unknown';
  }
  
  if (!firstName) {
    return lastName;
  }
  
  if (!lastName) {
    return firstName;
  }
  
  return `${firstName.charAt(0)}. ${lastName}`;
}

/**
 * Capitalize first letter of each word in a string
 * @param {string} text - The text to capitalize
 * @returns {string} Text with each word capitalized
 * @example
 * capitalizeWords('john doe') // "John Doe"
 * capitalizeWords('JOHN DOE') // "John Doe"
 */
export function capitalizeWords(text: string): string {
  if (!text) {
    return '';
  }
  
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format name with proper capitalization, handling special cases like McDonald, O'Brien
 * @param {string} name - The name to format
 * @returns {string} Properly capitalized name
 * @example
 * formatProperName('mcdonald') // "McDonald"
 * formatProperName("o'brien") // "O'Brien"
 * formatProperName('macleod') // "MacLeod"
 */
export function formatProperName(name: string): string {
  if (!name) {
    return '';
  }
  
  // Handle special cases like "McDonald", "O'Brien", etc.
  return name
    .split(' ')
    .map(word => {
      if (word.includes("'")) {
        // Handle names like O'Brien
        const parts = word.split("'");
        return parts.map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '').join("'");
      }
      
      if (word.toLowerCase().startsWith('mc') && word.length > 2) {
        // Handle names like McDonald
        return 'Mc' + word.charAt(2).toUpperCase() + word.slice(3).toLowerCase();
      }
      
      if (word.toLowerCase().startsWith('mac') && word.length > 3) {
        // Handle names like MacLeod
        return 'Mac' + word.charAt(3).toUpperCase() + word.slice(4).toLowerCase();
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Get display name with fallback options (tries full name, then first, then last, then email, then fallback)
 * @param {string | null} [firstName] - The person's first name
 * @param {string | null} [lastName] - The person's last name
 * @param {string | null} [email] - The person's email address
 * @param {string} [fallback='Unknown User'] - Fallback text if no name available
 * @returns {string} Best available display name
 * @example
 * getDisplayName('John', 'Doe') // "John Doe"
 * getDisplayName(null, null, 'john@example.com') // "john"
 * getDisplayName(null, null, null) // "Unknown User"
 */
export function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
  fallback = 'Unknown User'
): string {
  if (firstName && lastName) {
    return formatFullName(firstName, lastName);
  }
  
  if (firstName) {
    return firstName;
  }
  
  if (lastName) {
    return lastName;
  }
  
  if (email) {
    return email.split('@')[0];
  }
  
  return fallback;
}

/**
 * Parse full name string into first and last name components
 * @param {string} fullName - The full name to parse
 * @returns {{ firstName: string; lastName: string }} Object with firstName and lastName
 * @example
 * parseFullName('John Doe') // { firstName: 'John', lastName: 'Doe' }
 * parseFullName('John Michael Doe') // { firstName: 'John', lastName: 'Michael Doe' }
 */
export function parseFullName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }
  
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  // First part is first name, rest is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}

/**
 * Truncate name to fit within a character limit (tries full name, then initial + last, then initials)
 * @param {string} firstName - The person's first name
 * @param {string} lastName - The person's last name
 * @param {number} maxLength - Maximum character length
 * @returns {string} Truncated name that fits within maxLength
 * @example
 * truncateName('John', 'Doe', 20) // "John Doe"
 * truncateName('John', 'Doe', 8) // "J. Doe"
 * truncateName('John', 'Doe', 3) // "JD"
 */
export function truncateName(firstName: string, lastName: string, maxLength: number): string {
  const fullName = formatFullName(firstName, lastName);
  
  if (fullName.length <= maxLength) {
    return fullName;
  }
  
  // Try with initial and last name
  const initialLastName = formatInitialLastName(firstName, lastName);
  if (initialLastName.length <= maxLength) {
    return initialLastName;
  }
  
  // Try with just initials
  const initials = getInitials(firstName, lastName);
  if (initials.length <= maxLength) {
    return initials;
  }
  
  // Last resort: truncate with ellipsis
  return fullName.substring(0, maxLength - 3) + '...';
}

/**
 * Compare function for sorting names alphabetically by last name, then first name
 * @param {Object} a - First person object
 * @param {string} a.firstName - First person's first name
 * @param {string} a.lastName - First person's last name
 * @param {Object} b - Second person object
 * @param {string} b.firstName - Second person's first name
 * @param {string} b.lastName - Second person's last name
 * @returns {number} Negative if a < b, positive if a > b, 0 if equal
 * @example
 * const people = [{ firstName: 'John', lastName: 'Doe' }, { firstName: 'Jane', lastName: 'Smith' }];
 * people.sort(compareNames); // Sorted by last name
 */
export function compareNames(
  a: { firstName: string; lastName: string },
  b: { firstName: string; lastName: string }
): number {
  const lastNameCompare = a.lastName.localeCompare(b.lastName);
  
  if (lastNameCompare !== 0) {
    return lastNameCompare;
  }
  
  return a.firstName.localeCompare(b.firstName);
}
