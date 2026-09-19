import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    <main style={{ maxWidth: 640, margin: "40px auto" }}>
      <h1>General Dashboard</h1>
      <p>Facebook-style feed — visible to every Blackhole member, across all realms.</p>

      {(!posts || posts.length === 0) && <p>No posts yet.</p>}

      <ul>
        {posts?.map((post) => (
          <li key={post.id}>
            <p>{post.caption}</p>
            <video src={post.video_url} controls style={{ maxWidth: "100%" }} />
          </li>
        ))}
      </ul>

      <nav>
        <a href="/realms/estate">Estate</a> · <a href="/realms/academy">Academy</a> ·{" "}
        <a href="/realms/syndicate">Syndicate</a>
      </nav>
    </main>
  );
}
