
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/Layout';
import DashboardHome from './components/DashboardHome';
import CallLogs from './components/CallLogs';
import AgentConfigPage from './components/AgentConfig';
import DataManagement from './components/DataManagement';
import { CallLog, UniversityRecord, AgentConfig, UniversityEvent, FAQItem, DepartmentContact } from './types';
import { MOCK_CALL_LOGS, MOCK_UNIVERSITY_DATA, DEFAULT_AGENT_CONFIG, MOCK_EVENTS, MOCK_FAQS, MOCK_CONTACTS } from './constants';

const App: React.FC = () => {
  const hodIdentity = {
    name: 'Dr. Satish Kumar',
    role: 'HOD' as const
  };
  
  const [logs, setLogs] = useState<CallLog[]>(() => {
    try {
      const saved = localStorage.getItem('hod_assist_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [universityRecords, setUniversityRecords] = useState<UniversityRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hod_assist_university_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [events, setEvents] = useState<UniversityEvent[]>(() => {
    try {
      const saved = localStorage.getItem('hod_assist_events');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MOCK_EVENTS;
  });

  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    try {
      const saved = localStorage.getItem('hod_assist_faqs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MOCK_FAQS;
  });

  const [contacts, setContacts] = useState<DepartmentContact[]>(() => {
    try {
      const saved = localStorage.getItem('hod_assist_contacts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return MOCK_CONTACTS;
  });

  const [agentConfig, setAgentConfig] = useState<AgentConfig>(() => {
    try {
      const saved = localStorage.getItem('hod_assist_agent_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_AGENT_CONFIG;
  });

  const [isAgentBusy, setIsAgentBusy] = useState(false);

  useEffect(() => { localStorage.setItem('hod_assist_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('hod_assist_university_records', JSON.stringify(universityRecords)); }, [universityRecords]);
  useEffect(() => { localStorage.setItem('hod_assist_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('hod_assist_faqs', JSON.stringify(faqs)); }, [faqs]);
  useEffect(() => { localStorage.setItem('hod_assist_contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('hod_assist_agent_config', JSON.stringify(agentConfig)); }, [agentConfig]);

  const handleSaveCall = useCallback((newLog: CallLog) => {
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const updateUniversityRecords = useCallback((newData: UniversityRecord[]) => setUniversityRecords(newData), []);
  const updateEvents = useCallback((newData: UniversityEvent[]) => setEvents(newData), []);
  const updateFaqs = useCallback((newData: FAQItem[]) => setFaqs(newData), []);
  const updateContacts = useCallback((newData: DepartmentContact[]) => setContacts(newData), []);

  const updateAgentConfig = useCallback((newConfig: AgentConfig) => setAgentConfig(newConfig), []);

  const handleFactoryReset = useCallback(() => {
    if (window.confirm("WARNING: This will delete ALL data and reset settings. Are you sure?")) {
      setLogs([]);
      setUniversityRecords([]);
      setEvents(MOCK_EVENTS);
      setFaqs(MOCK_FAQS);
      setContacts(MOCK_CONTACTS);
      setAgentConfig(DEFAULT_AGENT_CONFIG);
      localStorage.clear();
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <DashboardLayout 
              hodName={hodIdentity.name}
              onSaveCall={handleSaveCall} 
              universityRecords={universityRecords} 
              events={events}
              faqs={faqs}
              contacts={contacts}
              agentConfig={agentConfig}
              isAgentBusy={isAgentBusy}
              setIsAgentBusy={setIsAgentBusy}
            >
              <DashboardHome logs={logs} agentConfig={agentConfig} isAgentBusy={isAgentBusy} />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/logs" 
          element={
            <DashboardLayout 
              hodName={hodIdentity.name}
              onSaveCall={handleSaveCall} 
              universityRecords={universityRecords} 
              events={events}
              faqs={faqs}
              contacts={contacts}
              agentConfig={agentConfig}
              isAgentBusy={isAgentBusy}
              setIsAgentBusy={setIsAgentBusy}
            >
              <CallLogs logs={logs} universityRecords={universityRecords} />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/config" 
          element={
            <DashboardLayout 
              hodName={hodIdentity.name}
              onSaveCall={handleSaveCall} 
              universityRecords={universityRecords} 
              events={events}
              faqs={faqs}
              contacts={contacts}
              agentConfig={agentConfig}
              isAgentBusy={isAgentBusy}
              setIsAgentBusy={setIsAgentBusy}
            >
              <AgentConfigPage 
                config={agentConfig} 
                onUpdateConfig={updateAgentConfig} 
                onFactoryReset={handleFactoryReset}
              />
            </DashboardLayout>
          } 
        />
        <Route 
          path="/data" 
          element={
            <DashboardLayout 
              hodName={hodIdentity.name}
              onSaveCall={handleSaveCall} 
              universityRecords={universityRecords} 
              events={events}
              faqs={faqs}
              contacts={contacts}
              agentConfig={agentConfig}
              isAgentBusy={isAgentBusy}
              setIsAgentBusy={setIsAgentBusy}
            >
              <DataManagement 
                records={universityRecords} 
                onUpdateRecords={updateUniversityRecords}
                events={events}
                onUpdateEvents={updateEvents}
                faqs={faqs}
                onUpdateFaqs={updateFaqs}
                contacts={contacts}
                onUpdateContacts={updateContacts}
              />
            </DashboardLayout>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
