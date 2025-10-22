# Strong Web 專案文檔中心 / Strong Web Project Documentation Hub

**用途 / Purpose**: Strong Web 健身訓練 Web 應用程式的完整文檔導覽中心 / Complete documentation navigation hub for Strong Web fitness training web application  
**適用對象 / Target Audience**: 開發者、產品經理、測試人員、運維人員 / Developers, Product Managers, Testers, DevOps Engineers  
**專案類型 / Project Type**: Next.js 15 + Supabase + TypeScript 健身應用 / Next.js 15 + Supabase + TypeScript Fitness Application  
**最後更新 / Last Updated**: 2025-10-22

## 專案概覽 / Project Overview

Strong Web 是一個現代化的健身訓練記錄 Web 應用程式，支援離線使用、數據統計分析和跨平台同步。採用 Next.js 15 App Router、Supabase 後端、TypeScript 開發，具備完整的 PWA 支援。

Strong Web is a modern fitness training record web application that supports offline usage, data analytics, and cross-platform synchronization. Built with Next.js 15 App Router, Supabase backend, TypeScript, and complete PWA support.

### 核心功能 / Core Features
- 🏋️ **訓練管理 / Workout Management**: CRUD 操作、動作庫、自訂動作 / CRUD operations, exercise library, custom exercises
- 📊 **數據分析 / Data Analytics**: 歷史統計、1RM 估算、訓練趨勢 / Historical statistics, 1RM estimation, training trends  
- 🔐 **用戶認證 / User Authentication**: Email/OAuth 登入、密碼重設 / Email/OAuth login, password reset
- 📱 **PWA 支援 / PWA Support**: 離線功能、可安裝 / Offline functionality, installable
- ⚙️ **個人設定 / Personal Settings**: 單位切換、主題、多語系 / Unit conversion, themes, multilingual

### 技術架構 / Tech Stack
- **前端 / Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **後端 / Backend**: Supabase (Auth + Database + Edge Functions)
- **測試 / Testing**: Jest (Unit), Playwright (E2E)
- **部署 / Deployment**: Vercel (Frontend), Supabase (Backend)

## 🚀 快速開始 / Quick Start

### 第一次接手此專案 / First Time Working on This Project
如果你是第一次接觸此專案，請依序閱讀：

If this is your first time working on this project, please read in order:

1. **[專案結構說明 / Project Structure](docs/architecture/ARCH_專案結構.md)** - 了解整體架構 / Understand overall architecture
2. **[環境設定指南 / Environment Setup](docs/setup/SETUP_Supabase環境配置.md)** - 配置開發環境 / Configure development environment  
3. **[功能模組拆解 / Feature Breakdown](docs/architecture/ARCH_功能模組拆解.md)** - 深入了解各功能模組 / Deep dive into feature modules
4. **[測試指南 / Testing Guide](docs/development/GUIDE_測試指南.md)** - 學習測試流程 / Learn testing processes

### 按角色快速導覽 / Quick Navigation by Role

#### 🏗️ 開發者 / Developer
- **架構理解 / Architecture Understanding**: [專案結構](docs/architecture/ARCH_專案結構.md) | [功能拆解](docs/architecture/ARCH_功能模組拆解.md)
- **開發環境 / Development Environment**: [Supabase 設定](docs/setup/SETUP_Supabase環境配置.md) | [測試指南](docs/development/GUIDE_測試指南.md)  
- **安全規範 / Security Guidelines**: [安全文檔](docs/architecture/ARCH_安全架構.md)
- **功能規格 / Feature Specs**: [主規格文檔](docs/specs/SPEC_主要功能規格.md) | [Dashboard 規格](docs/specs/SPEC_Dashboard模組.md)

#### 📋 產品經理 / Product Manager  
- **需求概覽 / Requirements Overview**: [主規格文檔](docs/specs/SPEC_主要功能規格.md) | [功能拆解](docs/architecture/ARCH_功能模組拆解.md)
- **進度追蹤 / Progress Tracking**: [測試報告](docs/reports/REPORT_測試結果.md) | [功能拆解進度表](docs/architecture/ARCH_功能模組拆解.md#進度追蹤表)
- **功能規格 / Feature Specifications**: [Dashboard 模組](docs/specs/SPEC_Dashboard模組.md) | [休息計時器](docs/specs/SPEC_休息計時器.md)

#### 🧪 測試人員 / Tester
- **測試策略 / Testing Strategy**: [測試指南](docs/development/GUIDE_測試指南.md)
- **測試報告 / Test Reports**: [最新測試報告](docs/reports/REPORT_測試結果.md) | [衝突檢查](docs/reports/REPORT_衝突檢查.md)
- **環境配置 / Environment Setup**: [Supabase 設定](docs/setup/SETUP_Supabase環境配置.md)

#### 🚀 運維人員 / DevOps Engineer
- **部署指南 / Deployment Guide**: [Supabase 設定](docs/setup/SETUP_Supabase環境配置.md)  
- **安全配置 / Security Configuration**: [安全文檔](docs/architecture/ARCH_安全架構.md)
- **監控報告 / Monitoring Reports**: [測試報告](docs/reports/REPORT_測試結果.md)

## 📋 按工作場景導覽 / Navigation by Work Scenario

### 🔧 開發新功能 / Developing New Features
1. **查看需求 / Check Requirements**: [功能拆解](docs/architecture/ARCH_功能模組拆解.md) → 找到對應模組 / Find relevant module
2. **了解架構 / Understand Architecture**: [專案結構](docs/architecture/ARCH_專案結構.md) → 確認檔案位置 / Confirm file locations
3. **參考規格 / Reference Specs**: 查看 `docs/specs/` 下的相關規格文檔 / Check relevant spec docs under `docs/specs/`
4. **撰寫測試 / Write Tests**: [測試指南](docs/development/GUIDE_測試指南.md) → 單元測試和 E2E 測試 / Unit and E2E testing

### 🐛 修復問題 / Fixing Issues  
1. **檢查狀態 / Check Status**: [測試報告](docs/reports/REPORT_測試結果.md) → 了解已知問題 / Understand known issues
2. **查看架構 / Review Architecture**: [專案結構](docs/architecture/ARCH_專案結構.md) → 定位問題檔案 / Locate problem files
3. **安全檢查 / Security Check**: [安全文檔](docs/architecture/ARCH_安全架構.md) → 確認安全影響 / Confirm security impact
4. **測試驗證 / Test Validation**: [測試指南](docs/development/GUIDE_測試指南.md) → 驗證修復 / Validate fixes

### 📊 檢查專案狀態 / Checking Project Status
1. **整體狀況 / Overall Status**: [測試報告](docs/reports/REPORT_測試結果.md) → 最新專案健康狀況 / Latest project health status
2. **功能進度 / Feature Progress**: [功能拆解](docs/architecture/ARCH_功能模組拆解.md#進度追蹤表) → 各模組完成度 / Module completion status  
3. **衝突狀況 / Conflict Status**: [衝突檢查](docs/reports/REPORT_衝突檢查.md) → Git 合併狀態 / Git merge status
4. **技術債務 / Technical Debt**: 查看測試報告中的待修復項目 / Check pending fixes in test reports

### 🚢 部署上線 / Deployment
1. **環境準備 / Environment Preparation**: [Supabase 設定](docs/setup/SETUP_Supabase環境配置.md) → 配置生產環境 / Configure production environment
2. **安全檢查 / Security Check**: [安全文檔](docs/architecture/ARCH_安全架構.md) → RLS 和權限驗證 / RLS and permission validation
3. **測試驗證 / Test Validation**: [測試指南](docs/development/GUIDE_測試指南.md) → 完整測試流程 / Complete testing process
4. **最終檢查 / Final Check**: [測試報告](docs/reports/REPORT_測試結果.md) → 確認所有測試通過 / Confirm all tests pass

## 📚 完整文檔清單 / Complete Documentation List

### 架構文檔 / Architecture Documentation
| 文檔名稱 / Document | 用途 / Purpose | 適用對象 / Audience |
|-------------------|----------------|-------------------|
| [專案結構說明 / Project Structure](docs/architecture/ARCH_專案結構.md) | 整體架構和目錄結構說明 / Overall architecture and directory structure | 所有開發者 / All developers |
| [功能模組拆解 / Feature Breakdown](docs/architecture/ARCH_功能模組拆解.md) | 詳細功能模組設計和進度追蹤 / Detailed feature module design and progress tracking | 開發者、PM / Developers, PM |
| [安全文檔 / Security Documentation](docs/architecture/ARCH_安全架構.md) | 安全架構、RLS 政策、認證流程 / Security architecture, RLS policies, authentication | 開發者、運維 / Developers, DevOps |

### 功能規格 / Feature Specifications  
| 文檔名稱 / Document | 用途 / Purpose | 適用對象 / Audience |
|-------------------|----------------|-------------------|
| [主規格文檔 / Main Specification](docs/specs/SPEC_主要功能規格.md) | MoSCoW 需求分類和整體功能需求 / MoSCoW requirements and overall feature requirements | PM、開發者 / PM, Developers |
| [Dashboard 規格 / Dashboard Specification](docs/specs/SPEC_Dashboard模組.md) | 儀表板模組詳細執行規格 / Detailed dashboard module execution spec | 前端開發者 / Frontend developers |
| [休息計時器規格 / Rest Timer Specification](docs/specs/SPEC_休息計時器.md) | 休息計時器功能詳細規格 / Detailed rest timer functionality spec | 前端開發者 / Frontend developers |

### 設定指南 / Setup Guides
| 文檔名稱 / Document | 用途 / Purpose | 適用對象 / Audience |  
|-------------------|----------------|-------------------|
| [Supabase 設定指南 / Supabase Setup Guide](docs/setup/SETUP_Supabase環境配置.md) | 資料庫環境設定和遷移指南 / Database environment setup and migration guide | 開發者、運維 / Developers, DevOps |
| [1RM 修復指南 / 1RM Migration Fix](docs/setup/SETUP_1RM功能修復指南.md) | 1RM 分析功能的手動修復指南 / Manual fix guide for 1RM analysis functionality | 開發者、運維 / Developers, DevOps |

### 開發指南 / Development Guides
| 文檔名稱 / Document | 用途 / Purpose | 適用對象 / Audience |
|-------------------|----------------|-------------------|  
| [測試指南 / Testing Guide](docs/development/GUIDE_測試指南.md) | 單元測試和 E2E 測試執行指南 / Unit and E2E testing execution guide | 開發者、測試 / Developers, Testers |
| [PWA 實作摘要 / PWA Implementation Summary](docs/development/GUIDE_PWA實作摘要.md) | PWA Service Worker 實作的快速執行摘要 / Quick execution summary for PWA Service Worker implementation | 開發者快速參考 / Developer quick reference |
| [PWA Service Worker 計劃 / PWA Service Worker Plan](docs/development/GUIDE_PWA_Service_Worker實作計劃.md) | PWA Service Worker 缺失問題的完整技術實作規劃 / Complete technical implementation plan for missing PWA Service Worker issue | 前端開發者、DevOps / Frontend developers, DevOps |

### 測試報告 / Test Reports
| 文檔名稱 / Document | 用途 / Purpose | 適用對象 / Audience |
|-------------------|----------------|-------------------|
| [測試報告 / Test Report](docs/reports/REPORT_測試結果.md) | 最新的專案測試結果和狀態 / Latest project test results and status | 所有角色 / All roles |
| [衝突檢查 / Conflict Check](docs/reports/REPORT_衝突檢查.md) | Git 合併衝突解決記錄 / Git merge conflict resolution records | 開發者 / Developers |

### 專案管理 / Project Management  
| 文檔名稱 / Document | 用途 / Purpose | 適用對象 / Audience |
|-------------------|----------------|-------------------|
| [專案整理總結 / Reorganization Summary](docs/SUMMARY_專案整理總結.md) | 專案結構重整的歷史記錄 / Historical record of project structure reorganization | 開發者 / Developers |

### 文檔標準 / Documentation Standards
| 文檔名稱 / Document | 用途 / Purpose | 適用對象 / Audience |  
|-------------------|----------------|-------------------|
| [文檔撰寫標準 / Documentation Standards](DOCUMENTATION_STANDARDS.md) | 統一的雙語文檔撰寫規範 / Unified bilingual documentation writing standards | 所有文檔撰寫者、AI Agent / All doc writers, AI agents |
| [文檔維護流程 / Documentation Maintenance](docs/MAINTENANCE_文檔維護流程.md) | 系統化的文檔維護和更新流程 / Systematic documentation maintenance and update process | 所有開發者、產品經理、AI Agent / All developers, PMs, AI agents |

## 🔍 專案當前狀態 / Current Project Status

### ✅ 已完成功能 / Completed Features
- 用戶認證系統（Email + OAuth）/ User authentication system (Email + OAuth)
- 訓練 CRUD 操作 / Workout CRUD operations  
- 動作庫管理 / Exercise library management
- 歷史記錄和統計 / History and statistics
- 基礎 PWA 支援 / Basic PWA support
- 個人設定功能 / Personal settings functionality

### 🚧 進行中功能 / In Progress Features  
- Dashboard 模組視覺化 / Dashboard module visualization
- 1RM 分析功能 / 1RM analysis functionality  
- 休息計時器 / Rest timer
- 進階 PWA 功能 / Advanced PWA features

### ❌ 待開發功能 / Pending Features
- 完整的離線同步 / Complete offline synchronization
- 身體測量模組 / Body measurement module  
- 外部 API 整合 / External API integration
- 進階監控和安全 / Advanced monitoring and security

### ⚠️ 已知問題 / Known Issues
- TypeScript 型別錯誤 30 個（不影響運行）/ 30 TypeScript type errors (not affecting runtime)
- Node.js 18 版本警告（建議升級到 20+）/ Node.js 18 version warning (recommend upgrade to 20+)  
- E2E 測試環境需要配置 / E2E test environment needs configuration

詳細狀態請參考：[最新測試報告 / Latest Test Report](docs/reports/REPORT_測試結果.md)

For detailed status, see: [Latest Test Report](docs/reports/REPORT_測試結果.md)

## 📖 文檔維護指南 / Documentation Maintenance Guide

### 文檔更新原則 / Document Update Principles
- **雙語要求 / Bilingual Requirement**: 所有文檔必須包含中英文 / All documents must include Chinese and English
- **統一格式 / Unified Format**: 遵循 [文檔撰寫標準](DOCUMENTATION_STANDARDS.md) / Follow [Documentation Standards](DOCUMENTATION_STANDARDS.md)
- **及時更新 / Timely Updates**: 功能變更時同步更新相關文檔 / Update related docs when features change
- **連結完整性 / Link Integrity**: 定期檢查內部連結是否有效 / Regularly check internal links validity

### 新增文檔流程 / Adding New Documents Process
1. **確認類型和位置 / Confirm Type and Location**: 根據 [文檔標準](DOCUMENTATION_STANDARDS.md) 確定文檔分類 / Determine document classification per documentation standards
2. **使用標準模板 / Use Standard Template**: 複製標準格式模板 / Copy standard format template  
3. **雙語撰寫 / Bilingual Writing**: 中英文並行撰寫 / Write in Chinese and English simultaneously
4. **更新本文檔 / Update This Document**: 在相應表格中添加新文檔連結 / Add new document links to appropriate tables

### AI Agent 文檔撰寫 / AI Agent Documentation
所有 AI Agent 在撰寫或更新文檔時，必須：

All AI agents when writing or updating documents must:

- 遵循 [文檔撰寫標準](DOCUMENTATION_STANDARDS.md) / Follow [Documentation Standards](DOCUMENTATION_STANDARDS.md)
- 使用雙語格式（中文在前，英文在後）/ Use bilingual format (Chinese first, English second)  
- 包含完整的文檔結構（用途、適用對象、快速導覽等）/ Include complete document structure (purpose, audience, quick navigation, etc.)
- 更新本 README 中的相關連結 / Update relevant links in this README

## 🚀 快速命令 / Quick Commands

### 開發命令 / Development Commands
```bash
# 安裝依賴 / Install dependencies
pnpm install

# 啟動開發伺服器 / Start development server  
pnpm dev

# 執行測試 / Run tests
pnpm test                # 單元測試 / Unit tests
pnpm test:e2e           # E2E 測試 / E2E tests
pnpm type-check         # 型別檢查 / Type checking

# 資料庫相關 / Database related
node scripts/test-supabase-connection.js  # 測試資料庫連接 / Test database connection
pnpm run setup:db                         # 自動設定資料庫 / Auto setup database
```

### 文檔相關 / Documentation Related  
```bash
# 檢查文檔連結 / Check document links
find docs -name "*.md" -exec grep -l "](.*\.md)" {} \;

# 搜尋文檔內容 / Search document content
grep -r "關鍵字" docs/
```

---

## 📞 支援和聯絡 / Support and Contact

### 技術支援 / Technical Support
- **專案問題 / Project Issues**: 參考 [測試報告](docs/reports/REPORT_測試結果.md) 中的常見問題 / Refer to common issues in test reports
- **環境設定 / Environment Setup**: 查看 [Supabase 設定指南](docs/setup/SETUP_Supabase環境配置.md) / Check Supabase setup guide
- **開發問題 / Development Issues**: 參考 [專案結構說明](docs/architecture/ARCH_專案結構.md) / Reference project structure documentation

### 文檔回饋 / Documentation Feedback  
- **文檔問題 / Document Issues**: 請按照 [文檔標準](DOCUMENTATION_STANDARDS.md) 提出改進建議 / Submit improvement suggestions per documentation standards
- **內容更新 / Content Updates**: 遵循雙語更新流程 / Follow bilingual update process

---

**歡迎使用 Strong Web 專案！/ Welcome to Strong Web Project!**

此文檔是您的導覽中心，包含了專案的完整資訊。建議將此頁面加入書籤以便快速訪問。

This document is your navigation hub containing complete project information. We recommend bookmarking this page for quick access.

**最後更新 / Last Updated**: 2025-10-22 | **文檔版本 / Document Version**: v2.0
