import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutDetail, type WorkoutEntryWithExercise } from "@/components/features/workouts/workout-detail";
import type { Database } from "@/types/db";
import { readCache, writeCache } from "@/lib/idb";

jest.mock("@/lib/idb", () => ({
  readCache: jest.fn(),
  writeCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refreshMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, replace: replaceMock }),
}));

type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
type ExerciseRow = Pick<Database["public"]["Tables"]["exercises"]["Row"], "id" | "name" | "muscle_group">;

const insertResult = jest.fn();
const deleteResult = jest.fn();

jest.mock("@/components/features/providers/supabase-session-provider", () => ({
  useSupabaseClient: () => ({
    from: jest.fn((table: string) => {
      if (table === "workout_entries") {
        return {
          insert: (...args: unknown[]) => insertResult(...args),
          delete: () => ({
            eq(column: string, value: unknown) {
              deleteResult(column, value);
              return this;
            },
            then(resolve?: (value: { error: null }) => unknown, reject?: (reason: unknown) => unknown) {
              return Promise.resolve({ error: null }).then(resolve, reject);
            },
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    }),
  }),
}));

const baseWorkout: WorkoutRow = {
  id: "workout-1",
  user_id: "user-1",
  title: "Session",
  notes: "Notes",
  scheduled_for: null,
  status: "draft",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

const baseEntry: WorkoutEntryWithExercise = {
  id: "entry-1",
  workout_id: "workout-1",
  exercise_id: "exercise-1",
  position: 1,
  sets: 3,
  reps: 8,
  weight: 80,
  unit: "metric",
  notes: "",
  exercises: { id: "exercise-1", name: "Bench Press", muscle_group: "chest" },
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

const exercises: ExerciseRow[] = [
  { id: "exercise-1", name: "Bench Press", muscle_group: "chest" },
  { id: "exercise-2", name: "Deadlift", muscle_group: "back" },
];

describe("WorkoutDetail", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    (readCache as jest.Mock).mockResolvedValue(null);
    (writeCache as jest.Mock).mockResolvedValue(undefined);
    insertResult.mockReset();
    deleteResult.mockReset();
    refreshMock.mockReset();
    replaceMock.mockReset();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("hydrates entries from the cache when empty", async () => {
    (readCache as jest.Mock).mockResolvedValue({
      value: { ...baseWorkout, workout_entries: [baseEntry] },
      updatedAt: Date.now(),
    });

    render(
      <WorkoutDetail
        workout={{ ...baseWorkout, workout_entries: [] }}
        exercises={exercises}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeInTheDocument();
    });
  });

  it("shows validation errors when updating with an invalid title", async () => {
    render(
      <WorkoutDetail
        workout={{ ...baseWorkout, workout_entries: [baseEntry] }}
        exercises={exercises}
      />
    );

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("workouts.name"));
    await user.type(screen.getByLabelText("workouts.name"), "   ");
    await user.click(screen.getByRole("button", { name: "workouts.save" }));

    await waitFor(() => {
      expect(screen.getByText("A workout name is required")).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits workout updates and surfaces success state", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({ data: baseWorkout }) });

    render(
      <WorkoutDetail
        workout={{ ...baseWorkout, workout_entries: [baseEntry] }}
        exercises={exercises}
      />
    );

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("workouts.notes"), " updated");
    await user.click(screen.getByRole("button", { name: "workouts.save" }));

    await waitFor(() => {
      expect(screen.getByText("Workout updated")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/workouts/workout-1",
      expect.objectContaining({
        method: "PATCH",
      })
    );
    expect(refreshMock).toHaveBeenCalled();
  });

  it("creates workout entries via Supabase", async () => {
    insertResult.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: {
            ...baseEntry,
            id: "entry-2",
            exercise_id: "exercise-2",
            exercises: exercises[1],
          },
          error: null,
        }),
      }),
    });

    render(
      <WorkoutDetail
        workout={{ ...baseWorkout, workout_entries: [] }}
        exercises={exercises}
      />
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Exercise"), "exercise-2");
    await user.click(screen.getByRole("button", { name: "Add entry" }));

    const entriesHeading = screen.getByRole("heading", { name: "Workout entries" });
    const entriesContent = entriesHeading.parentElement?.nextElementSibling as HTMLElement;

    await waitFor(() => {
      expect(within(entriesContent).getAllByTestId("workout-entry").length).toBe(1);
    });

    expect(insertResult).toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("removes workout entries", async () => {
    render(
      <WorkoutDetail
        workout={{ ...baseWorkout, workout_entries: [baseEntry] }}
        exercises={exercises}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    });

    expect(deleteResult).toHaveBeenCalledWith("id", "entry-1");
    expect(deleteResult).toHaveBeenCalledWith("workout_id", "workout-1");
    expect(refreshMock).toHaveBeenCalled();
  });
});
