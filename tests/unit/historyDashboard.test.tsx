import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { HistoryEntry, HistoryTrendPoint, VolumeSummary } from "@/lib/history";
import { HistoryDashboard } from "@/components/features/history/history-dashboard";
import { HISTORY_SUMMARY_CACHE_KEY, historySnapshotKey, readCache, writeCache } from "@/lib/idb";

jest.mock("next-intl", () => ({
  useTranslations: () =>
    (key: string, values?: Record<string, unknown>) => {
      if (values && "timestamp" in values) {
        return `${key} ${String(values.timestamp)}`;
      }
      return key;
    },
}));

jest.mock("@/lib/idb", () => {
  const actual = jest.requireActual("@/lib/idb");
  return {
    ...actual,
    readCache: jest.fn(),
    writeCache: jest.fn(),
  };
});

jest.mock("@/components/features/history/history-trend-chart", () => ({
  HistoryTrendChart: ({ data }: { data: HistoryTrendPoint[] }) => (
    <div data-testid="trend-chart">{data.map((point) => point.date).join(",")}</div>
  ),
}));

jest.mock("@/components/features/history/history-list", () => ({
  HistoryList: ({ entries }: { entries: HistoryEntry[] }) => (
    <div data-testid="history-list">{entries.map((entry) => entry.exerciseName).join(",")}</div>
  ),
}));

jest.mock("@/components/features/history/one-rep-max/one-rep-max-section", () => ({
  OneRepMaxSection: () => <div data-testid="one-rm-section" />,
}));

describe("HistoryDashboard", () => {
  const mockReadCache = readCache as jest.MockedFunction<typeof readCache>;
  const mockWriteCache = writeCache as jest.MockedFunction<typeof writeCache>;
  const initialHistory: HistoryEntry[] = [
    {
      id: "initial",
      workoutId: "w1",
      exerciseId: "e1",
      exerciseName: "Initial entry",
      muscleGroup: null,
      performedAt: "2024-01-01T00:00:00Z",
      sets: 3,
      reps: 5,
      weight: 100,
      totalVolume: 1500,
      unit: "metric",
    },
  ];
  const initialTrend: HistoryTrendPoint[] = [
    { date: "2024-01-01", totalVolume: 1500 },
  ];
  const initialSummary: VolumeSummary[] = [
    { period: "7d", totalVolume: 700 },
    { period: "30d", totalVolume: 3000 },
  ];

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockReadCache.mockResolvedValue(null);
    mockWriteCache.mockResolvedValue(undefined as unknown as void);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("warms state from cached snapshot and summary values", async () => {
    const cachedHistory: HistoryEntry[] = [
      {
        ...initialHistory[0],
        id: "cached",
        exerciseName: "Cached entry",
        totalVolume: 2500,
      },
    ];
    const cachedTrend: HistoryTrendPoint[] = [
      { date: "2024-02-01", totalVolume: 2500 },
    ];
    const cachedSummary: VolumeSummary[] = [
      { period: "7d", totalVolume: 1700 },
      { period: "30d", totalVolume: 4250 },
    ];

    mockReadCache.mockImplementation(async (key: string) => {
      if (key === historySnapshotKey("30d")) {
        return {
          value: {
            data: cachedHistory,
            trend: cachedTrend,
            range: "30d",
            lastSyncedAt: "2024-02-01T12:00:00Z",
          },
          updatedAt: Date.now(),
        };
      }
      if (key === HISTORY_SUMMARY_CACHE_KEY) {
        return {
          value: cachedSummary,
          updatedAt: Date.now(),
        };
      }
      return null;
    });

    render(
      <HistoryDashboard
        initialHistory={initialHistory}
        initialTrend={initialTrend}
        initialSummary={initialSummary}
        initialRange="30d"
        lastSyncedAt="2024-01-15T00:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("history-list")).toHaveTextContent("Cached entry");
    });

    await waitFor(() => {
      expect(screen.getByTestId("trend-chart")).toHaveTextContent("2024-02-01");
    });

    await waitFor(() => {
      expect(screen.getAllByText("4,250").length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(mockWriteCache).toHaveBeenCalledWith(
        historySnapshotKey("30d"),
        expect.objectContaining({ data: cachedHistory, trend: cachedTrend })
      );
    });
  });

  it("fetches and updates history when changing range", async () => {
    const responseBody = {
      data: [
        {
          ...initialHistory[0],
          id: "range",
          exerciseName: "Range change",
          totalVolume: 900,
        },
      ],
      trend: [{ date: "2024-03-01", totalVolume: 900 }],
      range: "7d" as const,
      lastSyncedAt: "2024-03-02T00:00:00Z",
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseBody),
    });

    render(
      <HistoryDashboard
        initialHistory={initialHistory}
        initialTrend={initialTrend}
        initialSummary={initialSummary}
        initialRange="30d"
      />
    );

    const select = screen.getByLabelText("rangeLabel") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "7d" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/history?range=7d", { cache: "no-store" });
    });

    await waitFor(() => {
      expect(screen.getByTestId("history-list")).toHaveTextContent("Range change");
    });

    await waitFor(() => {
      const selectedRangeValue = screen.getByText("summary.activeRange").nextSibling as HTMLElement;
      expect(selectedRangeValue).toHaveTextContent("700");
    });
  });

  it("refreshes history and summary on manual refresh", async () => {
    const historyResponse = {
      data: [
        {
          ...initialHistory[0],
          id: "refresh",
          exerciseName: "Refreshed entry",
          totalVolume: 4800,
        },
      ],
      trend: [{ date: "2024-04-01", totalVolume: 4800 }],
      range: "30d" as const,
      lastSyncedAt: "2024-04-01T10:00:00Z",
    };
    const summaryResponse = {
      data: [
        { period: "7d" as const, totalVolume: 1200 },
        { period: "30d" as const, totalVolume: 4800 },
      ],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(historyResponse) })
      .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(summaryResponse) });

    render(
      <HistoryDashboard
        initialHistory={initialHistory}
        initialTrend={initialTrend}
        initialSummary={initialSummary}
        initialRange="30d"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/history?range=30d", { cache: "no-store" });
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/analytics/volume", { cache: "no-store" });
    });

    await waitFor(() => {
      expect(screen.getByTestId("history-list")).toHaveTextContent("Refreshed entry");
    });

    await waitFor(() => {
      const selectedRangeValue = screen.getByText("summary.activeRange").nextSibling as HTMLElement;
      expect(selectedRangeValue).toHaveTextContent("4,800");
    });
  });

  it("shows an error alert when refresh fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Server exploded" }),
    });

    render(
      <HistoryDashboard
        initialHistory={initialHistory}
        initialTrend={initialTrend}
        initialSummary={initialSummary}
        initialRange="30d"
      />
    );

    const select = screen.getByLabelText("rangeLabel") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "7d" } });

    await waitFor(() => {
      expect(screen.getByText("Server exploded")).toBeInTheDocument();
    });
  });
});
