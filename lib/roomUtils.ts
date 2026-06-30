import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getParticipantId(): string {
  if (typeof window === 'undefined') return uuidv4();
  let id = sessionStorage.getItem('participant_id');
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem('participant_id', id);
  }
  return id;
}

export async function createRoom(): Promise<string> {
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

  return roomCode;
}

export async function getRoomByCode(code: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', code.toUpperCase())
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) return null;
  return data;
}

export async function joinRoom(roomId: string, participantId: string, role: 'host' | 'guest') {
  // Check if already joined
  const { data: existing } = await supabase
    .from('room_participants')
    .select('*')
    .eq('room_id', roomId)
    .eq('participant_id', participantId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('room_participants')
    .insert({
      room_id: roomId,
      participant_id: participantId,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getParticipantsCount(roomId: string): Promise<number> {
  const { count } = await supabase
    .from('room_participants')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  return count ?? 0;
}

export async function updateRoomStatus(roomId: string, status: 'waiting' | 'active' | 'done') {
  await supabase.from('rooms').update({ status }).eq('id', roomId);
}
