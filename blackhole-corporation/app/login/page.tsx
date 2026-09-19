"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN || "blackhole.local";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError(null);

    const email = `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("That username and password don't match. Try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main suppressHydrationWarning style={{ maxWidth: 360, margin: "80px auto" }}>
      <h1>Blackhole Corporation</h1>
      <p>Sign in to your account.</p>

      <div>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && signIn()}
        />
      </div>

      {error && <p role="alert">{error}</p>}

      <button onClick={signIn} disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p>Accounts are created by an Admin. No self-registration.</p>
    </main>
  );
}
