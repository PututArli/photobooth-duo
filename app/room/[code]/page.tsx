import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PhotoboothRoom from '@/components/PhotoboothRoom';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Room ${params.code.toUpperCase()} — PhotoBooth Duo`,
    description: 'Sesi foto berdua secara online real-time',
  };
}

export default async function RoomPage({ params }: Props) {
  const code = params.code.toUpperCase();

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', code)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!room) {
    notFound();
  }

  return <PhotoboothRoom roomId={room.id} roomCode={code} />;
}
