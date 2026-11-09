# Anti Cafe — 咖啡手沖配方庫與計時指引 PWA

專為手沖咖啡愛好者打造的網頁 PWA 工具。收錄經典手沖配方（V60、四六法、Hoffmann 終極手法、Origami、Kalita Wave、冰手沖等），支援粉水比自適應換算、每段注水提示、沉浸式圓環倒數計時器、音效提示與螢幕防休眠常亮功能。

---

## ✨ 核心特色

1. **專業模板庫（配方清單）**
   - 收錄 11 款經典沖煮手法（經典 V60、粕谷哲四六法、James Hoffmann 終極/單杯手法、Matt Winton 五段注水法、Origami 30秒五段、Scott Rao 旋轉法、Kalita 波浪經典法、丹麥式/急冷/京都式冰手沖）。
   - 快速切換分類：全部、V60、Kalita Wave、Origami、冰手沖。
   - 包含水溫、研磨度、風味表現與豆子搭配建議。

2. **準備這一杯（食譜文字介面與動態縮放）**
   - 互動調整粉量 (g) 或總水量 (g)，自動維持原配方粉水比（1:15、1:16.7 等），即時等比例換算每一段注水量與累計注水量。
   - 支援指定咖啡豆名稱。
   - 完整列出各階段步驟與等待時間。

3. **沖煮計時器（沉浸式介面，參考 IMG_6872 設計）**
   - 金色光環圓形進度條與大字型倒數計時。
   - 「秤上應為」金色大字即時重量指引與目標總量。
   - 膠囊提示「接下來 • 注水至 XXg • XXs」。
   - 多段式步驟時間軸進度條。
   - 上一步 / 暫停與播放 / 下一步 / 重設控制。
   - 最後 3 秒蜂鳴倒數、步驟切換音效、沖煮完成慶祝音效與彩帶特效。
   - 支援 Web Screen Wake Lock API（沖煮時螢幕不休眠）。

4. **PWA 支援**
   - 支援安裝到手機主畫面（iOS Safari / Android Chrome）。
   - 離線 Service Worker 快取，無網路也能隨時手沖。
   - 針對行動裝置觸控最佳化與沉浸式暗色質感。

---

## 🚀 本地開發與預覽

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置正式版本
npm run build
```

---

## ☁️ 部署到 Vercel 指南

你可以非常輕鬆地將此專案部署到 Vercel：

### 方法一：透過 GitHub（推薦）
1. 在 GitHub 上建立一個新的儲存庫（Repository），例如 `anti-cafe-pwa`。
2. 將本地代碼推送到該儲存庫：
   ```bash
   git remote add origin https://github.com/<你的用戶名>/<你的儲存庫名稱>.git
   git branch -M main
   git push -u origin main
   ```
3. 前往 [vercel.com](https://vercel.com)，點擊「Add New...」->「Project」。
4. 匯入你的 GitHub 儲存庫，Framework Preset 選擇 **Vite**（Vercel 通常會自動偵測）。
5. 點擊「Deploy」，等待約 30 秒即可獲得個人專屬的正式網址！

### 方法二：透過 Vercel CLI
```bash
npm i -g vercel
vercel
```
