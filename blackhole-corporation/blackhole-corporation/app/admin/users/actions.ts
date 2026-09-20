"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAccountManager } from "@/lib/authorization";

const AUTH_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "blackhole.local";

const HIGHER_UP_RANKS = [
  "owner",
  "supreme_chief",
  "head_moderator",
  "lead_moderator",
  "moderator",
];

export async function createUserAccount(formData: FormData) {
  const { user: actingUser } = await requireAccountManager();

  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const displayName = (formData.get("displayName") as string)?.trim();
  const password = formData.get("password") as string;
  const higherUpRankRaw = formData.get("higherUpRank") as string;
  const higherUpRank = HIGHER_UP_RANKS.includes(higherUpRankRaw)
    ? higherUpRankRaw
    : null;
  const permissionKeys = formData.getAll("permissions") as string[];

  if (!username || !displayName || !password) {
    throw new Error("Username, display name, and password are required.");
  }

  const admin = createAdminClient();
  const email = `${username}@${AUTH_EMAIL_DOMAIN}`;

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !created.user) {
    throw new Error(error?.message || "Could not create the account.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    username,
    display_name: displayName,
    higher_up_rank: higherUpRank,
  });

  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no profile.
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(profileError.message);
  }

  if (permissionKeys.length > 0) {
    await admin.from("profile_permissions").insert(
      permissionKeys.map((key) => ({
        profile_id: created.user!.id,
        permission_key: key,
        granted_by: actingUser.id,
      }))
    );
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAccount(formData: FormData) {
  const { user: actingUser } = await requireAccountManager();
  const admin = createAdminClient();

  const profileId = formData.get("profileId") as string;
  const higherUpRankRaw = formData.get("higherUpRank") as string;
  const higherUpRank = HIGHER_UP_RANKS.includes(higherUpRankRaw)
    ? higherUpRankRaw
    : null;
  const permissionKeys = formData.getAll("permissions") as string[];

  if (!profileId) return;

  await admin
    .from("profiles")
    .update({ higher_up_rank: higherUpRank })
    .eq("id", profileId);

  await admin.from("profile_permissions").delete().eq("profile_id", profileId);

  if (permissionKeys.length > 0) {
    await admin.from("profile_permissions").insert(
      permissionKeys.map((key) => ({
        profile_id: profileId,
        permission_key: key,
        granted_by: actingUser.id,
      }))
    );
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
