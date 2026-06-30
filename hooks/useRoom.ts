'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getParticipantId, joinRoom, getParticipantsCount, updateRoomStatus } from '@/lib/roomUtils';
import {
  RoomState,
  RealtimeMessage,
  ParticipantInfo,
  SessionPhase,
  CapturedPhoto,
  COLOR_FILTERS,
  LAYOUTS,
  LayoutKey,
} from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const DEFAULT_STATE: RoomState = {
  layout: 'strip3',
  sessionCount: 3,
  timer: 3,
  color: 'none',
  colorCSS: 'none',
  frameBg: { type: 'solid', val: '#ffffff' },
  photoBorder: 'plain',
  customText: '',
  showDate: true,
  adj: { b: 100, c: 100, s: 100, w: 0 },
};

export function useRoom(roomId: string, roomCode: string) {
  const participantId = getParticipantId();

  const [roomState, setRoomState] = useState<RoomState>(DEFAULT_STATE);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [myPhotos, setMyPhotos] = useState<CapturedPhoto[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<CapturedPhoto[]>([]);
  const [partnerInfo, setPartnerInfo] = useState<ParticipantInfo | null>(null);
  const [partnerReady, setPartnerReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [role, setRole] = useState<'host' | 'guest'>('host');

  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // ── Join room and subscribe ──────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    async function setup() {
      // Determine role
      const count = await getParticipantsCount(roomId);
      const assignedRole: 'host' | 'guest' = count === 0 ? 'host' : 'guest';
      if (mounted) setRole(assignedRole);

      await joinRoom(roomId, participantId, assignedRole);

      // Subscribe to realtime channel
      const channel = supabase.channel(`room:${roomCode}`, {
        config: { broadcast: { self: false } },
      });

      channel
        .on('broadcast', { event: 'message' }, ({ payload }: { payload: RealtimeMessage }) => {
          if (!mounted) return;
          handleIncoming(payload);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Announce presence
            broadcast({ type: 'partner_joined', senderId: participantId, payload: { role: assignedRole } });
          }
        });

      channelRef.current = channel;
    }

    setup();

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomCode]);

  // ── Broadcast ────────────────────────────────────────────────────────────

  const broadcast = useCallback((msg: RealtimeMessage) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'message',
      payload: msg,
    });
  }, []);

  // ── Handle incoming messages ─────────────────────────────────────────────

  const handleIncoming = useCallback((msg: RealtimeMessage) => {
    switch (msg.type) {
      case 'partner_joined': {
        const p = msg.payload as { role: 'host' | 'guest' };
        setPartnerInfo({ id: msg.senderId, role: p.role, isReady: false });
        break;
      }
      case 'participant_ready': {
        setPartnerReady(true);
        break;
      }
      case 'countdown_start': {
        const { timerVal, totalCount } = msg.payload as { timerVal: number; totalCount: number };
        runCountdown(timerVal, totalCount, false);
        break;
      }
      case 'photo_captured': {
        const { dataUrl, index } = msg.payload as { dataUrl: string; index: number };
        setPartnerPhotos(prev => {
          const next = [...prev];
          next[index] = { dataUrl, participantId: msg.senderId, index };
          return next;
        });
        break;
      }
      case 'state_update': {
        setRoomState(msg.payload as RoomState);
        break;
      }
      case 'session_reset': {
        handleReset(false);
        break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown logic ──────────────────────────────────────────────────────

  const runCountdown = useCallback((timerVal: number, totalCount: number, isMaster: boolean) => {
    setPhase('countdown');
    let current = timerVal;
    setCountdown(current);

    const tick = () => {
      current--;
      setCountdown(current);
      if (current > 0) {
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        // Time to capture!
        setPhase('capturing');
        if (isMaster) {
          // Signal to capture
          setPhase('capturing');
        }
      }
    };

    countdownRef.current = setTimeout(tick, 1000);
  }, []);

  // ── Start session ────────────────────────────────────────────────────────

  const startSession = useCallback(() => {
    const count = LAYOUTS[roomState.layout as LayoutKey]?.count || 3;
    setMyPhotos([]);
    setPartnerPhotos([]);
    setPhotoIndex(0);
    setPhase('countdown');

    // Broadcast countdown_start to partner
    broadcast({
      type: 'countdown_start',
      senderId: participantId,
      payload: { timerVal: roomState.timer, totalCount: count },
    });

    runCountdown(roomState.timer, count, true);
  }, [roomState, broadcast, participantId, runCountdown]);

  // ── Called when a photo is captured locally ──────────────────────────────

  const onPhotoCaptured = useCallback((dataUrl: string, index: number) => {
    setMyPhotos(prev => {
      const next = [...prev];
      next[index] = { dataUrl, participantId, index };
      return next;
    });

    // Broadcast to partner
    broadcast({
      type: 'photo_captured',
      senderId: participantId,
      payload: { dataUrl, index },
    });

    const totalCount = LAYOUTS[roomState.layout as LayoutKey]?.count || 3;

    if (index + 1 >= totalCount) {
      // All photos done
      setTimeout(() => {
        setPhase('customizing');
        updateRoomStatus(roomId, 'active');
      }, 800);
    } else {
      // Next photo
      setPhotoIndex(index + 1);
      setPhase('countdown');
      broadcast({
        type: 'countdown_start',
        senderId: participantId,
        payload: { timerVal: roomState.timer, totalCount },
      });
      runCountdown(roomState.timer, totalCount, true);
    }
  }, [broadcast, participantId, roomState, roomId, runCountdown]);

  // ── Update shared state ──────────────────────────────────────────────────

  const updateState = useCallback((partial: Partial<RoomState>) => {
    setRoomState(prev => {
      const next = { ...prev, ...partial };
      broadcast({ type: 'state_update', senderId: participantId, payload: next });
      return next;
    });
  }, [broadcast, participantId]);

  const setColor = useCallback((colorId: string) => {
    const found = COLOR_FILTERS.find(f => f.id === colorId);
    updateState({ color: colorId, colorCSS: found?.css || 'none' });
  }, [updateState]);

  // ── Reset ────────────────────────────────────────────────────────────────

  const handleReset = useCallback((andBroadcast = true) => {
    setMyPhotos([]);
    setPartnerPhotos([]);
    setPhotoIndex(0);
    setPhase('idle');
    setCountdown(0);
    if (countdownRef.current) clearTimeout(countdownRef.current);
    if (andBroadcast) {
      broadcast({ type: 'session_reset', senderId: participantId });
    }
  }, [broadcast, participantId]);

  return {
    // State
    roomState,
    phase,
    myPhotos,
    partnerPhotos,
    partnerInfo,
    partnerReady,
    countdown,
    photoIndex,
    participantId,
    role,
    // Actions
    startSession,
    onPhotoCaptured,
    updateState,
    setColor,
    handleReset,
    broadcast,
  };
}
