import Link from "next/link";
import { requireAccountManager } from "@/lib/authorization";
import { NavHeader } from "@/components/nav-header";
import { createUserAccount } from "../actions";
import styles from "../admin-users.module.css";

export default async function NewUserPage() {
  const { supabase } = await requireAccountManager();

  const { data: permissions } = await supabase
    .from("permissions")
    .select("key, label, description")
    .order("label");

  return (
    <main className={styles.page}>
      <NavHeader />
      <div className={styles.content}>
        <Link href="/admin/users" className={styles.backLink}>
          ← Back to accounts
        </Link>
        <h1 className={styles.title}>New account</h1>
        <p className={styles.subtitle} style={{ marginBottom: 28 }}>
          Set their login, rank, and exactly which abilities they get.
        </p>

        <form action={createUserAccount} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              className={styles.input}
              placeholder="e.g. zhan"
              required
            />
            <span className={styles.fieldHint}>
              They&apos;ll log in with just this — no email needed.
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="displayName">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              className={styles.input}
              placeholder="e.g. Zhan"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              required
              minLength={6}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="higherUpRank">
              Higher Up rank (optional)
            </label>
            <select
              id="higherUpRank"
              name="higherUpRank"
              className={styles.select}
              defaultValue=""
            >
              <option value="">None — regular member</option>
              <option value="moderator">Moderator</option>
              <option value="lead_moderator">Lead Moderator</option>
              <option value="head_moderator">Head Moderator</option>
              <option value="supreme_chief">Supreme Chief</option>
              <option value="owner">Owner</option>
            </select>
            <span className={styles.fieldHint}>
              Any Higher Up rank already has full access — the checkboxes
              below are for granting specific abilities to regular members.
            </span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Permissions</span>
            <div className={styles.checkboxGroup}>
              {permissions?.map((perm) => (
                <label key={perm.key} className={styles.checkboxRow}>
                  <input type="checkbox" name="permissions" value={perm.key} />
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
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}
