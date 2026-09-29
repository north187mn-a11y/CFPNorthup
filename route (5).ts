import { NextResponse } from 'next/server';
import { fetchESPNGame } from '@/lib/espn';

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    return NextResponse.json(await fetchESPNGame(eventId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 502 });
  }
}
