"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup" | "forgot";

// Only allow redirects back into this site.
function getNextPath() {
  if (typeof window === "undefined") return "/";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const inputClass =
  "mt-1 w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        // Same message whether or not the account exists.
        setNotice("If an account exists for that email, we've sent a reset link.");
      }
    } else if (mode === "signup") {
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        setError("Usernames are 3-20 characters: letters, numbers or underscores.");
        setLoading(false);
        return;
      }

      // Case-insensitive check. Escape _ because it's a wildcard in ilike.
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username.replace(/_/g, "\\_"))
        .maybeSingle();

      if (taken) {
        setError("That username is already taken.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) {
        setError(
          error.message.includes("Database error")
            ? "That username is already taken."
            : error.message
        );
      } else if (data.session) {
        // Email confirmation is off, so they're already signed in.
        router.push(getNextPath());
        router.refresh();
      } else {
        setNotice("Check your email for a confirmation link, then sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push(getNextPath());
        router.refresh();
      }
    }
    setLoading(false);
  };

  const title =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
      ? "Reset your password"
      : "Sign in to your account";

  const submitLabel =
    mode === "signup" ? "Sign up" : mode === "forgot" ? "Send reset link" : "Sign in";

  return (
    <main className="flex flex-col justify-center py-12 sm:py-16 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">{title}</h1>
        {mode === "forgot" && (
          <p className="text-center text-gray-600 mt-3 px-4">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
          {error && (
            <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg">
              {notice}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {mode === "signup" && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  placeholder="birdie_king"
                />
                <p className="text-xs text-gray-500 mt-1">
                  3-20 letters, numbers or underscores.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="tiger@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Working..." : submitLabel}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
              >
                Back to sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
              >
                {mode === "signup"
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}