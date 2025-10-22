# 文檔維護流程 / Documentation Maintenance Process

**用途 / Purpose**: 為 Strong Web 專案建立系統化的文檔維護流程，確保文檔的準確性、完整性和可用性 / Establish systematic documentation maintenance process for Strong Web project to ensure accuracy, completeness, and usability  
**適用對象 / Target Audience**: 所有開發者、產品經理、AI Agent / All developers, product managers, AI agents  
**相關文檔 / Related Documents**: [文檔撰寫標準](../DOCUMENTATION_STANDARDS.md) | [主入口 README](../README.md)  
**最後更新 / Last Updated**: 2025-10-22

## 快速導覽 / Quick Navigation
- 如果你要更新文檔 → 看[文檔更新流程](#文檔更新流程--document-update-process) / If you need to update documentation → See [Document Update Process](#文檔更新流程--document-update-process)
- 如果你要新增文檔 → 看[新增文檔流程](#新增文檔流程--adding-new-documents) / If you need to add new documentation → See [Adding New Documents](#新增文檔流程--adding-new-documents)
- 如果你要檢查文檔品質 → 看[品質檢查清單](#品質檢查清單--quality-checklist) / If you need to check document quality → See [Quality Checklist](#品質檢查清單--quality-checklist)
- 如果你要定期維護 → 看[定期維護任務](#定期維護任務--regular-maintenance-tasks) / If you need regular maintenance → See [Regular Maintenance Tasks](#定期維護任務--regular-maintenance-tasks)

## 核心原則 / Core Principles

### 1. 文檔生命週期管理 / Document Lifecycle Management
所有文檔都應該遵循完整的生命週期：**創建 → 審核 → 發佈 → 維護 → 更新 → 歸檔**

All documents should follow a complete lifecycle: **Create → Review → Publish → Maintain → Update → Archive**

### 2. 即時更新原則 / Real-time Update Principle
功能變更時必須**同步更新**相關文檔，不得延後處理

Related documentation **must be updated synchronously** when features change, no delayed processing allowed

### 3. 品質優先原則 / Quality First Principle
文檔品質優於數量，每個文檔都必須準確、完整、有用

Document quality takes precedence over quantity, every document must be accurate, complete, and useful

## 文檔更新流程 / Document Update Process

### 步驟 1：確認更新需求 / Step 1: Confirm Update Requirements
```markdown
更新觸發條件 / Update Triggers:
- ✅ 功能新增/修改 / Feature addition/modification
- ✅ Bug 修復 / Bug fixes  
- ✅ API 變更 / API changes
- ✅ 架構調整 / Architecture adjustments
- ✅ 安全政策更新 / Security policy updates
- ✅ 部署流程變更 / Deployment process changes
```

### 步驟 2：識別影響範圍 / Step 2: Identify Impact Scope
使用以下檢查清單確認需要更新的文檔：

Use the following checklist to confirm documents that need updates:

| 變更類型 / Change Type | 需檢查的文檔 / Documents to Check |
|------------------------|-----------------------------------|
| 新功能 / New Feature | 功能拆解 + 相關規格 + README / Feature breakdown + related specs + README |
| API 變更 / API Change | API 文檔 + 相關模組文檔 / API docs + related module docs |
| 架構調整 / Architecture | 專案結構 + 安全文檔 / Project structure + security docs |
| 測試更新 / Test Update | 測試指南 + 測試報告 / Testing guide + test reports |
| 部署變更 / Deployment | 設定指南 + 安全文檔 / Setup guide + security docs |

### 步驟 3：執行更新 / Step 3: Execute Updates
```bash
# 1. 檢查當前文檔狀態 / Check current document status
git status docs/

# 2. 按照雙語標準更新 / Update according to bilingual standards
# 參考 DOCUMENTATION_STANDARDS.md / Refer to DOCUMENTATION_STANDARDS.md

# 3. 更新相關連結 / Update related links
grep -r "舊連結" docs/ # 搜尋需要更新的連結 / Search for links to update

# 4. 驗證格式正確性 / Verify format correctness  
# 使用品質檢查清單 / Use quality checklist
```

### 步驟 4：審核與發佈 / Step 4: Review and Publish
- **自我審核 / Self Review**: 使用[品質檢查清單](#品質檢查清單--quality-checklist) / Use quality checklist
- **更新主入口 / Update Main Entry**: 如有新文檔，更新 README.md 相關連結 / Update README.md related links if new documents added
- **提交變更 / Commit Changes**: 提供有意義的提交信息 / Provide meaningful commit message

```bash
# 提交範例 / Commit Example
git add docs/
git commit -m "docs: 更新功能拆解文檔，新增 Dashboard 模組雙語版本

- 將 Dashboard 模組轉換為中英雙語格式  
- 更新相關檔案引用連結
- 同步更新 README.md 導覽"
```

## 新增文檔流程 / Adding New Documents

### 1. 確定文檔類型和位置 / Determine Document Type and Location
參考 [文檔標準](../DOCUMENTATION_STANDARDS.md#檔案命名規範--file-naming-convention) 確定：

Refer to [Documentation Standards](../DOCUMENTATION_STANDARDS.md#檔案命名規範--file-naming-convention) to determine:

- 文檔類型前綴 / Document type prefix
- 存放目錄 / Storage directory  
- 檔案命名格式 / File naming format

### 2. 複製標準模板 / Copy Standard Template
```bash
# 複製模板結構 / Copy template structure
cp DOCUMENTATION_STANDARDS.md new_document.md

# 使用標準格式 / Use standard format
# 參考 DOCUMENTATION_STANDARDS.md 中的模板 / Refer to template in DOCUMENTATION_STANDARDS.md
```

### 3. 撰寫雙語內容 / Write Bilingual Content
- **中文在前，英文在後 / Chinese first, English second**
- **完整性檢查 / Completeness check**: 確保兩種語言內容等價 / Ensure equivalent content in both languages
- **格式統一 / Format consistency**: 遵循標準結構 / Follow standard structure

### 4. 更新導覽系統 / Update Navigation System
```markdown
需要更新的文檔 / Documents to Update:
1. README.md - 在相應表格中添加新文檔連結 / Add new document links to appropriate tables
2. 相關模組文檔 - 添加交叉引用 / Add cross-references to related module docs
3. 父級目錄的 README - 如果適用 / Parent directory README if applicable
```

## 品質檢查清單 / Quality Checklist

### 內容完整性檢查 / Content Completeness Check
- [ ] **雙語完整 / Bilingual Complete**: 中英文內容完整且等價 / Complete and equivalent Chinese and English content
- [ ] **結構標準 / Standard Structure**: 使用標準文檔模板 / Uses standard document template
- [ ] **用途明確 / Clear Purpose**: 文檔用途和適用對象清楚 / Clear document purpose and target audience
- [ ] **更新日期 / Update Date**: 「最後更新」日期正確 / "Last Updated" date is correct

### 技術準確性檢查 / Technical Accuracy Check  
- [ ] **代碼示例 / Code Examples**: 代碼示例可執行且正確 / Code examples are executable and correct
- [ ] **連結有效 / Valid Links**: 所有內部連結可正常訪問 / All internal links are accessible
- [ ] **版本一致 / Version Consistency**: 技術資訊與當前版本一致 / Technical information consistent with current version
- [ ] **API 文檔 / API Documentation**: API 端點和參數正確 / API endpoints and parameters are correct

### 可用性檢查 / Usability Check
- [ ] **快速導覽 / Quick Navigation**: 包含實用的快速導覽 / Includes useful quick navigation
- [ ] **搜尋友好 / Search Friendly**: 包含關鍵詞和標籤 / Includes keywords and tags
- [ ] **無障礙性 / Accessibility**: 標題層級正確，易於閱讀 / Correct heading levels, easy to read
- [ ] **行動友好 / Mobile Friendly**: 在小螢幕上也易於閱讀 / Easy to read on small screens

## 定期維護任務 / Regular Maintenance Tasks

### 每月任務 / Monthly Tasks
```bash
# 1. 檢查連結完整性 / Check link integrity
find docs -name "*.md" -exec grep -l "](.*\.md)" {} \; | xargs -I {} bash -c 'echo "檢查文檔: {}" && grep -o "](.*\.md)" {} | grep -v "http"'

# 2. 檢查過期資訊 / Check outdated information  
grep -r "TODO\|FIXME\|待辦" docs/

# 3. 更新測試報告 / Update test reports
# 如有新的測試結果，更新 TEST_REPORT.md / Update TEST_REPORT.md if new test results available
```

### 每季任務 / Quarterly Tasks
- **文檔審核 / Document Review**: 全面審核所有文檔的準確性和相關性 / Comprehensive review of all documents for accuracy and relevance
- **結構優化 / Structure Optimization**: 評估文檔結構是否需要調整 / Evaluate if document structure needs adjustment  
- **用戶反饋 / User Feedback**: 收集和處理用戶對文檔的反饋 / Collect and process user feedback on documentation
- **效能檢查 / Performance Check**: 檢查文檔載入速度和搜尋效能 / Check document loading speed and search performance

### 每年任務 / Annual Tasks
- **全面重構 / Complete Restructuring**: 考慮是否需要重新組織文檔架構 / Consider if documentation architecture needs reorganization
- **標準更新 / Standards Update**: 更新文檔標準和最佳實踐 / Update documentation standards and best practices
- **工具升級 / Tool Upgrades**: 評估文檔工具和流程的升級需求 / Evaluate upgrade needs for documentation tools and processes

## 緊急文檔更新流程 / Emergency Documentation Update Process

### 緊急情況定義 / Emergency Situations Definition
- 🔴 **安全漏洞修復 / Security Vulnerability Fix**: 影響系統安全的重要修復 / Critical fixes affecting system security
- 🔴 **生產環境問題 / Production Issues**: 影響用戶使用的重要問題 / Critical issues affecting user experience  
- 🔴 **API 破壞性變更 / Breaking API Changes**: 向下不相容的 API 變更 / Backward-incompatible API changes

### 緊急更新步驟 / Emergency Update Steps
1. **立即更新 / Immediate Update**: 更新相關技術文檔 / Update relevant technical documentation immediately
2. **通知機制 / Notification**: 更新 README.md 主頁面的「已知問題」區塊 / Update "Known Issues" section in README.md main page
3. **詳細說明 / Detailed Description**: 24 小時內提供完整的變更說明 / Provide complete change description within 24 hours
4. **追蹤修復 / Track Resolution**: 創建或更新相關的修復文檔 / Create or update related fix documentation

## 文檔工具和輔助腳本 / Documentation Tools and Helper Scripts

### 有用的 bash 命令 / Useful Bash Commands
```bash
# 搜尋所有 Markdown 文件中的特定內容 / Search specific content in all Markdown files
grep -r "搜尋詞" docs/ --include="*.md"

# 檢查文檔中的 TODO 項目 / Check TODO items in documentation
find docs -name "*.md" -exec grep -Hn "TODO\|FIXME\|⏳\|待辦" {} \;

# 統計文檔數量和行數 / Count documents and lines
find docs -name "*.md" | wc -l
find docs -name "*.md" -exec wc -l {} \; | awk '{sum+=$1} END {print "總行數:", sum}'

# 檢查雙語完整性 / Check bilingual completeness
find docs -name "*.md" -exec bash -c 'echo "檢查: $1"; chinese=$(grep -o "[\u4e00-\u9fff]" "$1" | wc -l); english=$(grep -o "[a-zA-Z]" "$1" | wc -l); echo "中文字符: $chinese, 英文字符: $english"' _ {} \;
```

### 自動化檢查腳本建議 / Automated Check Script Suggestions
```javascript
// scripts/check-docs.js - 文檔檢查腳本範例 / Documentation check script example
const fs = require('fs');
const path = require('path');

// 檢查文檔是否包含必要的元數據 / Check if documents contain necessary metadata
function checkDocumentMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const requiredFields = ['用途 / Purpose', '適用對象 / Target Audience', '最後更新 / Last Updated'];
  
  return requiredFields.every(field => content.includes(field));
}

// 檢查連結有效性 / Check link validity
function checkLinks(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const links = content.match(/\[.*?\]\((.*?)\)/g) || [];
  
  return links.filter(link => {
    const url = link.match(/\((.*?)\)/)[1];
    if (url.startsWith('http')) return true; // 外部連結暫時跳過 / Skip external links for now
    
    const targetPath = path.resolve(path.dirname(filePath), url);
    return fs.existsSync(targetPath);
  });
}
```

## 文檔品質指標 / Documentation Quality Metrics

### KPI 指標 / KPI Metrics
- **文檔覆蓋率 / Documentation Coverage**: 每個功能模組都有對應文檔 / Every feature module has corresponding documentation
- **更新及時性 / Update Timeliness**: 功能變更後 24 小時內更新文檔 / Update documentation within 24 hours after feature changes
- **連結有效性 / Link Validity**: 內部連結有效率 > 95% / Internal link validity rate > 95%
- **雙語完整性 / Bilingual Completeness**: 所有文檔都包含完整的中英文內容 / All documents contain complete Chinese and English content

### 品質評估週期 / Quality Assessment Cycle
- **日常監控 / Daily Monitoring**: 自動化檢查腳本 / Automated check scripts
- **週度報告 / Weekly Reports**: 文檔更新統計 / Documentation update statistics  
- **月度審核 / Monthly Review**: 全面品質評估 / Comprehensive quality assessment
- **季度改進 / Quarterly Improvement**: 流程和標準優化 / Process and standards optimization

## 故障排除 / Troubleshooting

### 常見問題 / Common Issues

**Q1: 文檔連結失效怎麼處理？/ How to handle broken documentation links?**

A1: 使用以下步驟 / Use the following steps:
```bash
# 1. 找出所有失效連結 / Find all broken links
find docs -name "*.md" -exec grep -l "](.*\.md)" {} \; | xargs grep "](.*\.md)"

# 2. 檢查目標文件是否存在 / Check if target files exist
# 3. 更新連結或移動文件到正確位置 / Update links or move files to correct location
```

**Q2: 雙語內容不對等怎麼辦？/ What to do when bilingual content is not equivalent?**

A2: 
- 參考 [文檔標準](../DOCUMENTATION_STANDARDS.md) 中的雙語要求 / Refer to bilingual requirements in Documentation Standards
- 使用翻譯工具協助，但確保技術術語準確 / Use translation tools but ensure technical terms are accurate
- 請其他團隊成員協助審核 / Ask other team members for review assistance

**Q3: 文檔過多導致維護困難？/ Too many documents making maintenance difficult?**

A3: 
- 定期歸檔過時文檔 / Regularly archive outdated documents
- 合併相似主題的文檔 / Merge documents with similar topics  
- 使用標籤和分類系統 / Use tag and categorization systems
- 強化主入口導覽功能 / Strengthen main entry navigation functionality

## 版本控制最佳實踐 / Version Control Best Practices

### Commit 信息格式 / Commit Message Format
```
docs: 簡短描述 / Brief description

- 詳細說明變更內容 / Detailed description of changes
- 影響的文檔和功能 / Affected documents and features  
- 相關的 issue 或 PR 號碼 / Related issue or PR numbers
```

### 分支策略 / Branching Strategy
- **主分支 / Main Branch**: 只包含穩定的文檔版本 / Only contains stable documentation versions
- **功能分支 / Feature Branch**: 用於大型文檔更新 / For major documentation updates
- **熱修復分支 / Hotfix Branch**: 用於緊急文檔修復 / For emergency documentation fixes

---

## 結語 / Conclusion

良好的文檔維護流程是專案成功的關鍵。遵循此流程能確保 Strong Web 專案的文檔始終保持高品質、準確性和可用性。

Good documentation maintenance process is key to project success. Following this process ensures that Strong Web project documentation always maintains high quality, accuracy, and usability.

所有團隊成員和 AI Agent 都應該熟悉並遵循此流程，共同維護優質的專案文檔。

All team members and AI agents should be familiar with and follow this process to collectively maintain high-quality project documentation.

---

**文檔維護聯絡 / Documentation Maintenance Contact**: 請參考主 README 中的支援資訊 / Please refer to support information in main README

**最後更新 / Last Updated**: 2025-10-22 | **版本 / Version**: v1.0
