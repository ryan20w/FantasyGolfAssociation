"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function CreateLeague() {
  const router = useRouter();

  const [leagueName, setLeagueName] = useState("");
  const [commissionerName, setCommissionerName] = useState("");
  const [numberOfTeams, setNumberOfTeams] = useState("8");

  function generateLeagueCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return `FGA-${code}`;
  }

  async function handleCreateLeague() {
    if (!leagueName.trim() || !commissionerName.trim()) {
      alert("Please enter a league name and commissioner name.");
      return;
    }

    // 1. Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be signed in to create a league!");
      router.push("/login");
      return;
    }

    const leagueCode = generateLeagueCode();

    // 2. Insert league including the user's ID as commissioner_id
    const { error } = await supabase
      .from("leagues")
      .insert({
        code: leagueCode,
        name: leagueName.trim(),
        commissioner: commissionerName.trim(),
        number_of_teams: Number(numberOfTeams),
        members: 1,
        commissioner_id: user.id,
      });

    if (error) {
  console.error("Supabase Error Message:", error.message);
  console.error("Supabase Error Details:", error.details);
  alert(`Problem creating league: ${error.message}`);
  return;
}

    router.push(`/my-leagues/${leagueCode}`);
  }

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">
            The Fantasy Golf Association
          </h1>
        </div>
      </header>

      {/* Create League */}
      <section className="max-w-3xl mx-auto px-6 py-16">

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            The Fantasy Golf Association
          </p>

          <h2 className="text-4xl font-bold mb-3">
            Create Your League
          </h2>

          <p className="text-gray-600">
            Set up your league and get your friends ready for the season.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

          {/* League Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              League Name
            </label>

            <input
              type="text"
              placeholder="e.g. The Boys Golf League"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Commissioner */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Commissioner Name
            </label>

            <input
              type="text"
              placeholder="Your name"
              value={commissionerName}
              onChange={(e) => setCommissionerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Number of Teams */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Number of Teams
            </label>

            <select
              value={numberOfTeams}
              onChange={(e) => setNumberOfTeams(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="4">4 Teams</option>
              <option value="5">5 Teams</option>
              <option value="6">6 Teams</option>
              <option value="7">7 Teams</option>
              <option value="8">8 Teams</option>
              <option value="10">10 Teams</option>
              <option value="12">12 Teams</option>
              <option value="14">14 Teams</option>
              <option value="16">16 Teams</option>
            </select>
          </div>

          {/* Create League Button */}
          <button
            type="button"
            onClick={handleCreateLeague}
            className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Create League
          </button>

        </div>

      </section>

    </main>
  );
}