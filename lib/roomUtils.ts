import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const ROOM_TTL_MS = 30 * 60 * 1000;

export function getRoomExpiresAt(from = Date.now()): string {
  return new Date(from + ROOM_TTL_MS).toISOString();
}

export function getRoomCreatedAfter(now = Date.now()): string {
  return new Date(now - ROOM_TTL_MS).toISOString();
}

export async function cleanupExpiredRooms() {
  const now = new Date().toISOString();
  const createdBefore = getRoomCreatedAfter();

  await supabase
    .from('rooms')
    .delete()
    .or(`expires_at.lte.${now},created_at.lte.${createdBefore}`);
}

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
    throw new Error('Failed to create room');
  }

  return roomCode;
}

export async function getRoomByCode(code: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('room_code', code.toUpperCase())
    .gt('expires_at', new Date().toISOString())
    .gt('created_at', getRoomCreatedAfter())
    .single();

  if (error) return null;
  return data;
}

export async function joinRoom(roomId: string, participantId: string, role: 'host' | 'guest') {
  const { data: room } = await supabase
    .from('rooms')
    .select('id')
    .eq('id', roomId)
    .gt('expires_at', new Date().toISOString())
    .gt('created_at', getRoomCreatedAfter())
    .single();

  if (!room) {
    throw new Error('Room expired');
  }

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
