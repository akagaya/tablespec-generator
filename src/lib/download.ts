import { saveAs } from 'file-saver';
import type { ExportResult } from '../types/exporter';

export function downloadResults(results: ExportResult[]): void {
  for (const result of results) {
    saveAs(new Blob([result.content], { type: 'text/plain;charset=utf-8' }), result.filename);
  }
}
