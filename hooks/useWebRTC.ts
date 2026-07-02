'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getParticipantId } from '@/lib/roomUtils';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(roomCode: string, isHost: boolean) {
  const participantId = getParticipantId();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isNegotiating = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

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

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('ice_candidate', e.candidate.toJSON());
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams.length > 0) {
        setRemoteStream(e.streams[0]);
      } else {
        setRemoteStream(new MediaStream([e.track]));
      }
    };

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return;
      setIsConnected(pc.connectionState === 'connected');
      // Reconnect if failed/disconnected
      if (pc.connectionState === 'failed') {
        pc.restartIce();
      }
    };

    pc.onnegotiationneeded = async () => {
      if (isNegotiating.current) return;
      if (!isHost) {
        // Guest needs negotiation (e.g. added a new track), ask host to send offer
        sendSignal('request_offer', {});
        return;
      }
      
      isNegotiating.current = true;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal('sdp_offer', offer);
      } catch {
        // ignore
      } finally {
        isNegotiating.current = false;
      }
    };

    pcRef.current = pc;
    return pc;
  }, [isHost, sendSignal]);

  // Setup signaling channel — run once per room
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
        if ((type === 'peer_joined' || type === 'request_offer') && isHost) {
          const offer = await pc.createOffer();
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
        } else if (type === 'ice_candidate') {
          const candidate = data as RTCIceCandidateInit;
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidates.current.push(candidate);
          }
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
          
          if (isHost) {
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
            audio: true,
          });
        } catch (err) {
          console.warn('Exact facingMode failed, falling back to soft constraint', err);
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: facingMode === 'environment' ? 'environment' : 'user',
            },
            audio: true,
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
  }, [facingMode, getOrCreatePC]);

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
    setIsMirrored(prev => !prev);
  }, []);

  const toggleMic = useCallback(() => {
    setIsMicOn(prev => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(t => t.enabled = newState);
      }
      return newState;
    });
  }, []);

  return { localStream, remoteStream, isConnected, facingMode, isMirrored, isMicOn, toggleCamera, toggleMirror, toggleMic };
}
