'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getParticipantId } from '@/lib/roomUtils';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // --- STUN Servers (Publik & Gratis) ---
    // STUN berguna untuk mencari tahu IP Publik (berhasil di sebagian besar jaringan rumah)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    
    // --- TURN Servers (Penting untuk Jarak Jauh / Beda Jaringan) ---
    // Jika masih blank hitam/tidak ada suara saat jarak jauh, itu berarti jaringan memblokir jalur P2P (Symmetric NAT).
    // Kamu WAJIB menggunakan TURN Server berbayar/kustom (seperti Twilio NTS, Xirsys, atau Metered berbayar).
    // Silakan hapus komentar di bawah ini dan masukkan kredensial TURN Server kamu:
    
    {
      urls: 'turn:boothkita.metered.ca:80',
      username: 'bbc314a19d82e1f2bee186c0',
      credential: 'r3Umsf9SU8U+zcGd'
    },
    {
      urls: 'turn:boothkita.metered.ca:443',
      username: 'bbc314a19d82e1f2bee186c0',
      credential: 'r3Umsf9SU8U+zcGd'
    },
    {
      urls: 'turn:boothkita.metered.ca:443?transport=tcp',
      username: 'bbc314a19d82e1f2bee186c0',
      credential: 'r3Umsf9SU8U+zcGd'
    }
  ],
  iceCandidatePoolSize: 10, // Mempercepat pencarian jalur koneksi
};

export function useWebRTC(roomCode: string, isHost: boolean) {
  const participantId = getParticipantId();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [streamTick, setStreamTick] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [partnerMirrored, setPartnerMirrored] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const isMirroredRef = useRef(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isNegotiating = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const isHostRef = useRef(isHost);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const sendSignal = useCallback((type: string, payload: unknown) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'webrtc',
      payload: { type, senderId: participantId, data: payload },
    });
  }, [participantId]);

  const getOrCreatePC = useCallback(() => {
    if (pcRef.current && pcRef.current.connectionState !== 'closed') {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    let candidateTimeout: NodeJS.Timeout | null = null;
    let candidateQueue: RTCIceCandidateInit[] = [];

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        candidateQueue.push(e.candidate.toJSON());
        if (!candidateTimeout) {
          candidateTimeout = setTimeout(() => {
            sendSignal('ice_candidate_batch', [...candidateQueue]);
            candidateQueue.length = 0;
            candidateTimeout = null;
          }, 150);
        }
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams.length > 0) {
        setRemoteStream(e.streams[0]);
      } else {
        setRemoteStream(prev => {
          if (prev) {
            prev.addTrack(e.track);
            return prev;
          }
          return new MediaStream([e.track]);
        });
      }
      // Force a tick so components know a new track was added to the stream
      setStreamTick(t => t + 1);
    };

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return;
      setIsConnected(pc.connectionState === 'connected');
      // Reconnect if failed/disconnected
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sendSignal]);

  // Setup signaling channel — run once per room
  useEffect(() => {
    if (typeof window === 'undefined' || !supabase || !localStream) return;

    if (channelRef.current) return;

    const channelName = `webrtc:${roomCode}`;
    const existing = supabase.getChannels().filter(c => c.topic.includes(channelName));
    for (const c of existing) {
      supabase.removeChannel(c);
    }

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    async function handleSignal(type: string, data: unknown, pc: RTCPeerConnection) {
      try {
        if (type === 'peer_joined' && isHostRef.current) {
          const offer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(offer);
          sendSignal('sdp_offer', offer);
        } else if (type === 'sdp_offer') {
          const offer = data as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          for (const c of pendingCandidates.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('sdp_answer', answer);
        } else if (type === 'sdp_answer') {
          const answer = data as RTCSessionDescriptionInit;
          const pc2 = pcRef.current;
          if (pc2 && pc2.signalingState === 'have-local-offer') {
            await pc2.setRemoteDescription(new RTCSessionDescription(answer));
            for (const c of pendingCandidates.current) {
              await pc2.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidates.current = [];
          }
        } else if (type === 'ice_candidate_batch') {
          const candidates = data as RTCIceCandidateInit[];
          for (const candidate of candidates) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              pendingCandidates.current.push(candidate);
            }
          }
        } else if (type === 'mirror_state') {
          setPartnerMirrored(data as boolean);
        }
      } catch {
        // ignore signal errors
      }
    }

    channel
      .on('broadcast', { event: 'webrtc' }, async ({ payload }: {
        payload: { type: string; senderId: string; data: unknown }
      }) => {
        if (!mountedRef.current || payload.senderId === participantId) return;

        const pc = getOrCreatePC();
        await handleSignal(payload.type, payload.data, pc);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          sendSignal('peer_joined', {});
          sendSignal('mirror_state', isMirroredRef.current);
          
          if (isHostRef.current) {
            // Wait for remote to subscribe, then send initial offer
            setTimeout(async () => {
              if (!mountedRef.current) return;
              const pc = getOrCreatePC();
              // Only offer if we haven't yet
              if (pc.signalingState === 'stable' && pc.localDescription === null) {
                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  sendSignal('sdp_offer', offer);
                } catch {
                  // ignore
                }
              }
            }, 2000);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, !!localStream]);

  // Handle camera stream — re-runs on facingMode change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    async function startCamera() {
      try {
        // MUST stop previous tracks BEFORE requesting new camera,
        // otherwise mobile browsers may keep the hardware locked and return the same camera.
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
          localStreamRef.current = null;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: facingMode === 'environment' ? { exact: 'environment' } : 'user',
            },
            audio: {
              echoCancellation: true,
              autoGainControl: true,
            },
          });
        } catch (err) {
          console.warn('Exact facingMode failed, falling back to soft constraint', err);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: facingMode === 'environment' ? 'environment' : 'user',
            },
            audio: {
              echoCancellation: true,
              autoGainControl: true,
            },
          });
        }

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        
        // Sync audio track with current mic state
        stream.getAudioTracks().forEach(t => t.enabled = isMicOn);
        
        setLocalStream(stream);

        // Update tracks on the peer connection if it exists
        const pc = pcRef.current;
        if (pc && pc.connectionState !== 'closed') {
          const senders = pc.getSenders();
          stream.getTracks().forEach(track => {
            const sender = senders.find(s => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch(() => {});
            } else {
              pc.addTrack(track, stream);
            }
          });
        } else if (!pc || pc.connectionState === 'closed') {
          // Create PC if not exists yet and add tracks
          const newPc = getOrCreatePC();
          stream.getTracks().forEach(track => {
            newPc.addTrack(track, stream);
          });
        }
      } catch (err) {
        console.error('Camera access error:', err);
        // Camera access denied or unavailable
      }
    }

    startCamera();

    return () => {
      cancelled = true;
    };
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  }, []);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const toggleMirror = useCallback(() => {
    setIsMirrored(prev => {
      const next = !prev;
      isMirroredRef.current = next;
      sendSignal('mirror_state', next);
      return next;
    });
  }, [sendSignal]);

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => t.enabled = newState);
      }
      return newState;
    });
  }, []);

  return { localStream, remoteStream, streamTick, isConnected, facingMode, isMirrored, partnerMirrored, isMicOn, toggleCamera, toggleMirror, toggleMic };
}
