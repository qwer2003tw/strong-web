# 安全文件 / Security Documentation

## 概述 / Overview

本文件概述了 Strong Web 中實施的安全措施，以保護用戶數據並確保系統完整性。

This document outlines the security measures implemented in Strong Web to protect user data and ensure system integrity.

## 認證與授權 / Authentication & Authorization

### 認證方法 / Authentication Methods

1. **電子郵件/密碼認證 / Email/Password Authentication**
   - 密碼長度至少為 8 個字元 / Passwords must be at least 8 characters long
   - 密碼雜湊由 Supabase Auth 處理 / Password hashing handled by Supabase Auth
   - 提供電子郵件驗證 / Email verification available

2. **OAuth 提供者 / OAuth Providers**
   - GitHub OAuth
   - Google OAuth
   - Apple OAuth（計劃中 / planned）

3. **密碼重設流程 / Password Reset Flow**
   - 基於安全令牌的密碼重設 / Secure token-based password reset
   - 重設連結在設定的時間後過期 / Reset links expire after a set time period
   - 需要電子郵件驗證 / Email verification required

### Session 管理 / Session Management

- Session 由 Supabase Auth 管理 / Sessions managed by Supabase Auth
- 安全的 HTTP-only cookies / Secure HTTP-only cookies
- 自動 session 更新 / Automatic session refresh
- 受保護的路由會將未認證的用戶重定向 / Protected routes redirect unauthenticated users

### 用戶身份驗證 / User Authentication Verification

**重要安全實踐：** 在驗證身份時，必須使用 `supabase.auth.getUser()` 而非 `supabase.auth.getSession()`。

**Important Security Practice**: Always use `supabase.auth.getUser()` instead of `supabase.auth.getSession()` for authentication verification.

- `getUser()` 透過聯繫 Supabase Auth server 來驗證用戶 / `getUser()` validates the user by contacting the Supabase Auth server
- `getSession()` 僅從本地存儲/cookies 讀取，可能包含未驗證的數據 / `getSession()` only reads from local storage/cookies and may contain unverified data
- 伺服器端認證必須使用 `getUser()` 以確保安全 / Server-side authentication must use `getUser()` for security

**實作範例 / Implementation**:
```typescript
// ✅ 安全：使用 Auth server 驗證用戶身份
// ✅ SECURE: Verify user identity with Auth server
const { data: { user }, error } = await supabase.auth.getUser();
if (!user || error) {
  redirect('/sign-in');
}

// ❌ 不安全：Session 數據可能被竄改
// ❌ INSECURE: Session data may be tampered with
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  redirect('/sign-in');
}
```

**應用位置 / Where Applied**:
- `app/layout.tsx` - 根佈局認證 / Root layout authentication
- `app/(dashboard)/layout.tsx` - 受保護的儀表板路由 / Protected dashboard routes
- `app/api/*` 中的所有 API 路由處理器 / All API route handlers in `app/api/*`

## 行級安全性 (RLS) / Row Level Security (RLS)

### 概述 / Overview

所有主要表格都啟用了行級安全性，以確保用戶只能訪問自己的數據。

Row Level Security is enabled on all main tables to ensure users can only access their own data.

### 受影響的表格 / Affected Tables

1. **profiles** - 用戶個人資料信息 / User profile information
2. **exercises** - 用戶的自定義練習 / User's custom exercises
3. **workouts** - 用戶的訓練計劃 / User's workout plans
4. **workout_entries** - 個別訓練記錄 / Individual workout entries

### RLS 策略 / RLS Policies

#### profiles 表格 / profiles Table

- **SELECT**: 用戶只能查看自己的個人資料 / Users can view only their own profile
- **INSERT**: 用戶只能創建自己的個人資料 / Users can create only their own profile
- **UPDATE**: 用戶只能更新自己的個人資料 / Users can update only their own profile
- **DELETE**: 不允許（個人資料應該軟刪除）/ Not allowed (profiles should be soft-deleted)

#### exercises 表格 / exercises Table

- **SELECT**: 用戶只能查看自己的練習 / Users can view only their own exercises
- **INSERT**: 用戶可以為自己創建練習 / Users can create exercises for themselves
- **UPDATE**: 用戶只能更新自己的練習 / Users can update only their own exercises
- **DELETE**: 用戶只能刪除自己的練習 / Users can delete only their own exercises

#### workouts 表格 / workouts Table

- **SELECT**: 用戶只能查看自己的訓練 / Users can view only their own workouts
- **INSERT**: 用戶可以為自己創建訓練 / Users can create workouts for themselves
- **UPDATE**: 用戶只能更新自己的訓練 / Users can update only their own workouts
- **DELETE**: 用戶只能刪除自己的訓練 / Users can delete only their own workouts

#### workout_entries 表格 / workout_entries Table

- **SELECT**: 用戶可以查看自己訓練的記錄 / Users can view entries for their own workouts
- **INSERT**: 用戶可以為自己的訓練創建記錄 / Users can create entries for their own workouts
- **UPDATE**: 用戶可以更新自己訓練的記錄 / Users can update entries for their own workouts
- **DELETE**: 用戶可以刪除自己訓練的記錄 / Users can delete entries for their own workouts

注意：workout_entries 策略通過父 workout 記錄檢查所有權。

Note: workout_entries policies check ownership through the parent workout record.

## 數據隱私 / Data Privacy

### 個人信息 / Personal Information

- 電子郵件地址存儲在 Supabase Auth 中 / Email addresses are stored in Supabase Auth
- 用戶個人資料包含最少的個人信息 / User profiles contain minimal personal information
- 未經同意不收集敏感健康數據 / No sensitive health data is collected without consent

### 數據導出 / Data Export

- 用戶可以以 CSV/JSON 格式導出數據 / Users can export their data in CSV/JSON format
- 導出包括所有訓練、練習和記錄 / Export includes all workouts, exercises, and entries
- 導出請求通過已認證的 API 安全處理 / Export requests are processed securely through authenticated API

### 數據保留 / Data Retention

- 帳戶活躍期間保留用戶數據 / User data is retained while account is active
- 刪除帳戶會移除所有相關數據 / Account deletion removes all associated data
- 備份保留遵循 Supabase 政策 / Backup retention follows Supabase policies

## API 安全性 / API Security

### 速率限制 / Rate Limiting

- 在敏感端點實施速率限制（計劃中）/ Rate limiting implemented on sensitive endpoints (planned)
- 防止暴力攻擊 / Prevents brute force attacks
- API 濫用保護 / API abuse protection

### 輸入驗證 / Input Validation

- 驗證所有用戶輸入 / All user inputs are validated
- 電子郵件格式驗證 / Email format validation
- 密碼強度要求 / Password strength requirements
- 通過參數化查詢防止 SQL 注入 / SQL injection prevention through parameterized queries

### CORS 策略 / CORS Policy

- 僅限於允許的來源 / Restricted to allowed origins
- 防止未經授權的跨域請求 / Prevents unauthorized cross-origin requests

## 審計日誌 / Audit Logging

### 計劃功能 / Planned Features

- 用戶認證事件 / User authentication events
- 數據修改追蹤 / Data modification tracking
- 安全事件監控 / Security event monitoring
- 合規審計追蹤 / Compliance audit trails

## 部署安全性 / Deployment Security

### 環境變數 / Environment Variables

- 敏感密鑰存儲在環境變數中 / Sensitive keys stored in environment variables
- 絕不提交到版本控制 / Never committed to version control
- 開發/生產使用不同的密鑰 / Different keys for development/production

### HTTPS/TLS

- 所有流量使用 TLS 加密 / All traffic encrypted with TLS
- 自動 HTTPS 強制執行 / Automatic HTTPS enforcement
- 安全的 cookie 傳輸 / Secure cookie transmission

## 安全最佳實踐 / Security Best Practices

### 對於開發者 / For Developers

1. 絕不提交密鑰或 API 金鑰 / Never commit secrets or API keys
2. 始終對敏感數據使用環境變數 / Always use environment variables for sensitive data
3. 徹底測試 RLS 策略 / Test RLS policies thoroughly
4. 保持依賴項更新 / Keep dependencies updated
5. 遵循安全編碼指南 / Follow secure coding guidelines

### 對於用戶 / For Users

1. 使用強而獨特的密碼 / Use strong, unique passwords
2. 啟用雙因素認證（可用時）/ Enable two-factor authentication (when available)
3. 謹慎對待 OAuth 權限 / Be cautious with OAuth permissions
4. 定期檢查帳戶活動 / Regularly review account activity

## 事件響應 / Incident Response

### 安全事件 / Security Incidents

1. 識別並遏制事件 / Identify and contain the incident
2. 評估影響 / Assess the impact
3. 必要時通知受影響的用戶 / Notify affected users if necessary
4. 實施修復 / Implement fixes
5. 記錄經驗教訓 / Document lessons learned

### 報告安全問題 / Reporting Security Issues

如果您發現安全漏洞，請發送電子郵件至 security@example.com（請更新為實際電子郵件）。

If you discover a security vulnerability, please email security@example.com (update with actual email).

## 合規性 / Compliance

### GDPR 合規性 / GDPR Compliance

- 用戶數據導出功能 / User data export capability
- 刪除權 / Right to deletion
- 透明的數據使用 / Transparent data usage
- 同意管理 / Consent management

### 數據處理 / Data Processing

- 根據隱私政策處理數據 / Data processed in accordance with privacy policy
- 第三方服務經過安全審查 / Third-party services vetted for security
- 定期安全審計 / Regular security audits

## 遷移腳本 / Migration Scripts

### 應用 RLS / Applying RLS

```bash
# 按順序應用 RLS 遷移
# Apply RLS migrations in order
supabase db push supabase/migrations/20250102_enable_rls.sql
supabase db push supabase/migrations/20250102_rls_policies.sql
```

### 回滾 RLS / Rolling Back RLS

```bash
# 僅在出現問題時使用
# Only use in case of issues
supabase db push supabase/migrations/20250102_rollback_rls.sql
```

### 驗證 RLS / Verifying RLS

```sql
-- 檢查已啟用 RLS 的表格
-- Check enabled RLS tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- 檢查所有策略
-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 測試安全性 / Testing Security

### RLS 測試 / RLS Testing

1. 以不同用戶身份測試 / Test as different users
2. 嘗試訪問其他用戶的數據 / Attempt to access other users' data
3. 驗證所有 CRUD 操作 / Verify all CRUD operations
4. 檢查策略性能 / Check policy performance

### 認證測試 / Authentication Testing

1. 測試密碼重設流程 / Test password reset flow
2. 驗證 OAuth 集成 / Verify OAuth integrations
3. 測試 session 過期 / Test session expiration
4. 檢查路由保護 / Check route protection

## 安全檢查清單 / Security Checklist

- [x] 所有表格啟用行級安全性 / Row Level Security enabled on all tables
- [x] RLS 策略已創建並測試 / RLS policies created and tested
- [x] 密碼重設功能已實施 / Password reset functionality implemented
- [x] 所有表單的輸入驗證 / Input validation on all forms
- [ ] API 端點的速率限制 / Rate limiting on API endpoints
- [ ] 審計日誌系統 / Audit logging system
- [ ] 雙因素認證 / Two-factor authentication
- [ ] 安全標頭配置 / Security headers configured
- [ ] 滲透測試完成 / Penetration testing completed
- [ ] 安全文件完整 / Security documentation complete

## 更新 / Updates

本文件應在以下情況下進行審查和更新：

This document should be reviewed and updated whenever:

- 添加新的安全功能 / New security features are added
- 安全政策變更 / Security policies change
- 發現並修復漏洞 / Vulnerabilities are discovered and fixed
- 合規要求變更 / Compliance requirements change

---

**最後更新 / Last Updated**: 2025-10-02  
**下次審查 / Next Review**: 2025-11-02
