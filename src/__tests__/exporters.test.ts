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
