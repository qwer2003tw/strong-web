import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { OneRepMaxSection } from "@/components/features/history/one-rep-max/one-rep-max-section";
import type { OneRepMaxResponsePayload } from "@/lib/analytics/oneRepMax";

// Mock global Response constructor
global.Response = class MockResponse {
  status: number;
  headers: Headers;
  body: unknown;

  constructor(body: unknown, init?: ResponseInit) {
    this.status = init?.status ?? 200;
    this.headers = new Headers(init?.headers);
    this.body = body;
  }

  async json() {
    return this.body;
  }
} as any;

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (values && values.date) {
      return `${key} ${values.date}`;
    }
    return key;
  },
}));

jest.mock("@/components/features/history/one-rep-max/one-rep-max-chart", () => ({
  OneRepMaxChart: ({ points }: { points: Array<{ exerciseId: string }> }) => (
    <div data-testid="one-rm-chart">{points.map((point) => point.exerciseId).join(",")}</div>
  ),
}));

jest.mock("@/components/features/history/one-rep-max/one-rep-max-best-card", () => ({
  OneRepMaxBestCard: ({ point }: { point: { exerciseName: string } | null }) => (
    <div data-testid="one-rm-best">{point ? point.exerciseName : "empty"}</div>
  ),
}));

jest.mock("@/lib/idb", () => {
  const actual = jest.requireActual("@/lib/idb");
  return {
    ...actual,
    readCache: jest.fn(),
    writeCache: jest.fn(),
  };
});

const mockReadCache = jest.requireMock("@/lib/idb").readCache as jest.MockedFunction<
  typeof import("@/lib/idb").readCache
>;
const mockWriteCache = jest.requireMock("@/lib/idb").writeCache as jest.MockedFunction<
  typeof import("@/lib/idb").writeCache
>;

const persistedPayload: OneRepMaxResponsePayload = {
  series: [
    {
      exerciseId: "ex-1",
      exerciseName: "Bench",
      performedOn: "2024-03-01T00:00:00.000Z",
      estimatedOneRm: 120,
      reps: 5,
      weight: 100,
      unit: "metric",
      sourceEntryId: "entry-1",
    },
  ],
  max: {
    exerciseId: "ex-1",
    exerciseName: "Bench",
    performedOn: "2024-03-01T00:00:00.000Z",
    estimatedOneRm: 120,
    reps: 5,
    weight: 100,
    unit: "metric",
    sourceEntryId: "entry-1",
  },
  method: "epley",
  filters: {
    exerciseIds: [],
    dateFrom: "2024-02-24",
    dateTo: "2024-03-01",
  },
};

describe("OneRepMaxSection", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockReadCache.mockResolvedValue(null as never);
    mockWriteCache.mockResolvedValue(undefined as never);
    global.fetch = jest.fn();
  });

  it("hydrates from persisted cache and issues conditional request", async () => {
    mockReadCache.mockResolvedValueOnce({
      value: {
        data: persistedPayload,
        lastSyncedAt: "2024-03-02T12:00:00Z",
        etag: '"abc"',
      },
      updatedAt: Date.now(),
    });

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(null, { status: 304, headers: { ETag: '"abc"' } })
    );

    render(<OneRepMaxSection initialRange="7d" initialMethod="epley" />);

    await waitFor(() => {
      expect(screen.getByTestId("one-rm-chart")).toHaveTextContent("ex-1");
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("date_from"),
        expect.objectContaining({
          headers: expect.objectContaining({ "If-None-Match": '"abc"' }),
        })
      );
    });
  });

  it("renders components and handles method changes", async () => {
    const responsePayload: OneRepMaxResponsePayload = {
      ...persistedPayload,
      method: "brzycki",
      series: [
        {
          ...persistedPayload.series[0],
          exerciseId: "ex-2",
          exerciseName: "Deadlift",
        },
      ],
      max: {
        ...persistedPayload.max!,
        exerciseId: "ex-2",
        exerciseName: "Deadlift",
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ data: responsePayload, lastSyncedAt: "2024-03-05T08:00:00Z" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ETag: '"xyz"',
        },
      })
    );

    render(<OneRepMaxSection initialRange="30d" initialMethod="epley" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const methodSelect = screen.getByLabelText("oneRm.methodLabel") as HTMLSelectElement;
    fireEvent.change(methodSelect, { target: { value: "brzycki" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Verify the API is called with correct method
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("method=brzycki"),
      expect.any(Object)
    );
  });
});
