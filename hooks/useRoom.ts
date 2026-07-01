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
  LAYOUTS,
  LayoutKey,
} from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const DEFAULT_STATE: RoomState = {
  layout: 'strip4',
  sessionCount: 4,
  timer: 3,
  frameBg: { type: 'solid', val: '#ffffff' },
  photoBorder: 'plain',
  customText: '',
  showDate: true,
};

export function useRoom(roomId: string, roomCode: string) {
  const participantId = getParticipantId();

  const [roomState, setRoomState] = useState<RoomState>(DEFAULT_STATE);
  const [phase, setPhase] = useState<SessionPhase>('waiting_partner');
  const [myPhotos, setMyPhotos] = useState<CapturedPhoto[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<CapturedPhoto[]>([]);
  const [partnerInfo, setPartnerInfo] = useState<ParticipantInfo | null>(null);
  const [partnerReady, setPartnerReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [role, setRole] = useState<'host' | 'guest'>('host');

  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Use refs to avoid stale closures in callbacks
  const broadcastRef = useRef<((msg: RealtimeMessage) => void) | null>(null);
  const roomStateRef = useRef<RoomState>(DEFAULT_STATE);
  const roomIdRef = useRef(roomId);

  // Keep refs in sync
  useEffect(() => { roomStateRef.current = roomState; }, [roomState]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  const broadcast = useCallback((msg: RealtimeMessage) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'message',
      payload: msg,
    });
  }, []);

  // Keep broadcastRef in sync
  useEffect(() => { broadcastRef.current = broadcast; }, [broadcast]);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const runCountdown = useCallback((timerVal: number, totalCount: number) => {
    clearCountdown();
    setPhase('countdown');
    let current = timerVal;
    setCountdown(current);

    const tick = () => {
      if (!mountedRef.current) return;
      current--;
      setCountdown(current);
      if (current > 0) {
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        setPhase('capturing');
      }
    };

    countdownRef.current = setTimeout(tick, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCountdown]);

  const handleReset = useCallback((andBroadcast = true) => {
    setMyPhotos([]);
    setPartnerPhotos([]);
    setPhotoIndex(0);
    setPhase('setup_layout');
    setCountdown(0);
    clearCountdown();
    if (andBroadcast) {
      broadcastRef.current?.({ type: 'session_reset', senderId: participantId });
    }
  }, [clearCountdown, participantId]);

  const handleIncoming = useCallback((msg: RealtimeMessage) => {
    if (!mountedRef.current) return;
    switch (msg.type) {
      case 'partner_joined': {
        const p = msg.payload as { role: 'host' | 'guest' };
        setPartnerInfo({ id: msg.senderId, role: p.role, isReady: false });
        // Reply so they know we're here too
        broadcastRef.current?.({ type: 'partner_joined', senderId: participantId, payload: { role: 'host' } });
        break;
      }
      case 'participant_ready': {
        setPartnerReady(true);
        break;
      }
      case 'countdown_start': {
        const { timerVal, totalCount } = msg.payload as { timerVal: number; totalCount: number };
        runCountdown(timerVal, totalCount);
        break;
      }
      case 'photo_captured': {
        // Obsolete: We now capture locally, no need to process incoming base64 images
        break;
      }
      case 'state_update': {
        setRoomState(msg.payload as RoomState);
        break;
      }
      case 'phase_update': {
        setPhase(msg.payload as SessionPhase);
        break;
      }
      case 'session_reset': {
        // Use a fresh reset without broadcasting back (avoids infinite loop)
        setMyPhotos([]);
        setPartnerPhotos([]);
        setPhotoIndex(0);
        setPhase('setup_layout');
        setCountdown(0);
        clearCountdown();
        break;
      }
    }
  }, [participantId, runCountdown, clearCountdown]);

  useEffect(() => {
    mountedRef.current = true;

    async function setup() {
      const { data: existing } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('participant_id', participantId)
        .single();

      const count = await getParticipantsCount(roomId);

      // DB count check removed to prevent permanent room lock. Capacity is now handled via Presence.

      // Role assignment: existing host stays host, first joiner is host, anyone else is guest
      const assignedRole: 'host' | 'guest' = existing?.role === 'host' ? 'host'
        : existing?.role === 'guest' ? 'guest'
        : count === 0 ? 'host'
        : 'guest';
      if (mountedRef.current) setRole(assignedRole);

      await joinRoom(roomId, participantId, assignedRole);

      const channel = supabase.channel(`room:${roomCode}`, {
        config: {
          broadcast: { self: false },
          presence: { key: participantId },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          if (!mountedRef.current) return;
          const state = channel.presenceState();
          const presentKeys = Object.keys(state);
          
          // Enforce 2-person limit based on join time
          if (presentKeys.length > 2) {
            const sorted = presentKeys.sort((a, b) => {
              const aTime = new Date((state[a][0] as any)?.online_at || 0).getTime();
              const bTime = new Date((state[b][0] as any)?.online_at || 0).getTime();
              return aTime - bTime;
            });
            const firstTwo = sorted.slice(0, 2);
            if (!firstTwo.includes(participantId)) {
               setPhase('error_full');
               channel.unsubscribe();
               return;
            }
          }

          if (presentKeys.length < 2) {
            setPartnerInfo(null);
            setPartnerReady(false);
          }
        })
        .on('broadcast', { event: 'message' }, ({ payload }: { payload: RealtimeMessage }) => {
          if (!mountedRef.current) return;
          handleIncoming(payload);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ online_at: new Date().toISOString() });
            broadcastRef.current?.({ type: 'partner_joined', senderId: participantId, payload: { role: assignedRole } });
          }
        });

      channelRef.current = channel;
    }

    setup();

    return () => {
      mountedRef.current = false;
      channelRef.current?.unsubscribe();
      clearCountdown();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomCode, participantId]);

  const startSession = useCallback(() => {
    const totalCount = LAYOUTS[roomStateRef.current.layout as LayoutKey]?.count || 4;
    clearCountdown();
    setMyPhotos([]);
    setPartnerPhotos([]);
    setPhotoIndex(0);

    broadcastRef.current?.({
      type: 'countdown_start',
      senderId: participantId,
      payload: { timerVal: roomStateRef.current.timer || 3, totalCount },
    });

    runCountdown(roomStateRef.current.timer || 3, totalCount);
  }, [clearCountdown, participantId, runCountdown]);

  const onPhotoCaptured = useCallback((myDataUrl: string, partnerDataUrl: string, index: number) => {
    setMyPhotos(prev => {
      const next = [...prev];
      next[index] = { dataUrl: myDataUrl, participantId, index };
      return next;
    });
    
    setPartnerPhotos(prev => {
      const next = [...prev];
      next[index] = { dataUrl: partnerDataUrl, participantId: partnerInfo?.id || 'partner', index };
      return next;
    });

    const totalCount = LAYOUTS[roomStateRef.current.layout as LayoutKey]?.count || 4;

    if (index + 1 >= totalCount) {
      setTimeout(() => {
        if (!mountedRef.current) return;
        setPhase('done');
        if (role === 'host') {
          updateRoomStatus(roomIdRef.current, 'done');
        }
      }, 800);
    } else {
      const nextIndex = index + 1;
      setPhotoIndex(nextIndex);

      const burstDelay = 2;
      if (role === 'host') {
        broadcastRef.current?.({
          type: 'countdown_start',
          senderId: participantId,
          payload: { timerVal: burstDelay, totalCount },
        });
      }
      runCountdown(burstDelay, totalCount);
    }
  }, [participantId, runCountdown, role, partnerInfo]);

  const updateState = useCallback((partial: Partial<RoomState>) => {
    setRoomState(prev => {
      const next = { ...prev, ...partial };
      broadcastRef.current?.({ type: 'state_update', senderId: participantId, payload: next });
      return next;
    });
  }, [participantId]);

  const changePhase = useCallback((newPhase: SessionPhase) => {
    setPhase(newPhase);
    broadcastRef.current?.({ type: 'phase_update', senderId: participantId, payload: newPhase });
  }, [participantId]);

  return {
    roomState,
    phase,
    changePhase,
    myPhotos,
    partnerPhotos,
    partnerInfo,
    partnerReady,
    countdown,
    photoIndex,
    participantId,
    role,
    startSession,
    onPhotoCaptured,
    updateState,
    handleReset,
    broadcast,
  };
}
