# v1.8.20.9 Test Results

- JavaScript構文確認 (`node --check`): PASS
- クラス自動判定: PASS
  - 未勝利 → 未勝利
  - 1勝クラス → 勝ち上がり
  - 2勝クラス / 3勝クラス → 2勝以上
  - OP / オープン → オープン
- GⅠ手動フラグ → GⅠ勝利 + 重賞勝利扱い: PASS
- 重賞手動フラグ → 重賞勝利扱い: PASS
- 旧評価「GⅠ勝利 / 重賞勝利」の移行フラグ保持: PASS（コードパス確認）
- Teacher Data Analyzer比較群: クラス自動ラベル済み非重賞馬を採用するロジック確認: PASS
- 既存JSON互換: Schema 5以前をSchema 6へ移行するロジック確認: PASS

# Test Results — Version 1.8.20.7

## Static checks

- JavaScript syntax (`node --check app.js`): PASS
- Required UI IDs present: PASS
  - `exportTeacherBtn`
  - `teacherAnalysisBtn`
- App asset version references updated: PASS
- ZIP file integrity: PASS

## Compatibility checks

- Schema Version 4 data to Schema Version 5 migration path: PASS (code inspection)
- Existing `modelSettings` preservation: PASS (code inspection)
- Existing horse records and teacherData preservation: PASS (code inspection)
- `analysisMeta` default completion for old backups: PASS (code inspection)

## Feature checks

- Teacher Dataset JSON includes teacher-enabled horses only: PASS (code inspection)
- Missing scores remain `null`: PASS (code inspection)
- GⅠ／重賞勝利 labels map to graded-winner group: PASS (code inspection)
- Unlabeled horses are excluded from the non-winner comparison group: PASS (code inspection)
- Per-field missing-value exclusion: PASS (code inspection)
- Mean difference, sample standard deviation and standardized effect calculation: PASS (code inspection)

## Device verification required

The following should be confirmed on the actual iPhone/iPad installation:

1. Existing JSON restoration
2. Teacher Dataset JSON download in Safari/Home Screen mode
3. Analysis dialog scrolling and table readability
4. Japanese filename handling in Files/iCloud Drive


## Version 1.8.20.8 追加テスト
- キャロット簡潔本文（アクロフェイズ形式）の馬名・生年月日・性別・毛色抽出：PASS
- 父・母・BMS・生産牧場・厩舎・所属抽出：PASS
- `2勝クラス(2-1-1-2)` 抽出：PASS
- 測尺4項目と予定育成牧場抽出：PASS
- JavaScript構文確認：PASS
