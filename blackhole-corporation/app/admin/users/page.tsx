import Link from "next/link";
import { requireAccountManager } from "@/lib/authorization";
import { NavHeader } from "@/components/nav-header";
import styles from "./admin-users.module.css";

export default async function AdminUsersPage() {
  const { supabase } = await requireAccountManager();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, higher_up_rank")
    .order("username");

  return (
    <main className={styles.page}>
      <NavHeader />
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Manage Accounts</h1>
            <p className={styles.subtitle}>
              Create accounts and control exactly what each one can do.
            </p>
          </div>
          <Link href="/admin/users/new" className={styles.newLink}>
            New account
          </Link>
        </div>

        <ul className={styles.userList}>
          {profiles?.map((p) => (
            <li key={p.id} className={styles.userRow}>
              <div className={styles.userIdentity}>
                <span className={styles.userName}>{p.display_name}</span>
                <span className={styles.userMeta}>
                  @{p.username}
                  {p.higher_up_rank ? ` · ${p.higher_up_rank.replace("_", " ")}` : ""}
                </span>
              </div>
              <Link href={`/admin/users/${p.id}`} className={styles.editLink}>
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
