import { NextResponse } from "next/server";
import { validateWorkoutForm } from "@/lib/validation";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/services/authService";
import {
  deleteWorkout,
  getWorkoutDetail,
  updateWorkout,
} from "@/lib/services/workoutService";
import type { WorkoutUpdate } from "@/types/view";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;

  try {
    const workout = await getWorkoutDetail(user.id, resolvedParams.id, { client: supabase });
    return NextResponse.json({ data: workout });
  } catch (error) {
    console.error("Failed to load workout", error);
    return NextResponse.json({ error: "Failed to load workout" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const payload = await request.json();

  if (payload.title) {
    const validation = validateWorkoutForm({
      title: payload.title,
      scheduled_for: payload.scheduled_for,
      notes: payload.notes,
    });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }
  }

  const updatePayload: WorkoutUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (typeof payload.title === "string") {
    updatePayload.title = payload.title;
  }
  if ("notes" in payload) {
    updatePayload.notes = payload.notes ?? null;
  }
  if ("scheduled_for" in payload) {
    updatePayload.scheduled_for = payload.scheduled_for ?? null;
  }
  if (typeof payload.status === "string") {
    updatePayload.status = payload.status;
  }

  try {
    const workout = await updateWorkout(user.id, resolvedParams.id, updatePayload, { client: supabase });
    return NextResponse.json({ data: workout });
  } catch (error) {
    console.error("Failed to update workout", error);
    return NextResponse.json({ error: "Failed to update workout" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;

  try {
    await deleteWorkout(user.id, resolvedParams.id, { client: supabase });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workout", error);
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 });
  }
}
