import { supabase } from "@/app/lib/supabase";

export type League = {
  id: number;
  code: string;
  name: string;
  commissioner: string;
  commissioner_id?: string;
  number_of_teams: number;
  members: number;
  created_at?: string;
};

export type MyLeague = League & { isCommissioner: boolean };

/** Every league the user created or joined, newest first. */
export async function fetchMyLeagues(userId: string): Promise<MyLeague[]> {
  const [{ data: memberships }, { data: created }] = await Promise.all([
    supabase.from("league_members").select("league_id").eq("user_id", userId),
    supabase.from("leagues").select("*").eq("commissioner_id", userId),
  ]);

  const joinedIds = (memberships ?? []).map((m) => m.league_id as number);
  const createdLeagues = (created ?? []) as League[];

  let joinedLeagues: League[] = [];
  if (joinedIds.length > 0) {
    const { data } = await supabase.from("leagues").select("*").in("id", joinedIds);
    joinedLeagues = (data ?? []) as League[];
  }

  const byId = new Map<number, League>();
  [...createdLeagues, ...joinedLeagues].forEach((l) => byId.set(l.id, l));

  return Array.from(byId.values())
    .map((l) => ({ ...l, isCommissioner: l.commissioner_id === userId }))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}
