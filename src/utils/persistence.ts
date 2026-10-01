// Minimal persistence - no-op for now
export function saveToLocalStorage(): boolean {
  return true;
}

export function loadFromLocalStorage(): any {
  return null;
}

export function clearLocalStorage(): boolean {
  return true;
}

export function hasPersistedData(): boolean {
  return false;
}

export function getStorageSize(): number {
  return 0;
}
