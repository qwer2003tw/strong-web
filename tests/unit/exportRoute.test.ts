/** @jest-environment node */

import { GET } from "@/app/api/export/route";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";

jest.mock("@/lib/supabaseServer");

const createSupabaseRouteHandlerClientMock = createSupabaseRouteHandlerClient as jest.MockedFunction<
  typeof createSupabaseRouteHandlerClient
>;

describe("GET /api/export", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns unauthorized when user is missing", async () => {
    const authGetUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "No session" },
    });

    createSupabaseRouteHandlerClientMock.mockResolvedValue({
      auth: { getUser: authGetUser },
    } as any);

    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns exported data when supabase succeeds", async () => {
    const now = new Date("2024-01-01T12:00:00.000Z");
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const workoutsData = [{ id: "w1", title: "Workout", workout_entries: [] }];
    const exercisesData = [{ id: "e1", name: "Squat" }];

    const workoutsEq = jest.fn().mockResolvedValue({ data: workoutsData, error: null });
    const exercisesEq = jest.fn().mockResolvedValue({ data: exercisesData, error: null });

    const select = jest.fn().mockImplementation((query: string) => {
      if (query.includes("workout_entries")) {
        return { eq: workoutsEq };
      }
      return { eq: exercisesEq };
    });

    const from = jest.fn().mockImplementation(() => {
      return { select };
    });

    createSupabaseRouteHandlerClientMock.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-123" } }, error: null }) },
      from,
    } as any);

    try {
      const response = await GET();
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(from).toHaveBeenCalledWith("workouts");
      expect(from).toHaveBeenCalledWith("exercises");
      expect(workoutsEq).toHaveBeenCalledWith("user_id", "user-123");
      expect(exercisesEq).toHaveBeenCalledWith("user_id", "user-123");
      expect(payload).toEqual({
        exportedAt: now.toISOString(),
        workouts: workoutsData,
        exercises: exercisesData,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it("propagates supabase errors", async () => {
    const workoutsError = { message: "Failed to load" };
    const workoutsEq = jest.fn().mockResolvedValue({ data: null, error: workoutsError });
    const select = jest.fn().mockReturnValue({ eq: workoutsEq });
    const from = jest.fn().mockReturnValue({ select });

    createSupabaseRouteHandlerClientMock.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from,
    } as any);

    const response = await GET();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to load" });
  });
});
