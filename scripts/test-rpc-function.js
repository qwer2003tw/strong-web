// 測試 Supabase RPC 函數
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 載入 .env.local 從項目根目錄
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
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 缺少環境變數');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'Missing');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'OK' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpcFunction() {
    console.log('🔍 測試 Supabase 連接和 RPC 函數...\n');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

    try {
        // 測試基本連接
        console.log('1. 測試基本資料庫連接...');
        const { data: healthCheck, error: healthError } = await supabase
            .from('profiles')
            .select('count')
            .limit(0);

        if (healthError && healthError.code !== 'PGRST116') {
            throw healthError;
        }
        console.log('✅ 基本連接成功\n');

        // 測試 RPC 函數是否存在
        console.log('2. 測試 get_one_rep_max RPC 函數...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_one_rep_max', {
            exercise_ids: null,
            from_date: null,
            to_date: null,
            method: 'epley'
        });

        if (rpcError) {
            console.log('❌ RPC 函數調用失敗');
            console.log('錯誤代碼:', rpcError.code);
            console.log('錯誤信息:', rpcError.message);
            console.log('錯誤詳情:', rpcError);
            return false;
        }

        console.log('✅ RPC 函數調用成功！');
        console.log('返回數據:', Array.isArray(rpcData) ? `${rpcData.length} 條記錄` : rpcData);
        return true;

    } catch (err) {
        console.error('❌ 測試失敗:', err.message);
        console.error('詳細錯誤:', err);
        return false;
    }
}

testRpcFunction()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((err) => {
        console.error('❌ 測試過程發生錯誤:', err);
        process.exit(1);
    });
