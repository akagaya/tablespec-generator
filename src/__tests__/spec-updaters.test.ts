import { describe, it, expect } from 'vitest';
import { mapTable, propagateColumnChange, propagateTableChange } from '../store/spec-updaters';
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

describe('propagateTableChange', () => {
  it('renames referenceTable', () => {
    const spec = mapTable(base(), 't-users', (t) => ({ ...t, name: 'members' }));
    const result = propagateTableChange(spec, 'users', 'members');
    expect(result.tables[1].foreignKeys[0].referenceTable).toBe('members');
  });

  it('clears references to a removed table', () => {
    const spec = base();
    const next = { ...spec, tables: spec.tables.filter((t) => t.id !== 't-users') };
    const result = propagateTableChange(next, 'users', null);
    expect(result.tables[0].foreignKeys[0]).toMatchObject({ referenceTable: '', referenceColumns: [] });
  });
});
