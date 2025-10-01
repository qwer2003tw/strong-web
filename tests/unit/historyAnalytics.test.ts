import { buildHistoryTrend, buildVolumeSummary, type HistoryEntry } from "@/lib/history";

describe("history analytics", () => {
  const referenceDate = new Date("2024-08-01T00:00:00.000Z");

  const baseEntry = (
    id: string,
    performedAt: string,
    totalVolume: number
  ): HistoryEntry => ({
    id,
    workoutId: null,
    exerciseId: null,
    exerciseName: "Sample",
    muscleGroup: null,
    performedAt,
    sets: 1,
    reps: 1,
    weight: totalVolume,
    totalVolume,
    unit: "metric",
  });

  const entries: HistoryEntry[] = [
    baseEntry("1", "2024-07-31T12:00:00.000Z", 1000),
    baseEntry("2", "2024-07-29T07:30:00.000Z", 800),
    baseEntry("3", "2024-07-20T18:15:00.000Z", 600),
    baseEntry("4", "2024-06-25T10:00:00.000Z", 400),
  ];

  it("builds 7 and 30 day trend lines", () => {
    const sevenDayTrend = buildHistoryTrend(entries, "7d", { referenceDate });
    const thirtyDayTrend = buildHistoryTrend(entries, "30d", { referenceDate });

    expect(sevenDayTrend).toHaveLength(7);
    expect(thirtyDayTrend).toHaveLength(30);

    const july31 = sevenDayTrend.find((item) => item.date === "2024-07-31");
    const july29 = sevenDayTrend.find((item) => item.date === "2024-07-29");
    expect(july31?.totalVolume).toBe(1000);
    expect(july29?.totalVolume).toBe(800);

    const july20 = thirtyDayTrend.find((item) => item.date === "2024-07-20");
    expect(july20?.totalVolume).toBe(600);
    const june25 = thirtyDayTrend.find((item) => item.date === "2024-06-25");
    expect(june25?.totalVolume ?? 0).toBe(0);
  });

  it("summarizes volume across 7 and 30 days", () => {
    const summary = buildVolumeSummary(entries, { referenceDate });
    const volume7 = summary.find((item) => item.period === "7d");
    const volume30 = summary.find((item) => item.period === "30d");

    expect(volume7?.totalVolume).toBe(1800);
    expect(volume30?.totalVolume).toBe(2400);
  });
});
