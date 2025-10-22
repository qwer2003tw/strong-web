import { test, expect, Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";

export interface TestUser {
    email: string;
    password: string;
    id?: string;
}

// 創建測試專用的 Supabase 客戶端
function createTestSupabaseClient(useServiceRole: boolean = false) {
    // 直接使用測試環境的 Supabase 配置
    const supabaseUrl = "https://rmrrewoywkjdjnxfskvm.supabase.co";
    const supabaseKey = useServiceRole
        ? "sb_secret_oiYpId6p3VLscZWDGpR06w_bB74jRvU"  // Service Role Key for admin operations
        : "sb_publishable_R3mRiwGPxxKkCfQS6MY0pw_qncFUqzL"; // Anon Key for regular operations

    return createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// 生成唯一的測試用戶
export function generateTestUser(): TestUser {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    return {
        email: `test-${timestamp}-${randomId}@example.com`,
        password: 'testpassword123', // 符合8字符最低要求
    };
}

// 創建測試用戶
export async function createTestUser(user: TestUser): Promise<TestUser> {
    const supabase = createTestSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
    });

    if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
    }

    return {
        ...user,
        id: data.user?.id,
    };
}

// 登入測試用戶
export async function signInTestUser(user: TestUser): Promise<void> {
    const supabase = createTestSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
    });

    if (error) {
        throw new Error(`Failed to sign in test user: ${error.message}`);
    }
}

// 清理測試用戶的數據
export async function cleanupTestUserData(user: TestUser): Promise<void> {
    const supabase = createTestSupabaseClient();

    try {
        // 確保用戶 ID 存在
        if (!user.id) {
            console.warn('Cannot cleanup test user data: user ID is missing');
            return;
        }

        // 首先登入用戶以獲得權限刪除其數據
        await signInTestUser(user);

        // 獲取用戶的 workouts 以便刪除相關的 workout_entries
        const { data: workouts } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', user.id);

        // 刪除用戶的 workout entries（基於 workout IDs）
        if (workouts && workouts.length > 0) {
            const workoutIds = workouts.map((w: { id: string }) => w.id);
            await supabase
                .from('workout_entries')
                .delete()
                .in('workout_id', workoutIds);
        }

        // 刪除用戶的 workouts
        await supabase
            .from('workouts')
            .delete()
            .eq('user_id', user.id);

        // 刪除用戶的 exercises
        await supabase
            .from('exercises')
            .delete()
            .eq('user_id', user.id);

        // 刪除用戶的 profile
        await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

        // 登出
        await supabase.auth.signOut();
    } catch (error) {
        console.warn('Failed to cleanup test user data:', error);
        // 不拋出錯誤，因為清理失敗不應該讓測試失敗
    }
}

// Playwright 測試輔助函數：在頁面中登入用戶
export async function signInUserOnPage(page: Page, user: TestUser): Promise<void> {
    await page.goto('/sign-in');

    // 填寫登入表單
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/password/i).fill(user.password);

    // 點擊登入按鈕
    await page.getByRole('button', { name: /sign in/i }).click();

    // 等待重定向到 workouts 頁面
    await expect(page).toHaveURL(/\/workouts/);
}

// Playwright 測試輔助函數：在頁面中註冊用戶
export async function signUpUserOnPage(page: Page, user: TestUser): Promise<void> {
    await page.goto('/sign-up');

    // 填寫註冊表單
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/password/i).fill(user.password);

    // 點擊註冊按鈕
    await page.getByRole('button', { name: /create account/i }).click();

    // 等待重定向到 workouts 頁面
    await expect(page).toHaveURL(/\/workouts/);
}

// Playwright 測試輔助函數：登出用戶
export async function signOutUserOnPage(page: Page): Promise<void> {
    // 這裡需要根據實際的登出UI來調整
    // 如果有登出按鈕，點擊它
    // 否則可以直接導航到登入頁面
    await page.goto('/sign-in');
}

// 測試 setup 和 teardown hooks
export function setupTestUser() {
    let testUser: TestUser;

    test.beforeEach(async () => {
        // 生成新的測試用戶
        testUser = generateTestUser();
        // 創建用戶（這會同時創建 auth 用戶和 profiles 記錄）
        testUser = await createTestUser(testUser);
    });

    test.afterEach(async () => {
        // 清理測試用戶的數據
        if (testUser?.id) {
            await cleanupTestUserData(testUser);
        }
    });

    // 返回函數來獲取當前測試用戶
    return () => testUser;
}
