import { describe, it, expect, beforeAll } from 'vitest';
import { exporterRegistry, registerBuiltinExporters } from '../exporters';
import { buildFixtureSpec } from './fixtures';

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
