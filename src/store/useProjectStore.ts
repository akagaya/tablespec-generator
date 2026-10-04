import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TableSpec, Column, Index, ForeignKey, DatabaseEngine } from '../types/tablespec';
import {
  createDefaultSpec,
  createTable,
  createColumn,
  createIndex,
  createForeignKey,
} from '../types/tablespec';
import { getDefaultType, resolveDbProfile } from '../data/column-types';
import { mapTable, propagateColumnChange, propagateTableChange, replaceById } from './spec-updaters';

interface ProjectState {
  spec: TableSpec;

  // Project / Database
  setProjectName: (name: string) => void;
  setDatabase: (engine: DatabaseEngine, version: string) => void;

  // Tables（addTable は追加したテーブルの id を返す）
  addTable: () => string;
  removeTable: (id: string) => void;
  updateTableName: (id: string, name: string) => void;
  updateTableComment: (id: string, comment: string) => void;

  // Columns
  addColumn: (tableId: string) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  updateColumn: (tableId: string, columnId: string, updates: Partial<Column>) => void;

  // Indexes
  addIndex: (tableId: string) => void;
  removeIndex: (tableId: string, indexId: string) => void;
  updateIndex: (tableId: string, indexId: string, updates: Partial<Index>) => void;

  // Foreign Keys
  addForeignKey: (tableId: string) => void;
  removeForeignKey: (tableId: string, fkId: string) => void;
  updateForeignKey: (tableId: string, fkId: string, updates: Partial<ForeignKey>) => void;

  // Import/Export
  importSpec: (spec: TableSpec) => void;
  resetSpec: () => void;
}

function defaultTypeOf(spec: TableSpec): string {
  return getDefaultType(spec.database.engine, spec.database.version);
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      const updateSpec = (updater: (spec: TableSpec) => TableSpec) =>
        set((state) => ({ spec: updater(state.spec) }));

      return {
        spec: createDefaultSpec(),

        setProjectName: (projectName) => updateSpec((spec) => ({ ...spec, projectName })),

        setDatabase: (engine, version) =>
          updateSpec((spec) => ({ ...spec, database: { ...spec.database, engine, version } })),

        addTable: () => {
          const { spec } = get();
          const table = createTable({
            name: `table_${spec.tables.length + 1}`,
            columns: [
              createColumn({ name: 'id', type: defaultTypeOf(spec), primaryKey: true, autoIncrement: true }),
            ],
          });
          set({ spec: { ...spec, tables: [...spec.tables, table] } });
          return table.id;
        },

        removeTable: (id) =>
          updateSpec((spec) => {
            const target = spec.tables.find((t) => t.id === id);
            const next = { ...spec, tables: spec.tables.filter((t) => t.id !== id) };
            return target ? propagateTableChange(next, target.name, null) : next;
          }),

        updateTableName: (id, name) =>
          updateSpec((spec) => {
            const oldName = spec.tables.find((t) => t.id === id)?.name ?? '';
            return propagateTableChange(mapTable(spec, id, (t) => ({ ...t, name })), oldName, name);
          }),

        updateTableComment: (id, comment) => updateSpec((spec) => mapTable(spec, id, (t) => ({ ...t, comment }))),

        addColumn: (tableId) =>
          updateSpec((spec) =>
            mapTable(spec, tableId, (t) => ({
              ...t,
              columns: [...t.columns, createColumn({ name: `column_${t.columns.length + 1}`, type: defaultTypeOf(spec) })],
            })),
          ),

        removeColumn: (tableId, columnId) =>
          updateSpec((spec) => {
            const oldName = spec.tables.find((t) => t.id === tableId)?.columns.find((c) => c.id === columnId)?.name ?? '';
            const next = mapTable(spec, tableId, (t) => ({ ...t, columns: t.columns.filter((c) => c.id !== columnId) }));
            return propagateColumnChange(next, tableId, oldName, null);
          }),

        updateColumn: (tableId, columnId, updates) =>
          updateSpec((spec) => {
            const oldName = spec.tables.find((t) => t.id === tableId)?.columns.find((c) => c.id === columnId)?.name ?? '';
            const next = mapTable(spec, tableId, (t) => ({
              ...t,
              columns: replaceById(t.columns, columnId, (c) => ({ ...c, ...updates })),
            }));
            return updates.name === undefined ? next : propagateColumnChange(next, tableId, oldName, updates.name);
          }),

        addIndex: (tableId) =>
          updateSpec((spec) => mapTable(spec, tableId, (t) => ({ ...t, indexes: [...t.indexes, createIndex()] }))),

        removeIndex: (tableId, indexId) =>
          updateSpec((spec) =>
            mapTable(spec, tableId, (t) => ({ ...t, indexes: t.indexes.filter((i) => i.id !== indexId) })),
          ),

        updateIndex: (tableId, indexId, updates) =>
          updateSpec((spec) =>
            mapTable(spec, tableId, (t) => ({
              ...t,
              indexes: replaceById(t.indexes, indexId, (i) => ({ ...i, ...updates })),
            })),
          ),

        addForeignKey: (tableId) =>
          updateSpec((spec) =>
            mapTable(spec, tableId, (t) => ({ ...t, foreignKeys: [...t.foreignKeys, createForeignKey()] })),
          ),

        removeForeignKey: (tableId, fkId) =>
          updateSpec((spec) =>
            mapTable(spec, tableId, (t) => ({ ...t, foreignKeys: t.foreignKeys.filter((fk) => fk.id !== fkId) })),
          ),

        updateForeignKey: (tableId, fkId, updates) =>
          updateSpec((spec) =>
            mapTable(spec, tableId, (t) => ({
              ...t,
              foreignKeys: replaceById(t.foreignKeys, fkId, (fk) => ({ ...fk, ...updates })),
            })),
          ),

        importSpec: (spec) => {
          // 未対応バージョンは同エンジンの最新プロファイルへ寄せる
          const profile = resolveDbProfile(spec.database.engine, spec.database.version);
          const database = profile ? { ...spec.database, version: profile.version } : spec.database;
          set({ spec: { ...spec, database } });
        },

        resetSpec: () => set({ spec: createDefaultSpec() }),
      };
    },
    {
      name: 'tablespec-project',
      partialize: (state) => ({ spec: state.spec }),
    },
  ),
);
