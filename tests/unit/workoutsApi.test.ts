jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import { GET as listGet, POST as listPost } from "@/app/api/workouts/route";
import { PATCH as detailPatch, DELETE as detailDelete } from "@/app/api/workouts/[id]/route";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";

jest.mock("@/lib/supabaseServer", () => ({
  createSupabaseRouteHandlerClient: jest.fn(),
}));

type SupabaseAuthResponse = {
  data: { user: { id: string } | null };
  error: { message: string } | null;
};

const createJsonRequest = (body: unknown) => ({
  json: async () => body,
}) as unknown as Request;

describe("workouts route handlers", () => {
  const mockCreateClient = createSupabaseRouteHandlerClient as jest.MockedFunction<
    typeof createSupabaseRouteHandlerClient
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("/api/workouts", () => {
    it("returns 401 when the user is not authenticated", async () => {
      const authResponse: SupabaseAuthResponse = { data: { user: null }, error: { message: "Auth error" } };
      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue(authResponse) },
        from: jest.fn(),
      };
      mockCreateClient.mockResolvedValueOnce(supabase as never);

      const response = await listGet();
      expect(response.status).toBe(401);
      const body = (await response.json()) as { error: string };
      expect(body.error).toBe("Unauthorized");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("returns validation errors for invalid POST payloads", async () => {
      const authResponse: SupabaseAuthResponse = { data: { user: { id: "user-1" } }, error: null };
      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue(authResponse) },
        from: jest.fn(),
      };
      mockCreateClient.mockResolvedValueOnce(supabase as never);

      const response = await listPost(createJsonRequest({ title: "   " }));
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(body.error).toContain("workout name");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("creates workouts with the expected payload", async () => {
      const authResponse: SupabaseAuthResponse = { data: { user: { id: "user-1" } }, error: null };
      const insertSingle = jest.fn().mockResolvedValue({
        data: {
          id: "workout-1",
          user_id: "user-1",
          title: "New workout",
          notes: null,
          scheduled_for: null,
          status: "draft",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        },
        error: null,
      });
      const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
      const insert = jest.fn().mockReturnValue({ select: insertSelect });
      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue(authResponse) },
        from: jest.fn().mockReturnValue({ insert }),
      };
      mockCreateClient.mockResolvedValueOnce(supabase as never);

      const response = await listPost(createJsonRequest({ title: "New workout" }));
      expect(response.status).toBe(201);
      expect(insert).toHaveBeenCalledWith({
        user_id: "user-1",
        title: "New workout",
        notes: null,
        scheduled_for: null,
        status: "draft",
      });
      expect(insertSelect).toHaveBeenCalledWith("*");
      const body = (await response.json()) as { data: { id: string } };
      expect(body.data.id).toBe("workout-1");
    });
  });

  describe("/api/workouts/[id]", () => {
    const baseAuth: SupabaseAuthResponse = { data: { user: { id: "user-1" } }, error: null };

    it("returns 401 for PATCH when the user is missing", async () => {
      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: "missing" } }) },
        from: jest.fn(),
      };
      mockCreateClient.mockResolvedValueOnce(supabase as never);

      const response = await detailPatch(createJsonRequest({ title: "Updated" }), {
        params: { id: "workout-1" },
      });
      expect(response.status).toBe(401);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("validates PATCH payloads when a title is provided", async () => {
      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue(baseAuth) },
        from: jest.fn(),
      };
      mockCreateClient.mockResolvedValueOnce(supabase as never);

      const response = await detailPatch(createJsonRequest({ title: "   " }), {
        params: { id: "workout-1" },
      });
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string };
      expect(body.error).toContain("workout name");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("updates workouts and returns the persisted record", async () => {
      const updateSingle = jest.fn().mockResolvedValue({
        data: {
          id: "workout-1",
          user_id: "user-1",
          title: "Updated",
          notes: "Details",
          scheduled_for: "2024-02-01",
          status: "completed",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-02-01T00:00:00.000Z",
        },
        error: null,
      });
      const updateSelect = jest.fn().mockReturnValue({ single: updateSingle });
      const updateEqSecond = jest.fn().mockReturnValue({ select: updateSelect });
      const updateEqFirst = jest.fn().mockReturnValue({ eq: updateEqSecond });
      const update = jest.fn().mockReturnValue({ eq: updateEqFirst });
      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue(baseAuth) },
        from: jest.fn().mockReturnValue({ update }),
      };
      mockCreateClient.mockResolvedValueOnce(supabase as never);

      const response = await detailPatch(
        createJsonRequest({
          title: "Updated",
          notes: "Details",
          scheduled_for: "2024-02-01",
          status: "completed",
        }),
        { params: { id: "workout-1" } }
      );
      expect(update).toHaveBeenCalled();
      expect(updateEqFirst).toHaveBeenCalledWith("user_id", "user-1");
      expect(updateEqSecond).toHaveBeenCalledWith("id", "workout-1");
      expect(updateSelect).toHaveBeenCalledWith("*");
      expect(response.status).toBe(200);
      const body = (await response.json()) as { data: { title: string; status: string } };
      expect(body.data.title).toBe("Updated");
      expect(body.data.status).toBe("completed");
    });

    it("deletes workouts and returns success", async () => {
      const deleteExecute = jest.fn().mockResolvedValue({ error: null });
      const deleteBuilder = {
        filters: [] as [string, unknown][],
        eq(column: string, value: unknown) {
          this.filters.push([column, value]);
          return this;
        },
        then(resolve?: (value: { error: null }) => unknown, reject?: (reason: unknown) => unknown) {
          return deleteExecute().then(resolve, reject);
        },
      };
      jest.spyOn(deleteBuilder, "eq");

      const supabase = {
        auth: { getUser: jest.fn().mockResolvedValue(baseAuth) },
        from: jest.fn().mockReturnValue({ delete: () => deleteBuilder }),
      };
      mockCreateClient.mockResolvedValueOnce(supabase as never);

      const response = await detailDelete({} as Request, {
        params: { id: "workout-1" },
      });

      expect(response.status).toBe(200);
      const body = (await response.json()) as { success: boolean };
      expect(body.success).toBe(true);
      expect(deleteBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(deleteBuilder.eq).toHaveBeenCalledWith("id", "workout-1");
      expect(deleteExecute).toHaveBeenCalled();
    });
  });
});
