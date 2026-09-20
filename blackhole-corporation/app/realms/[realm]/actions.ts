"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function hasPermission(permissionKey: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("higher_up_rank")
    .eq("id", user.id)
    .single();

  if (profile?.higher_up_rank) return user;

  const { data: perm } = await supabase
    .from("profile_permissions")
    .select("permission_key")
    .eq("profile_id", user.id)
    .eq("permission_key", permissionKey)
    .maybeSingle();

  return perm ? user : null;
}

export async function createMain(formData: FormData) {
  const user = await hasPermission("create_main");
  if (!user) throw new Error("Not authorized to create a Main.");

  const realmId = formData.get("realmId") as string;
  const realmSlug = formData.get("realmSlug") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const admin = createAdminClient();
  await admin
    .from("mains")
    .insert({ realm_id: realmId, name, created_by: user.id });

  revalidatePath(`/realms/${realmSlug}`);
}

export async function createDepartment(formData: FormData) {
  const user = await hasPermission("create_department");
  if (!user) throw new Error("Not authorized to create a Department.");

  const mainId = formData.get("mainId") as string;
  const realmSlug = formData.get("realmSlug") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  const admin = createAdminClient();
  await admin.from("departments").insert({ main_id: mainId, name });

  revalidatePath(`/realms/${realmSlug}`);
}
