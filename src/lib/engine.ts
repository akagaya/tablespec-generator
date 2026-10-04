import type { DatabaseEngine } from '../types/tablespec';

/** MariaDB と MySQL は SQL 方言・ORM プロバイダが共通 */
export function isMysqlFamily(engine: DatabaseEngine): boolean {
  return engine === 'mariadb' || engine === 'mysql';
}
