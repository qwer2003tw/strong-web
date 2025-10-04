// 部署 get_one_rep_max 函數到 Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 載入 .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ 缺少環境變數');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'OK' : 'Missing');
    process.exit(1);
}

// 使用 service role key 創建客戶端
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deployFunction() {
    console.log('🚀 部署 get_one_rep_max 函數...\n');
    console.log('URL:', supabaseUrl);
    console.log('Service Role Key:', serviceRoleKey.substring(0, 20) + '...\n');

    try {
        // 讀取 migration 文件
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250115_add_one_rep_max_function.sql');

        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration 文件不存在:', migrationPath);
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('✅ 讀取 migration 文件成功\n');

        // 分割 SQL 語句
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 10 && !s.startsWith('--'));

        console.log(`📝 準備執行 ${statements.length} 個 SQL 語句...\n`);

        // 執行每個語句
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`執行語句 ${i + 1}/${statements.length}...`);

            // 使用原生 SQL 執行
            const { data, error } = await supabase
                .from('_dummy_table_that_does_not_exist')
                .select('*')
                .limit(0);

            // 嘗試使用 rpc 執行原始 SQL（如果有的話）
            try {
                const result = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    },
                    body: JSON.stringify({ query: statement })
                });

                if (!result.ok) {
                    // 如果直接 API 調用失敗，嘗試通過其他方式
                    console.log('⚠️  無法通過 REST API 執行 SQL');
                    break;
                }
            } catch (fetchError) {
                console.log('⚠️  無法通過 REST API 執行 SQL');
                break;
            }
        }

        console.log('\n📋 部署完成，測試函數...\n');

        // 測試函數是否存在
        const { data: testData, error: testError } = await supabase.rpc('get_one_rep_max', {
            exercise_ids: null,
            from_date: null,
            to_date: null,
            method: 'epley'
        });

        if (testError) {
            console.log('❌ 函數測試失敗');
            console.log('錯誤:', testError);
            console.log('\n🔧 手動部署指南:');
            console.log('1. 開啟 Supabase Dashboard');
            console.log('2. 前往 SQL Editor');
            console.log('3. 執行以下 SQL:\n');
            console.log(migrationSQL);
            return false;
        }

        console.log('✅ 函數部署並測試成功！');
        console.log('返回:', Array.isArray(testData) ? `${testData.length} 條記錄` : testData);
        return true;

    } catch (err) {
        console.error('❌ 部署失敗:', err.message);
        console.error(err);
        return false;
    }
}

deployFunction()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((err) => {
        console.error('❌ 部署過程發生錯誤:', err);
        process.exit(1);
    });
