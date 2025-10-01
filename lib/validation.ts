export function validateEmail(value: string) {
  return /.+@.+\..+/.test(value);
}

export function validatePassword(value: string) {
  return value.length >= 8;
}

export interface WorkoutFormData {
  title: string;
  scheduled_for?: string;
  notes?: string;
}

export function validateWorkoutForm(data: WorkoutFormData) {
  if (!data.title.trim()) {
    return { valid: false, message: "A workout name is required" };
  }
  return { valid: true };
}
