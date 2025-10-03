import { WorkoutsDashboard } from "@/components/features/workouts/workouts-dashboard";
import { getCurrentUser } from "@/lib/services/authService";
import { getUserWorkouts } from "@/lib/services/workoutService";

export const revalidate = 0;

export default async function WorkoutsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <WorkoutsDashboard initialWorkouts={[]} />;
  }

  try {
    const workouts = await getUserWorkouts(user.id);
    return <WorkoutsDashboard initialWorkouts={workouts} />;
  } catch (error) {
    console.error("Failed to load workouts", error);
    return <WorkoutsDashboard initialWorkouts={[]} />;
  }
}
