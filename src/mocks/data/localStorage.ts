const STORAGE_KEY = 'counselor-ledger-mock-data';
const STORAGE_VERSION = '1.0';

export interface StoredMockData {
  version: string;
  timestamp: string;
  data: {
    tenants: any[];
    users: any[];
    students: any[];
    contacts: any[];
    reasonCategories: any[];
    reasonSubcategories: any[];
    interactions: any[];
  };
}

export function saveMockDataToStorage(data: StoredMockData['data']): void {
  try {
    const storedData: StoredMockData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
  } catch (error) {
    console.error('Failed to save mock data to localStorage:', error);
  }
}

export function loadMockDataFromStorage(): StoredMockData['data'] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed: StoredMockData = JSON.parse(stored);

    // Check version compatibility
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Mock data version mismatch, clearing storage');
      clearMockDataStorage();
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error('Failed to load mock data from localStorage:', error);
    return null;
  }
}

export function clearMockDataStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear mock data from localStorage:', error);
  }
}

export function hasMockDataInStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}
