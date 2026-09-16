"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinLeague() {
  const router = useRouter();

  const [leagueCode, setLeagueCode] = useState("");
  const [error, setError] = useState("");

  function handleJoinLeague() {
    const formattedCode = leagueCode.trim().toUpperCase();

    if (!formattedCode) {
      setError("Please enter a league code.");
      return;
    }

    const savedLeague = localStorage.getItem(
      `fga-league-${formattedCode}`
    );

    if (!savedLeague) {
      setError("League not found. Check your code and try again.");
      return;
    }

    router.push(`/join/${formattedCode}`);
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

      {/* Join League */}
      <section className="max-w-xl mx-auto px-6 py-16">

        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            The Fantasy Golf Association
          </p>

          <h2 className="text-4xl font-bold mb-3">
            Join a League
          </h2>

          <p className="text-gray-600">
            Enter the league code provided by your commissioner.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

          <label className="block text-sm font-semibold mb-2">
            League Code
          </label>

          <input
            type="text"
            placeholder="e.g. FGA-X7KQ"
            value={leagueCode}
            onChange={(e) => {
              setLeagueCode(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleJoinLeague();
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 uppercase focus:outline-none focus:ring-2 focus:ring-black"
          />

          {error && (
            <p className="text-red-600 text-sm mb-4">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleJoinLeague}
            className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Find League
          </button>

        </div>

      </section>

    </main>
  );
}