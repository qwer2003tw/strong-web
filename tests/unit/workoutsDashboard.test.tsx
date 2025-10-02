import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutsDashboard } from "@/components/features/workouts/workouts-dashboard";
import type { Database } from "@/lib/database.types";
import { readCache, writeCache } from "@/lib/idb";

jest.mock("@/lib/idb", () => ({
  readCache: jest.fn(),
  writeCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];

const baseWorkout: WorkoutRow = {
  id: "workout-1",
  user_id: "user-1",
  title: "Existing workout",
  notes: "",
  scheduled_for: null,
  status: "draft",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

describe("WorkoutsDashboard", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    refreshMock.mockClear();
    (readCache as jest.Mock).mockResolvedValue(null);
    (writeCache as jest.Mock).mockResolvedValue(undefined);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("loads cached workouts when no server data is provided", async () => {
    (readCache as jest.Mock).mockResolvedValue({
      value: [baseWorkout],
      updatedAt: Date.now(),
    });

    render(<WorkoutsDashboard initialWorkouts={[]} />);

    await waitFor(() => {
      expect(screen.getByText("Existing workout")).toBeInTheDocument();
    });

    expect(writeCache).toHaveBeenCalledWith("workouts:list", [baseWorkout]);
  });

  it("displays validation feedback when the title is invalid", async () => {
    render(<WorkoutsDashboard initialWorkouts={[baseWorkout]} />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("workouts.name"), "   ");
    await user.click(screen.getByRole("button", { name: "workouts.save" }));

    await waitFor(() => {
      expect(screen.getByText("A workout name is required")).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits valid data and renders the new workout", async () => {
    const newWorkout: WorkoutRow = {
      ...baseWorkout,
      id: "workout-2",
      title: "Created workout",
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: newWorkout }),
    });

    render(<WorkoutsDashboard initialWorkouts={[baseWorkout]} />);

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("workouts.name"));
    await user.type(screen.getByLabelText("workouts.name"), "Created workout");
    await user.click(screen.getByRole("button", { name: "workouts.save" }));

    await waitFor(() => {
      expect(screen.getByText("Created workout")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/workouts", expect.objectContaining({
      method: "POST",
    }));
    expect(writeCache).toHaveBeenCalledWith("workouts:list", expect.arrayContaining([newWorkout]));
    expect(refreshMock).toHaveBeenCalled();
  });
});
