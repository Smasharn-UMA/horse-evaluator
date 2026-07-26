# Horse Evaluator 3.0 Version 1.8.15.5

iPad・iPhone向けの一口馬主募集馬管理・AI評価アプリです。

## 今回の更新

歩様動画を1頭につき1本、MP4またはMOV形式で添付できます。動画本体はIndexedDBへ保存され、詳細画面で再生できます。動画URLだけを登録する従来方式も利用できます。

## 保存構成

- 基本情報・測尺・AI評価: localStorage
- 写真: IndexedDB
- 添付歩様動画: IndexedDB
- JSONバックアップ: 基本情報・測尺・AI評価・写真を対象。添付動画本体は対象外
