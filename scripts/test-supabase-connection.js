// 簡單的 Supabase 連接測試腳本
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手動載入 .env.local
const envPath = path.join(__dirname, '.env.local');
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔍 測試 Supabase 連接...\n');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

    try {
        // 測試資料庫連接
        const { data: tables, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST116') {
                console.log('⚠️  資料表尚未建立或 RLS 政策未設定');
                console.log('錯誤詳情:', error.message);
                return false;
            }
            throw error;
        }

        console.log('✅ 資料庫連接成功！');
        console.log('✅ profiles 表可以存取');
        return true;
    } catch (err) {
        console.error('❌ 連接失敗:', err.message);
        return false;
    }
}

testConnection()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((err) => {
        console.error('❌ 測試過程發生錯誤:', err);
        process.exit(1);
    });
