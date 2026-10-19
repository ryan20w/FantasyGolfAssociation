"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { League } from "@/app/lib/leagues";
import { DRAFT_ROUNDS, type Member } from "@/app/lib/draft";

export default function LeaguePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();

  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    async function loadLeague() {
      const { data, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (error) console.error(error);

      if (data) {
        setLeague(data);

        const [{ data: memberData }, { data: userData }] = await Promise.all([
          supabase
            .from("league_members")
            .select("*")
            .eq("league_id", data.id)
            .order("draft_position", { ascending: true }),
          supabase.auth.getUser(),
        ]);

        setMembers((memberData ?? []) as Member[]);
        setUserId(userData.user?.id ?? null);
      }

      setLoading(false);
    }

    loadLeague();
  }, [code]);

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
          <div className="flex justify-center gap-3">
            <Link
              href="/my-leagues/create"
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Create a league
            </Link>
            <Link
              href="/join"
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Join a league
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/join/${league.code}` : "";

  async function copy(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard can be blocked; the text is still selectable on screen.
    }
  }

  const openSpots = Math.max(league.number_of_teams - members.length, 0);
  const isMember = members.some((m) => m.user_id === userId);

  return (
    <main>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <Link
          href="/my-leagues"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          &larr; My Leagues
        </Link>

        <div className="mt-4 mb-8">
          <h1 className="text-4xl font-bold mb-2">{league.name}</h1>
          <p className="text-gray-600">Commissioner: {league.commissioner}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">League code</p>
            <p className="text-3xl font-bold tracking-wider">{league.code}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Teams</p>
            <p className="text-3xl font-bold">
              {members.length} / {league.number_of_teams}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Draft</p>
            <p className="text-xl font-bold">
              Snake, {DRAFT_ROUNDS} rounds
            </p>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold mb-1">Teams and draft order</h2>
          <p className="text-gray-600 mb-6">
            Picks follow a snake order: the order reverses each round.
          </p>

          {members.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center border-2 border-dashed border-gray-200 rounded-xl">
              No teams yet. Share the invite link below to fill the league.
            </p>
          ) : (
            <ol className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {m.draft_position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{m.team_name}</p>
                    {m.user_id === league.commissioner_id && (
                      <p className="text-xs text-gray-500">Commissioner</p>
                    )}
                  </div>
                  {m.user_id === userId && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
                      You
                    </span>
                  )}
                </li>
              ))}
              {Array.from({ length: openSpots }).map((_, i) => (
                <li
                  key={`open-${i}`}
                  className="p-4 rounded-xl border-2 border-dashed border-gray-200 flex items-center gap-4 text-gray-400"
                >
                  <span className="w-8 h-8 rounded-full border border-gray-300 text-sm font-bold flex items-center justify-center shrink-0">
                    {members.length + i + 1}
                  </span>
                  <p className="text-sm">Open spot</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Invite */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold mb-1">Invite your friends</h2>
          <p className="text-gray-600 mb-6">
            Share the league code or the invite link.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">League code</label>
              <div className="flex gap-3">
                <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-bold tracking-wider">
                  {league.code}
                </div>
                <button
                  type="button"
                  onClick={() => copy(league.code, "code")}
                  className="bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors w-32 shrink-0 whitespace-nowrap"
                >
                  {copied === "code" ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="inviteLink" className="block text-sm font-semibold mb-2">
                Invite link
              </label>
              <div className="flex gap-3">
                <input
                  id="inviteLink"
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 min-w-0 border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => copy(inviteLink, "link")}
                  className="bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors w-32 shrink-0 whitespace-nowrap"
                >
                  {copied === "link" ? "Copied" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/my-leagues/${league.code}/draft`}
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            Enter draft room
          </Link>
          {!isMember && userId && (
            <p className="text-sm text-gray-500">
              You&apos;re not on a team in this league, so you can watch the draft but not pick.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
