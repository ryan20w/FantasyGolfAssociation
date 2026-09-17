"use client";

import { useEffect, useState } from "react";
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

export default function JoinLeaguePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [league, setLeague] = useState<League | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function loadLeague() {
      const { code } = await params;

      const formattedCode = code.toUpperCase();

      setCode(formattedCode);

      const { data, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("code", formattedCode)
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
  }, [params]);

  async function handleJoinLeague() {
    if (!league || joining) return;

    if (league.members >= league.number_of_teams) {
      alert("This league is full.");
      return;
    }

    setJoining(true);

    const newMemberCount = league.members + 1;

    const { data, error } = await supabase
      .from("leagues")
      .update({
        members: newMemberCount,
      })
      .eq("id", league.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("There was a problem joining the league.");
      setJoining(false);
      return;
    }

    setLeague(data);
    setJoined(true);
    setJoining(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">
          Loading league...
        </p>
      </main>
    );
  }

  if (!league) {
    return (
      <main className="min-h-screen bg-gray-100">

        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-2xl font-bold">
              The Fantasy Golf Association
            </Link>
          </div>
        </header>

        <section className="max-w-xl mx-auto px-6 py-20 text-center">

          <h2 className="text-3xl font-bold mb-4">
            League Not Found
          </h2>

          <p className="text-gray-600 mb-8">
            We couldn't find a league associated with code{" "}
            <strong>{code}</strong>.
          </p>

          <Link
            href="/join"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Enter Another Code
          </Link>

        </section>

      </main>
    );
  }

  if (joined) {
    return (
      <main className="min-h-screen bg-gray-100">

        <header className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-2xl font-bold">
              The Fantasy Golf Association
            </Link>
          </div>
        </header>

        <section className="max-w-xl mx-auto px-6 py-20 text-center">

          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-8">

            <h2 className="text-3xl font-bold mb-3">
              You're In!
            </h2>

            <p className="text-gray-600 mb-2">
              You have joined:
            </p>

            <p className="text-2xl font-bold mb-6">
              {league.name}
            </p>

            <p className="text-gray-600 mb-8">
              The league now has{" "}
              <strong>
                {league.members} / {league.number_of_teams}
              </strong>{" "}
              teams.
            </p>

            <Link
              href={`/my-leagues/${league.code}`}
              className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
            >
              View League
            </Link>

          </div>

        </section>

      </main>
    );
  }

  const leagueFull =
    league.members >= league.number_of_teams;

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold">
            The Fantasy Golf Association
          </Link>
        </div>
      </header>

      <section className="max-w-xl mx-auto px-6 py-16">

        <div className="mb-8 text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            You've Been Invited
          </p>

          <h2 className="text-4xl font-bold mb-3">
            {league.name}
          </h2>

          <p className="text-gray-600">
            Join the league and compete for the FGA Cup.
          </p>

        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

          <div className="space-y-5 mb-8">

            <div>
              <p className="text-sm text-gray-500">
                League Code
              </p>

              <p className="text-xl font-bold tracking-wider">
                {league.code}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Commissioner
              </p>

              <p className="text-lg font-semibold">
                {league.commissioner}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Teams
              </p>

              <p className="text-lg font-semibold">
                {league.members} / {league.number_of_teams}
              </p>
            </div>

          </div>

          {leagueFull ? (
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="font-semibold">
                This league is full.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleJoinLeague}
              disabled={joining}
              className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {joining ? "Joining..." : "Join League"}
            </button>
          )}

        </div>

      </section>

    </main>
  );
}