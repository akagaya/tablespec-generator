import type { TableSpec } from '../types/tablespec';

export function buildFixtureSpec(engine: TableSpec['database']['engine'], version: string): TableSpec {
  return {
    version: '1.0.0',
    projectName: 'Fixture',
    database: { engine, version, charset: 'utf8mb4' },
    tables: [
      {
        id: 't-users',
        name: 'users',
        comment: "User's table",
        columns: [
          { id: 'c1', name: 'id', type: 'BIGINT', nullable: false, primaryKey: true, unique: false, autoIncrement: true, unsigned: true, comment: '' },
          { id: 'c2', name: 'email', type: 'VARCHAR', length: 255, nullable: false, primaryKey: false, unique: true, autoIncrement: false, unsigned: false, comment: 'Mail address' },
          { id: 'c3', name: 'nickname', type: 'VARCHAR', length: 50, nullable: true, primaryKey: false, unique: false, autoIncrement: false, unsigned: false, default: 'guest', comment: '' },
          { id: 'c4', name: 'balance', type: 'DECIMAL', precision: 10, scale: 2, nullable: false, primaryKey: false, unique: false, autoIncrement: false, unsigned: false, default: 0, comment: '' },
          { id: 'c5', name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, unique: false, autoIncrement: false, unsigned: false, default: { expression: 'CURRENT_TIMESTAMP' }, comment: '' },
          { id: 'c6', name: 'active', type: 'BOOLEAN', nullable: false, primaryKey: false, unique: false, autoIncrement: false, unsigned: false, default: true, comment: '' },
        ],
        indexes: [{ id: 'i1', name: 'idx_users_nickname', columns: ['nickname'], unique: false }],
        foreignKeys: [],
      },
      {
        id: 't-posts',
        name: 'posts',
        comment: '',
        columns: [
          { id: 'p1', name: 'id', type: 'INT', nullable: false, primaryKey: true, unique: false, autoIncrement: true, unsigned: false, comment: '' },
          { id: 'p2', name: 'user_id', type: 'BIGINT', nullable: false, primaryKey: false, unique: false, autoIncrement: false, unsigned: true, comment: '' },
          { id: 'p3', name: 'body', type: 'TEXT', nullable: true, primaryKey: false, unique: false, autoIncrement: false, unsigned: false, comment: '' },
        ],
        indexes: [{ id: 'i2', name: 'uq_posts_user', columns: ['user_id', 'id'], unique: true }],
        foreignKeys: [
          { id: 'f1', name: 'fk_posts_user', columns: ['user_id'], referenceTable: 't-users', referenceColumns: ['id'], onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
        ],
      },
    ],
  };
}
