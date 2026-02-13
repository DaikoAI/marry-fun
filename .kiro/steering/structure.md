# Project Structure

## Organization Philosophy

機能ベースの配置と役割の分離。`src/` 配下で app、components、lib、store などを用途別に整理。

## Directory Patterns

### App & Routing

**Location**: `src/app/[locale]/`  
**Purpose**: ロケール別ページ。`page.tsx` がルート、`layout.tsx` で共通レイアウト  
**Example**: `src/app/[locale]/chat/page.tsx`, `src/app/[locale]/start/page.tsx`

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
**Purpose**: ユーティリティ・ビジネスロジック（fetchGirlResponse など）

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
