import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Secret
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY!;
    const rapidApiHost = 'live-golf-data.p.rapidapi.com';
    const year = String(new Date().getUTCFullYear());

    // -------------------------------------------------------------------------
    // 2. Fetch and Upsert Top 300 OWGR Golfers
    // -------------------------------------------------------------------------
    const rankingsResponse = await fetch(
      `https://live-golf-data.p.rapidapi.com/rankings?orgId=1&year=${year}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
        },
        cache: 'no-store',
      }
    );

    if (!rankingsResponse.ok) {
      const body = await rankingsResponse.text();
      throw new Error(`Rankings fetch failed: ${rankingsResponse.status} ${body.slice(0, 300)}`);
    }

    const rankingsData = await rankingsResponse.json();
    const allRankings = Array.isArray(rankingsData.rankings) ? rankingsData.rankings : [];

    // Slice down to top 300
    const top300Raw = allRankings.slice(0, 300);

    // Sanitize name and rank types for Supabase column constraints
    const golfersToUpsert = top300Raw.map(
      (player: { 
        playerId: string | number; 
        fullName?: string; 
        firstName?: string; 
        lastName?: string; 
        playerName?: string;
        rank: string | number 
      }) => {
        const constructedName = player.fullName || 
          (player.firstName && player.lastName ? `${player.firstName} ${player.lastName}`.trim() : null) || 
          player.playerName || 
          'Unknown Golfer';

        const parsedRank = typeof player.rank === 'number' 
          ? player.rank 
          : parseInt(String(player.rank), 10);

        return {
          player_id: String(player.playerId),
          name: constructedName,
          owgr_rank: isNaN(parsedRank) ? 999 : parsedRank,
          world_ranking: isNaN(parsedRank) ? 999 : parsedRank,
          updated_at: new Date().toISOString(),
        };
      }
    );

    if (golfersToUpsert.length > 0) {
      const { error: golferError } = await supabase
        .from('golfers')
        .upsert(golfersToUpsert, { onConflict: 'player_id' });

      if (golferError) {
        throw new Error(`Supabase golfers upsert error: ${golferError.message}`);
      }
    }

    // -------------------------------------------------------------------------
    // 3. Fetch Current Tournament Field & Update 'field' Table
    // -------------------------------------------------------------------------
    const fieldResponse = await fetch(
      `https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&year=${year}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost,
        },
        cache: 'no-store',
      }
    );

    let activeFieldCount = 0;

    if (fieldResponse.ok) {
      const fieldData = await fieldResponse.json();
      const leaderboardRows = Array.isArray(fieldData.leaderboardRows) ? fieldData.leaderboardRows : [];

      if (leaderboardRows.length > 0) {
        const weeklyPlayerIds = leaderboardRows.map((row: { playerId: string | number }) => String(row.playerId));

        // Fetch matching records from 'golfers' table that are in top 300
        const { data: validDraftableGolfers, error: fetchError } = await supabase
          .from('golfers')
          .select('player_id, name, owgr_rank')
          .in('player_id', weeklyPlayerIds);

        if (fetchError) {
          throw new Error(`Error fetching draftable golfers subset: ${fetchError.message}`);
        }

        if (validDraftableGolfers && validDraftableGolfers.length > 0) {
          // Clear out the previous week's field
          const { error: deleteError } = await supabase
            .from('field')
            .delete()
            .neq('player_id', '');

          if (deleteError) {
            throw new Error(`Error clearing old field table: ${deleteError.message}`);
          }

          // Insert fresh weekly draftable field
          const fieldRowsToInsert = validDraftableGolfers.map((g) => ({
            player_id: g.player_id,
            name: g.name,
            owgr_rank: g.owgr_rank,
            is_draftable: true,
            updated_at: new Date().toISOString(),
          }));

          const { error: fieldInsertError } = await supabase
            .from('field')
            .insert(fieldRowsToInsert);

          if (fieldInsertError) {
            throw new Error(`Error inserting new field table: ${fieldInsertError.message}`);
          }

          activeFieldCount = fieldRowsToInsert.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${golfersToUpsert.length} total golfers in OWGR and populated ${activeFieldCount} draftable golfers into the field table.`,
    });
  } catch (error: unknown) {
    console.error('Error in cron update-golfers:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}