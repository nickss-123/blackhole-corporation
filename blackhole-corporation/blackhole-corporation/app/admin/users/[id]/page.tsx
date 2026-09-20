import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAccountManager } from "@/lib/authorization";
import { NavHeader } from "@/components/nav-header";
import { updateUserAccount } from "../actions";
import styles from "../admin-users.module.css";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAccountManager();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, higher_up_rank")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: permissions } = await supabase
    .from("permissions")
    .select("key, label, description")
    .order("label");

  const { data: granted } = await supabase
    .from("profile_permissions")
    .select("permission_key")
    .eq("profile_id", id);

  const grantedKeys = new Set(granted?.map((g) => g.permission_key));

  return (
    <main className={styles.page}>
      <NavHeader />
      <div className={styles.content}>
        <Link href="/admin/users" className={styles.backLink}>
          ← Back to accounts
        </Link>
        <h1 className={styles.title}>{profile.display_name}</h1>
        <p className={styles.subtitle} style={{ marginBottom: 28 }}>
          @{profile.username}
        </p>

        <form action={updateUserAccount} className={styles.form}>
          <input type="hidden" name="profileId" value={profile.id} />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="higherUpRank">
              Higher Up rank
            </label>
            <select
              id="higherUpRank"
              name="higherUpRank"
              className={styles.select}
              defaultValue={profile.higher_up_rank || ""}
            >
              <option value="">None — regular member</option>
              <option value="moderator">Moderator</option>
              <option value="lead_moderator">Lead Moderator</option>
              <option value="head_moderator">Head Moderator</option>
              <option value="supreme_chief">Supreme Chief</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Permissions</span>
            <div className={styles.checkboxGroup}>
              {permissions?.map((perm) => (
                <label key={perm.key} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="permissions"
                    value={perm.key}
                    defaultChecked={grantedKeys.has(perm.key)}
                  />
                  <span className={styles.checkboxText}>
                    <span className={styles.checkboxLabel}>{perm.label}</span>
                    {perm.description && (
                      <span className={styles.checkboxDescription}>
                        {perm.description}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.submit}>
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}
