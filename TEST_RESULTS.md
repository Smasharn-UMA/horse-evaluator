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
