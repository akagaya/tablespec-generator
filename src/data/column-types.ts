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
  /** `${engine}:${version}` */
  id: string;
  engine: DatabaseEngine;
  version: string;
  label: string;
  defaultType: string;
  types: ColumnTypeInfo[];
}

// ViteのGlobインポートで ./types/ 配下のすべてのJSONをビルド時に収集
const profileModules = import.meta.glob<DbProfile>('./types/*.json', { eager: true, import: 'default' });

export const PROFILES: DbProfile[] = Object.values(profileModules)
  // エンジン順、バージョンは降順でソート
  .sort((a, b) => a.engine.localeCompare(b.engine) || b.version.localeCompare(a.version, undefined, { numeric: true }));

export function getDbProfile(engine: DatabaseEngine, version: string): DbProfile | undefined {
  return PROFILES.find(p => p.engine === engine && p.version === version);
}

export function getSupportedVersions(engine: DatabaseEngine): DbProfile[] {
  return PROFILES.filter(p => p.engine === engine);
}

/** 指定バージョンのプロファイルが無い場合は同エンジンの最新版を返す */
export function resolveDbProfile(engine: DatabaseEngine, version: string): DbProfile | undefined {
  return getDbProfile(engine, version) ?? getSupportedVersions(engine)[0];
}

export function getColumnTypes(engine: DatabaseEngine, version: string): ColumnTypeInfo[] {
  return getDbProfile(engine, version)?.types ?? [];
}

export function getDefaultType(engine: DatabaseEngine, version: string): string {
  return getDbProfile(engine, version)?.defaultType ?? 'INT';
}

/** PROFILES をエンジンごとにグループ化（表示順を維持） */
export function groupProfilesByEngine(): [DatabaseEngine, DbProfile[]][] {
  const groups = new Map<DatabaseEngine, DbProfile[]>();
  for (const profile of PROFILES) {
    groups.set(profile.engine, [...(groups.get(profile.engine) ?? []), profile]);
  }
  return Array.from(groups);
}
