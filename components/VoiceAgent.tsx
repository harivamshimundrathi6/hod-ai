
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Loader2, 
  X, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PhoneForwarded
} from 'lucide-react';
import { UserRole, CallLog, UniversityRecord, AgentConfig, UniversityEvent, FAQItem, DepartmentContact } from '../types';
import { geminiService } from '../services/geminiService';

interface Props {
  onSaveCall: (log: CallLog) => void;
  universityRecords: UniversityRecord[];
  events: UniversityEvent[];
  faqs: FAQItem[];
  contacts: DepartmentContact[];
  agentConfig: AgentConfig;
  isAgentBusy: boolean;
  setIsAgentBusy: (busy: boolean) => void;
}

type ErrorState = {
  type: 'microphone' | 'api' | 'network' | 'unknown';
  message: string;
  instruction?: string;
};

export const VoiceAgent: React.FC<Props> = ({ 
  onSaveCall, 
  universityRecords, 
  events,
  faqs,
  contacts,
  agentConfig, 
  isAgentBusy, 
  setIsAgentBusy 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [interimUserText, setInterimUserText] = useState('');
  const [interimAiText, setInterimAiText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false); 
  const [showAutoSaveToast, setShowAutoSaveToast] = useState(false);

  const [activeAudioSourcesCount, setActiveAudioSourcesCount] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  
  const transcriptionsRef = useRef<{ role: 'user' | 'ai'; text: string }[]>([]);
  const interimUserRef = useRef('');
  const interimAiRef = useRef('');
  const isSavingRef = useRef(false);
  const emergencyDetectedRef = useRef(false); 

  useEffect(() => {
    transcriptionsRef.current = transcriptions;
    interimUserRef.current = interimUserText;
    interimAiRef.current = interimAiText;
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcriptions, interimUserText, interimAiText]);

  const decode = (base64: string) => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      return new Uint8Array(0);
    }
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const createPCMData = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const cleanupSession = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }

    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    setActiveAudioSourcesCount(0); 
    setIsAgentBusy(false);
    setIsConnecting(false);
  }, [setIsAgentBusy]);

  const handleCallWrapUp = useCallback(async () => {
    if (isSavingRef.current) return;
    
    const currentTranscripts = [...transcriptionsRef.current];
    const finalUserText = interimUserRef.current.trim();
    const finalAiText = interimAiRef.current.trim();
    
    if (finalUserText) currentTranscripts.push({ role: 'user', text: finalUserText });
    if (finalAiText) currentTranscripts.push({ role: 'ai', text: finalAiText });

    if (currentTranscripts.length === 0) {
      cleanupSession();
      return;
    }

    isSavingRef.current = true;
    cleanupSession();
    setIsSummarizing(true);
    
    try {
      const transcriptForAnalysis: CallLog['transcript'] = currentTranscripts.map(t => ({ 
        speaker: t.role === 'ai' ? 'AI' : 'Caller', 
        text: t.text 
      }));

      const analysis = await geminiService.analyzeCall(transcriptForAnalysis);

      const durationMs = Date.now() - startTimeRef.current;
      const durationStr = `${Math.floor(durationMs / 60000)}:${Math.floor((durationMs % 60000) / 1000).toString().padStart(2, '0')}`;

      const isEmergency = analysis.queryType === 'Emergency' || emergencyDetectedRef.current;
      const status = isEmergency ? 'Transferred' : 'Completed';

      if (isEmergency) {
        setIsTransferring(true);
        setTimeout(() => {
          const emergencyNumber = agentConfig.emergencyContactNumber || '9347216338';
          window.location.href = `tel:${emergencyNumber}`;
          setTimeout(() => setIsTransferring(false), 3000);
        }, 1500); 
      }

      onSaveCall({
        id: Math.random().toString(36).substr(2, 9),
        callerName: analysis.callerName || "System Test (HOD)",
        callerRole: (analysis.callerRole as any) || UserRole.HOD,
        phoneNumber: analysis.phoneNumber,
        rollNumber: analysis.rollNumber, 
        timestamp: new Date().toISOString(),
        language: 'en',
        summary: analysis.summary,
        queryType: isEmergency ? 'Emergency' : analysis.queryType,
        duration: durationStr,
        status: status,
        transcript: transcriptForAnalysis
      });

      if (!isEmergency) {
        setShowAutoSaveToast(true);
        setTimeout(() => setShowAutoSaveToast(false), 3000);
      }
    } catch (err) {
      console.error("Processing failed:", err);
    } finally {
      setIsSummarizing(false);
      isSavingRef.current = false;
      emergencyDetectedRef.current = false;
      setTranscriptions([]);
      setInterimUserText('');
      setInterimAiText('');
    }
  }, [onSaveCall, cleanupSession, agentConfig.emergencyContactNumber]);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setTranscriptions([]);
      transcriptionsRef.current = [];
      setInterimUserText('');
      setInterimAiText('');
      interimUserRef.current = '';
      interimAiRef.current = '';
      startTimeRef.current = Date.now();
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        throw { type: 'microphone', message: "Microphone Access Denied" };
      }
      
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      if (!inputAudioContextRef.current) inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      await audioContextRef.current.resume();
      await inputAudioContextRef.current.resume();

      const studentRecords = universityRecords.map(r => `ROLL: ${r.id} | NAME: ${r.name} | ATT: ${r.attendance}%`).join('\n');
      const eventList = events.map(e => `DATE: ${e.date} | TITLE: ${e.title}`).join('\n');
      const faqList = faqs.map(f => `Q: ${f.question} | A: ${f.answer}`).join('\n');
      const contactList = contacts.map(c => `${c.name}: ${c.phoneNumber}`).join('\n');

      const systemInstruction = `
        ${agentConfig.promptScript.replace('{{EMERGENCY_CONTACT_NUMBER}}', agentConfig.emergencyContactNumber)}
        
        KNOWLEDGE BASE:
        [STUDENT RECORDS]
        ${studentRecords}

        [EVENTS]
        ${eventList}

        [FAQs]
        ${faqList}

        [DIRECTORY]
        ${contactList}
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsAgentBusy(true);

            if (inputAudioContextRef.current && streamRef.current) {
              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              scriptProcessorRef.current = scriptProcessor;
              
              scriptProcessor.onaudioprocess = (e) => {
                if (isMuted) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createPCMData(inputData);
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Fix: Solve potential crash by adding optional chaining for 'parts'
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                setActiveAudioSourcesCount(prev => Math.max(0, prev - 1)); 
              };
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              setActiveAudioSourcesCount(prev => prev + 1); 
            }

            if (message.serverContent?.inputTranscription) {
              setInterimUserText(prev => prev + message.serverContent.inputTranscription.text);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setInterimAiText(prev => prev + text);
              if (text.toLowerCase().includes("initiating emergency transfer")) {
                emergencyDetectedRef.current = true;
                setTimeout(() => cleanupSession(), 3000);
              }
            }
            if (message.serverContent?.turnComplete) {
              setTranscriptions(prev => {
                const next = [...prev];
                if (interimUserRef.current.trim()) next.push({ role: 'user', text: interimUserRef.current.trim() });
                if (interimAiRef.current.trim()) next.push({ role: 'ai', text: interimAiRef.current.trim() });
                return next;
              });
              setInterimUserText(''); 
              setInterimAiText('');
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setActiveAudioSourcesCount(0); 
            }
          },
          onclose: () => handleCallWrapUp(),
          onerror: () => {
            setError({ type: 'api', message: "Connection Broken" });
            cleanupSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: systemInstruction,
          tools: agentConfig.googleSearchEnabled ? [{ googleSearch: {} }] : []
        }
      });
      sessionPromise.then(s => { sessionRef.current = s; });
    } catch (err: any) {
      setError({ type: 'unknown', message: "Start Failed" });
      setIsConnecting(false);
      cleanupSession();
    }
  };

  return (
    <>
      {showAutoSaveToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="font-bold text-sm">Interaction Logged</span>
          </div>
        </div>
      )}

      {isTransferring && (
        <div className="fixed inset-0 bg-red-950/90 backdrop-blur-lg z-[300] flex items-center justify-center">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center space-y-8 max-w-sm">
             <div className="w-28 h-28 bg-red-600 rounded-full flex items-center justify-center mx-auto text-white shadow-2xl animate-bounce">
                <PhoneForwarded size={48} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 uppercase">Emergency Transfer</h3>
             <p className="text-slate-500 text-sm font-bold">Contacting HOD at {agentConfig.emergencyContactNumber}</p>
          </div>
        </div>
      )}

      {isSummarizing && !isTransferring && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl text-center space-y-4">
            <Loader2 size={32} className="animate-spin mx-auto text-indigo-600" />
            <p className="font-black text-slate-800 uppercase">Syncing Data...</p>
          </div>
        </div>
      )}

      {!isAgentBusy && !isConnecting && !isSummarizing && !error && !isTransferring && (
        <button onClick={startCall} className="fixed bottom-8 right-8 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 z-50">
          <Phone size={28} />
        </button>
      )}

      {(isAgentBusy || isConnecting || error) && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6 text-white">
          <button onClick={() => { setError(null); cleanupSession(); }} className="absolute top-8 right-24 p-2 rounded-full hover:bg-white/10"><X size={32} /></button>
          
          {isAgentBusy && !error && (
            <button onClick={handleCallWrapUp} className="fixed top-6 right-6 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl z-[120]">
              <PhoneOff size={32} />
            </button>
          )}

          <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center">
            {error ? (
              <div className="text-center space-y-4">
                <AlertCircle size={48} className="text-red-500 mx-auto" />
                <h2 className="text-2xl font-black uppercase text-red-500">{error.message}</h2>
                <button onClick={startCall} className="px-8 py-3 bg-red-600 rounded-xl font-bold">Retry Simulation</button>
              </div>
            ) : (
              <>
                <div className="w-32 h-32 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-8">
                  <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl">
                    {isConnecting ? <Loader2 size={40} className="animate-spin" /> : <Volume2 size={40} className="animate-bounce" />}
                  </div>
                </div>
                
                <h2 className="text-2xl font-black">{isConnecting ? 'CONNECTING...' : 'AGENT MONITORING'}</h2>
                
                <div ref={transcriptContainerRef} className="w-full bg-black/40 border border-slate-800 rounded-3xl p-6 flex-1 overflow-y-auto mt-8 mb-8 space-y-4 custom-scrollbar">
                  {transcriptions.map((t, i) => (
                    <div key={i} className={`flex flex-col ${t.role === 'ai' ? 'items-start' : 'items-end'}`}>
                      <span className="text-[10px] font-black text-slate-500 uppercase mb-1">{t.role === 'ai' ? 'Agent' : 'Caller'}</span>
                      <p className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${t.role === 'ai' ? 'bg-indigo-950 text-indigo-100' : 'bg-slate-800 text-slate-200'}`}>{t.text}</p>
                    </div>
                  ))}
                </div>
                
                <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-slate-800'}`}>
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
