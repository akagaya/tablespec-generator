# TableSpec Schema Specification v1.0.0

TableSpec は、データベーステーブル構造を記述するための JSON スキーマ仕様である。
本仕様に準拠した JSON ファイルは、SQL・各種マイグレーションファイルへの変換元として利用される。

## Schema URI

```
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://tablespec.dev/schema/v1.0.0
```

---

## ルートオブジェクト

| Property   | Type     | Required | Description                     |
|------------|----------|----------|---------------------------------|
| `version`     | `string` | ✓        | スキーマバージョン（`"1.0.0"`）  |
| `projectName` | `string` |          | プロジェクト名                   |
| `database`    | `object` | ✓        | データベースエンジン設定          |
| `tables`      | `array`  | ✓        | テーブル定義の配列               |

### 例

```json
{
  "version": "1.0.0",
  "database": {
    "engine": "postgresql",
    "charset": "utf8mb4",
    "collation": "utf8mb4_unicode_ci"
  },
  "tables": []
}
```

---

## `database` オブジェクト

| Property    | Type     | Required | Description                            |
|-------------|----------|----------|----------------------------------------|
| `engine`    | `string` | ✓        | `"mariadb"` \| `"postgresql"` \| `"sqlite"` |
| `charset`   | `string` |          | デフォルト文字セット（MariaDB向け）       |
| `collation` | `string` |          | デフォルト照合順序（MariaDB向け）         |

---

## `table` オブジェクト

`tables` 配列の各要素。

| Property      | Type     | Required | Description              |
|---------------|----------|----------|--------------------------|
| `id`          | `string` | ✓        | UUID v4。内部参照用の一意識別子 |
| `name`        | `string` | ✓        | テーブル名。`^[a-zA-Z_][a-zA-Z0-9_]*$` に合致すること |
| `comment`     | `string` |          | テーブルコメント            |
| `columns`     | `array`  | ✓        | カラム定義の配列（1件以上）  |
| `indexes`     | `array`  |          | インデックス定義の配列       |
| `foreignKeys` | `array`  |          | 外部キー定義の配列          |

---

## `column` オブジェクト

`columns` 配列の各要素。

| Property        | Type      | Required | Default | Description                              |
|-----------------|-----------|----------|---------|------------------------------------------|
| `id`            | `string`  | ✓        |         | UUID v4。内部参照用の一意識別子             |
| `name`          | `string`  | ✓        |         | カラム名。`^[a-zA-Z_][a-zA-Z0-9_]*$` に合致すること |
| `type`          | `string`  | ✓        |         | データ型（対象DBに依存。後述の型一覧を参照） |
| `length`        | `integer` |          |         | 文字列長・表示幅（`>= 1`）                 |
| `precision`     | `integer` |          |         | 数値精度（`>= 0`）                         |
| `scale`         | `integer` |          |         | 小数点以下桁数（`>= 0`）                   |
| `nullable`      | `boolean` |          | `false` | NULL 許容                                 |
| `primaryKey`    | `boolean` |          | `false` | 主キー                                    |
| `unique`        | `boolean` |          | `false` | ユニーク制約                               |
| `autoIncrement` | `boolean` |          | `false` | 自動インクリメント                          |
| `unsigned`      | `boolean` |          | `false` | 符号なし（MariaDB向け）                     |
| `default`       | `any`     |          |         | デフォルト値。リテラル値または `{"expression": "NOW()"}` 形式 |
| `comment`       | `string`  |          |         | カラムコメント                              |
| `enumValues`    | `array`   |          |         | ENUM/SET 型の場合の選択肢（`string[]`）     |

### `default` の値表現

| パターン                           | 意味                     |
|-----------------------------------|--------------------------|
| `"hello"`                         | 文字列リテラル             |
| `42`                              | 数値リテラル               |
| `true` / `false`                  | 真偽値リテラル             |
| `null`                            | NULL                      |
| `{"expression": "NOW()"}`         | SQL 式（関数呼び出し等）    |
| `{"expression": "gen_random_uuid()"}` | SQL 式（PostgreSQL関数）|

---

## `index` オブジェクト

`indexes` 配列の各要素。

| Property  | Type      | Required | Default | Description                                   |
|-----------|-----------|----------|---------|-----------------------------------------------|
| `id`      | `string`  | ✓        |         | UUID v4                                        |
| `name`    | `string`  |          |         | インデックス名（省略時は自動生成）               |
| `columns` | `array`   | ✓        |         | 対象カラム名の配列（1件以上、`string[]`）        |
| `unique`  | `boolean` |          | `false` | ユニークインデックスか否か                       |
| `type`    | `string`  |          |         | `"btree"` \| `"hash"` \| `"gin"` \| `"gist"` \| `"brin"`。DBエンジンにより利用可否が異なる |

---

## `foreignKey` オブジェクト

`foreignKeys` 配列の各要素。

| Property           | Type     | Required | Description                                                        |
|--------------------|----------|----------|--------------------------------------------------------------------|
| `id`               | `string` | ✓        | UUID v4                                                             |
| `name`             | `string` |          | 外部キー制約名（省略時は自動生成）                                    |
| `columns`          | `array`  | ✓        | 参照元カラム名の配列（1件以上、`string[]`）                           |
| `referenceTable`   | `string` | ✓        | 参照先テーブルの `id`                                                |
| `referenceColumns` | `array`  | ✓        | 参照先カラム名の配列（`columns` と同数、`string[]`）                  |
| `onDelete`         | `string` |          | `"CASCADE"` \| `"SET NULL"` \| `"SET DEFAULT"` \| `"RESTRICT"` \| `"NO ACTION"` |
| `onUpdate`         | `string` |          | `"CASCADE"` \| `"SET NULL"` \| `"SET DEFAULT"` \| `"RESTRICT"` \| `"NO ACTION"` |

---

## DBエンジン別データ型一覧

### MariaDB

| Category  | Types |
|-----------|-------|
| Integer   | `TINYINT`, `SMALLINT`, `MEDIUMINT`, `INT`, `BIGINT` |
| Decimal   | `FLOAT`, `DOUBLE`, `DECIMAL` |
| String    | `CHAR`, `VARCHAR`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT` |
| Binary    | `BINARY`, `VARBINARY`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB` |
| Date/Time | `DATE`, `DATETIME`, `TIMESTAMP`, `TIME`, `YEAR` |
| Other     | `BOOLEAN`, `ENUM`, `SET`, `JSON` |

### PostgreSQL

| Category  | Types |
|-----------|-------|
| Integer   | `SMALLINT`, `INTEGER`, `BIGINT` |
| Serial    | `SMALLSERIAL`, `SERIAL`, `BIGSERIAL` |
| Decimal   | `REAL`, `DOUBLE PRECISION`, `NUMERIC` |
| String    | `CHAR`, `VARCHAR`, `TEXT` |
| Binary    | `BYTEA` |
| Date/Time | `DATE`, `TIMESTAMP`, `TIMESTAMPTZ`, `TIME`, `TIMETZ`, `INTERVAL` |
| Boolean   | `BOOLEAN` |
| UUID      | `UUID` |
| JSON      | `JSON`, `JSONB` |
| Network   | `INET`, `CIDR`, `MACADDR` |
| Array     | `ARRAY` |

### SQLite

| Category  | Types |
|-----------|-------|
| Affinity  | `INTEGER`, `REAL`, `TEXT`, `BLOB`, `NUMERIC` |

> [!NOTE]
> SQLite は型アフィニティに基づく動的型システムのため、型名は参考値として扱われる。

---

## 完全な JSON Schema 定義

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tablespec.dev/schema/v1.0.0",
  "title": "TableSpec",
  "description": "Database table structure specification",
  "type": "object",
  "required": ["version", "database", "tables"],
  "additionalProperties": false,
  "properties": {
    "version": {
      "type": "string",
      "const": "1.0.0",
      "description": "Schema version"
    },
    "database": {
      "$ref": "#/$defs/database"
    },
    "tables": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/table"
      },
      "description": "Array of table definitions"
    }
  },
  "$defs": {
    "database": {
      "type": "object",
      "required": ["engine"],
      "additionalProperties": false,
      "properties": {
        "engine": {
          "type": "string",
          "enum": ["mariadb", "postgresql", "sqlite"],
          "description": "Target database engine"
        },
        "charset": {
          "type": "string",
          "description": "Default character set"
        },
        "collation": {
          "type": "string",
          "description": "Default collation"
        }
      }
    },
    "table": {
      "type": "object",
      "required": ["id", "name", "columns"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Unique identifier for internal reference"
        },
        "name": {
          "type": "string",
          "pattern": "^[a-zA-Z_][a-zA-Z0-9_]*$",
          "description": "Table name"
        },
        "comment": {
          "type": "string",
          "description": "Table comment"
        },
        "columns": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/column"
          },
          "minItems": 1,
          "description": "Column definitions (at least one)"
        },
        "indexes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/index"
          },
          "default": [],
          "description": "Index definitions"
        },
        "foreignKeys": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/foreignKey"
          },
          "default": [],
          "description": "Foreign key definitions"
        }
      }
    },
    "column": {
      "type": "object",
      "required": ["id", "name", "type"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Unique identifier for internal reference"
        },
        "name": {
          "type": "string",
          "pattern": "^[a-zA-Z_][a-zA-Z0-9_]*$",
          "description": "Column name"
        },
        "type": {
          "type": "string",
          "description": "Data type (engine-dependent)"
        },
        "length": {
          "type": "integer",
          "minimum": 1,
          "description": "Character length or display width"
        },
        "precision": {
          "type": "integer",
          "minimum": 0,
          "description": "Numeric precision"
        },
        "scale": {
          "type": "integer",
          "minimum": 0,
          "description": "Numeric scale"
        },
        "nullable": {
          "type": "boolean",
          "default": false,
          "description": "Whether NULL is allowed"
        },
        "primaryKey": {
          "type": "boolean",
          "default": false,
          "description": "Whether this column is a primary key"
        },
        "unique": {
          "type": "boolean",
          "default": false,
          "description": "Whether this column has a unique constraint"
        },
        "autoIncrement": {
          "type": "boolean",
          "default": false,
          "description": "Whether this column auto-increments"
        },
        "unsigned": {
          "type": "boolean",
          "default": false,
          "description": "Whether this column is unsigned (MariaDB)"
        },
        "default": {
          "oneOf": [
            { "type": "string" },
            { "type": "number" },
            { "type": "boolean" },
            { "type": "null" },
            {
              "type": "object",
              "required": ["expression"],
              "additionalProperties": false,
              "properties": {
                "expression": {
                  "type": "string",
                  "description": "SQL expression for default value"
                }
              }
            }
          ],
          "description": "Default value (literal or SQL expression)"
        },
        "comment": {
          "type": "string",
          "description": "Column comment"
        },
        "enumValues": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1,
          "description": "Allowed values for ENUM/SET types"
        }
      }
    },
    "index": {
      "type": "object",
      "required": ["id", "columns"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Unique identifier"
        },
        "name": {
          "type": "string",
          "description": "Index name (auto-generated if omitted)"
        },
        "columns": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1,
          "description": "Column names included in the index"
        },
        "unique": {
          "type": "boolean",
          "default": false,
          "description": "Whether this is a unique index"
        },
        "type": {
          "type": "string",
          "enum": ["btree", "hash", "gin", "gist", "brin"],
          "description": "Index type (engine-dependent)"
        }
      }
    },
    "foreignKey": {
      "type": "object",
      "required": ["id", "columns", "referenceTable", "referenceColumns"],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Unique identifier"
        },
        "name": {
          "type": "string",
          "description": "Constraint name (auto-generated if omitted)"
        },
        "columns": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1,
          "description": "Source column names"
        },
        "referenceTable": {
          "type": "string",
          "description": "Referenced table ID"
        },
        "referenceColumns": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1,
          "description": "Referenced column names"
        },
        "onDelete": {
          "type": "string",
          "enum": ["CASCADE", "SET NULL", "SET DEFAULT", "RESTRICT", "NO ACTION"],
          "description": "Action on delete"
        },
        "onUpdate": {
          "type": "string",
          "enum": ["CASCADE", "SET NULL", "SET DEFAULT", "RESTRICT", "NO ACTION"],
          "description": "Action on update"
        }
      }
    }
  }
}
```

---

## サンプルデータ

```json
{
  "version": "1.0.0",
  "database": {
    "engine": "postgresql"
  },
  "tables": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "users",
      "comment": "ユーザーマスタ",
      "columns": [
        {
          "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          "name": "id",
          "type": "BIGSERIAL",
          "primaryKey": true
        },
        {
          "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
          "name": "name",
          "type": "VARCHAR",
          "length": 255,
          "nullable": false
        },
        {
          "id": "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
          "name": "email",
          "type": "VARCHAR",
          "length": 255,
          "nullable": false,
          "unique": true
        },
        {
          "id": "6ba7b813-9dad-11d1-80b4-00c04fd430c8",
          "name": "created_at",
          "type": "TIMESTAMPTZ",
          "nullable": false,
          "default": { "expression": "NOW()" }
        }
      ],
      "indexes": [
        {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "name": "idx_users_email",
          "columns": ["email"],
          "unique": true,
          "type": "btree"
        }
      ],
      "foreignKeys": []
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "posts",
      "comment": "投稿",
      "columns": [
        {
          "id": "8a9b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
          "name": "id",
          "type": "BIGSERIAL",
          "primaryKey": true
        },
        {
          "id": "8a9b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4e",
          "name": "user_id",
          "type": "BIGINT",
          "nullable": false
        },
        {
          "id": "8a9b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4f",
          "name": "title",
          "type": "VARCHAR",
          "length": 255,
          "nullable": false
        },
        {
          "id": "8a9b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c50",
          "name": "body",
          "type": "TEXT",
          "nullable": true
        }
      ],
      "indexes": [],
      "foreignKeys": [
        {
          "id": "9f8e7d6c-5b4a-3928-1716-0f5e4d3c2b1a",
          "name": "fk_posts_user_id",
          "columns": ["user_id"],
          "referenceTable": "550e8400-e29b-41d4-a716-446655440000",
          "referenceColumns": ["id"],
          "onDelete": "CASCADE",
          "onUpdate": "CASCADE"
        }
      ]
    }
  ]
}
```
