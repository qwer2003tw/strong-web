import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/services/authService";
import { createExercise, getUserExercises } from "@/lib/services/exerciseService";

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exercises = await getUserExercises(user.id, { client: supabase });
    return NextResponse.json({ data: exercises });
  } catch (error) {
    console.error("Failed to load exercises", error);
    return NextResponse.json({ error: "Failed to load exercises" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  if (!payload.name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const exercise = await createExercise(
      user.id,
      {
        name: payload.name,
        muscle_group: payload.muscle_group ?? null,
        equipment: payload.equipment ?? null,
        notes: payload.notes ?? null,
      },
      { client: supabase }
    );
    return NextResponse.json({ data: exercise }, { status: 201 });
  } catch (error) {
    console.error("Failed to create exercise", error);
    return NextResponse.json({ error: "Failed to create exercise" }, { status: 500 });
  }
}
