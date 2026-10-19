// Draft helpers shared by the draft room and league pages.

// How many golfers each team drafts. Change this one number to change draft length.
export const DRAFT_ROUNDS = 6;

export type Member = {
  id: string;
  league_id: number;
  user_id: string;
  team_name: string;
  draft_position: number;
};

/**
 * Snake draft: round 1 goes 1 -> N, round 2 goes N -> 1, and so on.
 * Returns the round and the draft position (1-based) for a 1-based pick number.
 */
export function getPickSlot(pickNumber: number, numTeams: number) {
  const round = Math.ceil(pickNumber / numTeams);
  const indexInRound = (pickNumber - 1) % numTeams;
  const position = round % 2 === 1 ? indexInRound + 1 : numTeams - indexInRound;
  return { round, position };
}

/** Which member picks at a given pick number. `ordered` must be sorted by draft_position. */
export function getMemberForPick(
  pickNumber: number,
  ordered: Member[]
): Member | null {
  if (ordered.length === 0) return null;
  const { position } = getPickSlot(pickNumber, ordered.length);
  return ordered[position - 1] ?? null;
}
