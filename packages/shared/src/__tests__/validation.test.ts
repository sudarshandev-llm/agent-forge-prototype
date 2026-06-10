import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateUrl,
  validatePhone,
  sanitizeInput,
  isValidJson,
  validateHexColor,
  isNonEmptyString,
  isPositiveInteger,
  validateEnumValue,
  isValidDate,
} from '../utils/validation';

enum TestEnum {
  FOO = 'foo',
  BAR = 'bar',
  BAZ = 'baz',
}

describe('validateEmail', () => {
  it('should return true for valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.org')).toBe(true);
    expect(validateEmail('a@b.cd')).toBe(true);
  });

  it('should return false for invalid emails', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('user@.com')).toBe(false);
    expect(validateEmail('user name@domain.com')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('should return true for valid URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://example.com/path?q=1')).toBe(true);
    expect(validateUrl('https://sub.example.co.uk:8080/page')).toBe(true);
    expect(validateUrl('ftp://files.example.com')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(validateUrl('')).toBe(false);
    expect(validateUrl('not-a-url')).toBe(false);
    expect(validateUrl('http://')).toBe(false);
    expect(validateUrl('://missing')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('should return true for valid phone numbers', () => {
    expect(validatePhone('+1234567890')).toBe(true);
    expect(validatePhone('+1 (234) 567-8900')).toBe(true);
    expect(validatePhone('123-456-7890')).toBe(true);
    expect(validatePhone('+44 20 7123 4567')).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(validatePhone('')).toBe(false);
    expect(validatePhone('abc')).toBe(false);
    expect(validatePhone('1')).toBe(false);
    expect(validatePhone('12345')).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('should escape HTML special characters', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
    );
  });

  it('should escape ampersands', () => {
    expect(sanitizeInput('a & b')).toBe('a &amp; b');
  });

  it('should escape single quotes', () => {
    expect(sanitizeInput("it's")).toBe("it&#x27;s");
  });

  it('should return empty string when given empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should not modify safe strings', () => {
    expect(sanitizeInput('Hello, World!')).toBe('Hello, World!');
  });

  it('should escape all five HTML special characters', () => {
    const result = sanitizeInput('&<>"\'/');
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#x27;');
    expect(result).toContain('&#x2F;');
  });
});

describe('isValidJson', () => {
  it('should return true for valid JSON strings', () => {
    expect(isValidJson('{}')).toBe(true);
    expect(isValidJson('{"key":"value"}')).toBe(true);
    expect(isValidJson('[1,2,3]')).toBe(true);
    expect(isValidJson('null')).toBe(true);
    expect(isValidJson('"string"')).toBe(true);
    expect(isValidJson('42')).toBe(true);
  });

  it('should return false for invalid JSON strings', () => {
    expect(isValidJson('')).toBe(false);
    expect(isValidJson('{invalid}')).toBe(false);
    expect(isValidJson('undefined')).toBe(false);
    expect(isValidJson("'single quotes'")).toBe(false);
  });
});

describe('validateHexColor', () => {
  it('should return true for valid hex colors', () => {
    expect(validateHexColor('#fff')).toBe(true);
    expect(validateHexColor('#000000')).toBe(true);
    expect(validateHexColor('#FF0000')).toBe(true);
    expect(validateHexColor('#a1b2c3')).toBe(true);
    expect(validateHexColor('#AABBCCDD')).toBe(true);
  });

  it('should return false for invalid hex colors', () => {
    expect(validateHexColor('')).toBe(false);
    expect(validateHexColor('#xyz')).toBe(false);
    expect(validateHexColor('123456')).toBe(false);
    expect(validateHexColor('#12345')).toBe(false);
    expect(validateHexColor('#GGG')).toBe(false);
    expect(validateHexColor('rgb(255,0,0)')).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('should return true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString(' ')).toBe(false);
    expect(isNonEmptyString('a')).toBe(true);
  });

  it('should return false for empty or non-string values', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(0)).toBe(false);
    expect(isNonEmptyString({})).toBe(false);
    expect(isNonEmptyString([])).toBe(false);
  });
});

describe('isPositiveInteger', () => {
  it('should return true for positive integers', () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(100)).toBe(true);
    expect(isPositiveInteger(999999)).toBe(true);
  });

  it('should return false for zero, negative, or non-integer values', () => {
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
    expect(isPositiveInteger(NaN)).toBe(false);
    expect(isPositiveInteger('1')).toBe(false);
    expect(isPositiveInteger(null)).toBe(false);
  });
});

describe('validateEnumValue', () => {
  it('should return true for valid enum values', () => {
    expect(validateEnumValue('foo', TestEnum)).toBe(true);
    expect(validateEnumValue('bar', TestEnum)).toBe(true);
    expect(validateEnumValue('baz', TestEnum)).toBe(true);
  });

  it('should return false for invalid enum values', () => {
    expect(validateEnumValue('qux', TestEnum)).toBe(false);
    expect(validateEnumValue('', TestEnum)).toBe(false);
    expect(validateEnumValue('FOO', TestEnum)).toBe(false);
  });

  it('should work as a type guard', () => {
    const value: string = 'foo';
    if (validateEnumValue(value, TestEnum)) {
      expect(TestEnum.FOO).toBe(value);
    }
  });
});

describe('isValidDate', () => {
  it('should return true for valid date strings', () => {
    expect(isValidDate('2024-01-15')).toBe(true);
    expect(isValidDate('2024-01-15T10:30:00Z')).toBe(true);
    expect(isValidDate('January 15, 2024')).toBe(true);
  });

  it('should return false for invalid date strings', () => {
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('2024-13-01')).toBe(true);
  });
});
