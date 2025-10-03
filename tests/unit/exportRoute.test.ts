/** @jest-environment node */

import { GET } from "@/app/api/export/route";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/services/authService";
import { exportUserExercises } from "@/lib/services/exerciseService";
import { exportUserWorkouts } from "@/lib/services/workoutService";

jest.mock("@/lib/supabaseServer");
jest.mock("@/lib/services/authService");
jest.mock("@/lib/services/exerciseService");
jest.mock("@/lib/services/workoutService");

const createSupabaseRouteHandlerClientMock = createSupabaseRouteHandlerClient as jest.MockedFunction<
  typeof createSupabaseRouteHandlerClient
>;
const getCurrentUserMock = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const exportUserExercisesMock = exportUserExercises as jest.MockedFunction<typeof exportUserExercises>;
const exportUserWorkoutsMock = exportUserWorkouts as jest.MockedFunction<typeof exportUserWorkouts>;

describe("GET /api/export", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns unauthorized when user is missing", async () => {
    const client = {} as any;

    createSupabaseRouteHandlerClientMock.mockResolvedValue(client);
    getCurrentUserMock.mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns exported data when supabase succeeds", async () => {
    const now = new Date("2024-01-01T12:00:00.000Z");
    jest.useFakeTimers();
    jest.setSystemTime(now);

    const client = { supabase: true } as any;
    const workoutsData = [{ id: "w1", title: "Workout", workout_entries: [] }];
    const exercisesData = [{ id: "e1", name: "Squat" }];

    createSupabaseRouteHandlerClientMock.mockResolvedValue(client);
    getCurrentUserMock.mockResolvedValue({ id: "user-123" } as any);
    exportUserWorkoutsMock.mockResolvedValue(workoutsData as any);
    exportUserExercisesMock.mockResolvedValue(exercisesData as any);

    try {
      const response = await GET();
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(createSupabaseRouteHandlerClientMock).toHaveBeenCalled();
      expect(getCurrentUserMock).toHaveBeenCalledWith({ client });
      expect(exportUserWorkoutsMock).toHaveBeenCalledWith("user-123", { client });
      expect(exportUserExercisesMock).toHaveBeenCalledWith("user-123", { client });
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
    const client = {} as any;

    createSupabaseRouteHandlerClientMock.mockResolvedValue(client);
    getCurrentUserMock.mockResolvedValue({ id: "user-1" } as any);
    exportUserWorkoutsMock.mockRejectedValue(new Error("Failed to export workouts"));

    const response = await GET();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to export workouts" });
  });
});
