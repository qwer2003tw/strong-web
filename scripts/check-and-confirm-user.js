// 查詢並確認測試使用者
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ 缺少環境變數（需要 SUPABASE_SERVICE_ROLE_KEY）');
    process.exit(1);
}

// 使用 Service Role Key 建立管理員客戶端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkAndConfirmUser() {
    console.log('🔍 查詢 Supabase 使用者...\n');

    try {
        // 使用 Admin API 查詢所有使用者
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw listError;
        }

        console.log(`找到 ${users.users.length} 個使用者：\n`);

        if (users.users.length === 0) {
            console.log('⚠️  資料庫中沒有任何使用者');
            console.log('\n📝 建議：重新執行 node create-test-user.js');
            return false;
        }

        // 顯示所有使用者
        users.users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   ID: ${user.id}`);
            console.log(`   確認狀態: ${user.email_confirmed_at ? '✅ 已確認' : '❌ 未確認'}`);
            console.log(`   建立時間: ${new Date(user.created_at).toLocaleString('zh-TW')}`);
            console.log('');
        });

        // 尋找測試帳號
        const testUser = users.users.find(u => u.email === 'test@strongweb.com');

        if (testUser) {
            console.log('✅ 找到測試帳號: test@strongweb.com\n');

            if (!testUser.email_confirmed_at) {
                console.log('🔧 正在確認 email...');

                // 使用 Admin API 更新使用者
                const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
                    testUser.id,
                    { email_confirm: true }
                );

                if (updateError) {
                    throw updateError;
                }

                console.log('✅ Email 已確認！');
                console.log('\n📧 測試帳號資訊:');
                console.log('   Email: test@strongweb.com');
                console.log('   Password: Test123456!');
                console.log('\n✨ 您現在可以使用此帳號登入了！');
                return true;
            } else {
                console.log('✅ Email 已經是確認狀態');
                console.log('\n📧 測試帳號資訊:');
                console.log('   Email: test@strongweb.com');
                console.log('   Password: Test123456!');
                console.log('\n✨ 您可以直接使用此帳號登入！');
                return true;
            }
        } else {
            console.log('⚠️  找不到測試帳號 test@strongweb.com');
            console.log('\n📝 建議：執行以下命令建立測試帳號');
            console.log('   node create-test-user.js');
            return false;
        }

    } catch (err) {
        console.error('❌ 操作失敗:', err.message);
        if (err.message.includes('Invalid API key')) {
            console.log('\n💡 提示：請確認 SUPABASE_SERVICE_ROLE_KEY 是否正確');
        }
        return false;
    }
}

checkAndConfirmUser()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((err) => {
        console.error('❌ 過程發生錯誤:', err);
        process.exit(1);
    });
