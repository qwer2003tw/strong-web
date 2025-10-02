type SupabaseUser = { id: string } | null;

type SupabaseResult<T> = { data: T; error: null } | { data: T; error: Error };

const mockGetUser = jest.fn<Promise<SupabaseResult<{ user: SupabaseUser }>>, []>();
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      ({
        status: init?.status ?? 200,
        async json() {
          return body;
        },
      }) as Response,
  },
}));

jest.mock("@/lib/supabaseServer", () => ({
  createSupabaseRouteHandlerClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { POST } = require("@/app/api/exercises/route") as {
  POST: (request: Request) => Promise<Response>;
};

describe("POST /api/exercises", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFrom.mockReturnValue({
      insert: mockInsert.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle,
        }),
      }),
    });
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    const request = { json: async () => ({ name: "Deadlift" }) } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns 400 when the exercise name is missing", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });

    const request = { json: async () => ({ muscle_group: "Back" }) } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Name is required" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("creates a new exercise and returns it", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-123" } }, error: null });

    const insertedExercise = {
      id: "exercise-1",
      user_id: "user-123",
      name: "Bench Press",
      muscle_group: "Chest",
      equipment: "Barbell",
      notes: "3 sets of 5 reps",
      updated_at: "2024-01-01T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
    };

    mockSingle.mockResolvedValueOnce({ data: insertedExercise, error: null });

    const request = {
      json: async () => ({
        name: "Bench Press",
        muscle_group: "Chest",
        equipment: "Barbell",
        notes: "3 sets of 5 reps",
      }),
    } as unknown as Request;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ data: insertedExercise });

    expect(mockFrom).toHaveBeenCalledWith("exercises");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      name: "Bench Press",
      muscle_group: "Chest",
      equipment: "Barbell",
      notes: "3 sets of 5 reps",
    });
  });
});
