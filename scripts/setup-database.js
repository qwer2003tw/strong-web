#!/usr/bin/env node

/**
 * Strong Web 資料庫自動初始化腳本
 * Database Auto Setup Script for Strong Web
 * 
 * 此腳本會自動設定所有必要的資料庫表格、索引、觸發器和 RLS 策略
 * This script automatically sets up all necessary database tables, indexes, triggers, and RLS policies
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 顏色輸出 / Color output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// 輔助函數 / Helper functions
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, total, message) {
    log(`\n[${step}/${total}] ${message}...`, colors.cyan);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

// 主要設定函數 / Main setup function
async function setupDatabase() {
    log('\n' + '='.repeat(60), colors.bright);
    log('🚀 Strong Web 資料庫初始化腳本', colors.bright);
    log('🚀 Strong Web Database Setup Script', colors.bright);
    log('='.repeat(60) + '\n', colors.bright);

    const totalSteps = 6;
    let currentStep = 0;

    try {
        // Step 1: 檢查環境變數 / Check environment variables
        currentStep++;
        logStep(currentStep, totalSteps, '檢查環境變數 / Checking environment variables');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            logError('環境變數未設定 / Environment variables not set');
            logInfo('請確保 .env.local 檔案包含以下變數：');
            logInfo('Please ensure .env.local contains:');
            console.log('  NEXT_PUBLIC_SUPABASE_URL=your-project-url');
            console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
            process.exit(1);
        }

        logSuccess('環境變數已設定 / Environment variables found');

        // Step 2: 測試連接 / Test connection
        currentStep++;
        logStep(currentStep, totalSteps, '測試 Supabase 連接 / Testing Supabase connection');

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 測試連接
        const { data: testData, error: testError } = await supabase
            .from('_test')
            .select('*')
            .limit(1);

        // 如果是表不存在的錯誤，那是正常的
        if (testError && !testError.message.includes('does not exist')) {
            logError(`連接失敗 / Connection failed: ${testError.message}`);
            process.exit(1);
        }

        logSuccess('成功連接到 Supabase / Successfully connected to Supabase');

        // Step 3: 讀取 Schema 檔案 / Read schema file
        currentStep++;
        logStep(currentStep, totalSteps, '讀取資料庫 Schema / Reading database schema');

        const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

        if (!fs.existsSync(schemaPath)) {
            logError('找不到 schema.sql 檔案 / schema.sql file not found');
            logInfo(`預期路徑 / Expected path: ${schemaPath}`);
            process.exit(1);
        }

        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        logSuccess(`Schema 檔案已讀取 / Schema file loaded (${schemaSQL.length} 字元)`);

        // Step 4: 執行 Schema / Execute schema
        currentStep++;
        logStep(currentStep, totalSteps, '建立資料庫結構 / Creating database structure');
        logInfo('這可能需要幾秒鐘... / This may take a few seconds...');

        // 分割 SQL 語句並逐一執行
        const statements = schemaSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const statement of statements) {
            if (statement.length < 10) continue; // 跳過太短的語句

            const { error } = await supabase.rpc('exec_sql', {
                sql_query: statement + ';'
            }).catch(async (rpcError) => {
                // 如果 exec_sql 函數不存在，使用替代方法
                // 我們需要使用 service_role key 來執行原始 SQL
                logWarning('無法使用 RPC 執行 SQL，請手動執行 schema.sql');
                logWarning('Cannot execute SQL via RPC, please run schema.sql manually');
                return { error: rpcError };
            });

            if (error) {
                // 某些錯誤是可以接受的（如表已存在）
                if (
                    error.message?.includes('already exists') ||
                    error.message?.includes('duplicate key') ||
                    error.message?.includes('already defined')
                ) {
                    // 這些是預期的錯誤
                } else {
                    errorCount++;
                    errors.push({ statement: statement.substring(0, 100), error: error.message });
                }
            } else {
                successCount++;
            }
        }

        if (errorCount > 0) {
            logWarning(`執行過程中有 ${errorCount} 個錯誤 / ${errorCount} errors occurred`);
            if (errorCount > 10) {
                logError('錯誤太多，建議手動執行 schema.sql / Too many errors, please run schema.sql manually');
                logInfo('在 Supabase Dashboard 的 SQL Editor 中執行 supabase/schema.sql');
                logInfo('Execute supabase/schema.sql in Supabase Dashboard SQL Editor');
            } else {
                errors.forEach(({ statement, error }) => {
                    logInfo(`語句 / Statement: ${statement}...`);
                    logInfo(`錯誤 / Error: ${error}`);
                });
            }
        }

        logSuccess('資料庫結構建立完成 / Database structure created');

        // Step 5: 驗證設定 / Verify setup
        currentStep++;
        logStep(currentStep, totalSteps, '驗證設定 / Verifying setup');

        // 檢查表格
        const tables = ['profiles', 'exercises', 'workouts', 'workout_entries'];
        let tablesFound = 0;

        for (const table of tables) {
            const { error } = await supabase.from(table).select('id').limit(1);
            if (!error) {
                tablesFound++;
            }
        }

        if (tablesFound === tables.length) {
            logSuccess(`所有 ${tables.length} 個表格已建立 / All ${tables.length} tables created`);
        } else {
            logWarning(`找到 ${tablesFound}/${tables.length} 個表格 / Found ${tablesFound}/${tables.length} tables`);
        }

        // Step 6: 完成 / Complete
        currentStep++;
        logStep(currentStep, totalSteps, '設定完成 / Setup complete');

        log('\n' + '='.repeat(60), colors.bright);
        log('✨ 資料庫初始化完成！ / Database initialization complete!', colors.green);
        log('='.repeat(60), colors.bright);

        log('\n📊 設定摘要 / Setup Summary:', colors.bright);
        log(`  - 表格數量 / Tables: ${tablesFound}/${tables.length}`);
        log(`  - Schema 語句 / Schema statements: ${statements.length}`);
        log(`  - 成功執行 / Successful: ${successCount}`);
        if (errorCount > 0) {
            log(`  - 錯誤 / Errors: ${errorCount}`, colors.yellow);
        }

        log('\n📝 下一步 / Next Steps:', colors.bright);
        log('  1. 執行 pnpm dev 啟動開發伺服器');
        log('     Run pnpm dev to start development server');
        log('  2. 訪問 http://localhost:3000/sign-up 註冊測試帳號');
        log('     Visit http://localhost:3000/sign-up to create a test account');
        log('  3. 開始開發！/ Start developing!');

        if (errorCount > 10) {
            log('\n⚠️  注意 / Note:', colors.yellow);
            log('  由於執行了太多錯誤，建議手動檢查資料庫設定');
            log('  Due to many errors, please manually verify database setup');
            log('  在 Supabase Dashboard 的 SQL Editor 中執行 supabase/schema.sql');
            log('  Execute supabase/schema.sql in Supabase Dashboard SQL Editor');
        }

        log('');

    } catch (error) {
        logError(`\n發生錯誤 / Error occurred: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// 檢查是否直接執行 / Check if running directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };
