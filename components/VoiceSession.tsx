
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import Icon from './Icon';

interface VoiceSessionProps {
  contextText: string;
  onClose: () => void;
}

// Helper functions for Audio Encoding & Decoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceSession: React.FC<VoiceSessionProps> = ({ contextText, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [volume, setVolume] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let sessionPromise: Promise<any> | null = null;
    let cleanupAudio = () => {};

    const startSession = async () => {
      try {
        if (!process.env.API_KEY) {
            setStatus('error');
            return;
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = inputAudioContext;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('listening');
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length));

                const pcmBlob = createBlob(inputData);
                
                if (sessionPromise) {
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                }
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
              
              cleanupAudio = () => {
                  source.disconnect();
                  scriptProcessor.disconnect();
                  stream.getTracks().forEach(t => t.stop());
              };
            },
            onmessage: async (message: LiveServerMessage) => {
              const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64EncodedAudioString) {
                setStatus('speaking');
                
                nextStartTimeRef.current = Math.max(
                    nextStartTimeRef.current,
                    outputAudioContext.currentTime,
                );
                
                const audioBuffer = await decodeAudioData(
                    decode(base64EncodedAudioString),
                    outputAudioContext,
                    24000,
                    1
                );
                
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                const outputNode = outputAudioContext.createGain();
                source.connect(outputNode);
                outputNode.connect(outputAudioContext.destination);

                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) setStatus('listening');
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                sourcesRef.current.add(source);
              }
              
              if (message.serverContent?.interrupted) {
                  for (const source of sourcesRef.current.values()) {
                      source.stop();
                      sourcesRef.current.delete(source);
                  }
                  nextStartTimeRef.current = 0;
                  setStatus('listening');
              }
            },
            onclose: () => onClose(),
            onerror: () => setStatus('error')
          },
          config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
              },
              systemInstruction: `Discuss this content briefly: "${contextText.substring(0, 4000)}".` 
          }
        });

      } catch (e) {
        setStatus('error');
      }
    };

    startSession();

    return () => {
       cleanupAudio();
       if (sessionPromise) sessionPromise.then(s => s.close());
       if (audioContextRef.current) audioContextRef.current.close();
       sourcesRef.current.forEach(s => s.stop());
    };
  }, [contextText, onClose]);

  return (
    <div className="voice-control-bar">
      <div style={{marginBottom: '1rem', textAlign: 'center'}}>
        <p className="text-title" style={{color: status === 'error' ? 'var(--accent-color)' : 'inherit'}}>
            {status === 'connecting' && 'Connecting...'}
            {status === 'listening' && 'Listening...'}
            {status === 'speaking' && 'Speaking...'}
            {status === 'error' && 'Link Error'}
        </p>
        <p className="text-caption">AI Analysis Module</p>
      </div>
      
      <button 
        className={`mic-button ${status === 'listening' || status === 'speaking' ? 'listening' : ''}`}
        onClick={onClose}
        style={{ transform: `scale(${1 + Math.min(volume * 1.5, 0.4)})` }}
      >
        <Icon name="mic" style={{fontSize: '32px'}} />
      </button>
      
      <button onClick={onClose} className="btn-icon" style={{marginTop: '1rem'}}>
        <span className="text-caption">End Session</span>
      </button>
    </div>
  );
};

export default VoiceSession;
