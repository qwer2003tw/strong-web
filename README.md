This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## MoSCoW 需求分類
> 📘 **模組化規劃**：詳細的功能拆解、資料模型與跨模組依賴，請參考《[Strong Web 模組化功能拆解](docs/feature-breakdown.md)》。下表整理了各模組的主要負責團隊與建議執行順序，供任務派發參考。

| 建議順序 | 模組 | 主要負責團隊 | 說明 |
| --- | --- | --- | --- |
| 1 | [Auth 模組](docs/feature-breakdown.md#auth-模組) | Identity Squad（後端 / 前端） | 完成核心登入、OAuth 與使用者初始化，為所有其他模組提供授權基礎。 |
| 2 | [部署 / DevOps 模組](docs/feature-breakdown.md#部署--devops-模組) | Platform Squad（DevOps / 後端） | 建立 Vercel、Supabase 環境與 CI/CD，確保後續功能可快速迭代。 |
| 3 | [監控與安全模組](docs/feature-breakdown.md#監控與安全模組) | SecOps Squad（後端 / 法遵） | 佈署 RLS、審計與監控底盤，保障資料安全與法遵需求。 |
| 4 | [Workout / Exercise CRUD 模組](docs/feature-breakdown.md#workout--exercise-crud-模組) | Training Experience Squad（前端 / 後端） | 實作訓練與動作管理，是歷史統計與 PWA 的資料來源。 |
| 5 | [PWA / 離線模組](docs/feature-breakdown.md#pwa--離線模組) | Experience Squad（前端） | 補強離線流程與安裝體驗，確保弱網環境的使用可靠度。 |
| 6 | [歷史與統計模組](docs/feature-breakdown.md#歷史與統計模組) | Insights Squad（前端 / 數據） | 提供 Recharts 圖表與統計視圖，支援訓練回顧與決策。 |
| 7 | [設定與偏好模組](docs/feature-breakdown.md#設定與偏好模組) | Personalization Squad（前端） | 讓使用者自訂單位、主題、多語系與個人資料。 |
| 8 | [外部 API / 整合模組](docs/feature-breakdown.md#外部-api--整合模組) | Integration Squad（後端 / 平台） | 對外提供 REST/GraphQL 介面與健康平台匯入能力。 |

### Must（一定要有）
- **Auth 與 OAuth**：Email/Password + Google/Apple/GitHub（Supabase Auth）。
- **訓練紀錄 CRUD**：動作庫、自訂動作、重量/次數/組數、備註、RPE（可選欄位）。
- **歷史與基本統計**：依日期、動作、肌群查詢；近 7/30 天訓練量與 1RM 估算趨勢（Recharts 視覺化）。
- **PWA 與離線支援**：核心流程離線可用（查看動作、建立/編輯訓練）；回網後自動同步；支援安裝至裝置。
- **設定頁**：切換單位（kg/lb）、主題（暗色優先）、個人資料編輯。
- **API**：公開 REST API 並透過 Auth 保護，確保 Strong App 與 Web 互通。
- **安全與隱私**：Row Level Security、最小權限控管、密碼與 Token 管理、資料匯出（CSV/JSON）。
- **部署**：前端 Vercel、後端 Supabase，具備基本監控與日誌。

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
