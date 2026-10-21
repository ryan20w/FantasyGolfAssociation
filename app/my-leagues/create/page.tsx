"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function CreateLeague() {
  const router = useRouter();

  const [leagueName, setLeagueName] = useState("");
  const [commissionerName, setCommissionerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [numberOfTeams, setNumberOfTeams] = useState("8");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  function generateLeagueCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `FGA-${code}`;
  }

  async function handleCreateLeague() {
    if (creating) return;
    setError("");

    if (!leagueName.trim()) {
      setError("Enter a league name to continue.");
      return;
    }
    if (!commissionerName.trim()) {
      setError("Enter your name to continue.");
      return;
    }
    if (!teamName.trim()) {
      setError("Give your team a name to continue.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login?next=/my-leagues/create");
      return;
    }

    setCreating(true);
    const leagueCode = generateLeagueCode();

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({
        code: leagueCode,
        name: leagueName.trim(),
        commissioner: commissionerName.trim(),
        number_of_teams: Number(numberOfTeams),
        members: 1,
        commissioner_id: user.id,
      })
      .select()
      .single();

    if (leagueError || !league) {
      console.error("Supabase error:", leagueError);
      setError(`We couldn't create your league: ${leagueError?.message ?? "unknown error"}`);
      setCreating(false);
      return;
    }

    // The commissioner is team #1 and picks first.
    const { error: memberError } = await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: user.id,
      team_name: teamName.trim(),
      draft_position: 1,
    });

    if (memberError) {
      console.error("Supabase error:", memberError);
      // Don't leave behind a league with no teams in it.
      await supabase.from("leagues").delete().eq("id", league.id);
      setError(`We couldn't add your team to the league: ${memberError.message}`);
      setCreating(false);
      return;
    }

    router.push(`/my-leagues/${leagueCode}`);
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="bg-gray-50">
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Link
          href="/my-leagues"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          &larr; My Leagues
        </Link>

        <div className="mt-4 mb-8">
          <h1 className="text-4xl font-bold mb-3">Create your league</h1>
          <p className="text-gray-600">
            Set up your league, then share the code with your friends.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div>
            <label htmlFor="leagueName" className="block text-sm font-semibold mb-2">
              League name
            </label>
            <input
              id="leagueName"
              type="text"
              placeholder="e.g. The Boys Golf League"
              maxLength={40}
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="commissionerName" className="block text-sm font-semibold mb-2">
              Your name
            </label>
            <input
              id="commissionerName"
              type="text"
              placeholder="Commissioner name"
              value={commissionerName}
              onChange={(e) => setCommissionerName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="teamName" className="block text-sm font-semibold mb-2">
              Your team name
            </label>
            <input
              id="teamName"
              type="text"
              placeholder="e.g. Birdie Bandits"
              maxLength={30}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              This is the name everyone sees in the draft room.
            </p>
          </div>

          <div>
            <label htmlFor="numberOfTeams" className="block text-sm font-semibold mb-2">
              Number of teams
            </label>
            <select
              id="numberOfTeams"
              value={numberOfTeams}
              onChange={(e) => setNumberOfTeams(e.target.value)}
              className={inputClass}
            >
              {[4, 5, 6, 7, 8, 10, 12, 14, 16].map((n) => (
                <option key={n} value={n}>
                  {n} Teams
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateLeague}
            disabled={creating}
            className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating league..." : "Create league"}
          </button>
        </div>
      </section>
    </main>
  );
}