// Data persistence utilities for localStorage

const STORAGE_KEY = 'afes_data';
const STORAGE_VERSION = '1.0.0';

export interface PersistedData {
  version: string;
  timestamp: string;
  data: {
    faculty: any[];
    students: any[];
    deans: any[];
    cycles: any[];
    criteria: any[];
    subQuestions: any[];
    evaluations: any[];
    auditLog: any[];
    trainingRecommendations: any[];
    disputes: any[];
  };
}

/**
 * Save data to localStorage
 */
export function saveToLocalStorage(data: PersistedData['data']): boolean {
  try {
    const persistedData: PersistedData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedData));
    console.log('✅ Data saved to localStorage');
    return true;
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Load data from localStorage
 */
export function loadFromLocalStorage(): PersistedData['data'] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('ℹ️ No persisted data found');
      return null;
    }

    const parsed: PersistedData = JSON.parse(stored);
    
    // Version check
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('⚠️ Data version mismatch, ignoring stored data');
      return null;
    }

    console.log('✅ Data loaded from localStorage');
    return parsed.data;
  } catch (error) {
    console.error('❌ Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Clear all persisted data
 */
export function clearLocalStorage(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ localStorage cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear localStorage:', error);
    return false;
  }
}

/**
 * Export data to JSON file
 */
export function exportData(data: PersistedData['data']): void {
  try {
    const persistedData: PersistedData = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data,
    };

    const json = JSON.stringify(persistedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `afes_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Data exported successfully');
  } catch (error) {
    console.error('❌ Failed to export data:', error);
    throw error;
  }
}

/**
 * Import data from JSON file
 */
export function importData(file: File): Promise<PersistedData['data']> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed: PersistedData = JSON.parse(content);
        
        // Version check
        if (parsed.version !== STORAGE_VERSION) {
          reject(new Error(`Data version mismatch. Expected ${STORAGE_VERSION}, got ${parsed.version}`));
          return;
        }

        console.log('✅ Data imported successfully');
        resolve(parsed.data);
      } catch (error) {
        console.error('❌ Failed to parse imported data:', error);
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Check if data exists in localStorage
 */
export function hasPersistedData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get storage size in KB
 */
export function getStorageSize(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return 0;
  return new Blob([data]).size / 1024;
}
