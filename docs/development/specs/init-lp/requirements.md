# Requirements Document

## Introduction

この仕様は、恋愛シミュレーションゲーム「marry.fun」の **簡易LP（トップページ）** を実装するための要件を定義します。LPは初回訪問時にBGMがループ再生され、ロゴがふわっと表示される“ギャルゲー風”の雰囲気を提供します。

## Requirements

### Requirement 1: ランディングページ基本体験

**Objective:** As a 新規訪問ユーザー, I want トップページでLP体験をすぐ開始できる, so that 「marry.fun」の雰囲気を短時間で把握できる

#### Acceptance Criteria

1.1 When トップページにアクセスしたとき, the LP shall 1画面で完結するファーストビューを表示する
1.2 The LP shall 主要コンテンツとして `public/logo.webp` を視認できる位置（画面中央付近）に表示する
1.3 The LP shall モバイル/デスクトップの両方でレイアウト崩れが発生しない（主要要素が画面外にはみ出さない）

### Requirement 2: BGM（use-sound）ループ再生

**Objective:** As a ユーザー, I want トップページでBGMがループ再生される, so that ギャルゲーっぽい没入感を得られる

#### Acceptance Criteria

2.1 When トップページにアクセスしたとき, the LP shall `use-sound` を用いて `public/sound/` 配下のBGMをループ再生する
2.2 While BGMが再生中, the LP shall 途切れずにループ再生を継続する
2.3 If ブラウザの自動再生制限により再生開始に失敗した場合, then the LP shall ユーザー操作で再生を開始できる導線（例: 再生ボタン）を提供する
2.4 The LP shall BGM再生の状態（再生中/停止中）がユーザーに分かるようにする

### Requirement 3: ロゴ表示アニメーション（ふわっと登場）

**Objective:** As a ユーザー, I want ロゴがふわっと現れる演出を見る, so that かわいくポップな第一印象を得られる

#### Acceptance Criteria

3.1 When トップページが表示されたとき, the LP shall `public/logo.webp` をフェードイン/浮遊感のあるアニメーションで表示する
3.2 The LP shall ロゴのアニメーションが初回表示時に不自然にカクつかない（視覚的に滑らかに見える）
3.3 Where OS/ブラウザで「動きを減らす（prefers-reduced-motion）」が有効な場合, the LP shall アニメーションを抑制する（例: フェードのみ、または即時表示）

### Requirement 4: ギャルゲー風の背景・ビジュアルデザイン

**Objective:** As a ユーザー, I want ギャルゲーっぽい背景やデザインを体験する, so that タイトル世界観にワクワクできる

#### Acceptance Criteria

4.1 The LP shall `public/bg.png` を背景として画面全体に表示する
4.2 The LP shall パステル/ポップ/キラキラ感のある“ギャルゲー風”の背景表現を提供する
4.3 The LP shall 背景とロゴのコントラストを確保し、ロゴが常に判別できる
4.4 The LP shall 背景表現が主要操作（BGM再生導線など）やロゴの視認性を阻害しない

### Requirement 5: ヘッダー/フッター情報（LP導線）

**Objective:** As a ユーザー, I want LPに最低限の情報導線がある, so that 公式情報にたどり着ける

#### Acceptance Criteria

5.1 The LP shall 画面上部に `marry.fun` の表記を表示する
5.2 The LP shall 画面下部に `Coming soon...` 相当の文言を表示する
5.3 The LP shall 画面下部に `X` / `Help` / `Docs` へのリンクを表示する
5.4 If いずれかのリンクURLが未確定の場合, then the LP shall プレースホルダ（例: `#`）ではなく「準備中」等の無効状態表現を行う

### Requirement 6: 品質・互換性（最低限）

**Objective:** As a ユーザー, I want 主要ブラウザで安定して表示される, so that いつでもLPを閲覧できる

#### Acceptance Criteria

6.1 The LP shall 最新のChrome/Safari/Firefoxのいずれかで表示が成立する
6.2 If 音声ファイルの取得に失敗した場合, then the LP shall 体験を破綻させずにフォールバック表示（例: 再生不可の案内）を行う
6.3 The LP shall 重大なコンソールエラーを発生させない

### Requirement 7: 3Dモデル（@react-three/fiber）表示

**Objective:** As a ユーザー, I want トップ画面の中央に3D人形モデルが表示される, so that ギャルゲーっぽい世界観をより強く感じられる

#### Acceptance Criteria

7.1 When トップページが表示されたとき, the LP shall `@react-three/fiber`（R3F）を使用して3Dシーンを描画する
7.2 The LP shall 3D人形モデルをファーストビューの中央付近に表示する
7.3 If 3Dモデルの読み込みに失敗した場合, then the LP shall 代替表示（例: ローディング/エラーメッセージ）を行い、ページ全体の体験を破綻させない
7.4 Where OS/ブラウザで「動きを減らす（prefers-reduced-motion）」が有効な場合, the LP shall 3Dの自動アニメーション（例: 常時回転）を抑制する
