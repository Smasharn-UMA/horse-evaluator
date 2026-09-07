# Release Notes — Blind Re-evaluation Phase 1 v1.0.0

- 281頭教師データ形式 `horse-evaluator-teacher-dataset-2.0` を前提にした再評価管理ツールを新規作成。
- 後知恵バイアス対策として完全ブラインド用匿名IDを生成。
- AI入力から馬名・血統・厩舎・生産・価格・競走実績・実績ラベルを除外。
- original evaluation は上書きせず、blind evaluationを別レイヤーとして比較。
- 項目別・実績別の差分集計を実装。
- Phase 1ではメディア自動送信を行わない。
