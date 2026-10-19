"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { League } from "@/app/lib/leagues";

export default function JoinLeagueByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();

  const [league, setLeague] = useState<League | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [{ data: leagueData, error: leagueError }, { data: userData }] =
        await Promise.all([
          supabase.from("leagues").select("*").eq("code", code).maybeSingle(),
          supabase.auth.getUser(),
        ]);

      if (leagueError) console.error(leagueError);

      const user = userData.user;
      setUserId(user?.id ?? null);

      if (leagueData) {
        setLeague(leagueData);

        if (user) {
          const { data: existing } = await supabase
            .from("league_members")
            .select("id")
            .eq("league_id", leagueData.id)
            .eq("user_id", user.id)
            .maybeSingle();
          setAlreadyMember(!!existing);
        }
      }

      setLoading(false);
    }

    load();
  }, [code]);

  async function handleJoinLeague() {
    if (!league || !userId || joining) return;
    setError("");

    const name = teamName.trim();
    if (!name) {
      setError("Give your team a name before joining.");
      return;
    }

    setJoining(true);

    // Re-check capacity against real members rather than the cached count.
    const { count } = await supabase
      .from("league_members")
      .select("id", { count: "exact", head: true })
      .eq("league_id", league.id);

    if ((count ?? 0) >= league.number_of_teams) {
      setError("This league just filled up.");
      setJoining(false);
      return;
    }

    // Next open draft slot. Retry if two people join at the same moment.
    let memberError: { message: string } | null = null;
    let position = (count ?? 0) + 1;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: insertError } = await supabase.from("league_members").insert({
        league_id: league.id,
        user_id: userId,
        team_name: name,
        draft_position: position,
      });
      memberError = insertError;
      if (!insertError) break;
      position += 1;
    }

    if (memberError) {
      console.error(memberError);
      setError(`We couldn't add you to the league: ${memberError.message}`);
      setJoining(false);
      return;
    }

    const { count: newCount } = await supabase
      .from("league_members")
      .select("id", { count: "exact", head: true })
      .eq("league_id", league.id);

    const { data: updated } = await supabase
      .from("leagues")
      .update({ members: newCount ?? position })
      .eq("id", league.id)
      .select()
      .single();

    setLeague(updated ?? { ...league, members: newCount ?? position });
    setJoined(true);
    setJoining(false);
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center py-32">
        <p className="text-gray-600">Loading league...</p>
      </main>
    );
  }

  if (!league) {
    return (
      <main>
        <section className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">League not found</h1>
          <p className="text-gray-600 mb-8">
            We couldn&apos;t find a league with the code <strong>{code}</strong>.
          </p>
          <Link
            href="/join"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Enter another code
          </Link>
        </section>
      </main>
    );
  }

  if (joined) {
    return (
      <main>
        <section className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-8">
            <h1 className="text-3xl font-bold mb-3">You&apos;re in!</h1>
            <p className="text-gray-600 mb-2">You joined</p>
            <p className="text-2xl font-bold mb-6">{league.name}</p>
            <p className="text-gray-600 mb-8">
              The league now has{" "}
              <strong>
                {league.members} / {league.number_of_teams}
              </strong>{" "}
              teams.
            </p>
            <Link
              href={`/my-leagues/${league.code}`}
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Go to league
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const leagueFull = league.members >= league.number_of_teams;

  return (
    <main>
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-emerald-700 mb-2">
            You&apos;ve been invited
          </p>
          <h1 className="text-4xl font-bold mb-3">{league.name}</h1>
          <p className="text-gray-600">Join the league and compete for the FGA Cup.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <dl className="space-y-5 mb-8">
            <div>
              <dt className="text-sm text-gray-500">League code</dt>
              <dd className="text-xl font-bold tracking-wider">{league.code}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Commissioner</dt>
              <dd className="text-lg font-semibold">{league.commissioner}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Teams</dt>
              <dd className="text-lg font-semibold">
                {league.members} / {league.number_of_teams}
              </dd>
            </div>
          </dl>

          {alreadyMember ? (
            <div className="text-center">
              <p className="font-semibold mb-4">You&apos;re already in this league.</p>
              <Link
                href={`/my-leagues/${league.code}`}
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Go to league
              </Link>
            </div>
          ) : leagueFull ? (
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="font-semibold">This league is full.</p>
            </div>
          ) : !userId ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Sign in to pick a team name and join.</p>
              <Link
                href={`/login?next=/join/${league.code}`}
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Sign in to join
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-semibold mb-2">
                  Your team name
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Birdie Bandits"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <p role="alert" className="text-red-600 text-sm">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleJoinLeague}
                disabled={joining}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {joining ? "Joining..." : "Join league"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
