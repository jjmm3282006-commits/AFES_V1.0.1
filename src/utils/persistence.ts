const STORAGE_KEY = 'afes_data';
const STORAGE_VERSION = '2.0.0';

export interface PersistedData {
  version: string;
  timestamp: string;
   {
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

export function saveToLocalStorage( PersistedData['data']): boolean {
  try {
    const persistedData: PersistedData = { version: STORAGE_VERSION, timestamp: new Date().toISOString(), data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedData));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

export function loadFromLocalStorage(): PersistedData['data'] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed: PersistedData = JSON.parse(stored);
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed.data;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

export function clearLocalStorage(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
}

export function exportData( PersistedData['data']): void {
  try {
    const persistedData: PersistedData = { version: STORAGE_VERSION, timestamp: new Date().toISOString(), data };
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
  } catch (error) {
    console.error('Failed to export ', error);
    throw error;
  }
}

export function importData(file: File): Promise<PersistedData['data']> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed: PersistedData = JSON.parse(content);
        if (parsed.version !== STORAGE_VERSION) {
          reject(new Error(`Data version mismatch`));
          return;
        }
        resolve(parsed.data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function hasPersistedData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function getStorageSize(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return 0;
  return new Blob([data]).size / 1024;
}
