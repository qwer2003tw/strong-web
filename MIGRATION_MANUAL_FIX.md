# 手動修復 1RM 分析功能

## 問題描述

1RM (一次最大重複) 分析功能返回 404 錯誤，因為 Supabase 資料庫中缺少 `get_one_rep_max` RPC 函數。

## 解決方案

### 步驟 1: 開啟 Supabase Dashboard

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的項目 (URL: https://rmrrewoywkjdjnxfskvm.supabase.co)
3. 點擊左側導航的 **SQL Editor**

### 步驟 2: 執行修正的 Migration SQL

⚠️ **重要更新**: 原始函數有 SQL 語法錯誤，請使用以下修正版本:

在 SQL Editor 中執行以下完整 SQL 代碼:

```sql
-- ============================================
-- One Rep Max analytics helper (修正版本)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_one_rep_max(
  exercise_ids uuid[] DEFAULT NULL,
  from_date date DEFAULT NULL,
  to_date date DEFAULT NULL,
  method text DEFAULT 'epley'
)
RETURNS TABLE (
  exercise_id uuid,
  exercise_name text,
  performed_on date,
  estimated_1rm numeric,
  reps integer,
  weight numeric,
  unit text,
  source_entry_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  method_safe text := lower(coalesce(method, 'epley'));
BEGIN
  IF method_safe NOT IN ('epley', 'brzycki') THEN
    RAISE EXCEPTION USING MESSAGE = 'Unsupported 1RM method', ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH filtered_entries AS (
    SELECT
      we.id AS entry_id,
      we.exercise_id,
      e.name AS exercise_name,
      COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) AS performed_on,
      we.reps,
      we.weight,
      we.unit
    FROM workout_entries we
    JOIN workouts w ON w.id = we.workout_id
    JOIN exercises e ON e.id = we.exercise_id
    WHERE w.user_id = auth.uid()
      AND we.weight IS NOT NULL
      AND we.weight > 0
      AND we.reps IS NOT NULL
      AND we.reps > 0
      AND (method_safe <> 'brzycki' OR we.reps < 37)
      AND (exercise_ids IS NULL OR we.exercise_id = ANY(exercise_ids))
      AND (from_date IS NULL OR COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) >= from_date)
      AND (to_date IS NULL OR COALESCE((w.scheduled_for AT TIME ZONE 'UTC')::date, (we.created_at AT TIME ZONE 'UTC')::date) <= to_date)
  ),
  ranked_entries AS (
    SELECT
      fe.entry_id,
      fe.exercise_id,
      fe.exercise_name,
      fe.performed_on,
      fe.reps,
      fe.weight,
      fe.unit,
      CASE
        WHEN method_safe = 'brzycki' THEN fe.weight * (36::numeric / (37 - fe.reps))
        ELSE fe.weight * (1 + fe.reps::numeric / 30)
      END AS estimated_1rm,
      ROW_NUMBER() OVER (
        PARTITION BY fe.exercise_id, fe.performed_on
        ORDER BY
          CASE
            WHEN method_safe = 'brzycki' THEN fe.weight * (36::numeric / (37 - fe.reps))
            ELSE fe.weight * (1 + fe.reps::numeric / 30)
          END DESC
      ) AS rank
    FROM filtered_entries fe
  )
  SELECT
    re.exercise_id,
    re.exercise_name,
    re.performed_on,
    re.estimated_1rm,
    re.reps,
    re.weight,
    re.unit,
    re.entry_id AS source_entry_id
  FROM ranked_entries re
  WHERE re.rank = 1
  ORDER BY re.performed_on ASC, re.exercise_name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_one_rep_max(uuid[], date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_one_rep_max(uuid[], date, date, text) TO anon;
```

**修正說明**: 
- 在 `ranked_entries` CTE 中添加了適當的表格別名 (`fe.`)
- 在最終 SELECT 中添加了適當的表格別名 (`re.`)
- 這解決了 PostgreSQL 的 "column reference is ambiguous" 錯誤

### 步驟 3: 點擊 "RUN" 按鈕

執行成功後，您應該看到 "Success" 消息。

### 步驟 4: 驗證修復

執行以下命令來測試函數是否正常工作:

```bash
node scripts/test-rpc-function.js
```

## 預期結果

修復成功後，您應該看到:
- ✅ 基本連接成功
- ✅ RPC 函數調用成功！

## 故障排除

### 如果仍然出現 404 錯誤:

1. **檢查表格是否存在**: 確保 `profiles`, `exercises`, `workouts`, `workout_entries` 表格都已創建
2. **重新執行 schema**: 執行 `supabase/schema.sql` 中的完整 schema
3. **清除緩存**: 在 Supabase Dashboard 中重新啟動項目

### 如果出現權限錯誤:

確保您使用的是有足夠權限的 Supabase 帳號來執行 SQL。

### 如果函數創建成功但仍有錯誤:

檢查是否有數據在 `workout_entries` 表格中，因為空表會返回空結果但不會報錯。

## 聯繫支持

如果問題持續存在，請提供:
1. Supabase Dashboard 中 SQL Editor 的執行結果截圖
2. 測試腳本的完整輸出
3. 任何錯誤消息的詳細信息
