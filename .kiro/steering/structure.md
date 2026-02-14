# Project Structure

## Organization Philosophy

機能ベースの配置と役割の分離。`src/` 配下で app、components、domain、usecase、interfaces、infrastructure などを用途別に整理。サーバーサイドは Clean Architecture（`docs/development/server.md`）に従う。

## Directory Patterns

### App & Routing

**Location**: `src/app/[locale]/`  
**Purpose**: ロケール別ページ。`page.tsx` がルート、`layout.tsx` で共通レイアウト  
**Example**: `src/app/[locale]/chat/page.tsx`, `src/app/[locale]/start/page.tsx`

**Location**: `src/app/api/`  
**Purpose**: Next.js API ルート。Route handler → schema 検証 → handler → use case の流れ  
**Example**: `app/api/chat/route.ts`, `app/api/auth/[...all]/route.ts`

### Domain (Clean Architecture)

**Location**: `src/domain/`  
**Purpose**: 純粋なビジネスロジック。entities, values, repositories(port), adapter(port), errors  
**Example**: `domain/entities/game-session.ts`, `domain/values/character-type.ts`  
**Rule**: 他レイヤーへの import 禁止

### UseCase

**Location**: `src/usecase/`  
**Purpose**: アプリケーションサービス。domain のポートを注入してオーケストレーション  
**Example**: `usecase/chat.ts`, `usecase/points.ts`  
**Rule**: domain の port のみ依存、HTTP の関心事なし

### Interface (API Layer)

**Location**: `src/interfaces/`  
**Purpose**: リクエスト/レスポンスの Zod スキーマ、ハンドラ、エラー→HTTP マッピング  
**Example**: `interfaces/schemas/chat.ts`, `interfaces/api/chat-handler.ts`  
**Rule**: ビジネスロジックなし、use case 経由でのみ呼び出し

### Infrastructure

**Location**: `src/infrastructure/`  
**Purpose**: domain ポートの実装。adapter（Moltworker 等）、repositories（D1）、container  
**Example**: `infrastructure/adapter/ai-chat-moltworker.ts`, `infrastructure/repositories/d1/`  
**Rule**: domain の port を実装、use case からは注入で受け取る

### Components

**Location**: `src/components/`  
**Purpose**: 再利用可能な UI 部品。機能単位で分割（background, chat-input, girl-view など）  
**Example**: `@/components/background`, `@/components/chat-header`

### i18n

**Location**: `src/i18n/`  
**Purpose**: next-intl のルーティング・ナビゲーション設定  
**Example**: `routing.ts`（locales, defaultLocale）, `navigation.ts`（Link, useRouter の i18n 版）

### Constants & Messages

**Location**: `src/constants/messages/{locale}/`  
**Purpose**: 翻訳 JSON。ファイル名は用途別（chat.json, common.json, goal.json など）

### Store

**Location**: `src/store/`  
**Purpose**: Zustand によるグローバル状態。`game-store.ts` でチャット・ポイント等を管理

### Lib

**Location**: `src/lib/`  
**Purpose**: クライアント用ユーティリティ・AI チャットのオーケストレーション等  
**Example**: `lib/girl-chat.ts`, `lib/auth/*`, `lib/result-share.ts`

### Hooks

**Location**: `src/hooks/`  
**Purpose**: 再利用可能な React フック（例: usePrefersReducedMotion）

## Naming Conventions

- **Files**: kebab-case（`girl-view.tsx`, `use-prefers-reduced-motion.ts`）
- **Components**: PascalCase
- **Store exports**: `use*` プレフィックス（`useGameStore`）

## Import Organization

```typescript
// Absolute imports for src/ 以下
import { Background } from "@/components/background";
import { useGameStore } from "@/store/game-store";
import { useRouter } from "@/i18n/navigation";

// Relative for同一ディレクトリ
import { routing } from "./routing";
```

**Path Aliases**:

- `@/*`: `./src/*`

## Code Organization Principles

- コンポーネントは props と store で状態を受け取り、ビジネスロジックは lib に寄せる
- メッセージは constants/messages の JSON から next-intl で取得

---

_Document patterns, not file trees. New files following patterns shouldn't require updates_

<!-- updated_at: 2025-02-14 | Sync: domain, usecase, interfaces, infrastructure, app/api patterns -->
