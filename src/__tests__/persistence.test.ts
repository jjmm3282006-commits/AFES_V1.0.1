import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  hasPersistedData,
  getStorageSize,
} from '../utils/persistence';

describe('Persistence Utility Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveToLocalStorage', () => {
    it('should save data to localStorage', () => {
      const testData = {
        faculty: [{ id: 'F001', name: 'Dr. Test' }],
        students: [],
        cycles: [],
      };

      const result = saveToLocalStorage(testData as any);
      expect(result).toBe(true);

      const stored = localStorage.getItem('afes_data');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.data).toEqual(testData);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should return true on successful save', () => {
      const result = saveToLocalStorage({ faculty: [] } as any);
      expect(result).toBe(true);
    });

    it('should handle empty data', () => {
      const result = saveToLocalStorage({} as any);
      expect(result).toBe(true);
    });
  });

  describe('loadFromLocalStorage', () => {
    it('should load data from localStorage', () => {
      const testData = {
        faculty: [{ id: 'F001', name: 'Dr. Test' }],
        students: [{ id: 'S001', name: 'Student Test' }],
      };

      saveToLocalStorage(testData as any);
      const loaded = loadFromLocalStorage();

      expect(loaded).toEqual(testData);
    });

    it('should return null if no data exists', () => {
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it('should return null if version mismatch', () => {
      const oldData = {
        version: '0.9.0',
        timestamp: new Date().toISOString(),
        data: { faculty: [] },
      };
      localStorage.setItem('afes_data', JSON.stringify(oldData));

      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it('should return null if data is corrupted', () => {
      localStorage.setItem('afes_data', 'invalid json');
      const loaded = loadFromLocalStorage();
      expect(loaded).toBeNull();
    });
  });

  describe('clearLocalStorage', () => {
    it('should clear all data from localStorage', () => {
      saveToLocalStorage({ faculty: [] } as any);
      expect(hasPersistedData()).toBe(true);

      const result = clearLocalStorage();
      expect(result).toBe(true);
      expect(hasPersistedData()).toBe(false);
    });

    it('should return true even if no data exists', () => {
      const result = clearLocalStorage();
      expect(result).toBe(true);
    });
  });

  describe('hasPersistedData', () => {
    it('should return true if data exists', () => {
      saveToLocalStorage({ faculty: [] } as any);
      expect(hasPersistedData()).toBe(true);
    });

    it('should return false if no data exists', () => {
      expect(hasPersistedData()).toBe(false);
    });
  });

  describe('getStorageSize', () => {
    it('should return storage size in KB', () => {
      saveToLocalStorage({ faculty: [] } as any);
      const size = getStorageSize();
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 if no data exists', () => {
      const size = getStorageSize();
      expect(size).toBe(0);
    });

    it('should increase with more data', () => {
      saveToLocalStorage({ faculty: [] } as any);
      const size1 = getStorageSize();

      saveToLocalStorage({
        faculty: Array(100).fill({ id: 'test', name: 'test' }),
      } as any);
      const size2 = getStorageSize();

      expect(size2).toBeGreaterThan(size1);
    });
  });
});
