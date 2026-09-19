import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    return <main style={{ margin: 40 }}>Realm not found.</main>;
  }

  const { data: mains } = await supabase
    .from("mains")
    .select("id, name")
    .eq("realm_id", realm.id);

  return (
    <main
      data-theme={realm.background_theme}
      style={{ maxWidth: 640, margin: "40px auto" }}
    >
      <h1>{realm.name} Dashboard</h1>
      <p>
        Background theme here is set by this realm's authority — members
        cannot override it (unlike the General Dashboard).
      </p>

      <h2>Mains</h2>
      {(!mains || mains.length === 0) && <p>No Mains created yet.</p>}
      <ul>
        {mains?.map((main) => (
          <li key={main.id}>{main.name}</li>
        ))}
      </ul>
    </main>
  );
}
