
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PhoneCall, 
  Settings, 
  Database, 
  Menu, 
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';
import { CallLog, UniversityRecord, AgentConfig, UniversityEvent, FAQItem, DepartmentContact } from '../types';
import { VoiceAgent } from './VoiceAgent';

interface Props {
  children: React.ReactNode;
  hodName: string;
  onSaveCall: (log: CallLog) => void;
  universityRecords: UniversityRecord[];
  events: UniversityEvent[];
  faqs: FAQItem[];
  contacts: DepartmentContact[];
  agentConfig: AgentConfig;
  isAgentBusy: boolean;
  setIsAgentBusy: (busy: boolean) => void;
}

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }> = ({ to, icon, label, active, onClick }) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-indigo-600 text-white shadow-md' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const DashboardLayout: React.FC<Props> = ({ 
  children, 
  hodName, 
  onSaveCall, 
  universityRecords, 
  events,
  faqs,
  contacts,
  agentConfig, 
  isAgentBusy, 
  setIsAgentBusy 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <VoiceAgent 
        onSaveCall={onSaveCall} 
        universityRecords={universityRecords}
        events={events}
        faqs={faqs}
        contacts={contacts} 
        agentConfig={agentConfig}
        isAgentBusy={isAgentBusy}
        setIsAgentBusy={setIsAgentBusy}
      />

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">HOD Assist</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Overview" active={location.pathname === '/'} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/logs" icon={<PhoneCall size={20} />} label="Call Logs" active={location.pathname === '/logs'} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/config" icon={<Settings size={20} />} label="Agent Configuration" active={location.pathname === '/config'} onClick={() => setIsSidebarOpen(false)} />
            <SidebarItem to="/data" icon={<Database size={20} />} label="Knowledge Base" active={location.pathname === '/data'} onClick={() => setIsSidebarOpen(false)} />
          </nav>

          <div className="p-6 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">HOD Terminal</p>
                <p className="text-[10px] font-bold text-slate-800 truncate">AIML Dept</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {location.pathname === '/' ? 'Department Dashboard' : 
               location.pathname === '/logs' ? 'Voice Traffic Monitoring' : 
               location.pathname === '/config' ? 'AI Agent Settings' : 'Data Management'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-900">{hodName}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">HOD Control</span>
            </div>
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-center font-bold">
              {hodName.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
