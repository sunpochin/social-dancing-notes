<!--
檔案用途：讓小任務直接找到入口與最近驗證。
所在層：docs。
主要關聯：AGENTS.md、TECHNICAL.md。
-->

# Agent Map

| 任務 | 入口 | 最近驗證 |
| --- | --- | --- |
| 文章目錄／導覽 | `SUMMARY.md`、`README.md` | 僅檢查本次文章與導覽連結 |
| 樂評 | `new-releases/` | 路徑、frontmatter、來源與翻譯狀態 |
| 翻譯／舞蹈筆記 | `behind-the-shine/`、`podcast-translations/`、`salsa-language/` | 改動文章、引用與既有網址 |
| AI 規則與防線 | [AGENTS.md](../AGENTS.md)、`scripts/` | `node scripts/check-harness.mjs`、`node --test tests/harness/*.test.mjs` |

先讀目標與直接契約，不全庫考古。測試一律用假資料；不因導覽需要而讀取憑證、私人內容或執行發布。
