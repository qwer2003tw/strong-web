import {
  calculateOneRepMax,
  buildOneRepMaxPayload,
  mapOneRepMaxRows,
  normaliseMethod,
  selectMaxPoint,
  type RawOneRepMaxRow,
} from "@/lib/analytics/oneRepMax";

describe("one rep max helpers", () => {
  it("calculates epley estimates", () => {
    expect(calculateOneRepMax(100, 5, "epley")).toBeCloseTo(116.67, 2);
    expect(calculateOneRepMax(0, 5, "epley")).toBe(0);
    expect(calculateOneRepMax(120, 0, "epley")).toBe(0);
  });

  it("caps brzycki reps at 36", () => {
    expect(calculateOneRepMax(120, 10, "brzycki")).toBeCloseTo(160, 1);
    expect(calculateOneRepMax(60, 50, "brzycki")).toBeCloseTo(2160, 0);
  });

  it("normalises supported methods", () => {
    expect(normaliseMethod("EPLEY")).toBe("epley");
    expect(normaliseMethod("invalid")).toBe("epley");
    expect(normaliseMethod(undefined)).toBe("epley");
  });

  it("maps RPC rows into chart points", () => {
    const rows: RawOneRepMaxRow[] = [
      {
        exercise_id: "ex-1",
        exercise_name: "Bench",
        performed_on: "2024-03-01",
        estimated_1rm: "125.5",
        reps: 5,
        weight: 100,
        unit: "metric",
        source_entry_id: "entry-1",
      },
      {
        exercise_id: "ex-2",
        exercise_name: null,
        performed_on: "2024-03-02",
        estimated_1rm: null,
        reps: 3,
        weight: "90",
        unit: "imperial",
        source_entry_id: null,
      },
    ];

    const mapped = mapOneRepMaxRows(rows);
    expect(mapped).toHaveLength(2);
    expect(mapped[0]).toMatchObject({
      exerciseId: "ex-1",
      exerciseName: "Bench",
      estimatedOneRm: 125.5,
      weight: 100,
      reps: 5,
      unit: "metric",
      sourceEntryId: "entry-1",
    });
    expect(mapped[1].exerciseName).toBe("Unknown exercise");
    expect(mapped[1].unit).toBe("imperial");
    expect(mapped[1].estimatedOneRm).toBeGreaterThan(0);
  });

  it("selects the best attempt", () => {
    const points = mapOneRepMaxRows([
      {
        exercise_id: "ex-1",
        exercise_name: "Bench",
        performed_on: "2024-03-01",
        estimated_1rm: 100,
        reps: 5,
        weight: 90,
        unit: "metric",
        source_entry_id: "entry-1",
      },
      {
        exercise_id: "ex-1",
        exercise_name: "Bench",
        performed_on: "2024-03-02",
        estimated_1rm: 105,
        reps: 4,
        weight: 95,
        unit: "metric",
        source_entry_id: "entry-2",
      },
    ]);

    const best = selectMaxPoint(points);
    expect(best?.sourceEntryId).toBe("entry-2");
    expect(best?.estimatedOneRm).toBe(105);
  });

  it("builds payloads with filters", () => {
    const rows: RawOneRepMaxRow[] = [
      {
        exercise_id: "ex-1",
        exercise_name: "Bench",
        performed_on: "2024-03-01",
        estimated_1rm: 110,
        reps: 5,
        weight: 95,
        unit: "metric",
        source_entry_id: "entry-1",
      },
    ];

    const payload = buildOneRepMaxPayload(rows, "epley", {
      exerciseIds: ["ex-1"],
      dateFrom: "2024-02-01",
      dateTo: "2024-03-31",
    });

    expect(payload.series).toHaveLength(1);
    expect(payload.max?.estimatedOneRm).toBeCloseTo(110);
    expect(payload.method).toBe("epley");
  });
});
