import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TableSpec,
  Table,
  Column,
  Index,
  ForeignKey,
  DatabaseEngine,
} from '../types/tablespec';
import {
  createDefaultSpec,
  createTable,
  createColumn,
  createIndex,
  createForeignKey,
} from '../types/tablespec';
import { getDefaultType } from '../data/column-types';

interface ProjectState {
  spec: TableSpec;
  selectedTableId: string | null;

  // Project / Database
  setProjectName: (name: string) => void;
  setDatabase: (engine: DatabaseEngine, version: string) => void;

  // Tables
  addTable: () => void;
  removeTable: (id: string) => void;
  updateTableName: (id: string, name: string) => void;
  updateTableComment: (id: string, comment: string) => void;
  selectTable: (id: string | null) => void;

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

function updateTableInSpec(spec: TableSpec, tableId: string, updater: (table: Table) => Table): TableSpec {
  return {
    ...spec,
    tables: spec.tables.map((t) => (t.id === tableId ? updater(t) : t)),
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      spec: createDefaultSpec(),
      selectedTableId: null,

      setProjectName: (name) =>
        set((state) => ({
          spec: {
            ...state.spec,
            projectName: name,
          },
        })),

      setDatabase: (engine, version) =>
        set((state) => ({
          spec: {
            ...state.spec,
            database: { ...state.spec.database, engine, version },
          },
        })),

      addTable: () =>
        set((state) => {
          const newTable = createTable({
            name: `table_${state.spec.tables.length + 1}`,
            columns: [
              createColumn({
                name: 'id',
                type: getDefaultType(state.spec.database.engine, state.spec.database.version),
                primaryKey: true,
                autoIncrement: true,
              }),
            ],
          });
          return {
            spec: {
              ...state.spec,
              tables: [...state.spec.tables, newTable],
            },
            selectedTableId: newTable.id,
          };
        }),

      removeTable: (id) =>
        set((state) => ({
          spec: {
            ...state.spec,
            tables: state.spec.tables.filter((t) => t.id !== id),
          },
          selectedTableId:
            state.selectedTableId === id ? null : state.selectedTableId,
        })),

      updateTableName: (id, name) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, id, (t) => ({ ...t, name })),
        })),

      updateTableComment: (id, comment) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, id, (t) => ({ ...t, comment })),
        })),

      selectTable: (id) => set({ selectedTableId: id }),

      addColumn: (tableId) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            columns: [
              ...t.columns,
              createColumn({
                name: `column_${t.columns.length + 1}`,
                type: getDefaultType(state.spec.database.engine, state.spec.database.version),
              }),
            ],
          })),
        })),

      removeColumn: (tableId, columnId) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            columns: t.columns.filter((c) => c.id !== columnId),
          })),
        })),

      updateColumn: (tableId, columnId, updates) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            columns: t.columns.map((c) =>
              c.id === columnId ? { ...c, ...updates } : c
            ),
          })),
        })),

      addIndex: (tableId) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            indexes: [...t.indexes, createIndex()],
          })),
        })),

      removeIndex: (tableId, indexId) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            indexes: t.indexes.filter((i) => i.id !== indexId),
          })),
        })),

      updateIndex: (tableId, indexId, updates) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            indexes: t.indexes.map((i) =>
              i.id === indexId ? { ...i, ...updates } : i
            ),
          })),
        })),

      addForeignKey: (tableId) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            foreignKeys: [...t.foreignKeys, createForeignKey()],
          })),
        })),

      removeForeignKey: (tableId, fkId) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            foreignKeys: t.foreignKeys.filter((fk) => fk.id !== fkId),
          })),
        })),

      updateForeignKey: (tableId, fkId, updates) =>
        set((state) => ({
          spec: updateTableInSpec(state.spec, tableId, (t) => ({
            ...t,
            foreignKeys: t.foreignKeys.map((fk) =>
              fk.id === fkId ? { ...fk, ...updates } : fk
            ),
          })),
        })),

      importSpec: (spec) => set({ spec, selectedTableId: null }),

      resetSpec: () =>
        set({ spec: createDefaultSpec(), selectedTableId: null }),
    }),
    {
      name: 'tablespec-project',
    }
  )
);
