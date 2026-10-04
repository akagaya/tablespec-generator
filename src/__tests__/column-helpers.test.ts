import { describe, it, expect } from 'vitest';
import { formatDefault, parseDefault } from '../lib/column-default';
import { typeChangeUpdates } from '../lib/column-type';
import { createColumn } from '../types/tablespec';

describe('column default', () => {
  it('treats empty input as no default', () => {
    expect(parseDefault('', false)).toBeUndefined();
    expect(parseDefault('', true)).toBeUndefined();
  });

  it('keeps expression defaults as expressions', () => {
    expect(parseDefault('NOW()', true)).toEqual({ expression: 'NOW()' });
    expect(formatDefault({ expression: 'NOW()' })).toBe('NOW()');
  });

  it('formats scalar defaults', () => {
    expect(formatDefault(0)).toBe('0');
    expect(formatDefault(false)).toBe('false');
    expect(formatDefault(null)).toBe('');
  });
});

describe('typeChangeUpdates', () => {
  it('drops size attributes unsupported by the new type', () => {
    const col = createColumn({ type: 'VARCHAR', length: 255, unsigned: true });
    expect(typeChangeUpdates(col, 'TEXT', { name: 'TEXT', category: 'String' })).toMatchObject({
      type: 'TEXT',
      length: undefined,
      unsigned: false,
    });
  });

  it('keeps attributes supported by the new type', () => {
    const col = createColumn({ type: 'INT', length: 11, unsigned: true });
    expect(
      typeChangeUpdates(col, 'BIGINT', { name: 'BIGINT', category: 'Integer', hasLength: true, hasUnsigned: true }),
    ).toMatchObject({ length: 11, unsigned: true });
  });
});
