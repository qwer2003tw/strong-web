import { GET as getHistoryRoute } from "@/app/api/history/route";
import { GET as getVolumeRoute } from "@/app/api/analytics/volume/route";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import {
  buildHistoryTrend,
  getHistoryEntries,
  getVolumeAnalytics,
  type HistoryEntry,
  type HistoryRange,
  type HistoryTrendPoint,
  type VolumeSummary,
} from "@/lib/history";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      const status = init?.status ?? 200;
      return {
        status,
        async json() {
          return body;
        },
      } as unknown as Response;
    },
  },
}));

jest.mock("@/lib/supabaseServer", () => ({
  createSupabaseRouteHandlerClient: jest.fn(),
}));

jest.mock("@/lib/history", () => {
  const actual = jest.requireActual("@/lib/history");
  return {
    ...actual,
    getHistoryEntries: jest.fn(),
    buildHistoryTrend: jest.fn(),
    getVolumeAnalytics: jest.fn(),
  };
});

describe("history route handlers", () => {
  const mockCreateClient = createSupabaseRouteHandlerClient as jest.MockedFunction<typeof createSupabaseRouteHandlerClient>;
  const mockGetHistoryEntries = getHistoryEntries as jest.MockedFunction<typeof getHistoryEntries>;
  const mockBuildHistoryTrend = buildHistoryTrend as jest.MockedFunction<typeof buildHistoryTrend>;
  const mockGetVolumeAnalytics = getVolumeAnalytics as jest.MockedFunction<typeof getVolumeAnalytics>;

  type MockSupabase = {
    auth: {
      getUser: jest.Mock<Promise<{ data: { user: { id: string } | null }; error: unknown }>>;
    };
  };

  const supabase: MockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
  };

  const createRequest = (url: string) => ({ url }) as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(supabase as never);
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-123" } }, error: null });
  });

  describe("GET /api/history", () => {
    it("parses the range parameter with fallback", async () => {
      const entries: HistoryEntry[] = [];
      const trend: HistoryTrendPoint[] = [];
      mockGetHistoryEntries.mockResolvedValue(entries);
      mockBuildHistoryTrend.mockReturnValue(trend);

      const response = await getHistoryRoute(createRequest("http://localhost/api/history?range=invalid"));
      const body = (await response.json()) as { range: HistoryRange };

      expect(mockGetHistoryEntries).toHaveBeenCalledWith(supabase, "user-123", "30d");
      expect(mockBuildHistoryTrend).toHaveBeenCalledWith(entries, "30d");
      expect(body.range).toBe("30d");
    });

    it("returns history snapshot payload", async () => {
      const entries: HistoryEntry[] = [
        {
          id: "entry",
          workoutId: "w1",
          exerciseId: "e1",
          exerciseName: "Test",
          muscleGroup: null,
          performedAt: "2024-01-01T00:00:00Z",
          sets: 3,
          reps: 5,
          weight: 100,
          totalVolume: 1500,
          unit: "metric",
        },
      ];
      const trend: HistoryTrendPoint[] = [{ date: "2024-01-01", totalVolume: 1500 }];
      mockGetHistoryEntries.mockResolvedValue(entries);
      mockBuildHistoryTrend.mockReturnValue(trend);

      const response = await getHistoryRoute(createRequest("http://localhost/api/history?range=7d"));
      const body = (await response.json()) as {
        data: HistoryEntry[];
        trend: HistoryTrendPoint[];
        range: HistoryRange;
        lastSyncedAt: string;
      };

      expect(response.status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          data: entries,
          trend,
          range: "7d",
          lastSyncedAt: expect.any(String),
        })
      );
    });

    it("logs and returns errors from history loader", async () => {
      const error = new Error("db unavailable");
      mockGetHistoryEntries.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      const response = await getHistoryRoute(createRequest("http://localhost/api/history"));
      const body = (await response.json()) as { error: string };

      expect(consoleSpy).toHaveBeenCalledWith("Failed to load history snapshot", error);
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "db unavailable" });

      consoleSpy.mockRestore();
    });
  });

  describe("GET /api/analytics/volume", () => {
    it("returns aggregated volume payload", async () => {
      const summary: VolumeSummary[] = [
        { period: "7d", totalVolume: 700 },
        { period: "30d", totalVolume: 3000 },
      ];
      mockGetVolumeAnalytics.mockResolvedValue(summary);

      const response = await getVolumeRoute(createRequest("http://localhost/api/analytics/volume"));
      const body = (await response.json()) as { data: VolumeSummary[]; lastSyncedAt: string };

      expect(response.status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          data: summary,
          lastSyncedAt: expect.any(String),
        })
      );
    });

    it("logs and returns analytics errors", async () => {
      const error = new Error("analytics failed");
      mockGetVolumeAnalytics.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      const response = await getVolumeRoute(createRequest("http://localhost/api/analytics/volume"));
      const body = (await response.json()) as { error: string };

      expect(consoleSpy).toHaveBeenCalledWith("Failed to load analytics summary", error);
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "analytics failed" });

      consoleSpy.mockRestore();
    });
  });
});
