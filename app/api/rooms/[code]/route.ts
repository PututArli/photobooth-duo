import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', code)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Room not found or expired' }, { status: 404 });
  }

  return NextResponse.json(data);
}
