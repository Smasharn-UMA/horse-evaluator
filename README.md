# Horse Evaluator AI Version 2.0.1

Version 2.0.0 Sprint 1を基礎に、旧Version 3.1.29形式のJSONバックアップ復元を修正した互換性修正版です。

## 主な修正
- Version 3.1.29形式の `horses` 配列をVersion 2系へ移行
- 埋め込み写真（data URL）をIndexedDBへ移行
- 写真保存に失敗した場合も馬データ全体の復元を継続
- 復元後の登録頭数を再検証
- iOS Safari／ホーム画面追加環境でFileReaderを使用

## 起動
`index.html` をGitHub Pagesまたは対応ブラウザで開いてください。
