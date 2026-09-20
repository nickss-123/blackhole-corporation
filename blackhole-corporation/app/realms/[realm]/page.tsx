import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/nav-header";
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

  const { data: realm } = await supabase
    .from("realms")
    .select("id, name, background_theme")
    .ilike("name", realmSlug)
    .single();

  if (!realm) {
    return (
      <main>
        <NavHeader />
        <p className={styles.notFound}>Realm not found.</p>
      </main>
    );
  }

  const { data: mains } = await supabase
    .from("mains")
    .select("id, name")
    .eq("realm_id", realm.id);

  return (
    <main className={styles.page} data-theme={realm.background_theme}>
      <NavHeader active={realm.name} />

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
              <li key={main.id} className={styles.mainItem}>
                {main.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
