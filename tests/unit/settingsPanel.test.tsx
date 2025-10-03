import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "@/components/features/settings/settings-panel";
import type { ThemePreference } from "@/types/db";
import { upsertUserProfile } from "@/lib/services/authService";

type SupabaseMock = {
  auth: {
    getUser: jest.Mock;
  };
};

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

let supabaseClientMock: SupabaseMock;
jest.mock("@/components/features/providers/supabase-session-provider", () => ({
  useSupabaseClient: () => supabaseClientMock,
}));

jest.mock("@/lib/services/authService", () => ({
  upsertUserProfile: jest.fn(),
}));

let themeValue: ThemePreference = "system";
const setThemeMock = jest.fn();
jest.mock("@/components/features/providers/theme-provider", () => ({
  useTheme: () => ({ theme: themeValue, setTheme: setThemeMock }),
}));

describe("SettingsPanel", () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const realCreateElement = document.createElement.bind(document);

  let createElementSpy: jest.SpyInstance;
  const upsertUserProfileMock = upsertUserProfile as jest.MockedFunction<typeof upsertUserProfile>;

  beforeEach(() => {
    supabaseClientMock = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { email: "user@example.com" } }, error: null }),
      },
    } as unknown as SupabaseMock;
    refreshMock.mockReset();
    setThemeMock.mockReset();
    themeValue = "system";
    upsertUserProfileMock.mockReset();
    window.localStorage.clear();
    (global as typeof globalThis).fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    if (createElementSpy) {
      createElementSpy.mockRestore();
    }
    createElementSpy = jest.spyOn(document, "createElement");
  });

  afterAll(() => {
    if (createElementSpy) {
      createElementSpy.mockRestore();
    }
    (global as typeof globalThis).fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  function renderPanel(overrides: Partial<Parameters<typeof SettingsPanel>[0]> = {}) {
    const profile = overrides.profile ?? ({
      id: "user-123",
      full_name: "Existing User",
      unit_preference: "metric",
      locale: "en",
      theme_preference: "system",
      created_at: "",
      updated_at: "",
    } as any);

    const userId = overrides.userId ?? "user-123";

    return render(<SettingsPanel profile={profile} userId={userId} />);
  }

  it("saves profile changes successfully", async () => {
    upsertUserProfileMock.mockResolvedValue({ id: "user-123" } as any);
    renderPanel();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByText("Settings updated")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });

    expect(upsertUserProfileMock).toHaveBeenCalledWith(
      "user-123",
      {
        email: "user@example.com",
        full_name: "Existing User",
        locale: "en",
        unit_preference: "metric",
        theme: "system",
      },
      { client: supabaseClientMock }
    );
  });

  it("shows an error when saving fails", async () => {
    upsertUserProfileMock.mockRejectedValue(new Error("Failed to update profile"));
    renderPanel();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to update profile")).toBeInTheDocument();
    });
  });

  it("updates theme and unit selections", async () => {
    upsertUserProfileMock.mockResolvedValue({ id: "user-123" } as any);
    renderPanel();

    const unitSelect = screen.getByLabelText("settings.unit") as HTMLSelectElement;
    const user = userEvent.setup();
    await user.selectOptions(unitSelect, "imperial");
    expect(unitSelect.value).toBe("imperial");

    const themeSelect = screen.getByLabelText("settings.theme");
    await user.selectOptions(themeSelect, "dark");
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("downloads the export payload", async () => {
    const exportData = { foo: "bar" };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(exportData),
    });
    (global as typeof globalThis).fetch = fetchMock as any;

    const urlMock = jest.fn().mockReturnValue("blob:mock");
    const revokeMock = jest.fn();
    URL.createObjectURL = urlMock as any;
    URL.revokeObjectURL = revokeMock as any;

    const anchor = document.createElement("a");
    const clickMock = jest.fn();
    anchor.click = clickMock;

    createElementSpy.mockImplementation(((tagName: string) => {
      if (tagName === "a") {
        return anchor;
      }
      return realCreateElement(tagName);
    }) as typeof document.createElement);

    renderPanel();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /export data/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/export");
    });

    expect(clickMock).toHaveBeenCalled();
    expect(anchor.href).toBe("blob:mock");
    expect(anchor.download).toMatch(/^strong-web-export-/);
    expect(urlMock).toHaveBeenCalled();
    expect(revokeMock).toHaveBeenCalledWith("blob:mock");
  });

  it("restores a stored success message on mount", () => {
    window.localStorage.setItem("strong-web-settings-success", "Settings updated");

    renderPanel();

    expect(screen.getByText("Settings updated")).toBeInTheDocument();
    expect(window.localStorage.getItem("strong-web-settings-success")).toBeNull();
  });
});
