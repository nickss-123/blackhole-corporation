"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

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
    <main className={styles.page} suppressHydrationWarning>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.card}>
        <h1 className={styles.wordmark}>Blackhole Corporation</h1>
        <p className={styles.subtitle}>Sign in to your account.</p>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="yourusername"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.submit} onClick={signIn} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className={styles.footnote}>
          Accounts are created by an Admin.
          <br />
          No self-registration.
        </p>
      </div>
    </main>
  );
}
