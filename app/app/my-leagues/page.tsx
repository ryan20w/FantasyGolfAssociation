"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { fetchMyLeagues, type MyLeague } from "@/app/lib/leagues";

export default function MyLeagues() {
  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setSignedIn(true);
        setLeagues(await fetchMyLeagues(user.id));
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">My leagues</h1>
          <p className="text-gray-600">
            Jump back into a league, or start a new one with your friends.
          </p>
        </div>

        {/* Existing leagues */}
        {!loading && signedIn && leagues.length > 0 && (
          <div className="grid gap-4 mb-10">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/my-leagues/${league.code}`}
                className="block p-5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-600 transition-colors"
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
                    <h2 className="text-lg font-bold text-gray-900 mt-2 truncate">
                      {league.name}
                    </h2>
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

        {!loading && !signedIn && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-10 flex flex-wrap items-center justify-between gap-4">
            <p className="text-gray-600">Sign in to see the leagues you&apos;re part of.</p>
            <Link
              href="/login?next=/my-leagues"
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-3">Create a league</h2>
            <p className="text-gray-600 mb-6">
              Start your own fantasy golf league and invite your friends.
            </p>
            <Link
              href="/my-leagues/create"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Create league
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold mb-3">Join a league</h2>
            <p className="text-gray-600 mb-6">
              Have a league code from a friend? Use it to join their league.
            </p>
            <Link
              href="/join"
              className="inline-block bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Join league
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
