export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Messages = {
  app: { name: string };
  nav: {
    workouts: string;
    exercises: string;
    settings: string;
    signOut: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    oauth: string;
    noAccount: string;
    haveAccount: string;
  };
  workouts: {
    title: string;
    empty: string;
    create: string;
    name: string;
    schedule: string;
    status: string;
    notes: string;
    save: string;
    delete: string;
    detail: string;
  };
  exercises: {
    title: string;
    create: string;
    empty: string;
  };
  settings: {
    title: string;
    unit: string;
    theme: string;
    profile: string;
  };
  offline: {
    readonly: string;
  };
};

const messages: Record<Locale, Messages> = {
  en: {
    app: { name: "Strong Web" },
    nav: {
      workouts: "Workouts",
      exercises: "Exercises",
      settings: "Settings",
      signOut: "Sign out",
    },
    auth: {
      signIn: "Sign in",
      signUp: "Create account",
      email: "Email",
      password: "Password",
      oauth: "Continue with",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
    },
    workouts: {
      title: "Your workouts",
      empty: "No workouts yet. Create your first plan!",
      create: "New workout",
      name: "Workout name",
      schedule: "Schedule",
      status: "Status",
      notes: "Notes",
      save: "Save workout",
      delete: "Delete workout",
      detail: "Workout detail",
    },
    exercises: {
      title: "Exercise library",
      create: "Add exercise",
      empty: "No exercises recorded yet.",
    },
    settings: {
      title: "Settings",
      unit: "Preferred unit",
      theme: "Theme",
      profile: "Profile",
    },
    offline: {
      readonly: "You are offline. Changes will be available when connection is restored.",
    },
  },
  zh: {
    app: { name: "Strong Web" },
    nav: {
      workouts: "訓練",
      exercises: "動作庫",
      settings: "設定",
      signOut: "登出",
    },
    auth: {
      signIn: "登入",
      signUp: "建立帳號",
      email: "電子郵件",
      password: "密碼",
      oauth: "使用以下帳號登入",
      noAccount: "還沒有帳號嗎？",
      haveAccount: "已經有帳號了嗎？",
    },
    workouts: {
      title: "你的訓練",
      empty: "目前沒有訓練計畫，建立一個吧！",
      create: "新增訓練",
      name: "訓練名稱",
      schedule: "排程",
      status: "狀態",
      notes: "備註",
      save: "儲存訓練",
      delete: "刪除訓練",
      detail: "訓練明細",
    },
    exercises: {
      title: "動作庫",
      create: "新增動作",
      empty: "目前沒有任何動作記錄。",
    },
    settings: {
      title: "設定",
      unit: "偏好單位",
      theme: "主題",
      profile: "個人資料",
    },
    offline: {
      readonly: "目前處於離線狀態，變更將在連線恢復後可用。",
    },
  },
};

export async function getMessages(locale: Locale): Promise<Messages> {
  return messages[locale] ?? messages[defaultLocale];
}
