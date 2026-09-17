# TableSpec Generator — Agent引き継ぎドキュメント

## プロジェクト概要

データベーステーブル構造を視覚的に設計し、各種スキーマ・マイグレーションファイルへエクスポートするブラウザ完結型 WebUI ツール。

- サーバ不要（SPA、LocalStorage で永続化）
- Docker Compose で開発・デプロイ

## 技術スタック

| Layer       | Technology              |
|-------------|-------------------------|
| Runtime     | Node.js 24 LTS         |
| Framework   | React 18 + TypeScript   |
| Build       | Vite 5                  |
| Styling     | Tailwind CSS 3          |
| State       | Zustand (persist middleware → localStorage) |
| Icons       | Lucide React            |
| File Export  | file-saver              |
| Container   | Docker (multi-stage) + nginx Alpine |

## アーキテクチャ

```
src/
├── types/          # TableSpec 型定義、Exporter インターフェース
├── data/           # DB別データ型マスタ
├── store/          # Zustand ストア（useProjectStore）
├── components/     # React UIコンポーネント
│   ├── layout/     #   Header, Workspace
│   ├── table/      #   TableCard, ColumnCell, AddColumn/Table
│   ├── relation/   #   RelationEditor (modal)
│   ├── index/      #   IndexEditor (modal)
│   └── export/     #   ExportDialog
├── exporters/      # エクスポータプラグインシステム
│   ├── registry.ts #   ExporterRegistry（register/get/getAll）
│   ├── sql/        #   SQL エクスポータ + DB方言
│   └── *.ts        #   各フレームワーク向けエクスポータ
└── hooks/          # カスタムフック
```

## 核心設計

### TableSpec スキーマ
- `docs/tablespec-schema.md` に厳密仕様を定義済み
- `public/tablespec.schema.json` に JSON Schema を配置
- バージョン: `1.0.0`

### UI モデル
- テーブルカード: 行=属性（Type, PK, Null, etc.）、列=DBカラム
- カラム追加時は右方向に伸びる（横スクロール対応）
- テーブル・カラムは自由に増減可能

### エクスポータプラグイン
- `Exporter` インターフェースを実装し、`ExporterRegistry` に登録する設計
- ビルトイン: JSON, SQL, Prisma, Drizzle, Laravel, Rails, Django, Mermaid ER
- 追加エクスポータは `exporterRegistry.register()` で登録

### 対象DB
- MariaDB / PostgreSQL / SQLite
- DB選択に応じてデータ型リストが動的に切り替わる

## 設計判断の記録

| 判断 | 理由 |
|------|------|
| 1プロジェクトのみ | 初期リリースでは複雑性を抑える |
| Undo/Redo なし | 初期リリース対象外 |
| ER図はMermaidコード出力 | 描画ライブラリ不要で十分実用的 |
| Zustand + persist | 軽量で LocalStorage 統合が容易 |
| エクスポータをプラグイン化 | 将来のフレームワーク追加を容易にする |

## 開発コマンド

```bash
# 開発環境
docker compose up dev        # http://localhost:5173

# 本番ビルド & 配信
docker compose up prod       # http://localhost:8080

# ローカル開発（Docker不使用）
npm install
npm run dev
```

## 現在のステータス

- [x] 要件定義・設計完了
- [x] TableSpec スキーマ仕様策定
- [x] プロジェクト基盤セットアップ
- [x] 型定義・データ定義
- [x] Zustand ストア
- [x] UIコンポーネント
- [x] エクスポータ実装
- [x] Docker設定
- [x] 統合・検証
