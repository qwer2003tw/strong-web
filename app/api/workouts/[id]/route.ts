import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { validateWorkoutForm } from "@/lib/validation";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("workouts")
    .select(
      "id, title, notes, scheduled_for, status, updated_at, created_at, workout_entries(id, exercise_id, position, sets, reps, weight, unit, notes, exercises(id, name, muscle_group))"
    )
    .eq("user_id", user.id)
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: Params) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const updatePayload: Record<string, unknown> = {
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

  const { data, error } = await supabase
    .from("workouts")
    .update(updatePayload)
    .eq("user_id", user.id)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: Params) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("user_id", user.id)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
