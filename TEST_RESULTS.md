# Test Results — Version 1.8.20.3

## Static checks
- `node --check app.js`: passed
- Existing file structure retained: `index.html`, `style.css`, `app.js`
- Local-storage key and schema version unchanged

## Parser checks
### Carrot active horse (Reader/Markdown format)
Test data based on the public page structure for horse ID 2208.

Expected and confirmed:
- Name: シックスペンス
- Birth date: 2021-04-17
- Sex: 牡
- Coat: 鹿毛
- Sire: キズナ
- Dam: フィンレイズラッキーチャーム
- Broodmare sire: Twirling Candy
- Breeder: ノーザンファーム
- Area: 美浦
- Trainer: 田中博
- Class: OP(6-1-0-6)
- Cross information stored in notes

## Regression scope
- Existing JSON storage key unchanged
- Existing schemaVersion remains 2
- Union/Silk parser entry points retained
- Manual page-text import retained

## Environment limitation
Actual cross-origin URL fetching cannot be guaranteed in GitHub Pages because it depends on CORS and the availability of the external reader service. When fetching fails, the app now explicitly directs the user to paste the page body.

- URL取得または解析失敗時に本文欄が空欄へ戻ることをコード確認済み。
