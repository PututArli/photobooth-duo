import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cleanupExpiredRooms, generateRoomCode, getRoomExpiresAt } from '@/lib/roomUtils';

export const dynamic = 'force-dynamic';

export async function POST() {
  let roomCode = '';
  let attempts = 0;
  let created = false;

  await cleanupExpiredRooms().catch(() => undefined);

  while (attempts < 5) {
    roomCode = generateRoomCode();

    const { error } = await supabase.from('rooms').insert({
      room_code: roomCode,
      status: 'waiting',
      expires_at: getRoomExpiresAt(),
    });

    if (!error) {
      created = true;
      break;
    }
    attempts++;
  }

  if (!created) {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }

  return NextResponse.json({ roomCode });
}
