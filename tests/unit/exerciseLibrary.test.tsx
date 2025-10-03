import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseLibrary } from "@/components/features/exercises/exercise-library";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("ExerciseLibrary", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockRefresh.mockClear();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("shows an error alert when refreshing fails", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(<ExerciseLibrary initialExercises={[]} />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to load exercises")).toBeInTheDocument();
    });
  });

  it("loads exercises when refresh succeeds", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "exercise-1",
            name: "Romanian Deadlift",
            muscle_group: "Hamstrings",
            equipment: "Barbell",
            notes: "Focus on hinge",

            updated_at: "2024-01-02T00:00:00Z",
          },
        ],
      }),
    });

    render(<ExerciseLibrary initialExercises={[]} />);

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    await waitFor(() => {
      expect(screen.getByText("Romanian Deadlift")).toBeInTheDocument();
    });
  });

  it("renders the newly created exercise after submission", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementation(async (_input: RequestInfo, init?: RequestInit) => {
      if (init?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: "exercise-2",
              name: "Front Squat",
              muscle_group: "Quads",
              equipment: "Barbell",
              notes: "Keep torso upright",

              updated_at: "2024-01-03T00:00:00Z",
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as Response;
    });

    render(
      <ExerciseLibrary
        initialExercises={[
          {
            id: "exercise-1",
            name: "Bench Press",
            muscle_group: "Chest",
            equipment: "Barbell",
            notes: "Arch back",

            updated_at: "2024-01-02T00:00:00Z",
          },
        ]}
      />
    );

    await user.type(screen.getByLabelText(/name/i), "Front Squat");
    await user.type(screen.getByLabelText(/muscle group/i), "Quads");
    await user.type(screen.getByLabelText(/equipment/i), "Barbell");
    await user.type(screen.getByLabelText(/notes/i), "Keep torso upright");

    await user.click(screen.getByRole("button", { name: /save exercise/i }));

    let createdCard: HTMLElement | null = null;

    await waitFor(() => {
      const heading = screen.getByRole("heading", { name: "Front Squat" });
      const headerContainer = heading.closest("div");
      createdCard = headerContainer?.parentElement ?? null;
      expect(createdCard).not.toBeNull();
    });

    const card = createdCard!;

    expect(within(card).getByText("Muscle group: Quads")).toBeInTheDocument();
    expect(within(card).getByText("Equipment: Barbell")).toBeInTheDocument();
    expect(within(card).getByText("Keep torso upright")).toBeInTheDocument();

    expect(mockRefresh).toHaveBeenCalled();
  });
});
