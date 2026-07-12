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
  videoFilter: 'none',
};

export function useRoom(roomId: string, roomCode: string, roomExpiresAt?: string) {
  const participantId = getParticipantId();

  const [roomState, setRoomState] = useState<RoomState>(DEFAULT_STATE);
  const [phase, setPhase] = useState<SessionPhase>('waiting_partner');
  const [myPhotos, setMyPhotos] = useState<CapturedPhoto[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<CapturedPhoto[]>([]);
  const [hostTimeOffset, setHostTimeOffset] = useState(0);
  const [partnerInfo, setPartnerInfo] = useState<ParticipantInfo | null>(null);
  const [partnerReady, setPartnerReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [captureRunId, setCaptureRunId] = useState(0);
  const [role, setRole] = useState<'host' | 'guest'>('host');
  const [isInitialized, setIsInitialized] = useState(false);
  const [roomIssue, setRoomIssue] = useState<'connection' | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomExpiryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Use refs to avoid stale closures in callbacks
  const broadcastRef = useRef<((msg: RealtimeMessage) => void) | null>(null);
  const roomStateRef = useRef<RoomState>(DEFAULT_STATE);
  const roomIdRef = useRef(roomId);
  const partnerInfoRef = useRef<ParticipantInfo | null>(null);
  const roleRef = useRef<'host' | 'guest'>('host');
  const captureModeRef = useRef<'session' | 'retake'>('session');
  const phaseRef = useRef<SessionPhase>('waiting_partner');
  const myPhotosRef = useRef<CapturedPhoto[]>([]);
  const partnerPhotosRef = useRef<CapturedPhoto[]>([]);
  const photoIndexRef = useRef<number>(0);

  // Keep refs in sync
  useEffect(() => { roomStateRef.current = roomState; }, [roomState]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { partnerInfoRef.current = partnerInfo; }, [partnerInfo]);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { myPhotosRef.current = myPhotos; }, [myPhotos]);
  useEffect(() => { partnerPhotosRef.current = partnerPhotos; }, [partnerPhotos]);
  useEffect(() => { photoIndexRef.current = photoIndex; }, [photoIndex]);

  const broadcast = useCallback((msg: RealtimeMessage) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'message',
      payload: msg,
    });
  }, []);

  // Keep broadcastRef in sync
  useEffect(() => { broadcastRef.current = broadcast; }, [broadcast]);

  useEffect(() => {
    if (role !== 'host') return;
    const interval = setInterval(() => {
      if (partnerInfoRef.current && broadcastRef.current) {
        broadcastRef.current({ type: 'sync_time', senderId: participantId, payload: { hostTime: Date.now() } });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [role, participantId]);

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
        else if (currentPhase === 'review') prevPhase = 'ready_to_capture';

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
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
  }, []);

  const expireRoom = useCallback(() => {
    clearCountdown();
    setCountdown(0);
    setRoomIssue(null);
    setPhase('expired');
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [clearCountdown]);

  useEffect(() => {
    if (!roomExpiresAt) return;

    const remaining = new Date(roomExpiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      expireRoom();
      return;
    }

    // Maximum 32-bit signed integer for setTimeout is ~24.8 days
    const MAX_TIMEOUT = 2147483647;
    if (remaining > MAX_TIMEOUT) {
      // It's an unlimited room, don't set a timeout
      return;
    }

    roomExpiryTimeoutRef.current = setTimeout(expireRoom, remaining);

    return () => {
      if (roomExpiryTimeoutRef.current) {
        clearTimeout(roomExpiryTimeoutRef.current);
        roomExpiryTimeoutRef.current = null;
      }
    };
  }, [roomExpiresAt, expireRoom]);

  const scheduleCapture = useCallback((timerSeconds: number, totalCount: number, isHost: boolean, mode: 'session' | 'retake' = captureModeRef.current) => {
    clearCountdown();
    captureModeRef.current = mode;
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
        setCaptureRunId(prev => prev + 1);
        setPhase('capturing');

        if (isHost) {
          captureTimeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setPhotoIndex(prevIndex => {
              if (captureModeRef.current === 'retake') {
                setPhase('review');
                broadcastRef.current?.({ type: 'phase_update', senderId: participantId, payload: 'review' });
                return prevIndex;
              }

              const nextIndex = prevIndex + 1;
              if (nextIndex >= totalCount) {
                setPhase('review');
                broadcastRef.current?.({ type: 'phase_update', senderId: participantId, payload: 'review' });
              } else {
                const nextTimer = roomStateRef.current.timer || 3;
                broadcastRef.current?.({ type: 'photo_start', senderId: participantId, payload: { timer: nextTimer, captureAt: Date.now() + nextTimer * 1000, totalCount, nextIndex } });
                scheduleCapture(nextTimer, totalCount, true, 'session');
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
    setCaptureRunId(0);
    captureModeRef.current = 'session';
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
        if (partnerInfoRef.current?.id !== msg.senderId || partnerInfoRef.current?.role !== p.role) {
          const isNewPartner = partnerInfoRef.current?.id !== msg.senderId;
          const newInfo = { id: msg.senderId, role: p.role, isReady: false };
          partnerInfoRef.current = newInfo; // Synchronous update!
          setPartnerInfo(newInfo);
          
          if (isNewPartner) {
            // Reply so they know we're here too
            broadcastRef.current?.({ type: 'partner_joined', senderId: participantId, payload: { role: roleRef.current } });
            
            // If I am the host, sync my current room state to the newly joined partner!
            if (roleRef.current === 'host') {
              broadcastRef.current?.({ type: 'state_update', senderId: participantId, payload: roomStateRef.current });
              broadcastRef.current?.({ type: 'sync_time', senderId: participantId, payload: { hostTime: Date.now() } });
            }
            
            // Important logic fix: if someone reconnects/refreshes, don't let them drag us back to the start!
            // If we are already in an advanced phase, tell them to catch up!
            if (phaseRef.current !== 'waiting_partner' && phaseRef.current !== 'setup_layout') {
              broadcastRef.current?.({ type: 'phase_update', senderId: participantId, payload: phaseRef.current });
              
              // Restore their photo arrays so they don't get stuck with a blank UI
              // Our myPhotos is their partnerPhotos, and vice versa!
              broadcastRef.current?.({ 
                type: 'sync_photos', 
                senderId: participantId, 
                payload: {
                  partnerPhotosForThem: myPhotosRef.current,
                  myPhotosForThem: partnerPhotosRef.current,
                  photoIndex: photoIndexRef.current,
                }
              });
            }
          }
        }
        break;
      }
      case 'sync_time': {
        const payload = msg.payload as { hostTime: number };
        const offset = payload.hostTime - Date.now();
        setHostTimeOffset(offset);
        break;
      }
      case 'participant_ready': {
        setPartnerReady(true);
        break;
      }
      case 'session_start': {
        const payload = msg.payload as { timer?: number; captureAt?: number; totalCount: number };
        const timer = payload.timer ?? (payload.captureAt ? Math.max(1, Math.ceil((payload.captureAt - Date.now()) / 1000)) : 3);
        clearCountdown();
        setMyPhotos([]);
        setPartnerPhotos([]);
        setPhotoIndex(0);
        setCaptureRunId(0);
        captureModeRef.current = 'session';
        scheduleCapture(timer, payload.totalCount, false, 'session');
        break;
      }
      case 'photo_start': {
        const payload = msg.payload as { timer?: number; captureAt?: number; totalCount: number; nextIndex: number };
        const timer = payload.timer ?? (payload.captureAt ? Math.max(1, Math.ceil((payload.captureAt - Date.now()) / 1000)) : 3);
        clearCountdown();
        setPhotoIndex(payload.nextIndex);
        scheduleCapture(timer, payload.totalCount, false, 'session');
        break;
      }
      case 'retake_start': {
        const payload = msg.payload as { index: number; timer?: number; captureAt?: number; totalCount: number };
        const timer = payload.timer ?? (payload.captureAt ? Math.max(1, Math.ceil((payload.captureAt - Date.now()) / 1000)) : 3);
        clearCountdown();
        setPhotoIndex(payload.index);
        scheduleCapture(timer, payload.totalCount, roleRef.current === 'host', 'retake');
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
      case 'sync_photos': {
        const payload = msg.payload as { partnerPhotosForThem: CapturedPhoto[], myPhotosForThem: CapturedPhoto[], photoIndex: number };
        setPartnerPhotos(payload.partnerPhotosForThem);
        setMyPhotos(payload.myPhotosForThem);
        setPhotoIndex(payload.photoIndex);
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
        setCaptureRunId(0);
        captureModeRef.current = 'session';
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
      try {
        const { data: existing } = await supabase
          .from('room_participants')
          .select('*')
          .eq('room_id', roomId)
          .eq('participant_id', participantId)
          .maybeSingle();

        const { data: anyHost } = await supabase
          .from('room_participants')
          .select('id, participant_id')
          .eq('room_id', roomId)
          .eq('role', 'host')
          .limit(1)
          .maybeSingle();

        const assignedRole: 'host' | 'guest' = existing?.role === 'host' ? 'host'
          : existing?.role === 'guest' ? 'guest'
          : (!anyHost || anyHost.participant_id === participantId) ? 'host'
          : 'guest';

        const participantRecord = await joinRoom(roomId, participantId, assignedRole);

        if (!participantRecord) {
          expireRoom();
          setIsInitialized(true);
          return;
        }
        
        if (mountedRef.current) {
          setRole(participantRecord.role);
          setRoomIssue(null);
          setIsInitialized(true);
        }

        if (!mountedRef.current) return;

        const channelName = `room:${roomCode}`;
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
                setPartnerInfo(prev => prev ?? { id: partnerKey, role: roleRef.current === 'host' ? 'guest' : 'host', isReady: false });
              }
            }
          })
          .on('broadcast', { event: 'message' }, ({ payload }: { payload: RealtimeMessage }) => {
            if (!mountedRef.current) return;
            handleIncoming(payload);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              setRoomIssue(null);
              await channel.track({ online_at: new Date().toISOString() });
              broadcastRef.current?.({ type: 'partner_joined', senderId: participantId, payload: { role: roleRef.current } });
              if (roleRef.current === 'host' && partnerInfoRef.current) {
                broadcastRef.current?.({ type: 'sync_time', senderId: participantId, payload: { hostTime: Date.now() } });
              }
              return;
            }
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setRoomIssue('connection');
            }
          });

        channelRef.current = channel;
      } catch (err) {
        console.warn('Channel subscription error (likely strict mode race condition):', err);
        if (mountedRef.current) {
          setRoomIssue('connection');
          setIsInitialized(true);
        }
      }
    }

    setup();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (roomExpiryTimeoutRef.current) {
        clearTimeout(roomExpiryTimeoutRef.current);
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
    setCaptureRunId(0);
    captureModeRef.current = 'session';

    const nextState = { ...roomStateRef.current, arrangeIndices: undefined, arrangeActiveSlot: 0 };
    roomStateRef.current = nextState;
    setRoomState(nextState);
    broadcastRef.current?.({ type: 'state_update', senderId: participantId, payload: nextState });

    const timerSeconds = roomStateRef.current.timer || 3;

    broadcastRef.current?.({
      type: 'session_start',
      senderId: participantId,
      payload: { timer: timerSeconds, captureAt: Date.now() + timerSeconds * 1000, totalCount: captureCount },
    });

    scheduleCapture(timerSeconds, captureCount, true, 'session');
  }, [clearCountdown, participantId, scheduleCapture]);

  const retakePhoto = useCallback((index: number) => {
    if (index < 0) return;

    const layout = LAYOUTS[roomStateRef.current.layout as LayoutKey];
    const layoutCount = layout?.count || 4;
    const totalCount = Math.max(6, layoutCount + 2);
    const timerSeconds = roomStateRef.current.timer || 3;

    clearCountdown();
    setPhotoIndex(index);
    captureModeRef.current = 'retake';

    broadcastRef.current?.({
      type: 'retake_start',
      senderId: participantId,
      payload: { index, timer: timerSeconds, captureAt: Date.now() + timerSeconds * 1000, totalCount },
    });

    scheduleCapture(timerSeconds, totalCount, roleRef.current === 'host', 'retake');
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
    captureRunId,
    participantId,
    role,
    isInitialized,
    roomIssue,
    startSession,
    retakePhoto,
    onPhotoCaptured,
    updateState,
    handleReset,
    broadcast,
    hostTimeOffset,
  };
}
