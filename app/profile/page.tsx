"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { User } from "@supabase/supabase-js";
import { fetchMyLeagues, type MyLeague } from "@/app/lib/leagues";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameNotice, setNameNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login?next=/profile");
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      setUsername(profile?.username ?? "");
      setSavedUsername(profile?.username ?? "");
      setLeagues(await fetchMyLeagues(user.id));
      setLoading(false);
    }

    loadUserData();
  }, [router]);

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setNameError(null);
    setNameNotice(null);

    const name = username.trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) {
      setNameError("Usernames are 3-20 characters: letters, numbers or underscores.");
      return;
    }
    if (name === savedUsername) {
      setEditing(false);
      return;
    }

    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username: name });
    setSavingName(false);

    if (error) {
      setNameError(
        error.code === "23505"
          ? "That username is already taken."
          : `We couldn't save your username: ${error.message}`
      );
      return;
    }

    setSavedUsername(name);
    setUsername(name);
    setEditing(false);
    setNameNotice("Username updated.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center py-32">
        <p className="text-gray-600 font-medium">Loading profile...</p>
      </main>
    );
  }

  return (
    <main>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500 mb-1">Username</p>

            {editing ? (
              <form onSubmit={handleSaveUsername} className="flex flex-wrap items-center gap-2">
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={20}
                  autoFocus
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={savingName}
                  className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setUsername(savedUsername);
                    setNameError(null);
                  }}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-2 py-2"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {savedUsername || "No username yet"}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setNameNotice(null);
                  }}
                  className="text-sm font-semibold text-emerald-700 hover:underline"
                >
                  {savedUsername ? "Change" : "Add one"}
                </button>
              </div>
            )}

            {nameError && (
              <p role="alert" className="text-red-600 text-sm mt-2">{nameError}</p>
            )}
            {nameNotice && (
              <p role="status" className="text-emerald-700 text-sm mt-2">{nameNotice}</p>
            )}
            <p className="text-sm text-gray-500 mt-2 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">My leagues</h2>
            <Link
              href="/my-leagues/create"
              className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              + Create league
            </Link>
          </div>

          {leagues.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-500 mb-4">You aren&apos;t in any leagues yet.</p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/my-leagues/create"
                  className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Start a league
                </Link>
                <Link
                  href="/join"
                  className="bg-white border border-gray-300 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Join a league
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/my-leagues/${league.code}`}
                  className="block p-5 rounded-xl border border-gray-200 hover:border-emerald-600 transition-colors bg-gray-50/50"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          {league.code}
                        </span>
                        {league.isCommissioner && (
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            Commissioner
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mt-2 truncate">
                        {league.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">Teams</p>
                      <p className="text-sm font-bold text-gray-900">
                        {league.members} / {league.number_of_teams}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}