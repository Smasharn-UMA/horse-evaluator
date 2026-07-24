# Horse Evaluator

一口馬主の募集馬を、測尺・写真・歩様動画・主観評価から整理する初期版Webアプリです。

## GitHubへのアップロード

1. GitHubで作成したリポジトリを開く
2. `Add file`
3. `Upload files`
4. 次の3ファイルをアップロード
   - `index.html`
   - `style.css`
   - `script.js`
5. `Commit changes`

## GitHub Pages公開

1. リポジトリの `Settings`
2. 左メニューの `Pages`
3. Source: `Deploy from a branch`
4. Branch: `main`
5. Folder: `/(root)`
6. `Save`

## 主な機能

- 馬名・クラブ・性別・生年月日の入力
- 馬体重・体高・胸囲・管囲の入力
- 立ち写真と歩様動画の端末内プレビュー
- トモ、柔軟性、踏み込み、連動性、成長余地の5段階評価
- 簡易総合点
- ブラウザ内保存
- JSON書き出し

## 注意

- 写真と動画そのものはブラウザ内保存されません。
- 評価ロジックは初期版の暫定基準です。
- 医学的・獣医学的診断、競走成績、回収率を保証するものではありません。
