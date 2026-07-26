# Horse Evaluator 3.0 Core — Version 1.8.15.2 Photo Storage Fix

写真ファイルを `localStorage` から分離し、容量の大きい画像データをブラウザの `IndexedDB` に保存する修正版です。募集馬一覧などのレイアウトはVersion 1.8.15から変更していません。

## 主な修正

- 写真ファイル本体をIndexedDBへ保存
- 馬の基本情報・測尺・AI評価は従来どおりlocalStorageへ保存
- 既存のBase64写真は初回起動時にIndexedDBへ自動移行
- 写真追加時の `The quota has been exceeded.` を回避
- 写真削除・馬削除・全データ削除時に、対応する画像データも削除
- JSONバックアップには写真を含め、復元時は写真をIndexedDBへ再配置
- 編集対象の1頭だけを更新する処理はVersion 1.8.15.1の修正を維持

## 更新方法

既存のGitHub Pagesリポジトリで、ZIP内の全ファイルを上書きしてください。既存データは初回起動時に自動移行されます。更新前にJSONバックアップを保存してください。
