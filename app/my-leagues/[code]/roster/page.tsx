"use client";

import { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { League } from "@/app/lib/leagues";
import { DRAFT_ROUNDS, type Member } from "@/app/lib/draft";

type Golfer = {
  id: string;
  name: string;
  country: string | null;
  world_ranking: number | null;
  owgr_rank: number | null;
  is_playing_this_week: boolean | null;
};

type DraftPick = {
  id: string;
  user_id: string;
  round_number: number;
  pick_number: number;
  golfer_name: string;
};

type Tab = "mine" | "teams" | "free";

const rankOf = (g: Golfer | undefined) => g?.owgr_rank ?? g?.world_ranking ?? null;

export default function RosterPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = use(params);
  const code = rawCode.toUpperCase();

  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("mine");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: leagueData } = await supabase
        .from("leagues")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (!leagueData) {
        setLoading(false);
        return;
      }
      setLeague(leagueData);

      const [memberRes, pickRes, golferRes, userRes] = await Promise.all([
        supabase
          .from("league_members")
          .select("*")
          .eq("league_id", leagueData.id)
          .order("draft_position", { ascending: true }),
        supabase
          .from("draft_picks")
          .select("*")
          .eq("league_id", leagueData.id)
          .order("pick_number", { ascending: true }),
        supabase.from("golfers").select("*"),
        supabase.auth.getUser(),
      ]);

      setMembers((memberRes.data ?? []) as Member[]);
      setPicks((pickRes.data ?? []) as DraftPick[]);
      setGolfers((golferRes.data ?? []) as Golfer[]);
      setUserId(userRes.data.user?.id ?? null);
      setLoading(false);
    }

    load();
  }, [code]);

  const golferByName = useMemo(() => new Map(golfers.map((g) => [g.name, g])), [golfers]);
  const draftedNames = useMemo(() => new Set(picks.map((p) => p.golfer_name)), [picks]);
  // Only trust the "playing this week" flag once the field sync has run at least once.
  const fieldLoaded = useMemo(() => golfers.some((g) => g.is_playing_this_week), [golfers]);

  const myMember = members.find((m) => m.user_id === userId) ?? null;
  const picksFor = (uid: string) => picks.filter((p) => p.user_id === uid);

  const freeAgents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return golfers
      .filter((g) => !draftedNames.has(g.name))
      .filter((g) => !fieldLoaded || g.is_playing_this_week)
      .filter((g) => g.name.toLowerCase().includes(term))
      .sort((a, b) => (rankOf(a) ?? 9999) - (rankOf(b) ?? 9999));
  }, [golfers, draftedNames, fieldLoaded, search]);

  function fieldBadge(golfer: Golfer | undefined) {
    if (!fieldLoaded || !golfer) return null;
    return golfer.is_playing_this_week ? (
      <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
        Playing this week
      </span>
    ) : (
      <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
        Not in field
      </span>
    );
  }

  function renderPick(pick: DraftPick) {
    const golfer = golferByName.get(pick.golfer_name);
    const rank = rankOf(golfer);
    return (
      <li key={pick.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
        <span className="text-xs font-semibold text-gray-500 w-14 shrink-0">
          Round {pick.round_number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{pick.golfer_name}</p>
          <p className="text-xs text-gray-500">
            {rank ? `World #${rank}` : "Unranked"}
            {golfer?.country ? ` · ${golfer.country}` : ""}
          </p>
        </div>
        {fieldBadge(golfer)}
      </li>
    );
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center py-32">
        <p className="text-gray-600">Loading rosters...</p>
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
            href="/my-leagues"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
          >
            Back to my leagues
          </Link>
        </section>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "mine", label: "My roster" },
    { id: "teams", label: "All teams" },
    { id: "free", label: "Free agents" },
  ];

  const myPicks = myMember ? picksFor(myMember.user_id) : [];
  const offField = fieldLoaded
    ? myPicks.filter((p) => !golferByName.get(p.golfer_name)?.is_playing_this_week).length
    : 0;

  return (
    <main>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <Link
          href={`/my-leagues/${code}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          &larr; Back to league
        </Link>

        <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold mb-1">{league.name}</h1>
            <p className="text-gray-600">Rosters and free agents</p>
          </div>
          <Link
            href={`/my-leagues/${code}/draft`}
            className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Draft room
          </Link>
        </div>

        <div role="tablist" className="flex gap-2 border-b border-gray-200 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* My roster */}
        {tab === "mine" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            {!myMember ? (
              <p className="text-gray-600">
                You&apos;re not on a team in this league, so there&apos;s no roster to show. You can
                still browse the other teams.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{myMember.team_name}</h2>
                  <p className="text-sm text-gray-500">
                    {myPicks.length} of {DRAFT_ROUNDS} drafted
                  </p>
                </div>
                {offField > 0 && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 my-4">
                    {offField} {offField === 1 ? "golfer on your roster isn't" : "golfers on your roster aren't"} in
                    this week&apos;s field.
                  </p>
                )}

                {myPicks.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl mt-4">
                    <p className="text-gray-500 mb-4">You haven&apos;t drafted anyone yet.</p>
                    <Link
                      href={`/my-leagues/${code}/draft`}
                      className="inline-block bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Go to the draft room
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-2 mt-4">
                    {myPicks.map((p) => renderPick(p))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        {/* All teams */}
        {tab === "teams" && (
          <div className="grid md:grid-cols-2 gap-6">
            {members.length === 0 && (
              <p className="text-gray-500 md:col-span-2">No teams in this league yet.</p>
            )}
            {members.map((m) => {
              const teamPicks = picksFor(m.user_id);
              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl border shadow-sm p-6 ${
                    m.user_id === userId ? "border-emerald-600" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold truncate">{m.team_name}</h2>
                      <p className="text-xs text-gray-500">
                        Pick #{m.draft_position} · {teamPicks.length} of {DRAFT_ROUNDS} drafted
                      </p>
                    </div>
                    {m.user_id === userId && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  {teamPicks.length === 0 ? (
                    <p className="text-sm text-gray-400">No golfers yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {teamPicks.map((p) => renderPick(p))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Free agents */}
        {tab === "free" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-1">Free agents</h2>
            <p className="text-gray-600 mb-4">
              {fieldLoaded
                ? "Golfers in this week's field that nobody in your league has drafted."
                : "Golfers that nobody in your league has drafted. The weekly field hasn't loaded yet, so this shows everyone."}
            </p>

            <label htmlFor="faSearch" className="sr-only">
              Search free agents
            </label>
            <input
              id="faSearch"
              type="text"
              placeholder="Search free agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="overflow-x-auto max-h-[560px] overflow-y-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-gray-500">Rank</th>
                    <th className="p-3 text-xs font-semibold text-gray-500">Name</th>
                    <th className="p-3 text-xs font-semibold text-gray-500">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {freeAgents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-500 text-sm">
                        No free agents match.
                      </td>
                    </tr>
                  ) : (
                    freeAgents.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50/50">
                        <td className="p-3 text-sm font-medium text-gray-600">
                          {rankOf(g) ? `#${rankOf(g)}` : "-"}
                        </td>
                        <td className="p-3 text-sm font-bold text-gray-900">{g.name}</td>
                        <td className="p-3 text-sm text-gray-500">{g.country ?? ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}