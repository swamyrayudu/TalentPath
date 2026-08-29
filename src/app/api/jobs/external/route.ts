import { NextRequest, NextResponse } from 'next/server';

import { getGeeksforgeeksJobSummaries } from '@/lib/jobs/geeksforgeeks';

export const dynamic = 'force-dynamic';

/**
 * External job feed (currently GeeksforGeeks), refreshed at most once a day.
 *
 * `?refresh=1` forces a re-fetch — point a daily cron at it if you want the
 * refresh to happen on a schedule rather than on the first request after the
 * cache expires.
 */
export async function GET(request: NextRequest) {
  const force = new URL(request.url).searchParams.get('refresh') === '1';

  try {
    // Summaries only — the board shows no prose, and the full descriptions would
    // roughly quadruple this response. /jobs/<id> loads the full record instead.
    const { jobs, cached, fetchedAt } = await getGeeksforgeeksJobSummaries({ force });

    return NextResponse.json({
      success: true,
      cached,
      fetchedAt: fetchedAt ? new Date(fetchedAt).toISOString() : null,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error('Error fetching external jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch external jobs', data: [] },
      { status: 500 }
    );
  }
}
