"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type League = {
  id: string;
  code: string;
  name: string;
  commissioner: string;
  number_of_teams: number;
  members: number;
  created_at: string;
};

export default function LeaguePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  // Unwrap params safely using React's use() hook
  const resolvedParams = use(params);
  const code = resolvedParams.code;

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeague() {
      if (!code) return;

      const { data, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("code", code)
        .single();

      if (error) {
        console.error(error);
      }

      if (data) {
        setLeague(data);
      }

      setLoading(false);
    }

    loadLeague();
  }, [code]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading league...</p>
      </main>
    );
  }

  if (!league) {
    return (
      <main className="min-h-screen bg-gray-100">
        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold">
              The Fantasy Golf Association
            </h1>
          </div>
        </header>

        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            League Not Found
          </h2>

          <p className="text-gray-600 mb-8">
            We could not find this league.
          </p>

          <Link
            href="/my-leagues/create"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Create a League
          </Link>
        </section>
      </main>
    );
  }

  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/join/${league.code}` : "";

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied!");
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            The Fantasy Golf Association
          </Link>

          <Link
            href="/my-leagues"
            className="text-gray-600 hover:text-black"
          >
            My Leagues
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            League Dashboard
          </p>

          <h2 className="text-4xl font-bold mb-2">
            {league.name}
          </h2>

          <p className="text-gray-600">
            Commissioner: {league.commissioner}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">
              League Code
            </p>

            <p className="text-3xl font-bold tracking-wider">
              {league.code}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">
              Teams
            </p>

            <p className="text-3xl font-bold">
              {league.members} / {league.number_of_teams}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-2">
              Commissioner
            </p>

            <p className="text-xl font-bold">
              {league.commissioner}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold mb-2">
            Invite Your Friends
          </h3>

          <p className="text-gray-600 mb-6">
            Share your league code or invite link with your friends.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              League Code
            </label>

            <div className="flex gap-3">
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-bold tracking-wider">
                {league.code}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Invite Link
            </label>

            <div className="flex gap-3">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
              />

              <button
                onClick={copyInviteLink}
                className="bg-black text-white px-5 py-3 rounded-lg font-semibold hover:bg-gray-800"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}