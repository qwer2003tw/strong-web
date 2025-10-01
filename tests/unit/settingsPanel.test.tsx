import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "@/components/features/settings/settings-panel";
import type { ThemePreference } from "@/lib/database.types";

type SupabaseMock = {
  from: jest.Mock;
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

  let upsertMock: jest.Mock;
  let createElementSpy: jest.SpyInstance;

  beforeEach(() => {
    upsertMock = jest.fn();
    supabaseClientMock = {
      from: jest.fn().mockReturnValue({ upsert: upsertMock }),
    } as unknown as SupabaseMock;
    refreshMock.mockReset();
    setThemeMock.mockReset();
    themeValue = "system";
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
    upsertMock.mockResolvedValue({ error: null });
    renderPanel();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByText("Settings updated")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });

    expect(supabaseClientMock.from).toHaveBeenCalledWith("profiles");
    expect(upsertMock).toHaveBeenCalledWith({
      id: "user-123",
      full_name: "Existing User",
      locale: "en",
      unit_preference: "metric",
      theme: "system",
    });
  });

  it("shows an error when saving fails", async () => {
    upsertMock.mockResolvedValue({ error: { message: "Unable to save" } });
    renderPanel();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByText("Unable to save")).toBeInTheDocument();
    });
  });

  it("updates theme and unit selections", async () => {
    upsertMock.mockResolvedValue({ error: null });
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

    const anchor = {
      click: jest.fn(),
      set href(value: string) {
        this._href = value;
      },
      get href() {
        return this._href;
      },
      set download(value: string) {
        this._download = value;
      },
      get download() {
        return this._download;
      },
      _href: "",
      _download: "",
    } as unknown as HTMLAnchorElement;

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

    expect(anchor.click).toHaveBeenCalled();
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
