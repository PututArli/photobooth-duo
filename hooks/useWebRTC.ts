'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getParticipantId } from '@/lib/roomUtils';

const ICE_SERVERS_FREE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    }
  ],
  iceCandidatePoolSize: 10,
};

const ICE_SERVERS_PREMIUM: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:boothkita.metered.ca:80",
      username: "bbc314a19d82e1f2bee186c0",
      credential: "r3Umsf9SU8U+zcGd",
    },
    {
      urls: "turn:boothkita.metered.ca:80?transport=tcp",
      username: "bbc314a19d82e1f2bee186c0",
      credential: "r3Umsf9SU8U+zcGd",
    },
    {
      urls: "turn:boothkita.metered.ca:443",
      username: "bbc314a19d82e1f2bee186c0",
      credential: "r3Umsf9SU8U+zcGd",
    },
    {
      urls: "turns:boothkita.metered.ca:443?transport=tcp",
      username: "bbc314a19d82e1f2bee186c0",
      credential: "r3Umsf9SU8U+zcGd",
    },
  ],
  iceCandidatePoolSize: 10,
};

export function useWebRTC(roomCode: string, isHost: boolean, usePremiumTURN: boolean = false) {
  const participantId = getParticipantId();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [streamTick, setStreamTick] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [partnerMirrored, setPartnerMirrored] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const isMirroredRef = useRef(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isNegotiating = useRef(false);
  const ignoreOffer = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const isHostRef = useRef(isHost);
  
  // Ensure isHost is always up-to-date if component re-renders with new props
  isHostRef.current = isHost;

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

    const config = usePremiumTURN ? ICE_SERVERS_PREMIUM : ICE_SERVERS_FREE;
    const pc = new RTCPeerConnection(config);

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
      setIsConnected(pc.connectionState === 'connected');
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.onnegotiationneeded = async () => {
      if (!isHostRef.current || isNegotiating.current) return;
      
      try {
        isNegotiating.current = true;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal('sdp_offer', offer);
      } catch (err) {
        // ignore
      } finally {
        isNegotiating.current = false;
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
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('sdp_answer', answer);
          
          for (const c of pendingCandidates.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates.current = [];
        } else if (type === 'sdp_answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
            for (const c of pendingCandidates.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
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

  // Full teardown when room changes or unmounts
  useEffect(() => {
    return () => {
      // NOTE: We DO NOT stop the local stream tracks here intentionally!
      // The stream is managed by the startCamera effect.
      
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode]);

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
        setCameraError(false);
        
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
        setCameraError(true);
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

  const retryCamera = useCallback(() => {
    setCameraError(false);
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, 50);
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

  return { localStream, remoteStream, streamTick, isConnected, facingMode, isMirrored, partnerMirrored, isMicOn, cameraError, toggleCamera, toggleMirror, toggleMic, retryCamera };
}
