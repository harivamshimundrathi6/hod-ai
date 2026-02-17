
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Users, 
  PhoneOutgoing, 
  Clock, 
  MessageSquare,
  Activity,
  Zap,
  PowerOff,
  AlertCircle,
  BrainCircuit,
  Globe2,
  PieChart as PieChartIcon,
  Radio,
  History,
  TrendingUp,
  Text, // Added Text icon for summary lengths
} from 'lucide-react';
import { CallLog, AgentConfig } from '../types';
import { geminiService } from '../services/geminiService';

interface Props {
  logs: CallLog[];
  agentConfig: AgentConfig;
  isAgentBusy: boolean;
}

const DashboardHome: React.FC<Props> = ({ logs, agentConfig, isAgentBusy }) => {
  const [uptime, setUptime] = useState(0);
  const [smartAlerts, setSmartAlerts] = useState<{ title: string; severity: 'high' | 'medium' | 'low'; description: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      setIsAnalyzing(true);
      geminiService.generateSmartAlerts(logs).then(alerts => {
        setSmartAlerts(alerts);
        setIsAnalyzing(false);
      });
    } else {
      setSmartAlerts([]); // Clear alerts if no logs
    }
  }, [logs.length]);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => {
    const totalCalls = logs.length;
    const uniqueCallers = new Set(logs.map(log => log.callerName)).size;
    
    const totalSeconds = logs.reduce((acc, log) => {
      const parts = log.duration.split(':').map(Number);
      if (parts.length === 2) {
        return acc + (parts[0] * 60 + parts[1]);
      }
      return acc + (parts[0] || 0); // Fallback for unexpected format
    }, 0);

    const avgSeconds = totalCalls > 0 ? totalSeconds / totalCalls : 0;
    const avgDurationStr = `${Math.floor(avgSeconds / 60)}:${Math.round(avgSeconds % 60).toString().padStart(2, '0')}m`;
    const resolutionRate = totalCalls > 0 ? Math.round((logs.filter(l => l.status === 'Completed').length / totalCalls) * 100) : 0;

    return [
      { label: 'Total Logs', value: totalCalls.toLocaleString(), change: 'Lifetime', icon: <PhoneOutgoing size={24} />, color: 'bg-indigo-600' },
      { label: 'Verified Contacts', value: uniqueCallers.toLocaleString(), change: 'Linked', icon: <Users size={24} />, color: 'bg-emerald-500' },
      { label: 'Avg Context', value: avgDurationStr, change: 'Per Call', icon: <Clock size={24} />, color: 'bg-amber-500' },
      { label: 'AI Resolution', value: `${resolutionRate}%`, change: 'Success', icon: <MessageSquare size={24} />, color: 'bg-blue-500' },
    ];
  }, [logs]);

  const queryDistribution = useMemo(() => {
    const counts: Record<string, number> = { Exam: 0, Fee: 0, Attendance: 0, Admission: 0, Emergency: 0, Other: 0 };
    logs.forEach(l => {
      if (counts[l.queryType] !== undefined) counts[l.queryType]++;
      else counts.Other++;
    });
    return [
      { name: 'Examination', value: counts.Exam, color: '#6366f1' },
      { name: 'Fee Status', value: counts.Fee, color: '#f59e0b' },
      { name: 'Attendance', value: counts.Attendance, color: '#10b981' },
      { name: 'Admission', value: counts.Admission, color: '#3b82f6' },
      { name: 'Emergency', value: counts.Emergency, color: '#ef4444' },
      { name: 'Unclassified', value: counts.Other, color: '#94a3b8' }
    ].filter(d => d.value > 0);
  }, [logs]);

  const barData = useMemo(() => {
    return queryDistribution.map(item => ({
      name: item.name,
      volume: item.value,
      fill: item.color
    }));
  }, [queryDistribution]);

  const summaryLengthDistribution = useMemo(() => {
    const counts = { short: 0, medium: 0, long: 0 };
    logs.forEach(log => {
      const length = log.summary.length;
      if (length < 75) {
        counts.short++;
      } else if (length >= 75 && length < 200) {
        counts.medium++;
      } else {
        counts.long++;
      }
    });

    return [
      { name: 'Short (< 75 Chars)', value: counts.short, color: '#84cc16' }, // lime-500
      { name: 'Medium (75-199 Chars)', value: counts.medium, color: '#f97316' }, // orange-500
      { name: 'Long (>= 200 Chars)', value: counts.long, color: '#ef4444' } // red-500
    ].filter(d => d.value > 0);
  }, [logs]);

  const status = !agentConfig.active ? { label: 'OFFLINE', color: 'bg-slate-500', icon: <PowerOff size={24} /> } :
                 isAgentBusy ? { label: 'STREAMING', color: 'bg-indigo-600', icon: <Radio size={24} />, pulse: true } :
                 { label: 'MONITORING', color: 'bg-emerald-500', icon: <Zap size={24} /> };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. REAL-TIME SYSTEM MONITOR */}
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        <div className="p-10 lg:w-1/3 bg-slate-900 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-indigo-500 rounded-full animate-ping"></div>
          </div>
          
          <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 ${status.color}`}>
            {status.icon}
          </div>
          
          <div className="relative z-10">
            <h3 className="text-4xl font-black text-white tracking-tighter italic">{status.label}</h3>
            <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2">Uptime: {formatUptime(uptime)}</p>
          </div>
        </div>
        
        <div className="flex-1 p-10 grid grid-cols-2 gap-8 items-center bg-white">
          <div className="space-y-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Deployment Sector</span>
             <p className="font-black text-2xl text-slate-800 tracking-tight truncate">{agentConfig.departmentName}</p>
          </div>
          <div className="space-y-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Admin Console</span>
             <p className="font-black text-2xl text-slate-800 tracking-tight truncate">{agentConfig.hodName}</p>
          </div>
          <div className="space-y-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Live Search Overlay</span>
             <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${agentConfig.googleSearchEnabled ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <p className={`font-black text-2xl tracking-tight ${agentConfig.googleSearchEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {agentConfig.googleSearchEnabled ? 'ONLINE' : 'LOCKED'}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
            <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</h3>
            <div className="mt-4 flex items-center gap-2">
               <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. INTELLIGENCE & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* AI INTELLIGENCE HUB */}
          <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-indigo-600 pointer-events-none">
              <BrainCircuit size={120} />
            </div>
            
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100"><BrainCircuit size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Hub</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Automated Trend Analysis</p>
                </div>
              </div>
              {isAnalyzing && <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 animate-pulse bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">SYNCING...</div>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {smartAlerts.length > 0 ? smartAlerts.map((alert, i) => (
                <div key={i} className={`p-6 rounded-[2rem] border-l-[6px] shadow-sm transition-all hover:scale-[1.02] ${
                  alert.severity === 'high' ? 'bg-red-50/50 border-red-500' : 
                  alert.severity === 'medium' ? 'bg-amber-50/50 border-amber-500' : 'bg-blue-50/50 border-blue-500'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      alert.severity === 'high' ? 'bg-red-500 text-white' : 
                      alert.severity === 'medium' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                    }`}><AlertCircle size={16} /></div>
                    <h4 className="font-black text-slate-900 tracking-tight">{alert.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{alert.description}</p>
                </div>
              )) : (
                <div className="col-span-2 text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Awaiting interaction data for deep analysis...</p>
                </div>
              )}
            </div>
          </div>

          {/* CALL VOLUME BAR CHART */}
          <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-emerald-600 text-white rounded-2xl"><TrendingUp size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Interaction Volume</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Topic-Based distribution</p>
                </div>
             </div>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="volume" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* NEW: SUMMARY LENGTH DISTRIBUTION PIE CHART */}
          <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl"><Text size={24} /></div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Summary Lengths</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Distribution of AI-generated summaries</p>
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={summaryLengthDistribution} innerRadius={60} outerRadius={90} dataKey="value" stroke="none" paddingAngle={5} animationDuration={1000}>
                                {summaryLengthDistribution.map((e, i) => <Cell key={i} fill={e.color} className="focus:outline-none" />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px' }}
                                itemStyle={{ fontWeight: 'black', fontSize: '12px', textTransform: 'uppercase' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full mt-6 space-y-3">
                    {summaryLengthDistribution.length > 0 ? summaryLengthDistribution.map((q, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: q.color}}></div>
                                <span className="text-xs font-black text-slate-700">{q.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400">{logs.length > 0 ? Math.round(q.value / logs.length * 100) : 0}%</span>
                                <span className="text-sm font-black text-slate-900">{q.value}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-slate-200 italic font-medium">No Summary Data</div>
                    )}
                </div>
            </div>
          </div> {/* End of NEW PIE CHART */}

        </div>

        {/* Right: Query Metrics Pie Chart */}
        <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-xl flex flex-col h-full">
           <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl"><PieChartIcon size={24} /></div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Query Metrics</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Categorical Share</p>
              </div>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center">
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={queryDistribution} innerRadius={80} outerRadius={110} dataKey="value" stroke="none" paddingAngle={8} animationDuration={1000}>
                      {queryDistribution.map((e, i) => <Cell key={i} fill={e.color} className="focus:outline-none" />)}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px' }}
                      itemStyle={{ fontWeight: 'black', fontSize: '12px', textTransform: 'uppercase' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             
             <div className="w-full mt-10 space-y-4">
                {queryDistribution.length > 0 ? queryDistribution.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{backgroundColor: q.color}}></div>
                      <span className="text-sm font-black text-slate-700">{q.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-slate-400">{logs.length > 0 ? Math.round(q.value / logs.length * 100) : 0}%</span>
                      <span className="text-sm font-black text-slate-900">{q.value}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 text-slate-200 italic font-medium">Distribution Map Unavailable</div>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
