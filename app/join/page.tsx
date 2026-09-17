"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function JoinLeaguePage() {
  const [leagueCode, setLeagueCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const router = useRouter();

  async function handleJoinLeague() {
    const formattedCode = leagueCode.trim().toUpperCase();

    if (!formattedCode) {
      setError("Please enter a league code.");
      return;
    }

    setError("");
    setChecking(true);

    console.log("Looking for league code:", formattedCode);

    const { data, error: supabaseError } = await supabase
      .from("leagues")
      .select("code")
      .eq("code", formattedCode)
      .maybeSingle();

    console.log("Supabase result:", data);
    console.log("Supabase error:", supabaseError);

    setChecking(false);

    if (supabaseError) {
      console.error(supabaseError);
      setError("There was a problem checking the league.");
      return;
    }

    if (!data) {
      setError("League not found. Check your code and try again.");
      return;
    }

    router.push(`/join/${formattedCode}`);
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold">
            The Fantasy Golf Association
          </Link>
        </div>
      </header>

      <section className="max-w-xl mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Join a League
          </p>

          <h2 className="text-4xl font-bold mb-3">
            Enter Your League Code
          </h2>

          <p className="text-gray-600">
            Enter the code provided by your league commissioner.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <label className="block text-sm font-semibold mb-2">
            League Code
          </label>

          <input
            type="text"
            value={leagueCode}
            onChange={(e) => {
              setLeagueCode(e.target.value);
              setError("");
            }}
            placeholder="FGA-7K42"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 uppercase"
          />

          {error && (
            <p className="text-red-600 text-sm mb-4">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleJoinLeague}
            disabled={checking}
            className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {checking ? "Checking..." : "Find League"}
          </button>
        </div>
      </section>
    </main>
  );
}