import { SettingsPanel } from "@/components/features/settings/settings-panel";
import { getCurrentUser, getUserProfile } from "@/lib/services/authService";

export const revalidate = 0;

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <SettingsPanel profile={null} userId="" />;
  }

  try {
    const profile = await getUserProfile(user.id);
    return <SettingsPanel profile={profile ?? null} userId={user.id} />;
  } catch (error) {
    console.error("Failed to load profile", error);
    return <SettingsPanel profile={null} userId={user.id} />;
  }
}
