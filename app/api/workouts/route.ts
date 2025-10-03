import { NextResponse } from "next/server";
import { validateWorkoutForm } from "@/lib/validation";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/services/authService";
import { createWorkout, getUserWorkouts } from "@/lib/services/workoutService";
import type { WorkoutRow } from "@/types/view";

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workouts = await getUserWorkouts(user.id, { client: supabase });
    return NextResponse.json({ data: workouts });
  } catch (error) {
    console.error("Failed to load workouts", error);
    return NextResponse.json({ error: "Failed to load workouts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Partial<WorkoutRow>;
  const validation = validateWorkoutForm({
    title: payload.title ?? "",
    scheduled_for: payload.scheduled_for ?? undefined,
    notes: payload.notes ?? undefined,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  try {
    const workout = await createWorkout(
      user.id,
      {
        title: payload.title,
        notes: payload.notes ?? null,
        scheduled_for: payload.scheduled_for ?? null,
        status: payload.status ?? "draft",
      },
      { client: supabase }
    );

    return NextResponse.json({ data: workout }, { status: 201 });
  } catch (error) {
    console.error("Failed to create workout", error);
    return NextResponse.json({ error: "Failed to create workout" }, { status: 500 });
  }
}
