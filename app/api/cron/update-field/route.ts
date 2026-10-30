import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_HOST = 'live-golf-data.p.rapidapi.com';
const ORG_ID = '1'; // PGA TOUR on Slash Golf. Confirm in their docs.
const DAY_MS = 24 * 60 * 60 * 1000;

type Json = Record<string, unknown>;

async function slashGet(path: string, params: Record<string, string>): Promise<Json> {
  const url = new URL(`https://${API_HOST}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
      'X-RapidAPI-Host': API_HOST,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${path} failed with status ${res.status}`);
  return (await res.json()) as Json;
}
// Tries each path in order and returns the first that works, with a readable error if none do.
async function slashGetFirst(
  paths: string[],
  params: Record<string, string>
): Promise<{ path: string; data: Json }> {
  const failures: string[] = [];
  for (const path of paths) {
    try {
      return { path, data: await slashGet(path, params) };
    } catch (e) {
      failures.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(
    `No tournament endpoint worked for tournId ${params.tournId}, year ${params.year}. Tried: ${failures.join('; ')}`
  );
}
// Dates may arrive as ISO strings, epoch numbers, or Mongo-style {$date: ...} objects.
function toMs(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : NaN;
  }
  if (value && typeof value === 'object') {
    const obj = value as Json;
    if ('$date' in obj) return toMs(obj.$date);
    if ('$numberLong' in obj) return Number(obj.$numberLong);
  }
  return NaN;
}

// "Ludvig Åberg" -> "ludvig aberg", "Davis Love III" -> "davis love"
function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === '1';
    let tournId = searchParams.get('tournId') ?? '';
    let year = searchParams.get('year') ?? String(new Date().getUTCFullYear());
    let tournName = '';

    // 1. Find this week's event from the schedule (unless tournId was passed in).
    if (!tournId) {
      const scheduleData = await slashGet('/schedule', { orgId: ORG_ID, year });
      const list = (Array.isArray(scheduleData.schedule) ? scheduleData.schedule : []) as Json[];

      const events = list
        .map((e) => {
          const date = (e.date ?? {}) as Json;
          return {
            id: String(e.tournId ?? ''),
            name: String(e.name ?? ''),
            start: toMs(date.start),
            end: toMs(date.end),
          };
        })
        .filter((e) => e.id && Number.isFinite(e.start) && Number.isFinite(e.end))
        .sort((a, b) => a.start - b.start);

      // The current event, or the next upcoming one (with a day of slack after it ends).
      const current = events.find((e) => e.end + DAY_MS >= Date.now());
      if (!current) {
        return NextResponse.json(
          {
            success: false,
            error: 'Could not find a current or upcoming event in the schedule.',
            ...(debug ? { scheduleKeys: Object.keys(scheduleData), sample: list.slice(0, 2) } : {}),
          },
          { status: 404 }
        );
      }
      tournId = current.id;
      tournName = current.name;
      year = String(new Date(current.start).getUTCFullYear());
    }

    // 2. Pull the tournament's field.
        const { path: usedPath, data: tournament } = await slashGetFirst(
      ['/tournament', '/tournaments', '/leaderboard'],
      { orgId: ORG_ID, tournId, year }
    );
    const rawPlayers = (
      [tournament.players, tournament.field, tournament.leaderboardRows, tournament.leaderboard].find(
        (v) => Array.isArray(v)
      ) ?? []
    ) as Json[];

    const fieldKeys = new Set<string>();
    for (const p of rawPlayers) {
      const status = String(p.status ?? '').toLowerCase();
      const withdrawn =
        p.isWithdrawn === true || ['wd', 'withdrawn', 'dq', 'removed'].includes(status);
      if (withdrawn) continue;

      const full =
        (p.fullName as string) ||
        (p.name as string) ||
        [p.firstName, p.lastName].filter(Boolean).join(' ');
      if (full) fieldKeys.add(nameKey(full));
    }

    if (debug) {
      return NextResponse.json({
                tournId,
        tournName,
        year,
        endpointUsed: usedPath,
        tournamentKeys: Object.keys(tournament),
        totalPlayers: rawPlayers.length,
        playerSample: rawPlayers.slice(0, 2),
      });
    }

    if (fieldKeys.size === 0) {
      // Don't wipe the current flags if the field isn't published yet.
      return NextResponse.json(
        { success: false, error: `No field published yet for tournament ${tournId}.` },
        { status: 409 }
      );
    }

    // 3. Match the field against the golfers table by normalized name.
    const { data: golfers, error: golfersError } = await supabase
      .from('golfers')
      .select('id, name');
    if (golfersError) throw new Error(`Golfer read error: ${golfersError.message}`);

    const matchedIds = (golfers ?? [])
      .filter((g) => fieldKeys.has(nameKey(g.name as string)))
      .map((g) => g.id as string);

    if (matchedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Field loaded, but no golfers matched by name.' },
        { status: 409 }
      );
    }

    // 4. Flag the field, then clear everyone else (in that order, so the pool is never empty).
    const now = new Date().toISOString();
    const { error: onError } = await supabase
      .from('golfers')
      .update({ is_playing_this_week: true, current_tournament_id: tournId, updated_at: now })
      .in('id', matchedIds);
    if (onError) throw new Error(`Field update error: ${onError.message}`);

    const { error: offError } = await supabase
      .from('golfers')
      .update({ is_playing_this_week: false, current_tournament_id: null, updated_at: now })
      .not('id', 'in', `(${matchedIds.join(',')})`);
    if (offError) throw new Error(`Field clear error: ${offError.message}`);

    return NextResponse.json({
      success: true,
      tournament: tournName || tournId,
      fieldSize: fieldKeys.size,
      inPool: matchedIds.length,
      message: `${matchedIds.length} of your ${golfers?.length ?? 0} golfers are playing this week.`,
    });
  } catch (error: unknown) {
    console.error('Error updating field:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}