import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canManageAccounts } from "@/lib/authorization";
import { NavHeader } from "@/components/nav-header";
import { createMain, createDepartment } from "./actions";
import styles from "./realm.module.css";

export default async function RealmDashboardPage({
  params,
}: {
  params: Promise<{ realm: string }>;
}) {
  const { realm: realmSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: realm }, showManageAccounts] = await Promise.all([
    supabase
      .from("realms")
      .select("id, name, background_theme")
      .ilike("name", realmSlug)
      .single(),
    canManageAccounts(supabase, user.id),
  ]);

  if (!realm) {
    return (
      <main>
        <NavHeader showManageAccounts={showManageAccounts} />
        <p className={styles.notFound}>Realm not found.</p>
      </main>
    );
  }

  const { data: mains } = await supabase
    .from("mains")
    .select("id, name, departments(id, name)")
    .eq("realm_id", realm.id);

  // Higher Ups always have create-Main/Department access; regular members
  // need the explicit "create_main" / "create_department" checkbox.
  const [{ data: profile }, { data: perms }] = await Promise.all([
    supabase
      .from("profiles")
      .select("higher_up_rank")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profile_permissions")
      .select("permission_key")
      .eq("profile_id", user.id),
  ]);

  const permKeys = new Set(perms?.map((p) => p.permission_key));
  const canCreateMain =
    Boolean(profile?.higher_up_rank) || permKeys.has("create_main");
  const canCreateDepartment =
    Boolean(profile?.higher_up_rank) || permKeys.has("create_department");

  return (
    <main className={styles.page} data-theme={realm.background_theme}>
      <NavHeader active={realm.name} showManageAccounts={showManageAccounts} />

      <div className={styles.content}>
        <h1 className={styles.title}>{realm.name}</h1>
        <p className={styles.subtitle}>
          This realm&apos;s background theme is set by its authority — members
          view it as-is, unlike the customizable General Dashboard.
        </p>
        <span className={styles.themeNote}>
          <span className={styles.themeDot} aria-hidden="true" />
          Theme: {realm.background_theme || "default"}
        </span>

        <h2 className={styles.sectionLabel}>Mains</h2>

        {(!mains || mains.length === 0) ? (
          <div className={styles.empty}>No Mains created yet.</div>
        ) : (
          <ul className={styles.mainsList}>
            {mains.map((main) => (
              <li key={main.id} className={styles.mainCard}>
                <p className={styles.mainName}>{main.name}</p>

                {main.departments && main.departments.length > 0 && (
                  <ul className={styles.deptList}>
                    {main.departments.map((dept) => (
                      <li key={dept.id} className={styles.deptItem}>
                        {dept.name}
                      </li>
                    ))}
                  </ul>
                )}

                {canCreateDepartment && (
                  <form action={createDepartment} className={styles.inlineForm}>
                    <input type="hidden" name="mainId" value={main.id} />
                    <input type="hidden" name="realmSlug" value={realmSlug} />
                    <input
                      name="name"
                      placeholder="New department name"
                      className={styles.inlineInput}
                      required
                    />
                    <button type="submit" className={styles.inlineButton}>
                      Add
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {canCreateMain && (
          <form action={createMain} className={styles.inlineForm}>
            <input type="hidden" name="realmId" value={realm.id} />
            <input type="hidden" name="realmSlug" value={realmSlug} />
            <input
              name="name"
              placeholder="New Main name"
              className={styles.inlineInput}
              required
            />
            <button type="submit" className={styles.inlineButton}>
              Create Main
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
