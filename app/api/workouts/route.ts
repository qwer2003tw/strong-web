import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { validateWorkoutForm } from "@/lib/validation";
import type { Database } from "@/lib/database.types";

export async function GET() {
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
    .select("id, title, notes, scheduled_for, status, updated_at, created_at")
    .eq("user_id", user.id)
    .order("scheduled_for", { ascending: true, nullsFirst: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as Partial<Database["public"]["Tables"]["workouts"]["Insert"]>;
  const validation = validateWorkoutForm({
    title: payload.title ?? "",
    scheduled_for: payload.scheduled_for ?? undefined,
    notes: payload.notes ?? undefined,
  });

  if (!validation.valid) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      title: payload.title!,
      notes: payload.notes ?? null,
      scheduled_for: payload.scheduled_for ?? null,
      status: payload.status ?? "draft",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
