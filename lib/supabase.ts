import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          room_code: string;
          status: 'waiting' | 'active' | 'done';
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          room_code: string;
          status?: 'waiting' | 'active' | 'done';
          created_at?: string;
          expires_at?: string;
        };
        Update: { status?: 'waiting' | 'active' | 'done' };
      };
      room_participants: {
        Row: {
          id: string;
          room_id: string;
          participant_id: string;
          role: 'host' | 'guest';
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          participant_id: string;
          role: 'host' | 'guest';
          joined_at?: string;
        };
        Update: never;
      };
    };
  };
};
