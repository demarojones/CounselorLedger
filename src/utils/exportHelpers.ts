/**
 * Export utilities for reports
 * Note: Requires jsPDF and html2canvas to be installed for PDF export
 * Run: npm install jspdf html2canvas
 */

/**
 * Escape CSV value to handle special characters
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create CSV content
  const csvRows = [
    csvHeaders.map(escapeCSVValue).join(','), // Header row
    ...data.map(row => csvHeaders.map(header => escapeCSVValue(row[header])).join(',')),
  ];

  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to CSV with custom column mapping
 */
export function exportToCSVWithMapping(
  data: any[],
  filename: string,
  columnMapping: Record<string, string | ((item: any) => any)>
) {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(columnMapping);

  // Transform data according to mapping
  const transformedData = data.map(item => {
    const row: Record<string, any> = {};

    headers.forEach(header => {
      const mapping = columnMapping[header];

      if (typeof mapping === 'function') {
        row[header] = mapping(item);
      } else {
        row[header] = item[mapping];
      }
    });

    return row;
  });

  exportToCSV(transformedData, filename, headers);
}

/**
 * Export element to PDF
 * Requires jsPDF and html2canvas
 */
export async function exportToPDF(elementId: string, filename: string) {
  try {
    // Dynamic imports to avoid errors if libraries aren't installed
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      return;
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      alert('PDF export requires additional libraries. Please run: npm install jspdf html2canvas');
    } else {
      alert('Failed to export PDF. Please try again.');
    }
  }
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Format time duration for export
 */
export function formatTimeForExport(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Export table element to CSV
 */
export function exportTableToCSV(tableId: string, filename: string) {
  const table = document.getElementById(tableId);

  if (!table || !(table instanceof HTMLTableElement)) {
    console.error(`Table with id "${tableId}" not found`);
    return;
  }

  const rows: string[][] = [];

  // Get headers
  const headerCells = table.querySelectorAll('thead th');
  if (headerCells.length > 0) {
    rows.push(Array.from(headerCells).map(cell => cell.textContent?.trim() || ''));
  }

  // Get data rows
  const dataRows = table.querySelectorAll('tbody tr');
  dataRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    rows.push(Array.from(cells).map(cell => cell.textContent?.trim() || ''));
  });

  // Create CSV content
  const csvContent = rows.map(row => row.map(escapeCSVValue).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Format data for report export
 */
export function formatDataForExport(data: any[]): any[] {
  return data.map(item => {
    const formatted: Record<string, any> = {};

    Object.keys(item).forEach(key => {
      const value = item[key];

      // Format dates
      if (value instanceof Date) {
        formatted[key] = formatDateForExport(value);
      }
      // Format booleans
      else if (typeof value === 'boolean') {
        formatted[key] = value ? 'Yes' : 'No';
      }
      // Format null/undefined
      else if (value === null || value === undefined) {
        formatted[key] = '';
      }
      // Keep other values as-is
      else {
        formatted[key] = value;
      }
    });

    return formatted;
  });
}

/**
 * Generate filename with timestamp
 */
export function generateFilenameWithTimestamp(baseName: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${baseName}_${timestamp}`;
}

/**
 * Copy data to clipboard as CSV
 */
export async function copyToClipboardAsCSV(data: any[], headers?: string[]): Promise<boolean> {
  if (data.length === 0) {
    return false;
  }

  const csvHeaders = headers || Object.keys(data[0]);

  const csvRows = [
    csvHeaders.join('\t'), // Use tabs for better Excel compatibility
    ...data.map(row => csvHeaders.map(header => row[header] ?? '').join('\t')),
  ];

  const csvContent = csvRows.join('\n');

  try {
    await navigator.clipboard.writeText(csvContent);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
