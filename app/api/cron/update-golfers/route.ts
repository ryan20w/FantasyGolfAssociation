import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Secret (and refuse to run if it isn't configured)
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch Official World Golf Rankings from RapidAPI
    // The API requires orgId (1 = PGA TOUR) and year.
    const year = String(new Date().getUTCFullYear());
    const rankingsResponse = await fetch(
      `https://live-golf-data.p.rapidapi.com/rankings?orgId=1&year=${year}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
          'X-RapidAPI-Host': 'live-golf-data.p.rapidapi.com',
        },
        cache: 'no-store',
      }
    );

    if (!rankingsResponse.ok) {
      const body = await rankingsResponse.text();
      throw new Error(`Rankings fetch failed: ${rankingsResponse.status} ${body.slice(0, 300)}`);
    }

    const rankingsData = await rankingsResponse.json();

    // Visit .../update-golfers?debug=1 to see the response shape without writing anything.
    if (new URL(request.url).searchParams.get('debug') === '1') {
      const list = Array.isArray(rankingsData.rankings) ? rankingsData.rankings : [];
      return NextResponse.json({
        keys: Object.keys(rankingsData),
        count: list.length,
        sample: list.slice(0, 3),
      });
    }

    // 3. Upsert golfers into Supabase (inserts missing players, updates existing ones).
    // world_ranking is written too because the draft room and older code read it.
    const golfersToUpsert = (rankingsData.rankings || []).map(
      (player: { fullName: string; rank: number }) => ({
        name: player.fullName,
        owgr_rank: player.rank,
        world_ranking: player.rank,
        updated_at: new Date().toISOString(),
      })
    );

    if (golfersToUpsert.length > 0) {
      const { error } = await supabase
        .from('golfers')
        .upsert(golfersToUpsert, { onConflict: 'name' });

      if (error) {
        throw new Error(`Supabase upsert error: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully populated/updated ${golfersToUpsert.length} golfers in Supabase.`,
    });
  } catch (error: unknown) {
    console.error('Error updating golfers:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}