import { exporterRegistry } from './registry';
import { jsonExporter } from './json-exporter';
import { sqlExporter } from './sql/sql-exporter';
import { prismaExporter } from './prisma-exporter';
import { drizzleExporter } from './drizzle-exporter';
import { laravelExporter } from './laravel-exporter';
import { railsExporter } from './rails-exporter';
import { djangoExporter } from './django-exporter';
import { mermaidExporter } from './mermaid-exporter';

export function registerBuiltinExporters(): void {
  exporterRegistry.register(jsonExporter);
  exporterRegistry.register(sqlExporter);
  exporterRegistry.register(prismaExporter);
  exporterRegistry.register(drizzleExporter);
  exporterRegistry.register(laravelExporter);
  exporterRegistry.register(railsExporter);
  exporterRegistry.register(djangoExporter);
  exporterRegistry.register(mermaidExporter);
}

export { exporterRegistry };
