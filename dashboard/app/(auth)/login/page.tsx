"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Dev bypass — works without Supabase configured
    if (email.trim() === "admin" && password.trim() === "admin") {
      document.cookie = "wp_dev_session=1; path=/; max-age=86400; samesite=lax";
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen bg-zinc-950 flex flex-col"
      style={{ fontFamily: "var(--font-body, sans-serif)" }}
    >
      <style>{`
        .wp-display { font-family: var(--font-display, Georgia, serif); }
        .hero-dots {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }
      `}</style>

      <div className="hero-dots absolute inset-0 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 h-16">
        <Link href="/" className="wp-display text-white text-xl tracking-tight">
          Waypoint
        </Link>
        <Link
          href="/signup"
          className="px-4 py-1.5 text-sm font-medium text-zinc-300 border border-zinc-700 rounded-full hover:text-white hover:border-zinc-400 transition-colors"
        >
          Sign up
        </Link>
      </nav>

      {/* Form */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="wp-display text-3xl text-white mb-2">Welcome back</h1>
            <p className="text-zinc-500 text-sm">Sign in to your Waypoint account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-2.5 text-sm outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 px-4 py-2.5 text-sm outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-lg bg-amber-400 text-zinc-950 font-semibold text-sm py-2.5 hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-zinc-400 hover:text-white transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
