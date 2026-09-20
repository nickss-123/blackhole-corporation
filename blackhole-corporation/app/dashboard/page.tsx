import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavHeader } from "@/components/nav-header";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: posts } = await supabase
    .from("general_posts")
    .select("id, video_url, caption, created_at, profile_id")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className={styles.page}>
      <NavHeader active="General" />

      <div className={styles.content}>
        <h1 className={styles.title}>General Dashboard</h1>
        <p className={styles.subtitle}>
          Visible to every Blackhole member, across all realms.
        </p>

        {(!posts || posts.length === 0) ? (
          <div className={styles.empty}>Nothing posted yet.</div>
        ) : (
          <ul className={styles.feed}>
            {posts.map((post) => (
              <li key={post.id} className={styles.post}>
                {post.caption && <p className={styles.caption}>{post.caption}</p>}
                <video src={post.video_url} controls className={styles.video} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
