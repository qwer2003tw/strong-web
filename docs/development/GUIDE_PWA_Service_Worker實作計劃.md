# PWA Service Worker 實作計畫 / PWA Service Worker Implementation Plan

**用途 / Purpose**: PWA Service Worker 缺失問題的完整技術實作規劃 / Complete technical implementation plan for missing PWA Service Worker issue  
**適用對象 / Target Audience**: 前端開發者、DevOps 工程師 / Frontend developers, DevOps engineers  
**相關文檔 / Related Documents**: [專案結構說明](../architecture/PROJECT_STRUCTURE.md), [功能拆解](../architecture/feature-breakdown.md)  
**最後更新 / Last Updated**: 2025-10-22

## 快速導覽 / Quick Navigation
- 如果你要了解問題根因 → 看第 2 節 / If you need to understand root cause → See Section 2
- 如果你要開始實作 → 看第 3 節 / If you need to start implementation → See Section 3
- 如果你要進行測試 → 看第 7 節 / If you need to test → See Section 7
- 如果你要檢查完成標準 → 看第 8 節 / If you need completion criteria → See Section 8

## 1. 專案概況 / Project Overview

### 問題優先級 / Issue Priority
🔴 **最高優先級 / Highest Priority** - PWA 核心功能完全失效 / PWA core functionality completely broken

### 影響範圍 / Impact Scope
PWA Service Worker 缺失導致以下功能無法使用 / Missing PWA Service Worker causes the following features to be unusable:

- PWA 安裝功能無法使用 / PWA installation functionality unavailable
- 離線功能完全失效 / Offline functionality completely broken  
- 背景同步無法運作 / Background sync not working
- Lighthouse PWA 分數為 0 / Lighthouse PWA score is 0

## 2. 問題根因分析 / Root Cause Analysis

### 當前配置問題 / Current Configuration Issue
```javascript
// next.config.js 中的配置 / Configuration in next.config.js
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  workboxOptions: {
    swSrc: "public/sw.js", // ← 這個文件不存在！/ This file does not exist!
  },
});
```

### 技術債務分析 / Technical Debt Analysis
| 問題類型 / Issue Type | 當前狀態 / Current State | 目標狀態 / Target State |
|---------------------|------------------------|----------------------|
| Service Worker 文件 / SW File | ❌ 不存在 / Missing | ✅ 完整實作 / Fully implemented |
| 離線快取 / Offline Cache | ❌ 無快取策略 / No cache strategy | ✅ 多層快取 / Multi-tier cache |
| 背景同步 / Background Sync | ❌ 未配置 / Not configured | ✅ 自動同步 / Auto sync |
| 推送通知 / Push Notifications | ❌ 不支援 / Not supported | ✅ 完整支援 / Full support |

## 3. 詳細實作計畫 / Detailed Implementation Plan

### 第一階段：基礎 Service Worker 建立 / Phase 1: Basic Service Worker Setup
**預估時間 / Estimated Time**: 4-6小時 / 4-6 hours

#### Step 1: 建立核心 Service Worker 文件 / Create Core Service Worker File
```javascript
// public/sw.js
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSync } from 'workbox-background-sync';

// 宣告 Workbox 預快取清單 / Declare Workbox precache manifest
declare let self: ServiceWorkerGlobalScope;

// 預快取 next-pwa 產生的資源 / Precache next-pwa generated resources
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

console.log('Strong Web Service Worker loaded');
```

#### Step 2: 快取策略設定 / Cache Strategy Configuration
```javascript
// 在 public/sw.js 中繼續添加 / Continue adding to public/sw.js

// 1. API 請求快取策略 - Network First / API request cache strategy - Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'strong-web-api',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5分鐘 / 5 minutes
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 2. 靜態資源快取策略 - Cache First / Static assets cache strategy - Cache First
registerRoute(
  ({ request }) => 
    request.destination === 'image' || 
    request.destination === 'font' ||
    request.destination === 'style',
  new CacheFirst({
    cacheName: 'strong-web-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30天 / 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 3. 頁面快取策略 - Stale While Revalidate / Page cache strategy - Stale While Revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'strong-web-pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24小時 / 24 hours
      }),
    ],
  })
);
```

#### Step 3: 離線頁面處理 / Offline Page Handling
```javascript
// 離線後備頁面 / Offline fallback page
const OFFLINE_URL = '/offline';
const FALLBACK_HTML_URL = '/offline.html';

// 預快取離線頁面 / Precache offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('strong-web-offline')
      .then((cache) => cache.add(FALLBACK_HTML_URL))
  );
});

// 導航請求失敗時顯示離線頁面 / Show offline page when navigation requests fail
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(FALLBACK_HTML_URL);
      })
    );
  }
});
```

### 第二階段：背景同步機制 / Phase 2: Background Sync Mechanism
**預估時間 / Estimated Time**: 6-8小時 / 6-8 hours

#### Step 1: 訓練資料同步 / Workout Data Sync
```javascript
// 在 public/sw.js 中添加背景同步 / Add background sync to public/sw.js

const bgSyncWorkouts = new BackgroundSync('workouts-sync', {
  maxRetentionTime: 24 * 60, // 24小時重試 / 24 hours retry
});

const bgSyncSettings = new BackgroundSync('settings-sync', {
  maxRetentionTime: 12 * 60, // 12小時重試 / 12 hours retry
});

// 攔截 POST/PUT/DELETE 請求進行背景同步 / Intercept POST/PUT/DELETE for background sync
registerRoute(
  ({ url, request }) => {
    return url.pathname.startsWith('/api/workouts') && 
           ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  },
  async ({ event }) => {
    try {
      const response = await fetch(event.request.clone());
      return response;
    } catch (error) {
      // 網路失敗時加入背景同步佇列 / Add to background sync queue on network failure
      await bgSyncWorkouts.replayRequests();
      throw error;
    }
  }
);
```

#### Step 2: IndexedDB 同步狀態追蹤 / IndexedDB Sync Status Tracking
```javascript
// 監聽背景同步事件 / Listen to background sync events
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'workouts-sync') {
    event.waitUntil(syncWorkouts());
  } else if (event.tag === 'settings-sync') {
    event.waitUntil(syncSettings());
  }
});

async function syncWorkouts() {
  try {
    // 從 IndexedDB 獲取待同步的訓練資料 / Get pending workout data from IndexedDB
    const pendingWorkouts = await getPendingSyncData('workouts');
    
    for (const workout of pendingWorkouts) {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout.data),
      });
      
      if (response.ok) {
        await removePendingSyncData('workouts', workout.id);
        await notifyClient('sync-success', { type: 'workout', id: workout.id });
      }
    }
  } catch (error) {
    console.error('Workout sync failed:', error);
    await notifyClient('sync-error', { type: 'workout', error: error.message });
  }
}
```

### 第三階段：推送通知支援 / Phase 3: Push Notification Support
**預估時間 / Estimated Time**: 4-6小時 / 4-6 hours

#### 推送事件處理 / Push Event Handling
```javascript
// 在 public/sw.js 中添加推送通知 / Add push notifications to public/sw.js

self.addEventListener('push', (event) => {
  const options = {
    body: 'Your workout reminder is ready! / 您的訓練提醒已就緒！',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Start Workout / 開始訓練',
        icon: '/action-start.png'
      },
      {
        action: 'close',
        title: 'Dismiss / 關閉',
        icon: '/action-close.png'
      }
    ]
  };

  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data = { ...options.data, ...payload.data };
  }

  event.waitUntil(
    self.registration.showNotification('Strong Web', options)
  );
});

// 處理通知點擊 / Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/workouts')
    );
  } else if (event.action === 'close') {
    // 只關閉通知，不採取行動 / Just close notification, no action
  } else {
    // 默認行為：打開應用 / Default behavior: open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
```

### 第四階段：離線頁面建立 / Phase 4: Offline Page Creation
**預估時間 / Estimated Time**: 2-3小時 / 2-3 hours

#### 建立離線後備頁面 / Create Offline Fallback Page
```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Strong Web - 離線模式 / Offline Mode</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 {
            margin: 1rem 0;
        }
        p {
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 0.75rem 2rem;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
        }
        .retry-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">💪</div>
        <h1>目前離線中 / Currently Offline</h1>
        <p>
            請檢查網路連線，或查看已同步的訓練資料<br>
            Please check your internet connection or view synced workout data
        </p>
        <button class="retry-btn" onclick="window.location.reload()">
            重試連線 / Retry Connection
        </button>
    </div>
</body>
</html>
```

## 4. 檔案結構 / File Structure

完成後的檔案結構 / File structure after completion:
```
public/
├── sw.js                 # 主要 Service Worker / Main Service Worker
├── offline.html          # 離線後備頁面 / Offline fallback page
├── manifest.json         # PWA 配置 (已存在) / PWA config (existing)
└── icons/               # PWA 圖示 (需確認) / PWA icons (needs verification)
    ├── icon-192x192.png
    ├── icon-512x512.png
    ├── badge-72x72.png
    ├── action-start.png
    └── action-close.png
```

## 5. 依賴需求 / Dependencies

### NPM 套件確認 / NPM Package Verification
確認以下套件已安裝 / Verify the following packages are installed:
```json
{
  "devDependencies": {
    "@ducanh2912/next-pwa": "^10.2.9",
    "workbox-precaching": "^7.0.0",
    "workbox-routing": "^7.0.0",
    "workbox-strategies": "^7.0.0",
    "workbox-expiration": "^7.0.0",
    "workbox-background-sync": "^7.0.0"
  }
}
```

### Manifest 配置驗證 / Manifest Configuration Verification
檢查 `public/manifest.json` 是否完整 / Check if `public/manifest.json` is complete:
```json
{
  "name": "Strong Web",
  "short_name": "Strong",
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512x512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 6. 實作順序 / Implementation Sequence

### 第一天 / Day 1
1. **上午 / Morning**: 建立基礎 Service Worker 文件 / Create basic Service Worker file
2. **下午 / Afternoon**: 實作快取策略 / Implement cache strategies

### 第二天 / Day 2  
1. **上午 / Morning**: 建立離線頁面 / Create offline page
2. **下午 / Afternoon**: 測試基礎功能 / Test basic functionality

### 第三天 / Day 3
1. **全天 / Full day**: 實作背景同步機制 / Implement background sync mechanism

### 第四天 / Day 4
1. **上午 / Morning**: 添加推送通知支援 / Add push notification support  
2. **下午 / Afternoon**: 整合測試 / Integration testing

## 7. 測試策略 / Testing Strategy

### 功能測試清單 / Functional Testing Checklist

#### 離線功能測試 / Offline Functionality Testing
- [ ] 開啟 DevTools → Network → 勾選 "Offline" / Open DevTools → Network → Check "Offline"
- [ ] 驗證快取的頁面可以正常載入 / Verify cached pages load normally
- [ ] 測試離線後備頁面顯示 / Test offline fallback page display
- [ ] 確認 IndexedDB 資料可以離線存取 / Confirm IndexedDB data accessible offline

#### 背景同步測試 / Background Sync Testing
- [ ] 離線狀態下建立訓練資料 / Create workout data while offline
- [ ] 重新連線後驗證自動同步 / Verify auto-sync after reconnection
- [ ] 檢查同步失敗的重試機制 / Check sync failure retry mechanism

#### 推送通知測試 / Push Notification Testing  
- [ ] 註冊推送訂閱 / Register push subscription
- [ ] 發送測試通知 / Send test notification
- [ ] 驗證通知點擊行為 / Verify notification click behavior

### 效能測試標準 / Performance Testing Standards

#### Lighthouse PWA 檢查項目 / Lighthouse PWA Checklist
- [ ] Fast and reliable (>90分 / >90 points)
- [ ] Installable (>90分 / >90 points)
- [ ] PWA Optimized (>90分 / >90 points)

#### 關鍵指標 / Key Metrics
- Service Worker 註冊時間 < 100ms / SW registration time < 100ms
- 快取命中率 > 85% / Cache hit rate > 85%  
- 背景同步成功率 > 95% / Background sync success rate > 95%

### 測試工具 / Testing Tools
```bash
# 本地測試服務器 / Local test server
pnpm dev

# 建置測試 / Build testing
pnpm build
pnpm start

# Lighthouse 測試 / Lighthouse testing
npx lighthouse http://localhost:3000 --chrome-flags="--headless"

# PWA 功能測試 / PWA functionality testing
# 在 Chrome DevTools Application 面板檢查 / Check in Chrome DevTools Application panel
```

## 8. 完成標準與驗收 / Completion Criteria & Acceptance

### 技術驗收標準 / Technical Acceptance Criteria

#### 必須達成 / Must Achieve
- [ ] Chrome DevTools 顯示 Service Worker 正常運作 / Chrome DevTools shows SW running normally
- [ ] 可以透過瀏覽器「安裝應用程式」 / Can install via browser "Install App"
- [ ] 離線狀態下核心頁面可正常顯示 / Core pages display normally offline
- [ ] Lighthouse PWA 分數 ≥ 90 / Lighthouse PWA score ≥ 90
- [ ] 背景同步功能正常運作 / Background sync works correctly

#### 建議達成 / Should Achieve
- [ ] 推送通知功能運作正常 / Push notifications work correctly
- [ ] 快取策略優化，載入速度提升 / Cache strategy optimized, loading speed improved
- [ ] 同步衝突處理機制 / Sync conflict handling mechanism

### 使用者驗收標準 / User Acceptance Criteria
- [ ] 使用者可以在離線狀態下查看訓練資料 / Users can view workout data offline
- [ ] 離線建立的資料會在重新連線後自動同步 / Offline-created data syncs automatically on reconnection
- [ ] PWA 可以正常安裝到手機桌面 / PWA installs normally to mobile home screen
- [ ] 載入速度明顯改善 / Loading speed noticeably improved

## 9. 風險與緩解策略 / Risks & Mitigation Strategies

### 技術風險 / Technical Risks

#### 瀏覽器相容性 / Browser Compatibility
**風險 / Risk**: 舊版瀏覽器不支援 Service Worker / Older browsers don't support Service Worker  
**緩解 / Mitigation**: 提供降級方案，基本功能仍可使用 / Provide fallback, basic functionality still works

#### 快取空間限制 / Cache Storage Limits
**風險 / Risk**: 快取佔用過多存儲空間 / Cache uses too much storage  
**緩解 / Mitigation**: 實作 LRU 清理策略和配額管理 / Implement LRU cleanup and quota management

#### 同步衝突 / Sync Conflicts  
**風險 / Risk**: 離線資料與伺服器資料衝突 / Offline data conflicts with server data  
**緩解 / Mitigation**: 實作衝突偵測和解決機制 / Implement conflict detection and resolution

### 操作風險 / Operational Risks

#### 部署失敗 / Deployment Failure
**風險 / Risk**: Service Worker 更新導致功能異常 / SW update causes functionality issues  
**緩解 / Mitigation**: 分階段部署，完整回滾機制 / Staged deployment, complete rollback mechanism

## 10. 後續維護 / Future Maintenance

### 監控指標 / Monitoring Metrics
- Service Worker 安裝成功率 / SW installation success rate
- 快取命中率統計 / Cache hit rate statistics  
- 背景同步失敗率 / Background sync failure rate
- PWA 安裝轉換率 / PWA installation conversion rate

### 更新策略 / Update Strategy
- Service Worker 版本管理 / SW version management
- 快取失效策略 / Cache invalidation strategy
- 用戶通知更新機制 / User update notification mechanism

---

**文檔維護 / Document Maintenance**: 請在實作過程中同時更新本文檔 / Please update this document during implementation  
**支援聯絡 / Support Contact**: 如有技術問題請參考相關文檔或聯絡開發團隊 / For technical issues, refer to related docs or contact dev team
