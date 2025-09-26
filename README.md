# CrashGame 五牌局模擬器（純前端版，可用於 GitHub Pages）

- 顯示 **5 種牌局**，每一步的 **Multiplier** 與 **步驟期望值 (p × m)**。
- 可做 **全局倍率比例** 與 **牌局倍率比例** 調整，或按「**一鍵逼近**」把整體 RTP 拉到目標（預設 0.97）。
- 可逐步修改倍率 / 機率，立即看到 **每步/每牌局/整體 RTP** 變化。
- 可設定每個牌局的「**選中機率**」，作為整體 RTP 的加權。

## 快速佈署（GitHub Pages）
1. 將本專案 push 至你的 GitHub repo（例如 `crashgame-simulator`）。
2. 到 GitHub → **Settings → Pages**：
   - **Source**：選 **Deploy from a branch**
   - **Branch**：選 **main**，資料夾選 **/docs**
3. 儲存後，GitHub 會以 `docs/index.html` 作為入口，網址為：`https://<username>.github.io/<repo>/`。

> 本版為 **純前端**，不需伺服器或 Python 執行環境。若需大量回合模擬、或讀取 Excel 多工作表，建議使用獨立的 Python/Streamlit 版本另行部署。

## 檔案結構
```
.
├─ docs/
│  ├─ index.html         # 單頁應用（入口）
│  └─ assets/
│     └─ app.js         # 主程式（JS）
├─ README.md
└─ LICENSE (MIT)
```

## 授權
MIT
