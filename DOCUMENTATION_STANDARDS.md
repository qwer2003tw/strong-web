# 文檔撰寫標準 / Documentation Standards

**用途 / Purpose**: 為所有 Strong Web 專案文檔制定統一的雙語撰寫標準 / Establish unified bilingual documentation standards for all Strong Web project documents  
**適用對象 / Target Audience**: 所有參與文檔撰寫的開發者和 AI Agent / All developers and AI agents involved in documentation writing  
**最後更新 / Last Updated**: 2025-10-22

## 核心原則 / Core Principles

### 1. 雙語要求 / Bilingual Requirement
- **強制性雙語**: 所有文檔必須同時包含中文和英文 / **Mandatory Bilingual**: All documents must include both Chinese and English
- **語言順序**: 中文在前，英文在後 / **Language Order**: Chinese first, English second
- **完整性**: 兩種語言的內容必須完整且等價 / **Completeness**: Both languages must be complete and equivalent

### 2. 格式統一 / Format Consistency
- 所有文檔使用統一的結構和格式 / All documents use unified structure and format
- 標題、段落、列表都要保持雙語 / Headings, paragraphs, and lists must be bilingual
- 代碼註釋和示例說明也要雙語 / Code comments and examples must be bilingual

## 文檔結構模板 / Document Structure Template

```markdown
# 文檔標題 / Document Title

**用途 / Purpose**: 中文說明 / English description  
**適用對象 / Target Audience**: 中文說明 / English description  
**相關文檔 / Related Documents**: [連結 / Links]  
**最後更新 / Last Updated**: YYYY-MM-DD

## 快速導覽 / Quick Navigation
- 如果你要做 X → 看第 N 節 / If you need to do X → See Section N
- 如果你要做 Y → 看第 M 節 / If you need to do Y → See Section M

## 主要內容 / Main Content

### 子標題 / Subsection Title
中文內容...

English content...

#### 更細的標題 / Detailed Subsection
中文說明...

English explanation...

## 代碼示例 / Code Examples

```bash
# 中文註釋 / English comment
command --flag value
```

## 相關連結 / Related Links
- [中文描述 / English Description](path/to/file)

---
**文檔維護 / Document Maintenance**: 請在更新時同時維護中英文內容 / Please maintain both Chinese and English content when updating
```

## 檔案命名規範 / File Naming Convention

### 命名格式 / Naming Format
```
類型_具體名稱.md / TYPE_SPECIFIC_NAME.md
```

### 類型前綴 / Type Prefixes
| 中文類型 | 英文類型 | 前綴 | 示例 |
|---------|---------|------|------|
| 功能規格 | Feature Spec | `FEATURE_` | `FEATURE_訓練管理.md` |
| 架構文檔 | Architecture | `ARCH_` | `ARCH_資料庫設計.md` |
| 設定指南 | Setup Guide | `SETUP_` | `SETUP_環境配置.md` |
| 開發指南 | Development Guide | `GUIDE_` | `GUIDE_開發流程.md` |
| 測試報告 | Test Report | `REPORT_` | `REPORT_測試結果.md` |
| API 規格 | API Specification | `API_` | `API_REST接口.md` |

### 檔案組織 / File Organization
```
docs/
├── README.md                    # 主入口 / Main entry
├── DOCUMENTATION_STANDARDS.md  # 本文檔 / This document
├── architecture/               # 架構文檔 / Architecture docs
├── features/                   # 功能規格 / Feature specs  
├── setup/                      # 設定指南 / Setup guides
├── development/                # 開發指南 / Development guides
├── api/                        # API 文檔 / API documentation
└── reports/                    # 報告 / Reports
```

## 撰寫規則 / Writing Rules

### 1. 標題層級 / Heading Levels
```markdown
# 主標題 / Main Title (H1)
## 主要章節 / Major Section (H2)  
### 子章節 / Subsection (H3)
#### 詳細說明 / Details (H4)
```

### 2. 段落格式 / Paragraph Format
- 中文段落在前 / Chinese paragraph first
- 空一行 / Leave one blank line
- 英文段落在後 / English paragraph second
- 再空一行進入下一段 / Another blank line before next section

### 3. 列表格式 / List Format
```markdown
中文標題 / English Title:
- 中文項目 / English item
- 中文項目 / English item
```

### 4. 表格格式 / Table Format
```markdown
| 中文標題 / English Header | 中文標題 / English Header |
|---------------------------|---------------------------|
| 中文內容 / English content | 中文內容 / English content |
```

### 5. 代碼塊 / Code Blocks
```markdown
```語言
// 中文註釋 / English comment
code here
```
```

## 質量檢查清單 / Quality Checklist

創建或更新文檔時，請檢查以下項目 / When creating or updating documents, check the following:

### 內容完整性 / Content Completeness
- [ ] 包含完整的中英文標題 / Complete Chinese and English titles
- [ ] 所有段落都有雙語版本 / All paragraphs have bilingual versions
- [ ] 代碼註釋和示例都是雙語 / Code comments and examples are bilingual
- [ ] 相關連結描述是雙語 / Related link descriptions are bilingual

### 格式一致性 / Format Consistency  
- [ ] 使用標準的文檔結構模板 / Uses standard document structure template
- [ ] 檔案命名符合規範 / File naming follows convention
- [ ] 標題層級正確 / Heading levels are correct
- [ ] 表格和列表格式統一 / Tables and lists follow unified format

### 可用性 / Usability
- [ ] 包含快速導覽部分 / Includes quick navigation section
- [ ] 相關文檔連結完整 / Related document links are complete
- [ ] 更新日期正確 / Update date is correct
- [ ] 適用對象明確 / Target audience is clear

## Agent 撰寫指引 / Agent Writing Guidelines

### 對於 AI Agent / For AI Agents
當你需要創建或更新文檔時 / When you need to create or update documents:

1. **必須遵循雙語要求** / **Must follow bilingual requirement**
   - 每個段落都要中英文 / Every paragraph must be bilingual
   - 不可跳過任何語言版本 / Cannot skip any language version

2. **使用標準模板** / **Use standard template**
   - 複製本文檔的結構模板 / Copy the structure template from this document
   - 填入適當的內容 / Fill in appropriate content

3. **檢查連結完整性** / **Check link integrity**
   - 確保所有連結有效 / Ensure all links are valid
   - 連結描述要雙語 / Link descriptions must be bilingual

4. **保持格式一致** / **Maintain format consistency**
   - 遵循命名規範 / Follow naming convention
   - 使用統一的標題格式 / Use unified heading format

### 常見錯誤避免 / Common Mistakes to Avoid
- ❌ 只寫中文或只寫英文 / Writing only Chinese or only English
- ❌ 中英文內容不對等 / Unequal Chinese and English content  
- ❌ 忘記更新「最後更新」日期 / Forgetting to update "Last Updated" date
- ❌ 檔案命名不規範 / Non-standard file naming
- ❌ 缺少快速導覽部分 / Missing quick navigation section

## 維護流程 / Maintenance Process

### 文檔更新流程 / Document Update Process
1. **修改內容** / **Modify Content**: 同時更新中英文版本 / Update both Chinese and English versions simultaneously
2. **更新日期** / **Update Date**: 修改「最後更新」日期 / Modify "Last Updated" date  
3. **檢查連結** / **Check Links**: 驗證所有內部連結 / Verify all internal links
4. **格式檢查** / **Format Check**: 使用質量檢查清單 / Use quality checklist
5. **提交變更** / **Commit Changes**: 提供有意義的提交信息 / Provide meaningful commit message

### 定期審查 / Regular Review
- 每季度審查文檔是否需要更新 / Quarterly review if documents need updates
- 檢查連結是否失效 / Check for broken links  
- 確認內容是否與實際功能一致 / Confirm content matches actual functionality

---

**重要提醒 / Important Reminder**: 此標準為強制性要求，所有文檔都必須遵循 / These standards are mandatory requirements that all documents must follow

**支援 / Support**: 如有疑問，請參考現有的雙語文檔示例 / For questions, refer to existing bilingual document examples
