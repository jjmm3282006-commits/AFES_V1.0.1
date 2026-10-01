const STORAGE_KEY = 'afes_data';
const STORAGE_VERSION = '2.0.0';

export function saveToLocalStorage( any): boolean {
  try {
    const persistedData = { version: STORAGE_VERSION, timestamp: new Date().toISOString(), data: data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedData));
    return true;
  } catch (error) {
    console.error('Failed to save:', error);
    return false;
  }
}

export function loadFromLocalStorage(): any {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.version !== STORAGE_VERSION) return null;
    return parsed.data;
  } catch (error) {
    console.error('Failed to load:', error);
    return null;
  }
}

export function clearLocalStorage(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasPersistedData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function getStorageSize(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? new Blob([data]).size / 1024 : 0;
}
