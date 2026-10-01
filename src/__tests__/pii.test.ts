import { stripPII, detectPII } from '../utils/pii';

describe('PII Utility Functions', () => {
  describe('stripPII', () => {
    it('should remove email addresses', () => {
      const input = 'Contact me at john.doe@example.com for more info';
      const result = stripPII(input);
      expect(result).not.toContain('john.doe@example.com');
      expect(result).toContain('[REDACTED_EMAIL]');
    });

    it('should remove phone numbers', () => {
      const input = 'Call me at (555) 123-4567 or 555-987-6543';
      const result = stripPII(input);
      expect(result).not.toContain('555');
      expect(result).toContain('[REDACTED_PHONE]');
    });

    it('should remove student IDs', () => {
      const input = 'I am student C24-001 and my friend is C24-042';
      const result = stripPII(input);
      expect(result).not.toContain('C24-001');
      expect(result).not.toContain('C24-042');
      expect(result).toContain('[REDACTED_STUDENT_ID]');
    });

    it('should remove URLs', () => {
      const input = 'Check out https://example.com/page and http://test.org';
      const result = stripPII(input);
      expect(result).not.toContain('https://example.com');
      expect(result).not.toContain('http://test.org');
      expect(result).toContain('[REDACTED_URL]');
    });

    it('should remove SSNs', () => {
      const input = 'My SSN is 123-45-6789';
      const result = stripPII(input);
      expect(result).not.toContain('123-45-6789');
      expect(result).toContain('[REDACTED_SSN]');
    });

    it('should remove common names', () => {
      const input = 'My name is John Smith and I work with Sarah Johnson';
      const result = stripPII(input);
      expect(result).not.toContain('John');
      expect(result).not.toContain('Smith');
      expect(result).not.toContain('Sarah');
      expect(result).not.toContain('Johnson');
      expect(result).toContain('[REDACTED_NAME]');
    });

    it('should handle multiple PII types in one string', () => {
      const input = 'Email: test@example.com, Phone: 555-123-4567, ID: C24-001';
      const result = stripPII(input);
      expect(result).not.toContain('test@example.com');
      expect(result).not.toContain('555-123-4567');
      expect(result).not.toContain('C24-001');
      expect(result).toContain('[REDACTED_EMAIL]');
      expect(result).toContain('[REDACTED_PHONE]');
      expect(result).toContain('[REDACTED_STUDENT_ID]');
    });

    it('should return empty string for empty input', () => {
      expect(stripPII('')).toBe('');
    });

    it('should return original text if no PII detected', () => {
      const input = 'This is a normal feedback without any personal information';
      expect(stripPII(input)).toBe(input);
    });

    it('should be case insensitive for names', () => {
      const input = 'JOHN and john and John are all redacted';
      const result = stripPII(input);
      expect(result).not.toContain('JOHN');
      expect(result).not.toContain('john');
      expect(result).not.toContain('John');
    });
  });

  describe('detectPII', () => {
    it('should detect email addresses', () => {
      const input = 'Contact me at test@example.com';
      const detected = detectPII(input);
      expect(detected).toContain('Email address');
    });

    it('should detect phone numbers', () => {
      const input = 'Call me at (555) 123-4567';
      const detected = detectPII(input);
      expect(detected).toContain('Phone number');
    });

    it('should detect student IDs', () => {
      const input = 'My ID is C24-001';
      const detected = detectPII(input);
      expect(detected).toContain('Student ID');
    });

    it('should detect URLs', () => {
      const input = 'Visit https://example.com';
      const detected = detectPII(input);
      expect(detected).toContain('URL');
    });

    it('should detect SSNs', () => {
      const input = 'SSN: 123-45-6789';
      const detected = detectPII(input);
      expect(detected).toContain('SSN');
    });

    it('should detect names', () => {
      const input = 'My name is John';
      const detected = detectPII(input);
      expect(detected.some(item => item.includes('name'))).toBe(true);
    });

    it('should return empty array for clean text', () => {
      const input = 'This is clean feedback';
      const detected = detectPII(input);
      expect(detected).toHaveLength(0);
    });

    it('should detect multiple PII types', () => {
      const input = 'Email: test@example.com, Phone: 555-123-4567';
      const detected = detectPII(input);
      expect(detected.length).toBeGreaterThan(1);
      expect(detected).toContain('Email address');
      expect(detected).toContain('Phone number');
    });

    it('should return empty array for empty input', () => {
      expect(detectPII('')).toHaveLength(0);
    });
  });
});
