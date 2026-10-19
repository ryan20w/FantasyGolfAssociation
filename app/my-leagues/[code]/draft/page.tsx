"use client";

import { useCallback, useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import type { League } from "@/app/lib/leagues";
import {
  DRAFT_ROUNDS,
  getMemberForPick,
  getPickSlot,
  type Member,
} from "@/app/lib/draft";

type Golfer = {
  id: string;
  name: string;
  country: string;
  world_ranking: number;
};

type DraftPick = {
  id: string;
  league_id: number;
  round_number: number;
  pick_number: number;
  golfer_name: string;
  user_id: string;
};

export default function DraftRoom({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = use(params);
  const leagueCode = rawCode.toUpperCase();

  const [league, setLeague] = useState<League | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hideDrafted, setHideDrafted] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchPicks = useCallback(async (leagueId: number) => {
    const { data, error } = await supabase
      .from("draft_picks")
      .select("*")
      .eq("league_id", leagueId)
      .order("pick_number", { ascending: true });
    if (error) console.error("Pick fetch error:", error);
    setPicks((data ?? []) as DraftPick[]);
  }, []);

  useEffect(() => {
    async function loadDraftData() {
      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("*")
        .eq("code", leagueCode)
        .maybeSingle();

      if (leagueError || !leagueData) {
        console.error("League fetch error:", leagueError);
        setLoading(false);
        return;
      }
      setLeague(leagueData);

      const [golferRes, memberRes, userRes] = await Promise.all([
        supabase.from("golfers").select("*").order("world_ranking", { ascending: true }),
        supabase
          .from("league_members")
          .select("*")
          .eq("league_id", leagueData.id)
          .order("draft_position", { ascending: true }),
        supabase.auth.getUser(),
      ]);

      if (golferRes.error) console.error("Golfer fetch error:", golferRes.error);
      if (memberRes.error) console.error("Member fetch error:", memberRes.error);

      setGolfers((golferRes.data ?? []) as Golfer[]);
      setMembers((memberRes.data ?? []) as Member[]);
      setUserId(userRes.data.user?.id ?? null);

      await fetchPicks(leagueData.id);
      setLoading(false);
    }

    loadDraftData();
  }, [leagueCode, fetchPicks]);

  // Live updates: every pick anyone makes shows up for everyone.
  useEffect(() => {
    if (!league) return;

    const channel = supabase
      .channel(`draft-${league.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "draft_picks",
          filter: `league_id=eq.${league.id}`,
        },
        (payload) => {
          const newPick = payload.new as DraftPick;
          setPicks((current) =>
            current.some((p) => p.id === newPick.id)
              ? current
              : [...current, newPick].sort((a, b) => a.pick_number - b.pick_number)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [league]);

  // ----- Derived draft state -----
  const orderedMembers = useMemo(
    () => [...members].sort((a, b) => a.draft_position - b.draft_position),
    [members]
  );
  const memberByUser = useMemo(
    () => new Map(orderedMembers.map((m) => [m.user_id, m])),
    [orderedMembers]
  );
  const pickByGolfer = useMemo(
    () => new Map(picks.map((p) => [p.golfer_name, p])),
    [picks]
  );

  const numTeams = orderedMembers.length;
  const totalPicks = numTeams * DRAFT_ROUNDS;
  const nextPickNumber = picks.length + 1;
  const draftComplete = numTeams > 0 && picks.length >= totalPicks;

  const onTheClock = draftComplete ? null : getMemberForPick(nextPickNumber, orderedMembers);
  const upNext =
    draftComplete || nextPickNumber + 1 > totalPicks
      ? null
      : getMemberForPick(nextPickNumber + 1, orderedMembers);
  const currentSlot = numTeams > 0 ? getPickSlot(nextPickNumber, numTeams) : null;

  const myMember = userId ? memberByUser.get(userId) ?? null : null;
  const isMyTurn = !!onTheClock && onTheClock.user_id === userId;
  const backToBack = !!onTheClock && !!upNext && onTheClock.user_id === upNext.user_id;

  const teamName = (uid: string) => memberByUser.get(uid)?.team_name ?? "Unknown team";

  async function handleDraftGolfer(golfer: Golfer) {
    if (!league || !isMyTurn || !userId || drafting || !currentSlot) return;

    setDrafting(true);
    setNotice(null);

    const { data, error } = await supabase
      .from("draft_picks")
      .insert([
        {
          league_id: league.id,
          round_number: currentSlot.round,
          pick_number: nextPickNumber,
          golfer_name: golfer.name,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      if (error.code === "23505") {
        setNotice("Someone else just made that pick. The board has been refreshed.");
        await fetchPicks(league.id);
      } else {
        setNotice(`We couldn't make that pick: ${error.message}`);
      }
    } else if (data) {
      const newPick = data as DraftPick;
      setPicks((current) =>
        current.some((p) => p.id === newPick.id)
          ? current
          : [...current, newPick].sort((a, b) => a.pick_number - b.pick_number)
      );
    }

    setDrafting(false);
  }

  const filteredGolfers = golfers.filter((g) => {
    if (hideDrafted && pickByGolfer.has(g.name)) return false;
    return g.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const myPicks = picks.filter((p) => p.user_id === userId);

  // ----- Render -----
  if (loading) {
    return (
      <main className="flex items-center justify-center py-32">
        <p className="text-gray-600 font-medium">Loading draft room...</p>
      </main>
    );
  }

  if (!league) {
    return (
      <main>
        <section className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">League not found</h1>
          <p className="text-gray-600 mb-8">
            We couldn&apos;t find a league with the code <strong>{leagueCode}</strong>.
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

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <Link
              href={`/my-leagues/${leagueCode}`}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Back to league
            </Link>
            <h1 className="text-3xl font-bold mt-1">{league.name} draft</h1>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
            {leagueCode}
          </span>
        </div>

        {/* Draft status */}
        {numTeams === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
            <p className="font-semibold text-gray-900">No teams in this league yet.</p>
            <p className="text-sm text-gray-600 mt-1">
              The draft starts once teams have joined. Share the league code{" "}
              <strong>{league.code}</strong> to fill it up.
            </p>
          </div>
        ) : draftComplete ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 mb-6">
            <p className="text-xl font-bold text-emerald-900">Draft complete</p>
            <p className="text-sm text-emerald-800 mt-1">
              All {totalPicks} picks are in. Good luck this season.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-2xl border p-6 mb-6 grid gap-6 sm:grid-cols-3 ${
              isMyTurn
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-200 bg-white"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="sm:col-span-2">
              <p className={`text-sm font-medium ${isMyTurn ? "text-emerald-100" : "text-gray-500"}`}>
                {isMyTurn ? "You're on the clock" : "On the clock"}
              </p>
              <p className="text-3xl font-bold mt-1">{onTheClock?.team_name}</p>
              {currentSlot && (
                <p className={`text-sm mt-1 ${isMyTurn ? "text-emerald-100" : "text-gray-500"}`}>
                  Round {currentSlot.round} of {DRAFT_ROUNDS}, pick {nextPickNumber} of {totalPicks}
                </p>
              )}
            </div>
            <div>
              <p className={`text-sm font-medium ${isMyTurn ? "text-emerald-100" : "text-gray-500"}`}>
                Up next
              </p>
              {upNext ? (
                <>
                  <p className="text-xl font-bold mt-1">{upNext.team_name}</p>
                  {backToBack && (
                    <p className={`text-xs mt-1 ${isMyTurn ? "text-emerald-100" : "text-gray-500"}`}>
                      Back-to-back picks
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xl font-bold mt-1">Final pick</p>
              )}
            </div>
          </div>
        )}

        {notice && (
          <div role="alert" className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 rounded-lg">
            {notice}
          </div>
        )}

        {!myMember && numTeams > 0 && (
          <div className="mb-6 bg-gray-100 border border-gray-200 text-gray-700 text-sm p-3 rounded-lg">
            You&apos;re watching this draft. Only teams in the league can make picks.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: golfer pool */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">Golfers</h2>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideDrafted}
                    onChange={(e) => setHideDrafted(e.target.checked)}
                    className="accent-emerald-600"
                  />
                  Hide drafted golfers
                </label>
              </div>

              <label htmlFor="golferSearch" className="sr-only">
                Search golfers
              </label>
              <input
                id="golferSearch"
                type="text"
                placeholder="Search golfers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <div className="overflow-x-auto max-h-[560px] overflow-y-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-xs font-semibold text-gray-500">Rank</th>
                      <th className="p-3 text-xs font-semibold text-gray-500">Name</th>
                      <th className="p-3 text-xs font-semibold text-gray-500">Country</th>
                      <th className="p-3 text-xs font-semibold text-gray-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredGolfers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                          {golfers.length === 0
                            ? "No golfers in the database yet."
                            : "No golfers match your search."}
                        </td>
                      </tr>
                    ) : (
                      filteredGolfers.map((golfer) => {
                        const pick = pickByGolfer.get(golfer.name);
                        return (
                          <tr key={golfer.id} className={pick ? "bg-gray-50/70" : "hover:bg-gray-50/50"}>
                            <td className="p-3 text-sm font-medium text-gray-600">
                              #{golfer.world_ranking}
                            </td>
                            <td className={`p-3 text-sm font-bold ${pick ? "text-gray-400" : "text-gray-900"}`}>
                              {golfer.name}
                            </td>
                            <td className="p-3 text-sm text-gray-500">{golfer.country}</td>
                            <td className="p-3 text-right">
                              {pick ? (
                                <span className="text-xs text-gray-500">
                                  Drafted by <strong>{teamName(pick.user_id)}</strong>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDraftGolfer(golfer)}
                                  disabled={!isMyTurn || drafting}
                                  title={isMyTurn ? undefined : "You can draft when you're on the clock"}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    isMyTurn && !drafting
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  Draft
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: order, board, my team */}
          <div className="space-y-6">
            {/* Draft order */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Teams</h2>
              {numTeams === 0 ? (
                <p className="text-sm text-gray-500">No teams yet.</p>
              ) : (
                <ol className="space-y-2">
                  {orderedMembers.map((m) => {
                    const isClock = onTheClock?.user_id === m.user_id;
                    const isNext = !isClock && upNext?.user_id === m.user_id;
                    const count = picks.filter((p) => p.user_id === m.user_id).length;
                    return (
                      <li
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isClock
                            ? "border-emerald-600 bg-emerald-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <span className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {m.draft_position}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {m.team_name}
                            {m.user_id === userId && (
                              <span className="ml-2 text-xs font-semibold text-emerald-700">You</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {count} of {DRAFT_ROUNDS} drafted
                          </p>
                        </div>
                        {isClock && (
                          <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                            On the clock
                          </span>
                        )}
                        {isNext && (
                          <span className="text-xs font-semibold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                            Up next
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Draft board */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Draft board</h2>

              {picks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No picks yet.
                  {onTheClock && (
                    <>
                      {" "}
                      <strong>{onTheClock.team_name}</strong> is first on the clock.
                    </>
                  )}
                </p>
              ) : (
                <ol className="space-y-3 max-h-[420px] overflow-y-auto">
                  {[...picks].reverse().map((pick) => {
                    const slot = numTeams > 0 ? getPickSlot(pick.pick_number, numTeams) : null;
                    const pickInRound = numTeams > 0 ? ((pick.pick_number - 1) % numTeams) + 1 : pick.pick_number;
                    return (
                      <li
                        key={pick.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-xl"
                      >
                        <p className="text-xs font-semibold text-emerald-700">
                          Round {slot?.round ?? pick.round_number}, pick {pickInRound}{" "}
                          <span className="text-gray-400 font-normal">(#{pick.pick_number} overall)</span>
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {pick.golfer_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Drafted by <strong>{teamName(pick.user_id)}</strong>
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* My team */}
            {myMember && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{myMember.team_name}</h2>
                <p className="text-sm text-gray-500 mb-4">Your roster</p>
                {myPicks.length === 0 ? (
                  <p className="text-sm text-gray-500">You haven&apos;t drafted anyone yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {myPicks.map((p) => (
                      <li key={p.id} className="flex justify-between text-sm">
                        <span className="font-semibold text-gray-900">{p.golfer_name}</span>
                        <span className="text-gray-500">Round {p.round_number}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
