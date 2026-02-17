
import React, { useState, useRef, useMemo } from 'react';
import { 
  Search, 
  Play, 
  Square, 
  FileText, 
  ChevronDown, 
  Clock, 
  Database, 
  Loader2,
  Copy,
  Check,
  Phone,
  UserCheck,
  Download,
  Sparkles,
  Info,
  Calendar,
  Activity,
  IdCard
} from 'lucide-react';
import { CallLog, UniversityRecord, LanguageCode } from '../types';
import { geminiService, decodeBase64, decodeAudioData } from '../services/geminiService';

const LanguageTag: React.FC<{ code: LanguageCode }> = ({ code }) => {
  const labels = { en: 'English', hi: 'Hindi', te: 'Telugu' };
  const colors = { en: 'bg-blue-100 text-blue-700', hi: 'bg-orange-100 text-orange-700', te: 'bg-emerald-100 text-emerald-700' };
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${colors[code]}`}>
      {labels[code]}
    </span>
  );
};

const CallDetail: React.FC<{ call: CallLog; universityRecords: UniversityRecord[] }> = ({ call, universityRecords }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const cachedAudioBuffer = useRef<AudioBuffer | null>(null);

  const record = universityRecords.find(r => r.id === call.callerId || r.id === call.rollNumber);

  const handleCopyTranscript = () => {
    const text = call.transcript.map(t => `${t.speaker === 'AI' ? 'AI Assistant' : 'Caller'}: ${t.text}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      currentSourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (!cachedAudioBuffer.current) {
        setIsLoadingAudio(true);
        const base64Audio = await geminiService.generateTTS(call.transcript);
        if (base64Audio) {
          const uint8 = decodeBase64(base64Audio);
          cachedAudioBuffer.current = await decodeAudioData(uint8, audioContextRef.current);
        }
        setIsLoadingAudio(false);
      }

      if (cachedAudioBuffer.current && audioContextRef.current) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = cachedAudioBuffer.current;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start(0);
        currentSourceRef.current = source;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Playback failed:", error);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 border-t border-slate-200 space-y-8 animate-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-xl border border-indigo-100 group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-indigo-600 pointer-events-none">
          <Sparkles size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="w-full md:w-2/3 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">AI Summary</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Automated Intelligence Digest</p>
              </div>
            </div>
            
            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
              <p className="text-lg font-bold text-indigo-950 leading-relaxed italic">
                "{call.summary}"
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2">
                <Info size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Topic: <span className="text-indigo-600">{call.queryType}</span></span>
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Duration: <span className="text-indigo-600">{call.duration}</span></span>
              </div>
              <div className="px-4 py-2 bg-slate-100 rounded-xl flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status: <span className="text-emerald-600">{call.status}</span></span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex flex-col justify-between min-h-[220px]">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Voice Recording</h4>
              <div className="h-12 flex items-center justify-center gap-1">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 rounded-full bg-indigo-400/50 ${isPlaying ? 'animate-pulse' : ''}`}
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  ></div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={handleTogglePlayback}
              disabled={isLoadingAudio}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all active:scale-95 ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
              } disabled:opacity-50`}
            >
              {isLoadingAudio ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              {isLoadingAudio ? 'SYTHESIZING...' : isPlaying ? 'STOP PLAYBACK' : 'LISTEN TO INTERACTION'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText size={18} className="text-slate-400" /> Full Transcript
            </h4>
            <button 
              onClick={handleCopyTranscript}
              className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${
                isCopied 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              {isCopied ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 max-h-[500px] overflow-y-auto space-y-6 shadow-inner custom-scrollbar">
            {call.transcript.map((t, i) => (
              <div key={i} className={`flex w-full ${t.speaker === 'AI' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${t.speaker === 'AI' ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
                  
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                    t.speaker === 'AI' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {t.speaker === 'AI' ? <Sparkles size={18} /> : <UserCheck size={18} />}
                  </div>

                  <div className={`flex flex-col ${t.speaker === 'AI' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {t.speaker === 'AI' ? 'AI Assistant' : 'Caller'}
                      </span>
                    </div>
                    
                    <div className={`px-6 py-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                      t.speaker === 'AI' 
                        ? 'bg-slate-900 text-slate-50 rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      {t.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <UserCheck size={18} className="text-slate-400" /> Caller Verification
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Identified Name</p>
                 <span className="text-base font-black text-slate-900">{call.callerName}</span>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact / Roll No.</p>
                 <div className="flex items-center gap-2">
                   {call.rollNumber ? <IdCard size={16} className="text-indigo-500" /> : <Phone size={16} className="text-indigo-500" />}
                   <span className="text-base font-black text-slate-900">{call.rollNumber || call.phoneNumber || 'N/A'}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Database size={18} className="text-slate-400" /> Records Association
            </h4>
            {record ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-lg">
                <div className="bg-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-xl">
                      {record.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-black text-lg text-white">{record.name}</h5>
                      <p className="text-xs text-indigo-400 uppercase font-black tracking-widest">{record.id} • {record.role}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-8 bg-slate-50/30">
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Attendance</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${record.attendance >= 75 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
                          style={{ width: `${record.attendance}%` }}
                        />
                      </div>
                      <span className="text-xs font-black">{record.attendance}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Fee Status</p>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${record.feeStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {record.feeStatus}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400">
                <Database size={48} className="mb-4 text-slate-200" />
                <p className="text-sm font-black uppercase tracking-widest">No Linkage Found</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Caller does not exist in the Knowledge Base.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CallLogsProps {
  logs: CallLog[];
  universityRecords: UniversityRecord[];
}

const CallLogs: React.FC<CallLogsProps> = ({ logs, universityRecords }) => {
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => 
    log.callerName.toLowerCase().includes(search.toLowerCase()) ||
    log.queryType.toLowerCase().includes(search.toLowerCase()) ||
    (log.phoneNumber && log.phoneNumber.includes(search)) ||
    (log.rollNumber && log.rollNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["Caller Name", "Role", "Topic", "Contact/Roll No", "Language", "Date", "Summary"];
    const csvData = filteredLogs.map(log => [
      `"${log.callerName}"`, 
      `"${log.callerRole}"`, 
      `"${log.queryType}"`, 
      `"${log.rollNumber || log.phoneNumber || 'N/A'}"`, 
      `"${log.language}"`, 
      `"${new Date(log.timestamp).toLocaleDateString()}"`, 
      `"${log.summary.replace(/"/g, '""')}"`
    ].join(','));
    const blob = new Blob([[headers.join(','), ...csvData].join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HOD_Assist_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Search names, roll numbers or topics..."
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-black font-bold text-sm transition-all shadow-lg active:scale-95">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-200">
                <th className="px-8 py-6 w-16"></th>
                <th className="px-8 py-6">Interaction Profile</th>
                <th className="px-8 py-6">Topic Classification</th>
                <th className="px-8 py-6">Capture Info</th>
                <th className="px-8 py-6">Language</th>
                <th className="px-8 py-6 text-right">Activity Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((call) => (
                <React.Fragment key={call.id}>
                  <tr 
                    className={`hover:bg-indigo-50/40 transition-all cursor-pointer group ${expandedCallId === call.id ? 'bg-indigo-50/70 shadow-inner' : ''}`}
                    onClick={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
                  >
                    <td className="px-8 py-6">
                      <div className={`transition-transform duration-500 ${expandedCallId === call.id ? 'rotate-180' : ''}`}>
                         <ChevronDown size={20} className="text-slate-300 group-hover:text-indigo-600" />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-base">{call.callerName}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{call.callerRole}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-4 py-2 rounded-xl text-[10px] font-black bg-white border border-slate-200 text-slate-700 shadow-sm uppercase tracking-widest">
                        {call.queryType}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-sm font-bold text-slate-700">
                        {call.rollNumber ? (
                          <span className="flex items-center gap-1.5"><IdCard size={14} className="text-indigo-400"/> {call.rollNumber}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Phone size={14} className="text-indigo-400"/> {call.phoneNumber || '---'}</span>
                        )}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <LanguageTag code={call.language} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-slate-900">{new Date(call.timestamp).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase mt-0.5">{new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                  </tr>
                  {expandedCallId === call.id && (
                    <tr>
                      <td colSpan={6} className="p-0 overflow-hidden">
                        <CallDetail call={call} universityRecords={universityRecords} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-slate-300">
                     <p className="text-lg font-black uppercase tracking-widest">No logs found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CallLogs;
