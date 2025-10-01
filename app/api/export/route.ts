import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [workoutsResponse, exercisesResponse] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "id, title, status, notes, scheduled_for, created_at, updated_at, workout_entries(id, exercise_id, position, sets, reps, weight, unit, notes))"
      )
      .eq("user_id", user.id),
    supabase
      .from("exercises")
      .select("id, name, muscle_group, equipment, notes, created_at, updated_at")
      .eq("user_id", user.id),
  ]);

  if (workoutsResponse.error || exercisesResponse.error) {
    return NextResponse.json(
      { error: workoutsResponse.error?.message ?? exercisesResponse.error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    workouts: workoutsResponse.data,
    exercises: exercisesResponse.data,
  });
}
