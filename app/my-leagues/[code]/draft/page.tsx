"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type Golfer = {
  id: string;
  name: string;
  country: string;
  world_ranking: number;
  is_available: boolean;
};

type DraftPick = {
  id: string;
  league_id: string;
  round_number: number;
  pick_number: number;
  golfer_name: string;
  user_id: string;
  team_name?: string;
  manager_name?: string;
};

type League = {
  id: string;
  code: string;
  name: string;
  number_of_teams: number;
};

export default function DraftRoom({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const resolvedParams = use(params);
  const leagueCode = resolvedParams.code;
  const router = useRouter();

  const [league, setLeague] = useState<League | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadDraftData() {
      // 1. Fetch league details
      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("*")
        .eq("code", leagueCode.toUpperCase())
        .single();

      if (leagueError || !leagueData) {
        console.error("League fetch error:", leagueError);
        setLoading(false);
        return;
      }

      setLeague(leagueData);

      // 2. Fetch available golfers
      const { data: golferData, error: golferError } = await supabase
        .from("golfers")
        .select("*")
        .order("world_ranking", { ascending: true });

      if (golferError) console.error("Golfer fetch error:", golferError);

      // 3. Fetch league members/teams so we can map user_ids to team names
      const { data: memberData, error: memberError } = await supabase
        .from("league_members") // or whatever your membership table is named (e.g. teams/league_teams)
        .select("*")
        .eq("league_id", leagueData.id);

      // Create a lookup map for user_id -> team_name
      const teamMap = new Map<string, string>();
      if (!memberError && memberData) {
        memberData.forEach((m) => {
          // Adjust property names based on your schema (e.g., m.team_name or m.name)
          teamMap.set(m.user_id, m.team_name || m.name || "Manager Team");
        });
      }

      // 4. Fetch existing draft picks using league_id
      const { data: pickData, error: pickError } = await supabase
        .from("draft_picks")
        .select("*")
        .eq("league_id", leagueData.id)
        .order("pick_number", { ascending: true });

      if (pickError) {
        console.error("Pick fetch error:", pickError);
      } 

      const currentPicks = (pickData || []).map((p) => ({
        ...p,
        team_name: teamMap.get(p.user_id) || "Team",
      }));
      
      setPicks(currentPicks);

      // Mark drafted golfers as unavailable based on existing picks
      const draftedGolferNames = new Set(currentPicks.map((p) => p.golfer_name));
      if (golferData) {
        setGolfers(
          golferData.map((g) => ({
            ...g,
            is_available: !draftedGolferNames.has(g.name),
          }))
        );
      }

      setLoading(false);
    }

    loadDraftData();
  }, [leagueCode]);

  // Setup Supabase Realtime once league is loaded
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
        async (payload) => {
          const newPick = payload.new as DraftPick;

          // Fetch team name for the user who made the pick
          const { data: memberData } = await supabase
            .from("league_members")
            .select("*")
            .eq("league_id", league.id)
            .eq("user_id", newPick.user_id)
            .single();

          const enhancedPick: DraftPick = {
            ...newPick,
            team_name: memberData?.team_name || memberData?.name || "Team",
          };

          setPicks((currentPicks) => {
            if (currentPicks.some((p) => p.id === enhancedPick.id)) return currentPicks;
            return [...currentPicks, enhancedPick];
          });

          setGolfers((currentGolfers) =>
            currentGolfers.map((g) =>
              g.name === enhancedPick.golfer_name ? { ...g, is_available: false } : g
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [league]);

  async function handleDraftGolfer(golfer: Golfer) {
    if (!league) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      alert("You must be logged in to draft.");
      return;
    }

    const nextPickNumber = picks.length + 1;
    const numTeams = league.number_of_teams || 10;
    const nextRound = Math.ceil(nextPickNumber / numTeams);

    const pickPayload = {
      league_id: league.id,
      round_number: nextRound,
      pick_number: nextPickNumber,
      golfer_name: golfer.name,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("draft_picks")
      .insert([pickPayload])
      .select();

    if (error) {
      console.error("Detailed Supabase Insert Error:", JSON.stringify(error, null, 2));
      alert(`Error making pick: ${error.message || "Check console for details"}`);
    } else {
      // Fetch user's team name for immediate UI reflection
      const { data: memberData } = await supabase
        .from("league_members")
        .select("*")
        .eq("league_id", league.id)
        .eq("user_id", user.id)
        .single();

      const newPickItem: DraftPick = data && data[0] ? {
        ...data[0],
        team_name: memberData?.team_name || memberData?.name || "Team"
      } : {
        id: Math.random().toString(),
        team_name: memberData?.team_name || memberData?.name || "Team",
        ...pickPayload
      };

      setPicks((prev) => {
        if (prev.some(p => p.id === newPickItem.id)) return prev;
        return [...prev, newPickItem];
      });
      
      setGolfers(
        golfers.map((g) => (g.id === golfer.id ? { ...g, is_available: false } : g))
      );
    }
  }

  const filteredGolfers = golfers.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 font-medium">Loading Draft Room...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            href={`/my-leagues/${leagueCode}`}
            className="text-xl font-bold text-gray-900"
          >
            ← Back to League Dashboard
          </Link>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Draft Room ({leagueCode.toUpperCase()})
          </span>
        </div>
      </header>

      {/* Main Draft Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Golfer Pool & Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Golfers</h2>
            
            <input
              type="text"
              placeholder="Search golfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Rank</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Country</th>
                    <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGolfers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                        No golfers found in the database.
                      </td>
                    </tr>
                  ) : (
                    filteredGolfers.map((golfer) => (
                      <tr key={golfer.id} className="hover:bg-gray-50/50">
                        <td className="p-3 text-sm font-medium text-gray-600">
                          #{golfer.world_ranking}
                        </td>
                        <td className="p-3 text-sm font-bold text-gray-900">
                          {golfer.name}
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {golfer.country}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDraftGolfer(golfer)}
                            disabled={!golfer.is_available}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              golfer.is_available
                                ? "bg-black text-white hover:bg-gray-800"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {golfer.is_available ? "Draft" : "Picked"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Live Draft Board / Recent Picks */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Draft Board</h2>
            
            {picks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No picks made yet. The draft is underway!
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {picks.map((pick) => (
                  <div
                    key={pick.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-700">
                          R{pick.round_number} - P{pick.pick_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          • {pick.team_name || "Manager Team"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">
                        {pick.golfer_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}