
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Zap, ShieldCheck, HelpCircle, MessageCircle, Info, Search, Globe, Trash2, AlertTriangle, Phone } from 'lucide-react';
import { AgentConfig } from '../types';
import { geminiService } from '../services/geminiService';

interface Props {
  config: AgentConfig;
  onUpdateConfig: (newConfig: AgentConfig) => void;
  onFactoryReset: () => void;
}

const AgentConfigPage: React.FC<Props> = ({ config: initialConfig, onUpdateConfig, onFactoryReset }) => {
  const [localConfig, setLocalConfig] = useState<AgentConfig>(initialConfig);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | 'saving' | 'saved'>(null);

  useEffect(() => {
    setLocalConfig(initialConfig);
  }, [initialConfig]);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const refined = await geminiService.refinePromptScript(localConfig.promptScript);
      setLocalConfig({ ...localConfig, promptScript: refined });
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    onUpdateConfig(localConfig);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg">
          <MessageCircle size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-800">Voice Agent Control Center</h2>
          <p className="text-slate-500 mt-1 font-medium">Fine-tune behavioral logic and AI departmental capabilities.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-widest">Active Deploy</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* SEARCH CONTROLS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-indigo-500" />
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-widest">Policy Grounding</label>
                </div>
                <div 
                  onClick={() => setLocalConfig({...localConfig, googleSearchEnabled: !localConfig.googleSearchEnabled})}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${localConfig.googleSearchEnabled ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-indigo-700 uppercase">Google Search Tool</span>
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${localConfig.googleSearchEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localConfig.googleSearchEnabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>
                  <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                    Allow the AI Agent to query the web for public university calendars, holiday dates, and external academic news to provide up-to-date context during calls.
                  </p>
                </div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800">
            <div className="p-6 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Zap size={20} /></div>
                <h3 className="font-bold text-white">Advanced Persona Logic</h3>
              </div>
              <button onClick={handleOptimize} disabled={isOptimizing} className="text-[10px] font-black text-indigo-400 flex items-center gap-2 hover:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/30 uppercase disabled:opacity-50">
                <RefreshCw size={14} className={isOptimizing ? 'animate-spin' : ''} /> Optimize Logic
              </button>
            </div>
            <div className="p-6">
              <textarea 
                className="w-full h-[400px] p-6 font-mono text-sm bg-black/40 text-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 leading-relaxed border border-slate-800 resize-none"
                value={localConfig.promptScript}
                onChange={(e) => setLocalConfig({ ...localConfig, promptScript: e.target.value })}
              />
            </div>
            <div className="p-6 bg-slate-800/20 border-t border-slate-800 flex justify-end">
              <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl" disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Deploy Changes
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           
           {/* EMERGENCY SETTINGS */}
           <div className="bg-red-50 rounded-3xl border border-red-100 p-8 shadow-sm">
             <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Phone size={14}/> Emergency Hotline</h4>
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase">HOD Private Number</label>
               <input 
                 type="text"
                 className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-slate-900 font-black text-lg"
                 placeholder="Enter phone number"
                 value={localConfig.emergencyContactNumber}
                 onChange={(e) => setLocalConfig({...localConfig, emergencyContactNumber: e.target.value})}
               />
               <p className="text-[10px] text-red-400 font-medium">Calls will be forwarded here when the AI detects an emergency.</p>
             </div>
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Globe size={14}/> System Capabilities</h4>
             <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg h-fit"><ShieldCheck size={16}/></div>
                  <div><p className="text-xs font-bold text-slate-800">Identity Guard</p><p className="text-[10px] text-slate-500">Strict User ID verification for PII data.</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg h-fit"><Zap size={16}/></div>
                  <div><p className="text-xs font-bold text-slate-800">Real-time PCM</p><p className="text-[10px] text-slate-500">Optimized for low-latency voice streaming.</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg h-fit"><Info size={16}/></div>
                  <div><p className="text-xs font-bold text-slate-800">Multi-lingual</p><p className="text-[10px] text-slate-500">Native support for EN, HI, and TE.</p></div>
                </div>
             </div>
           </div>
           
           <div className="bg-indigo-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900">
              <h4 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-indigo-400"/> Operational Status</h4>
              <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                The AI Agent is currently utilizing the Knowledge Base from the HOD terminal to provide accurate academic and administrative guidance to callers.
              </p>
           </div>

           {/* DANGER ZONE */}
           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-red-600">
                <AlertTriangle size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">Danger Zone</h4>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                Resetting the system will permanently delete all call logs, clear the student knowledge base, and restore default agent settings.
              </p>
              <button 
                onClick={onFactoryReset}
                className="w-full py-3 bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={16} /> Factory Reset System
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgentConfigPage;
