import { GET as getHistoryRoute } from "@/app/api/history/route";
import { GET as getVolumeRoute } from "@/app/api/analytics/volume/route";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { type HistoryEntry, type HistoryRange, type HistoryTrendPoint, type VolumeSummary } from "@/lib/history";
import { getHistorySnapshot, getVolumeSummary } from "@/lib/services/historyService";

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

jest.mock("@/lib/services/historyService", () => ({
  getHistorySnapshot: jest.fn(),
  getVolumeSummary: jest.fn(),
}));

describe("history route handlers", () => {
  const mockCreateClient = createSupabaseRouteHandlerClient as jest.MockedFunction<typeof createSupabaseRouteHandlerClient>;
  const mockGetHistorySnapshot = getHistorySnapshot as jest.MockedFunction<typeof getHistorySnapshot>;
  const mockGetVolumeSummary = getVolumeSummary as jest.MockedFunction<typeof getVolumeSummary>;

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
      mockGetHistorySnapshot.mockResolvedValue({ entries, trend, summary: [] as VolumeSummary[] });

      const response = await getHistoryRoute(createRequest("http://localhost/api/history?range=invalid"));
      const body = (await response.json()) as { range: HistoryRange };

      expect(mockGetHistorySnapshot).toHaveBeenCalledWith("user-123", "30d", { client: supabase });
      expect(body.range).toBe("30d");
    });

    it("returns history snapshot payload", async () => {
      const snapshot = {
        entries: [
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
        ] as HistoryEntry[],
        trend: [{ date: "2024-01-01", totalVolume: 1500 }] as HistoryTrendPoint[],
        summary: [] as VolumeSummary[],
      };
      mockGetHistorySnapshot.mockResolvedValue(snapshot);

      const response = await getHistoryRoute(createRequest("http://localhost/api/history?range=7d"));
      const body = (await response.json()) as {
        data: typeof snapshot.entries;
        trend: typeof snapshot.trend;
        range: HistoryRange;
        lastSyncedAt: string;
      };

      expect(response.status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          data: snapshot.entries,
          trend: snapshot.trend,
          range: "7d",
          lastSyncedAt: expect.any(String),
        })
      );
    });

    it("logs and returns errors from history loader", async () => {
      const error = new Error("db unavailable");
      mockGetHistorySnapshot.mockRejectedValue(error);
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
      mockGetVolumeSummary.mockResolvedValue(summary);

      const response = await getVolumeRoute();
      const body = (await response.json()) as { data: typeof summary; lastSyncedAt: string };

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
      mockGetVolumeSummary.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

      const response = await getVolumeRoute();
      const body = (await response.json()) as { error: string };

      expect(consoleSpy).toHaveBeenCalledWith("Failed to load analytics summary", error);
      expect(response.status).toBe(500);
      expect(body).toEqual({ error: "analytics failed" });

      consoleSpy.mockRestore();
    });
  });
});
