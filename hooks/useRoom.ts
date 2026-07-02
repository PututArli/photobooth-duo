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
  const partnerInfoRef = useRef<ParticipantInfo | null>(null);
  const roleRef = useRef<'host' | 'guest'>('host');

  // Keep refs in sync
  useEffect(() => { roomStateRef.current = roomState; }, [roomState]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { partnerInfoRef.current = partnerInfo; }, [partnerInfo]);
  useEffect(() => { roleRef.current = role; }, [role]);

  const broadcast = useCallback((msg: RealtimeMessage) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'message',
      payload: msg,
    });
  }, []);

  // Keep broadcastRef in sync
  useEffect(() => { broadcastRef.current = broadcast; }, [broadcast]);

  // Handle native back button to navigate wizard instead of exiting room
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Push a dummy state so we can intercept the first back press
    window.history.pushState({ photobooth: true }, '', '');

    const handlePopState = () => {
      // Immediately push back the state so the user remains in the page
      window.history.pushState({ photobooth: true }, '', '');

      setPhase((currentPhase) => {
        let prevPhase = currentPhase;
        if (currentPhase === 'setup_theme') prevPhase = 'setup_layout';
        else if (currentPhase === 'ready_to_capture') prevPhase = 'setup_theme';
        else if (currentPhase === 'done') prevPhase = 'decorate';
        else if (currentPhase === 'decorate') prevPhase = 'arrange';

        if (prevPhase !== currentPhase) {
           // Synchronize back navigation with partner
           broadcastRef.current?.({ type: 'phase_update', senderId: participantId, payload: prevPhase });
           return prevPhase;
        } else {
           // If at the beginning, or un-backable phase (like capturing/arrange), let them exit if at beginning
           if (currentPhase === 'waiting_partner' || currentPhase === 'setup_layout') {
               window.location.href = '/';
           }
           return currentPhase;
        }
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const scheduleCapture = useCallback((timerSeconds: number, totalCount: number, isHost: boolean) => {
    clearCountdown();
    setPhase('countdown');

    const localCaptureAt = Date.now() + timerSeconds * 1000;

    const updateVisuals = () => {
      if (!mountedRef.current) return;
      const remaining = Math.ceil((localCaptureAt - Date.now()) / 1000);

      if (remaining > 0) {
        setCountdown(remaining);
        countdownRef.current = setTimeout(updateVisuals, 100);
      } else {
        setCountdown(0);
        setPhase('capturing');

        if (isHost) {
          setTimeout(() => {
            if (!mountedRef.current) return;
            setPhotoIndex(prevIndex => {
              const nextIndex = prevIndex + 1;
              if (nextIndex >= totalCount) {
                setPhase('arrange');
                broadcastRef.current?.({ type: 'phase_update', senderId: participantId, payload: 'arrange' });
              } else {
                const nextTimer = roomStateRef.current.timer || 3;
                broadcastRef.current?.({ type: 'photo_start', senderId: participantId, payload: { timer: nextTimer, totalCount, nextIndex } });
                scheduleCapture(nextTimer, totalCount, true);
              }
              return nextIndex;
            });
          }, 1500);
        }
      }
    };

    updateVisuals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearCountdown, participantId]);

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
        
        // Prevent infinite ping-pong! Only reply if this is a NEW partner joining.
        if (partnerInfoRef.current?.id !== msg.senderId) {
          const newInfo = { id: msg.senderId, role: p.role, isReady: false };
          partnerInfoRef.current = newInfo; // Synchronous update!
          setPartnerInfo(newInfo);
          
          // Reply so they know we're here too
          broadcastRef.current?.({ type: 'partner_joined', senderId: participantId, payload: { role: roleRef.current } });
        }
        break;
      }
      case 'participant_ready': {
        setPartnerReady(true);
        break;
      }
      case 'session_start': {
        const { timer, totalCount } = msg.payload as { timer: number; totalCount: number };
        clearCountdown();
        setMyPhotos([]);
        setPartnerPhotos([]);
        setPhotoIndex(0);
        scheduleCapture(timer, totalCount, false);
        break;
      }
      case 'photo_start': {
        const { timer, totalCount, nextIndex } = msg.payload as { timer: number; totalCount: number; nextIndex: number };
        clearCountdown();
        setPhotoIndex(nextIndex);
        scheduleCapture(timer, totalCount, false);
        break;
      }
      case 'photo_captured': {
        const { index, dataUrl } = msg.payload as { index: number; dataUrl: string };
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
      case 'phase_update': {
        setPhase(msg.payload as SessionPhase);
        break;
      }
      case 'sync_decorate': {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sync_decorate', { detail: msg.payload }));
        }
        break;
      }
      case 'trigger_complete_decorate': {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('trigger_complete_decorate'));
        }
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
  }, [participantId, scheduleCapture, clearCountdown]);

  useEffect(() => {
    mountedRef.current = true;

    async function setup() {
      const { data: existing } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('participant_id', participantId)
        .single();

      const { data: anyHost } = await supabase
        .from('room_participants')
        .select('id, participant_id')
        .eq('room_id', roomId)
        .eq('role', 'host')
        .limit(1)
        .maybeSingle();

      // Role assignment: existing host stays host, if no host exists we become host, otherwise guest
      const assignedRole: 'host' | 'guest' = existing?.role === 'host' ? 'host'
        : existing?.role === 'guest' ? 'guest'
        : (!anyHost || anyHost.participant_id === participantId) ? 'host'
        : 'guest';

      // Use the database as the absolute source of truth
      const participantRecord = await joinRoom(roomId, participantId, assignedRole);
      
      if (mountedRef.current) setRole(participantRecord.role);

      if (!mountedRef.current) return;

      const channelName = `room:${roomCode}`;
      
      // Cleanup any cached channel in strict mode
      const existingChannels = supabase.getChannels().filter(c => c.topic.includes(channelName));
      for (const c of existingChannels) {
        await supabase.removeChannel(c);
      }

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: participantId },
        },
      });

      try {
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
            } else {
              // Partner is present — detect their ID from presence and update partnerInfo
              const partnerKey = presentKeys.find(k => k !== participantId);
              if (partnerKey) {
                setPartnerInfo(prev => prev ?? { id: partnerKey, role: 'guest', isReady: false });
              }
            }
          })
          .on('broadcast', { event: 'message' }, ({ payload }: { payload: RealtimeMessage }) => {
            if (!mountedRef.current) return;
            handleIncoming(payload);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({ online_at: new Date().toISOString() });
              broadcastRef.current?.({ type: 'partner_joined', senderId: participantId, payload: { role: roleRef.current } });
            }
          });
      } catch (err) {
        console.warn('Channel subscription error (likely strict mode race condition):', err);
      }

      channelRef.current = channel;
    }

    setup();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      clearCountdown();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, roomCode, participantId]);

  const startSession = useCallback(() => {
    const layout = LAYOUTS[roomStateRef.current.layout as LayoutKey];
    const layoutCount = layout?.count || 4;
    const captureCount = Math.max(6, layoutCount + 2); // E.g., for 4-slot layout, capture 6.
    
    clearCountdown();
    setMyPhotos([]);
    setPartnerPhotos([]);
    setPhotoIndex(0);

    const timerSeconds = roomStateRef.current.timer || 3;

    broadcastRef.current?.({
      type: 'session_start',
      senderId: participantId,
      payload: { timer: timerSeconds, totalCount: captureCount },
    });

    scheduleCapture(timerSeconds, captureCount, true);
  }, [clearCountdown, participantId, scheduleCapture]);

  const onPhotoCaptured = useCallback((myDataUrl: string, index: number) => {
    setMyPhotos(prev => {
      const next = [...prev];
      next[index] = { dataUrl: myDataUrl, participantId, index };
      return next;
    });
    
    // Broadcast my photo to partner so they get my exact frame
    broadcastRef.current?.({
      type: 'photo_captured',
      senderId: participantId,
      payload: { index, dataUrl: myDataUrl }
    });

    // The timer loop is now handled strictly in runCountdown to prevent drift
  }, [participantId]);

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
    setPhaseLocal: setPhase,
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
