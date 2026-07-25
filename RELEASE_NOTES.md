# Release Notes

## 3.1.1 — Sprint 1.4.1 Step1

### Fixed
- Sprint 1.3バックアップJSONの復元互換性を強化
- JSON構文・データ構造・年度値のエラー表示を追加
- 欠損フィールドを安全に補完
- 保存後の再読込検証を追加

### Safety
- JSON取込直前の状態を `horseEvaluator3_preImportBackup` に自動退避
- 置換と追加・更新の選択内容を確認画面に明示

### Compatibility
- Sprint 1.3（3.1.0）JSONで検証
- 59頭の読込、保存、再読込、再書出しの件数一致を確認


## Sprint 1.5 (Scaffold)
- Planned: Silk parser, Union parser improvements, club field, sex field.
