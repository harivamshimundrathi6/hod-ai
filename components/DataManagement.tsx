
import React, { useState, useRef } from 'react';
import { 
  Upload, Download, Plus, Search, Trash2, Edit2, 
  FileSpreadsheet, Zap, X, Calendar, BookOpen, Contact, Users,
  FileText, CheckCircle, AlertCircle
} from 'lucide-react';
import { UserRole, UniversityRecord, UniversityEvent, FAQItem, DepartmentContact } from '../types';

interface Props {
  records: UniversityRecord[];
  onUpdateRecords: (newData: UniversityRecord[]) => void;
  events: UniversityEvent[];
  onUpdateEvents: (newData: UniversityEvent[]) => void;
  faqs: FAQItem[];
  onUpdateFaqs: (newData: FAQItem[]) => void;
  contacts: DepartmentContact[];
  onUpdateContacts: (newData: DepartmentContact[]) => void;
}

const DataManagement: React.FC<Props> = ({ 
  records, onUpdateRecords, 
  events, onUpdateEvents,
  faqs, onUpdateFaqs,
  contacts, onUpdateContacts
}) => {
  const [activeTab, setActiveTab] = useState<'people' | 'calendar' | 'faq' | 'directory'>('people');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- CSV Logic ---

  const downloadTemplate = () => {
    let headers = "";
    let filename = "";
    if (activeTab === 'people') {
      headers = "id,name,role,department,attendance,feeStatus,lastInternalMarks,cgpa";
      filename = "students_template.csv";
    } else if (activeTab === 'calendar') {
      headers = "title,date,category,description";
      filename = "events_template.csv";
    } else if (activeTab === 'directory') {
      headers = "name,phoneNumber,email,building";
      filename = "directory_template.csv";
    } else {
      headers = "question,answer,category";
      filename = "faqs_template.csv";
    }
    
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    let headers: string[] = [];
    
    if (activeTab === 'people') {
      dataToExport = records;
      headers = ["id", "name", "role", "department", "attendance", "feeStatus"];
    } else if (activeTab === 'calendar') {
      dataToExport = events;
      headers = ["title", "date", "category", "description"];
    } else if (activeTab === 'directory') {
      dataToExport = contacts;
      headers = ["name", "phoneNumber", "email", "building"];
    } else {
      dataToExport = faqs;
      headers = ["question", "answer", "category"];
    }

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => headers.map(h => `"${item[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hod_assist_${activeTab}_export.csv`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const body = lines.slice(1);

        const newEntries = body.map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i];
          });
          if (!obj.id && activeTab !== 'people') obj.id = Math.random().toString(36).substr(2, 9);
          return obj;
        });

        if (activeTab === 'people') onUpdateRecords([...records, ...newEntries]);
        else if (activeTab === 'calendar') onUpdateEvents([...events, ...newEntries]);
        else if (activeTab === 'directory') onUpdateContacts([...contacts, ...newEntries]);
        else onUpdateFaqs([...faqs, ...newEntries]);

        showNotification(`Successfully imported ${newEntries.length} items`, 'success');
      } catch (err) {
        showNotification("Failed to parse CSV. Please use the provided template.", 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- UI Filters ---
  const filteredRecords = records.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredEvents = events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFaqs = faqs.filter(f => f.question.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- Modal Handlers ---
  const handleOpenModal = (item?: any) => {
    setEditingItem(item || null);
    if (item) {
      setFormData({ ...item });
    } else {
      const id = Math.random().toString(36).substr(2, 9);
      if (activeTab === 'people') setFormData({ id: '', name: '', role: UserRole.STUDENT, department: 'AIML', attendance: 80, cgpa: 8.0, feeStatus: 'Paid', lastInternalMarks: '0/30' });
      else if (activeTab === 'calendar') setFormData({ id, title: '', date: new Date().toISOString().split('T')[0], category: 'Academic', description: '' });
      else if (activeTab === 'faq') setFormData({ id, question: '', answer: '', category: 'General' });
      else if (activeTab === 'directory') setFormData({ id, name: '', phoneNumber: '', email: '', building: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'people') {
      if (editingItem) onUpdateRecords(records.map(r => r.id === editingItem.id ? formData : r));
      else onUpdateRecords([...records, formData]);
    } else if (activeTab === 'calendar') {
      if (editingItem) onUpdateEvents(events.map(e => e.id === editingItem.id ? formData : e));
      else onUpdateEvents([...events, formData]);
    } else if (activeTab === 'faq') {
      if (editingItem) onUpdateFaqs(faqs.map(f => f.id === editingItem.id ? formData : f));
      else onUpdateFaqs([...faqs, formData]);
    } else if (activeTab === 'directory') {
      if (editingItem) onUpdateContacts(contacts.map(c => c.id === editingItem.id ? formData : c));
      else onUpdateContacts([...contacts, formData]);
    }
    handleCloseModal();
    showNotification("Record saved successfully", 'success');
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    if (activeTab === 'people') onUpdateRecords(records.filter(r => r.id !== id));
    if (activeTab === 'calendar') onUpdateEvents(events.filter(e => e.id !== id));
    if (activeTab === 'faq') onUpdateFaqs(faqs.filter(f => f.id !== id));
    if (activeTab === 'directory') onUpdateContacts(contacts.filter(c => c.id !== id));
    showNotification("Entry deleted", 'success');
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-8 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
          <span className="font-bold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
           <button onClick={() => setActiveTab('people')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'people' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={16}/> Students</button>
           <button onClick={() => setActiveTab('calendar')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}><Calendar size={16}/> Events</button>
           <button onClick={() => setActiveTab('directory')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}><Contact size={16}/> Directory</button>
           <button onClick={() => setActiveTab('faq')} className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'faq' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}><BookOpen size={16}/> FAQs</button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <button onClick={downloadTemplate} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Download size={16} /> Template
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={handleExportCSV} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <FileSpreadsheet size={16} /> Export
          </button>
          <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg hover:bg-black transition-all">
            <Plus size={18} /> New Entry
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder={`Search ${activeTab === 'people' ? 'students by name or roll number' : activeTab}...`} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800 shadow-sm transition-all" 
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[500px]">
         <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                <th className="px-10 py-6">Identity</th>
                <th className="px-10 py-6">Departmental Profile</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'people' && filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-6 font-mono text-sm font-black text-indigo-600">{r.id}</td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-lg">{r.name}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400 uppercase font-black">{r.role} • {r.department}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${r.attendance >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {r.attendance}% Attendance
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenModal(r)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(r.id)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'calendar' && filteredEvents.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-6 font-black text-slate-600 text-sm">{e.date}</td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-lg">{e.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded-md">{e.category}</span>
                      <p className="text-sm text-slate-500 mt-2 font-medium line-clamp-1">{e.description}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenModal(e)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(e.id)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'directory' && filteredContacts.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-6 font-black text-indigo-600 text-sm">{c.phoneNumber}</td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-lg">{c.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black mt-1">{c.building} • {c.email}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenModal(c)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(c.id)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === 'faq' && filteredFaqs.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-6 font-black text-indigo-600 text-[10px] uppercase">{f.category}</td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-base leading-tight">Q: {f.question}</span>
                      <p className="text-sm text-slate-500 mt-2 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">A: {f.answer}</p>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleOpenModal(f)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(f.id)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}

              {((activeTab === 'people' && filteredRecords.length === 0) ||
                (activeTab === 'calendar' && filteredEvents.length === 0) ||
                (activeTab === 'directory' && filteredContacts.length === 0) ||
                (activeTab === 'faq' && filteredFaqs.length === 0)) && (
                <tr>
                  <td colSpan={3} className="px-10 py-32 text-center text-slate-300">
                    <div className="flex flex-col items-center gap-4">
                      <FileSpreadsheet size={64} className="opacity-20" />
                      <p className="text-lg font-black uppercase tracking-widest">Knowledge vault empty</p>
                      <button onClick={downloadTemplate} className="text-indigo-600 font-bold text-sm hover:underline">Download CSV Template</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Edit Entry' : 'Manual Entry'}</h3>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">Direct Knowledge Injection</p>
                </div>
                <button onClick={handleCloseModal} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={24} /></button>
             </div>
             <form onSubmit={handleSubmit} className="p-10 space-y-5">
                {activeTab === 'people' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Roll Number / ID</label>
                      <input required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="e.g. CS2024-001" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!editingItem} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Full Name</label>
                      <input required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="Legal Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Attendance %</label>
                        <input type="number" className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="0-100" value={formData.attendance} onChange={e => setFormData({...formData, attendance: parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Fee Status</label>
                        <select className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" value={formData.feeStatus} onChange={e => setFormData({...formData, feeStatus: e.target.value as any})}>
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Partial">Partial</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'calendar' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Event Title</label>
                      <input required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold text-slate-800" placeholder="Exam, Holiday, etc." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Date</label>
                      <input type="date" required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold text-slate-800" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <textarea className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold text-slate-800 resize-none h-24" placeholder="Brief description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </>
                )}

                {activeTab === 'directory' && (
                  <>
                    <input required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold" placeholder="Department / Office Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold" placeholder="Phone Number" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold" placeholder="Building / Room No." value={formData.building} onChange={e => setFormData({...formData, building: e.target.value})} />
                  </>
                )}

                {activeTab === 'faq' && (
                  <>
                    <input required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold" placeholder="Common Question" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} />
                    <textarea required className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold resize-none h-32" placeholder="Standard Answer" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} />
                    <select className="w-full p-4 bg-slate-50 rounded-[1.25rem] border border-slate-200 font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="General">General</option>
                      <option value="Admissions">Admissions</option>
                      <option value="IT">IT</option>
                      <option value="Housing">Housing</option>
                    </select>
                  </>
                )}
                
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all mt-4">
                   Commit to Records
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
