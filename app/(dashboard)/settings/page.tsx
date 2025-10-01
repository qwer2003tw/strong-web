import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { SettingsPanel } from "@/components/features/settings/settings-panel";

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  let userId: string | null = null;
  try {
    const result = await supabase.auth.getSession();
    userId = result.data.session?.user.id ?? null;
  } catch (error) {
    console.error('Failed to fetch Supabase session', error);
  }

  if (!userId) {
    return <SettingsPanel profile={null} userId="" />;
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return <SettingsPanel profile={profile ?? null} userId={userId} />;
  } catch (error) {
    console.error('Failed to load profile', error);
    return <SettingsPanel profile={null} userId={userId} />;
  }
}
