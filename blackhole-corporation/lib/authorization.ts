import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Non-redirecting check, safe to call from any page to decide whether to
 * show admin-only UI (e.g. a "Manage Accounts" nav link).
 */
export async function canManageAccounts(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("higher_up_rank")
    .eq("id", userId)
    .single();

  if (profile?.higher_up_rank) return true;

  const { data: perm } = await supabase
    .from("profile_permissions")
    .select("permission_key")
    .eq("profile_id", userId)
    .eq("permission_key", "manage_accounts")
    .maybeSingle();

  return Boolean(perm);
}

/**
 * Confirms the current user is signed in AND either a Higher Up or holds
 * the "manage_accounts" permission. Throws/redirects otherwise. Used at
 * the top of every admin server action and admin page.
 */
export async function requireAccountManager() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, higher_up_rank")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.higher_up_rank) {
    return { supabase, user, profile };
  }

  const { data: perm } = await supabase
    .from("profile_permissions")
    .select("permission_key")
    .eq("profile_id", user.id)
    .eq("permission_key", "manage_accounts")
    .maybeSingle();

  if (!perm) {
    redirect("/dashboard");
  }

  return { supabase, user, profile };
}
