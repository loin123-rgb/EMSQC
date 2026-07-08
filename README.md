# EMSQC

EMS QC 管制圖網頁版。這個版本是純前端靜態網站，可直接由 Netlify 從 GitHub 部署，不需要 Python 伺服器，也不會把使用者上傳的資料永久存到雲端。

## 功能

- 手動輸入量測值
- 匯入 Excel / CSV
- Xbar 管制圖
- R 管制圖
- Cp / Cpk / Ca 計算
- 匯出 Excel 報表
- 適合 Netlify 免費部署

## Netlify 部署設定

在 Netlify 建立或設定專案時選擇這個 GitHub repository：

```text
loin123-rgb/EMSQC
```

Build settings：

```text
Build command: 留空
Publish directory: .
```

本專案已包含 `netlify.toml`，Netlify 通常會自動讀取設定。

## 資料安全說明

目前版本採用瀏覽器端計算：

- Excel 只在使用者瀏覽器讀取
- 計算只在使用者瀏覽器執行
- 不建立資料庫
- 不永久保存量測資料

如果之後需要多人登入、歷史資料查詢、權限控管，可以再加 Netlify Functions 或資料庫。
