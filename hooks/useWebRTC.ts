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

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const isNegotiating = useRef(false);

  const sendSignal = useCallback((type: string, payload: unknown) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'webrtc',
      payload: { type, senderId: participantId, data: payload },
    });
  }, [participantId]);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('ice_candidate', e.candidate.toJSON());
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0] || null);
    };

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected');
    };

    pc.onnegotiationneeded = async () => {
      if (isNegotiating.current) return;
      isNegotiating.current = true;
      try {
        if (isHost) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal('sdp_offer', offer);
        }
      } catch (e) {
        console.error('Negotiation error:', e);
      } finally {
        isNegotiating.current = false;
      }
    };

    return pc;
  }, [isHost, sendSignal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    async function init() {
      // Get local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        setLocalStream(stream);

        // Create peer connection
        const pc = createPC();
        pcRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Subscribe to WebRTC signal channel
        const channel = supabase.channel(`webrtc:${roomCode}`, {
          config: { broadcast: { self: false } },
        });

        channel
          .on('broadcast', { event: 'webrtc' }, async ({ payload }: {
            payload: { type: string; senderId: string; data: unknown }
          }) => {
            if (!mounted || payload.senderId === participantId) return;
            await handleSignal(payload.type, payload.data, pc);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && isHost) {
              // Host creates offer after brief delay to let guest subscribe
              setTimeout(async () => {
                if (!mounted) return;
                try {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  sendSignal('sdp_offer', offer);
                } catch (e) {
                  console.error('Offer error:', e);
                }
              }, 2000);
            }
          });

        channelRef.current = channel;
      } catch (e) {
        console.error('getUserMedia error:', e);
      }
    }

    async function handleSignal(type: string, data: unknown, pc: RTCPeerConnection) {
      try {
        if (type === 'sdp_offer') {
          const offer = data as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          // Flush pending candidates
          for (const c of pendingCandidates.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          }
          pendingCandidates.current = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('sdp_answer', answer);
        } else if (type === 'sdp_answer') {
          const answer = data as RTCSessionDescriptionInit;
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            for (const c of pendingCandidates.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
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
      } catch (e) {
        console.error('Signal handling error:', e);
      }
    }

    init();

    return () => {
      mounted = false;
      localStream?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      channelRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, isHost]);

  const captureFrame = useCallback((): string | null => {
    if (!localStream) return null;
    const video = document.createElement('video');
    video.srcObject = localStream;
    video.muted = true;

    // Use the actual live video element on page
    const liveVideo = document.getElementById('local-video') as HTMLVideoElement;
    if (!liveVideo) return null;

    const canvas = document.createElement('canvas');
    canvas.width = liveVideo.videoWidth || 640;
    canvas.height = liveVideo.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(liveVideo, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [localStream]);

  return { localStream, remoteStream, isConnected, captureFrame };
}
