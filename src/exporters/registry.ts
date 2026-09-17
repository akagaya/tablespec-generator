import type { Exporter } from '../types/exporter';

class ExporterRegistry {
  private exporters: Map<string, Exporter> = new Map();

  register(exporter: Exporter): void {
    this.exporters.set(exporter.id, exporter);
  }

  unregister(id: string): void {
    this.exporters.delete(id);
  }

  get(id: string): Exporter | undefined {
    return this.exporters.get(id);
  }

  getAll(): Exporter[] {
    return Array.from(this.exporters.values());
  }
}

export const exporterRegistry = new ExporterRegistry();
