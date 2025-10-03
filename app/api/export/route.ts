import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/services/authService";
import { exportUserExercises } from "@/lib/services/exerciseService";
import { exportUserWorkouts } from "@/lib/services/workoutService";

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [workouts, exercises] = await Promise.all([
      exportUserWorkouts(user.id, { client: supabase }),
      exportUserExercises(user.id, { client: supabase }),
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      workouts,
      exercises,
    });
  } catch (error) {
    console.error("Failed to export data", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
