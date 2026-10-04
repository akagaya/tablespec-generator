import { describe, it, expect, beforeAll } from 'vitest';
import { exporterRegistry, registerBuiltinExporters } from '../exporters';
import { buildFixtureSpec } from './fixtures';
import { PROFILES } from '../data/column-types';
import { createColumn, createForeignKey, createTable } from '../types/tablespec';

const engines = [
  ['mariadb', '11.4'],
  ['mysql', '8.4'],
  ['postgresql', '16'],
  ['sqlite', '3'],
] as const;

beforeAll(() => {
  registerBuiltinExporters();
});

describe('builtin exporters', () => {
  for (const [engine, version] of engines) {
    describe(engine, () => {
      const spec = buildFixtureSpec(engine, version);
      for (const id of ['json', 'sql', 'prisma', 'drizzle', 'laravel', 'rails', 'django', 'mermaid']) {
        it(id, () => {
          const exporter = exporterRegistry.get(id);
          expect(exporter).toBeDefined();
          expect(exporter!.generate(spec)).toMatchSnapshot();
        });
      }
    });
  }
});

describe('sql exporter details', () => {
  it('emits ENUM values, precision-only sizes and generated constraint names', () => {
    const spec = buildFixtureSpec('mysql', '8.4');
    const users = spec.tables[0];
    users.columns.push(
      { id: 'e1', name: 'role', type: 'ENUM', enumValues: ['admin', "o'brien"], nullable: false, primaryKey: false, unique: false, autoIncrement: false, unsigned: false, comment: '' },
      { id: 'e2', name: 'ratio', type: 'DECIMAL', precision: 5, scale: 0, nullable: false, primaryKey: false, unique: false, autoIncrement: false, unsigned: false, comment: '' },
    );
    users.indexes[0].name = '';
    spec.tables[1].foreignKeys[0].name = '';

    const sql = exporterRegistry.get('sql')!.generate(spec);
    const content = Array.isArray(sql) ? sql[0].content : sql.content;
    expect(content).toContain("`role` ENUM('admin', 'o''brien') NOT NULL");
    expect(content).toContain('`ratio` DECIMAL(5, 0) NOT NULL');
    expect(content).toContain('CREATE INDEX `idx_users_nickname` ON `users`');
    expect(content).toContain('ADD CONSTRAINT `fk_posts_user_id` FOREIGN KEY');
  });
});

describe('foreign key references', () => {
  const generate = (id: string, spec: ReturnType<typeof buildFixtureSpec>) => {
    const result = exporterRegistry.get(id)!.generate(spec);
    return Array.isArray(result) ? result.map((r) => r.content).join('\n') : result.content;
  };

  it('follows the referenced table after it is renamed', () => {
    const spec = buildFixtureSpec('postgresql', '16');
    spec.tables[0].name = 'members';
    expect(generate('sql', spec)).toContain('REFERENCES "members" ("id")');
    expect(generate('mermaid', spec)).toContain('posts }o--|| members');
  });

  it('skips foreign keys whose reference cannot be resolved', () => {
    const spec = buildFixtureSpec('mariadb', '11.4');
    spec.tables[1].foreignKeys[0].referenceTable = '';
    for (const id of ['sql', 'laravel', 'rails', 'django', 'mermaid', 'drizzle']) {
      expect(generate(id, spec)).not.toMatch(/fk_posts_user|ForeignKey\(|add_foreign_key|->foreign\(|\}o--\|\||references\(/);
    }
  });
});

describe('drizzle exporter', () => {
  const generate = (spec: ReturnType<typeof buildFixtureSpec>) => {
    const result = exporterRegistry.get('drizzle')!.generate(spec);
    return Array.isArray(result) ? result[0].content : result.content;
  };

  /** 生成コード中で呼び出している関数がすべて import または宣言されていること */
  const undefinedCalls = (code: string) => {
    const imported = new Set(
      [...code.matchAll(/import \{ ([^}]+) \}/g)].flatMap((m) => m[1].split(',').map((s) => s.trim())),
    );
    const declared = new Set([...code.matchAll(/const (\w+) =/g)].map((m) => m[1]));
    const body = code.replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/`[^`]*`/g, '``');
    const called = new Set(
      [...body.matchAll(/(?<![.\w])([a-zA-Z_$][\w$]*)\(/g)].map((m) => m[1]).filter((n) => !['import'].includes(n)),
    );
    return [...called].filter((n) => !imported.has(n) && !declared.has(n));
  };

  for (const profile of PROFILES) {
    it(`uses only imported builders for every ${profile.label} type`, () => {
      const spec = buildFixtureSpec(profile.engine, profile.version);
      spec.tables.push(
        createTable({
          name: 'all_types',
          columns: profile.types.map((tc) =>
            createColumn({
              name: `c_${tc.name.toLowerCase().replace(/\s+/g, '_')}`,
              type: tc.name,
              length: tc.hasLength ? 20 : undefined,
              precision: tc.hasPrecision ? 10 : undefined,
              enumValues: tc.hasEnumValues ? ['a', 'b'] : undefined,
            }),
          ),
        }),
      );
      expect(undefinedCalls(generate(spec))).toEqual([]);
    });
  }

  it('emits composite primary keys, self references and quoted keys', () => {
    const spec = buildFixtureSpec('postgresql', '16');
    spec.tables.push(
      createTable({
        id: 't-tree',
        name: 'index',
        columns: [
          createColumn({ name: 'tenant', type: 'INTEGER', primaryKey: true }),
          createColumn({ name: 'id', type: 'INTEGER', primaryKey: true }),
          createColumn({ name: 'parent-id', type: 'INTEGER', nullable: true }),
        ],
        foreignKeys: [
          createForeignKey({ columns: ['tenant', 'parent-id'], referenceTable: 't-tree', referenceColumns: ['tenant', 'id'] }),
        ],
      }),
    );
    const code = generate(spec);
    expect(code).toContain("export const indexTable = pgTable('index', {");
    expect(code).toContain("tenant: integer('tenant').notNull(),");
    expect(code).toContain('primaryKey({ columns: [t.tenant, t.id] })');
    expect(code).toContain("columns: [t.tenant, t['parent-id']], foreignColumns: [t.tenant, t.id]");
    expect(undefinedCalls(code)).toEqual([]);
  });
});
