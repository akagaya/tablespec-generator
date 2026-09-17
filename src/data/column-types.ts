/// <reference types="vite/client" />
import type { DatabaseEngine } from '../types/tablespec';

export interface ColumnTypeInfo {
  name: string;
  category: string;
  hasLength?: boolean;
  hasPrecision?: boolean;
  hasScale?: boolean;
  hasUnsigned?: boolean;
  hasEnumValues?: boolean;
}

export interface DbProfile {
  id: string;
  engine: DatabaseEngine;
  version: string;
  label: string;
  defaultType: string;
  types: ColumnTypeInfo[];
}

// ViteのGlobインポートで ./types/ 配下のすべてのJSONをビルド時に収集
const profileModules = import.meta.glob('./types/*.json', { eager: true });

export const PROFILES: DbProfile[] = Object.values(profileModules)
  .map((mod: any) => mod.default || mod)
  // エンジン順、バージョンは降順でソート
  .sort((a, b) => a.engine.localeCompare(b.engine) || b.version.localeCompare(a.version, undefined, { numeric: true }));

export function getDbProfile(engine: DatabaseEngine, version: string): DbProfile | undefined {
  return PROFILES.find(p => p.engine === engine && p.version === version);
}

export function getColumnTypes(engine: DatabaseEngine, version: string): ColumnTypeInfo[] {
  const profile = getDbProfile(engine, version);
  return profile ? profile.types : [];
}

export function getDefaultType(engine: DatabaseEngine, version: string): string {
  const profile = getDbProfile(engine, version);
  return profile ? profile.defaultType : 'INT';
}

export function getSupportedVersions(engine: DatabaseEngine): DbProfile[] {
  return PROFILES.filter(p => p.engine === engine);
}
