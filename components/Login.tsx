
import React, { useState } from 'react';
import { UserRole } from '../types';
import { GraduationCap, LogIn, ShieldAlert } from 'lucide-react';

interface Props {
  onLogin: (role: UserRole, name: string) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.HOD);
  const [name, setName] = useState('');

  const roles = Object.values(UserRole);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(role, name);
    } else {
      onLogin(role, role === UserRole.HOD ? 'Dr. Satish Kumar' : 'User');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative bg blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px] opacity-20 animate-pulse delay-700"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center bg-white/20 p-4 rounded-2xl mb-4 backdrop-blur-sm">
            <GraduationCap size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">HOD Assist</h1>
          <p className="text-indigo-100 mt-2">AI-Powered Department Receptionist</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block">Full Name</label>
            <input 
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block">Access Role</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    role === r 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === UserRole.HOD && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700 text-xs">
              <ShieldAlert size={20} className="flex-shrink-0" />
              <p>Admin login gives you access to full call recordings and agent configuration.</p>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transform transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg"
          >
            <LogIn size={20} /> Access Dashboard
          </button>

          <p className="text-center text-xs text-slate-400">
            By logging in, you agree to university data privacy policies.
          </p>
        </form>
      </div>

      <div className="mt-8 text-center text-slate-500 text-sm z-10">
        <p>© 2024 University Academic Portal • Department of CSE</p>
      </div>
    </div>
  );
};

export default Login;
