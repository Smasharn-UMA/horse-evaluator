# TEST RESULTS — Version 1.8.20.5 Dev

## 実施結果

- JavaScript構文確認: PASS (`node --check app.js`)
- 複数時点測尺: PASS
  - 2026年5月下旬 358kg / 145cm / 160cm / 19.0cm
  - 2026年7月上旬 400kg
  - 最新値は 400kg / 145cm / 160cm / 19.0cm
- 1行測尺: PASS
  - 420kg / 150cm / 168cm / 19.8cm
- 日付なし測尺: PASS
  - 453kg / 154cm / 176cm / 19.7cm
- 既存履歴と新規取込履歴の結合: PASS
- index.html のVersion表記とapp.jsキャッシュキー更新: PASS

## 既知の制限

- 日付が月までしかない場合、内部日付はその月の1日として保存。
- 本文中の測尺表記が画像のみの場合は抽出不可。
- URL取得可否は相手サイトおよびブラウザのCORS制限に依存。
