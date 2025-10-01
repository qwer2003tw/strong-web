export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Messages = {
  app: { name: string };
  nav: {
    workouts: string;
    history: string;
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
  history: {
    title: string;
    lastSynced: string;
    rangeLabel: string;
    range: {
      "7d": string;
      "30d": string;
    };
    refresh: string;
    trend: {
      title: string;
      volume: string;
    };
    summary: {
      title: string;
      activeRange: string;
      "7d": string;
      "30d": string;
    };
    empty: {
      title: string;
      description: string;
    };
    entry: {
      sets: string;
      reps: string;
      volume: string;
    };
    tooltip: {
      label: string;
      volume: string;
    };
  };
};

const messages: Record<Locale, Messages> = {
  en: {
    app: { name: "Strong Web" },
    nav: {
      workouts: "Workouts",
      history: "History",
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
    history: {
      title: "History",
      lastSynced: "Last synced {timestamp}",
      rangeLabel: "Range",
      range: {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
      },
      refresh: "Refresh",
      trend: {
        title: "Training trend",
        volume: "Training volume",
      },
      summary: {
        title: "Summary",
        activeRange: "Selected range",
        "7d": "Last 7 days",
        "30d": "Last 30 days",
      },
      empty: {
        title: "No sessions yet",
        description: "Your recent workouts will appear here once you start logging entries.",
      },
      entry: {
        sets: "Sets",
        reps: "Reps",
        volume: "Volume",
      },
      tooltip: {
        label: "Total volume",
        volume: "kg",
      },
    },
  },
  zh: {
    app: { name: "Strong Web" },
    nav: {
      workouts: "訓練",
      history: "歷史",
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
    history: {
      title: "歷史紀錄",
      lastSynced: "最後同步時間 {timestamp}",
      rangeLabel: "範圍",
      range: {
        "7d": "最近 7 天",
        "30d": "最近 30 天",
      },
      refresh: "重新整理",
      trend: {
        title: "訓練趨勢",
        volume: "訓練量",
      },
      summary: {
        title: "摘要",
        activeRange: "選定範圍",
        "7d": "最近 7 天",
        "30d": "最近 30 天",
      },
      empty: {
        title: "尚無訓練紀錄",
        description: "開始紀錄訓練後，最新的訓練紀錄將顯示在這裡。",
      },
      entry: {
        sets: "組數",
        reps: "次數",
        volume: "總訓練量",
      },
      tooltip: {
        label: "總訓練量",
        volume: "公斤",
      },
    },
  },
};

export async function getMessages(locale: Locale): Promise<Messages> {
  return messages[locale] ?? messages[defaultLocale];
}
