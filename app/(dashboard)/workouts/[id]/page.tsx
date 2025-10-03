import { notFound } from "next/navigation";
import { WorkoutDetail } from "@/components/features/workouts/workout-detail";
import { getCurrentUser } from "@/lib/services/authService";
import { getUserExercises } from "@/lib/services/exerciseService";
import { getWorkoutDetail } from "@/lib/services/workoutService";

export const revalidate = 0;

interface WorkoutPageParams {
  params: {
    id: string;
  };
}

export default async function WorkoutDetailPage({ params }: WorkoutPageParams) {
  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }

  try {
    const [workout, exercises] = await Promise.all([
      getWorkoutDetail(user.id, params.id),
      getUserExercises(user.id),
    ]);
    return <WorkoutDetail workout={workout} exercises={exercises} />;
  } catch (error) {
    console.error("Failed to load workout detail", error);
    notFound();
  }
}
