// 建立測試使用者帳號
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 載入環境變數
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

async function createTestUser() {
    console.log('🔍 建立測試使用者...\n');

    const testEmail = 'test@strongweb.com';
    const testPassword = 'Test123456!';

    try {
        // 註冊測試帳號
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: {
                    full_name: 'Test User',
                }
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                console.log('ℹ️  測試帳號已存在');
                console.log('\n📧 測試帳號資訊:');
                console.log('   Email:', testEmail);
                console.log('   Password:', testPassword);
                return true;
            }
            throw error;
        }

        console.log('✅ 測試帳號建立成功！');
        console.log('\n📧 測試帳號資訊:');
        console.log('   Email:', testEmail);
        console.log('   Password:', testPassword);

        if (data.user) {
            console.log('   User ID:', data.user.id);

            // 檢查是否需要確認 email
            if (data.user.confirmed_at) {
                console.log('   狀態: ✅ 已確認');
            } else {
                console.log('\n⚠️  注意: 如果 Supabase 啟用了 Email 確認，您需要：');
                console.log('   1. 前往 Supabase Dashboard > Authentication > Users');
                console.log('   2. 找到該使用者並點擊 "Confirm Email"');
                console.log('   或在 Supabase Dashboard > Authentication > Email Templates');
                console.log('   關閉 "Confirm email" 設定');
            }
        }

        return true;
    } catch (err) {
        console.error('❌ 建立失敗:', err.message);
        return false;
    }
}

createTestUser()
    .then((success) => {
        console.log('\n✨ 完成！您現在可以使用上述帳號登入應用程式。');
        process.exit(success ? 0 : 1);
    })
    .catch((err) => {
        console.error('❌ 過程發生錯誤:', err);
        process.exit(1);
    });
