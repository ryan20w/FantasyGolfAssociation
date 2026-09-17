"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { User } from "@supabase/supabase-js";

type League = {
  id: string;
  code: string;
  name: string;
  commissioner: string;
  number_of_teams: number;
  members: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Fetch leagues created by this user
      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("*")
        .eq("commissioner_id", user.id);

      if (leagueError) {
        console.error(leagueError);
      } else if (leagueData) {
        setLeagues(leagueData);
      }

      setLoading(false);
    }

    loadUserData();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 font-medium">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            The Fantasy Golf Association
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-black">
              Home
            </Link>
            <Link href="/news" className="text-sm font-medium text-gray-600 hover:text-black">
              News
            </Link>
            <span className="text-sm font-semibold text-black border-b-2 border-black pb-0.5">
              Profile
            </span>
          </nav>
        </div>
      </header>

      {/* Main Profile Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Account Profile</p>
            <h1 className="text-2xl font-bold text-gray-900">{user?.email}</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
          >
            Sign Out
          </button>
        </div>

        {/* My Leagues Hub Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Leagues</h2>
            <Link
              href="/my-leagues/create"
              className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              + Create League
            </Link>
          </div>

          {leagues.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-500 mb-4">You haven&apos;t created any leagues yet.</p>
              <Link
                href="/my-leagues/create"
                className="inline-block bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 transition"
              >
                Start Your First League
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {leagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/my-leagues/${league.code}`}
                  className="block p-5 rounded-xl border border-gray-200 hover:border-black transition bg-gray-50/50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {league.code}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-2">{league.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-semibold">Teams</p>
                      <p className="text-sm font-bold text-gray-900">{league.members} / {league.number_of_teams}</p>
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