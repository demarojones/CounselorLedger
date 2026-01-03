/**
 * Date and time utility functions for formatting, parsing, and manipulating dates
 * @module dateHelpers
 */

/**
 * Format a date for display in various formats
 * @param {Date | string} date - The date to format (Date object or ISO string)
 * @param {'short' | 'long' | 'full'} format - The format style to use
 * @returns {string} Formatted date string
 * @example
 * formatDate(new Date(), 'short') // "01/15/2024"
 * formatDate(new Date(), 'long') // "January 15, 2024"
 * formatDate(new Date(), 'full') // "Monday, January 15, 2024"
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  switch (format) {
    case 'short':
      // MM/DD/YYYY
      return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }).format(dateObj);

    case 'long':
      // January 1, 2024
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);

    case 'full':
      // Monday, January 1, 2024
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(dateObj);

    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Format a time for display in 12-hour format
 * @param {Date | string} date - The date/time to format
 * @param {boolean} includeSeconds - Whether to include seconds in the output
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 * @example
 * formatTime(new Date()) // "2:30 PM"
 * formatTime(new Date(), true) // "2:30:45 PM"
 */
export function formatTime(date: Date | string, includeSeconds = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Time';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  }).format(dateObj);
}

/**
 * Format a date and time together for display
 * @param {Date | string} date - The date/time to format
 * @param {'short' | 'long'} format - The format style to use
 * @returns {string} Formatted date and time string
 * @example
 * formatDateTime(new Date(), 'short') // "01/15/2024, 2:30 PM"
 * formatDateTime(new Date(), 'long') // "January 15, 2024 at 2:30 PM"
 */
export function formatDateTime(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date/Time';
  }

  if (format === 'short') {
    // MM/DD/YYYY, HH:MM AM/PM
    return `${formatDate(dateObj, 'short')}, ${formatTime(dateObj)}`;
  }

  // January 1, 2024 at HH:MM AM/PM
  return `${formatDate(dateObj, 'long')} at ${formatTime(dateObj)}`;
}

/**
 * Format a duration in minutes to a human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "1 hr 30 min", "45 min")
 * @example
 * formatDuration(30) // "30 min"
 * formatDuration(90) // "1 hr 30 min"
 * formatDuration(120) // "2 hrs"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) {
    return '0 min';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hr' : `${hours} hrs`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Calculate end time from start time and duration in minutes
 * @param {Date | string} startTime - The start time
 * @param {number} durationMinutes - Duration in minutes to add
 * @returns {Date} The calculated end time
 * @example
 * const start = new Date('2024-01-15T14:00:00');
 * calculateEndTime(start, 30) // Date object for 2:30 PM
 */
export function calculateEndTime(startTime: Date | string, durationMinutes: number): Date {
  const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return endDate;
}

/**
 * Calculate duration in minutes between two dates
 * @param {Date | string} startTime - The start time
 * @param {Date | string} endTime - The end time
 * @returns {number} Duration in minutes (rounded)
 * @example
 * const start = new Date('2024-01-15T14:00:00');
 * const end = new Date('2024-01-15T15:30:00');
 * calculateDuration(start, end) // 90
 */
export function calculateDuration(startTime: Date | string, endTime: Date | string): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const durationMs = end.getTime() - start.getTime();
  return Math.round(durationMs / (1000 * 60));
}

/**
 * Get relative time string from now (e.g., "2 hours ago", "in 3 days")
 * @param {Date | string} date - The date to compare to now
 * @returns {string} Human-readable relative time string
 * @example
 * getRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 * getRelativeTime(new Date(Date.now() + 86400000)) // "in 1 day"
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Past
  if (diffMs < 0) {
    const absDiffMinutes = Math.abs(diffMinutes);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);

    if (absDiffMinutes < 1) {
      return 'just now';
    }
    if (absDiffMinutes < 60) {
      return `${absDiffMinutes} ${absDiffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (absDiffHours < 24) {
      return `${absDiffHours} ${absDiffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (absDiffDays < 30) {
      return `${absDiffDays} ${absDiffDays === 1 ? 'day' : 'days'} ago`;
    }
    return formatDate(dateObj, 'short');
  }

  // Future
  if (diffMinutes < 60) {
    return `in ${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'}`;
  }
  if (diffHours < 24) {
    return `in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
  }
  if (diffDays < 30) {
    return `in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }
  return formatDate(dateObj, 'short');
}

/**
 * Check if a date is today
 * @param {Date | string} date - The date to check
 * @returns {boolean} True if the date is today
 * @example
 * isToday(new Date()) // true
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the past
 * @param {Date | string} date - The date to check
 * @returns {boolean} True if the date is before now
 * @example
 * isPast(new Date('2020-01-01')) // true
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < new Date().getTime();
}

/**
 * Check if a date is in the future
 * @param {Date | string} date - The date to check
 * @returns {boolean} True if the date is after now
 * @example
 * isFuture(new Date('2030-01-01')) // true
 */
export function isFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() > new Date().getTime();
}

/**
 * Get start of day (00:00:00.000) for a date
 * @param {Date | string} date - The date to process
 * @returns {Date} Date object set to start of day
 * @example
 * startOfDay(new Date('2024-01-15T14:30:00')) // 2024-01-15T00:00:00.000
 */
export function startOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Get end of day (23:59:59.999) for a date
 * @param {Date | string} date - The date to process
 * @returns {Date} Date object set to end of day
 * @example
 * endOfDay(new Date('2024-01-15T14:30:00')) // 2024-01-15T23:59:59.999
 */
export function endOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * Add or subtract days from a date
 * @param {Date | string} date - The starting date
 * @param {number} days - Number of days to add (negative to subtract)
 * @returns {Date} New date with days added
 * @example
 * addDays(new Date('2024-01-15'), 7) // 2024-01-22
 * addDays(new Date('2024-01-15'), -3) // 2024-01-12
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Add or subtract months from a date
 * @param {Date | string} date - The starting date
 * @param {number} months - Number of months to add (negative to subtract)
 * @returns {Date} New date with months added
 * @example
 * addMonths(new Date('2024-01-15'), 3) // 2024-04-15
 * addMonths(new Date('2024-01-15'), -1) // 2023-12-15
 */
export function addMonths(date: Date | string, months: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setMonth(dateObj.getMonth() + months);
  return dateObj;
}

/**
 * Format date for HTML input field (YYYY-MM-DD format)
 * @param {Date | string} date - The date to format
 * @returns {string} Date string in YYYY-MM-DD format
 * @example
 * formatDateForInput(new Date('2024-01-15')) // "2024-01-15"
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format time for HTML input field (HH:MM format in 24-hour time)
 * @param {Date | string} date - The date/time to format
 * @returns {string} Time string in HH:MM format
 * @example
 * formatTimeForInput(new Date('2024-01-15T14:30:00')) // "14:30"
 */
export function formatTimeForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format datetime for HTML input field (YYYY-MM-DDTHH:MM format)
 * @param {Date | string} date - The date/time to format
 * @returns {string} Datetime string in ISO format for input fields
 * @example
 * formatDateTimeForInput(new Date('2024-01-15T14:30:00')) // "2024-01-15T14:30"
 */
export function formatDateTimeForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return `${formatDateForInput(dateObj)}T${formatTimeForInput(dateObj)}`;
}

/**
 * Parse date range string into start and end dates
 * @param {string} range - Range string (e.g., "last 7 days", "this month")
 * @returns {{ startDate: Date; endDate: Date }} Object with start and end dates
 * @example
 * parseDateRange('last 7 days') // { startDate: Date, endDate: Date }
 * parseDateRange('this month') // { startDate: Date, endDate: Date }
 */
export function parseDateRange(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (range.toLowerCase()) {
    case 'today':
      startDate = startOfDay(new Date());
      break;
    case 'yesterday':
      startDate = startOfDay(addDays(new Date(), -1));
      endDate.setTime(endOfDay(addDays(new Date(), -1)).getTime());
      break;
    case 'last 7 days':
      startDate = addDays(new Date(), -7);
      break;
    case 'last 30 days':
      startDate = addDays(new Date(), -30);
      break;
    case 'last 90 days':
      startDate = addDays(new Date(), -90);
      break;
    case 'this month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      break;
    case 'last month':
      startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
      endDate.setTime(new Date(endDate.getFullYear(), endDate.getMonth(), 0).getTime());
      break;
    case 'this year':
      startDate = new Date(endDate.getFullYear(), 0, 1);
      break;
    default:
      startDate = addDays(new Date(), -30);
  }

  return { startDate, endDate };
}
