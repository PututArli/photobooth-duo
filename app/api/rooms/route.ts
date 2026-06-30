import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRoomCode } from '@/lib/roomUtils';

export const dynamic = 'force-dynamic';

export async function POST() {
  let roomCode = '';
  let attempts = 0;

  while (attempts < 5) {
    roomCode = generateRoomCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error } = await supabase.from('rooms').insert({
      room_code: roomCode,
      status: 'waiting',
      expires_at: expiresAt,
    });

    if (!error) break;
    attempts++;
  }

  if (!roomCode) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  return NextResponse.json({ roomCode });
}
