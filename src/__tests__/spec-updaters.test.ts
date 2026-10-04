import { describe, it, expect } from 'vitest';
import { clearTableReferences, mapTable, propagateColumnChange } from '../store/spec-updaters';
import { migrateReferenceTables } from '../lib/references';
import { buildFixtureSpec } from './fixtures';

const base = () => buildFixtureSpec('mariadb', '11.4');

const renameColumn = (tableId: string, columnId: string, name: string) => {
  const spec = base();
  const oldName = spec.tables.find((t) => t.id === tableId)!.columns.find((c) => c.id === columnId)!.name;
  const next = mapTable(spec, tableId, (t) => ({
    ...t,
    columns: t.columns.map((c) => (c.id === columnId ? { ...c, name } : c)),
  }));
  return propagateColumnChange(next, tableId, oldName, name);
};

describe('propagateColumnChange', () => {
  it('renames referenced column in own FK and index', () => {
    const spec = renameColumn('t-posts', 'p2', 'author_id');
    const posts = spec.tables[1];
    expect(posts.foreignKeys[0].columns).toEqual(['author_id']);
    expect(posts.indexes[0].columns).toEqual(['author_id', 'id']);
  });

  it('renames referenceColumns in other tables pointing to this table', () => {
    const spec = renameColumn('t-users', 'c1', 'user_id');
    expect(spec.tables[1].foreignKeys[0].referenceColumns).toEqual(['user_id']);
  });

  it('removes deleted column from references', () => {
    const spec = base();
    const next = mapTable(spec, 't-posts', (t) => ({ ...t, columns: t.columns.filter((c) => c.id !== 'p2') }));
    const result = propagateColumnChange(next, 't-posts', 'user_id', null);
    expect(result.tables[1].foreignKeys[0]).toMatchObject({ columns: [], referenceColumns: [] });
    expect(result.tables[1].indexes[0].columns).toEqual(['id']);
  });

  it('removes the FK pair when a referenced column is deleted', () => {
    const spec = base();
    const next = mapTable(spec, 't-users', (t) => ({ ...t, columns: t.columns.filter((c) => c.id !== 'c1') }));
    const result = propagateColumnChange(next, 't-users', 'id', null);
    expect(result.tables[1].foreignKeys[0]).toMatchObject({ columns: [], referenceColumns: [] });
  });

  it('keeps references while another column still has the old name', () => {
    const spec = base();
    // users に id を重複させる
    spec.tables[0].columns.push({ ...spec.tables[0].columns[0], id: 'dup' });
    const result = propagateColumnChange(spec, 't-users', 'id', 'renamed');
    expect(result).toBe(spec);
  });
});

describe('table references (by id)', () => {
  it('keeps FK references intact when the referenced table is renamed', () => {
    const spec = mapTable(base(), 't-users', (t) => ({ ...t, name: 'members' }));
    expect(spec.tables[1].foreignKeys[0].referenceTable).toBe('t-users');
  });

  it('clears references to a removed table', () => {
    const spec = base();
    const next = clearTableReferences({ ...spec, tables: spec.tables.filter((t) => t.id !== 't-users') }, 't-users');
    expect(next.tables[0].foreignKeys[0]).toMatchObject({ referenceTable: '', referenceColumns: [] });
  });

  it('migrates legacy name references to ids', () => {
    const spec = base();
    spec.tables[1].foreignKeys[0].referenceTable = 'users';
    expect(migrateReferenceTables(spec).tables[1].foreignKeys[0].referenceTable).toBe('t-users');
  });

  it('leaves id references and unknown names untouched', () => {
    const spec = base();
    expect(migrateReferenceTables(spec)).toBe(spec);
    spec.tables[1].foreignKeys[0].referenceTable = 'missing';
    expect(migrateReferenceTables(spec).tables[1].foreignKeys[0].referenceTable).toBe('missing');
  });
});
