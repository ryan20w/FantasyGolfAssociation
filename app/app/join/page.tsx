"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function JoinLeaguePage() {
  const [leagueCode, setLeagueCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const router = useRouter();

  async function handleJoinLeague(e?: React.FormEvent) {
    e?.preventDefault();
    const formattedCode = leagueCode.trim().toUpperCase();

    if (!formattedCode) {
      setError("Enter a league code to continue.");
      return;
    }

    setError("");
    setChecking(true);

    const { data, error: supabaseError } = await supabase
      .from("leagues")
      .select("code")
      .eq("code", formattedCode)
      .maybeSingle();

    setChecking(false);

    if (supabaseError) {
      console.error("Supabase error:", supabaseError);
      setError(`There was a problem checking the league: ${supabaseError.message}`);
      return;
    }

    if (!data) {
      setError("We couldn't find that league. Check the code and try again.");
      return;
    }

    router.push(`/join/${formattedCode}`);
  }

  return (
    <main className="bg-gray-50">
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Join a league</h1>
          <p className="text-gray-600">
            Enter the code your league commissioner shared with you.
          </p>
        </div>

        <form
          onSubmit={handleJoinLeague}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8"
        >
          <label htmlFor="leagueCode" className="block text-sm font-semibold mb-2">
            League code
          </label>

          <input
            id="leagueCode"
            type="text"
            value={leagueCode}
            onChange={(e) => {
              setLeagueCode(e.target.value);
              setError("");
            }}
            placeholder="FGA-7K42"
            autoComplete="off"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {error && (
            <p role="alert" className="text-red-600 text-sm mb-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={checking}
            className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {checking ? "Checking..." : "Find league"}
          </button>
        </form>
      </section>
    </main>
  );
}
