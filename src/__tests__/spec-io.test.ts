import { describe, it, expect } from 'vitest';
import { parseSpec, SpecParseError } from '../lib/spec-io';
import { buildFixtureSpec } from './fixtures';

describe('parseSpec', () => {
  it('round-trips a valid spec', () => {
    const spec = buildFixtureSpec('postgresql', '16');
    expect(parseSpec(JSON.parse(JSON.stringify(spec)))).toEqual(spec);
  });

  it('fills missing optional fields', () => {
    const spec = parseSpec({
      version: '1.0.0',
      database: { engine: 'sqlite', version: '3' },
      tables: [{ name: 'a', columns: [{ name: 'id', type: 'INTEGER' }] }],
    });
    const table = spec.tables[0];
    expect(table.id).toBeTruthy();
    expect(table.indexes).toEqual([]);
    expect(table.foreignKeys).toEqual([]);
    expect(table.columns[0]).toMatchObject({ nullable: false, primaryKey: false, comment: '' });
  });

  it('drops invalid enum values', () => {
    const spec = parseSpec({
      database: { engine: 'mysql', version: '8.4' },
      tables: [
        {
          name: 'a',
          columns: [],
          indexes: [{ columns: ['x'], type: 'bogus' }],
          foreignKeys: [{ columns: ['x'], referenceTable: 'b', referenceColumns: ['y'], onDelete: 'EXPLODE' }],
        },
      ],
    });
    expect(spec.tables[0].indexes[0].type).toBeUndefined();
    expect(spec.tables[0].foreignKeys[0].onDelete).toBeUndefined();
  });

  it.each([null, [], {}, { database: {}, tables: [] }, { database: { engine: 'oracle' }, tables: [] }])(
    'rejects malformed input %#',
    (input) => {
      expect(() => parseSpec(input)).toThrow(SpecParseError);
    },
  );
});
