import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { store } from '../store';
import type { EvaluationCycle } from '../types';
import { LogIn, Shield, AlertCircle, Calendar } from 'lucide-react';

export default function Login() {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeCycle, setActiveCycle] = useState<EvaluationCycle | undefined>();

  useEffect(() => {
    setActiveCycle(store.getActiveCycle());
    const unsub = store.subscribe('cycle_changed', () => setActiveCycle(store.getActiveCycle()));
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await login(username, password); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #D5D8DC 0%, #EDEBE8 100%)' }}>
      <div className="w-full max-w-md">
        {activeCycle && (
          <div className="mb-4 rounded-xl p-3 flex items-center gap-2 shadow-sm" style={{ backgroundColor: '#EDEBE8', border: '1px solid #B87333' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <Calendar size={16} style={{ color: '#B87333' }} className="flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#B87333' }}>Current Active Period</p>
              <p className="text-sm font-semibold" style={{ color: '#002366' }}>{activeCycle.displayName}</p>
            </div>
          </div>
        )}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #002366, #003399)', border: '3px solid #B87333' }}>
            <span className="text-4xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#B87333' }}>W</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#002366' }}>AFES</h1>
          <p className="text-sm" style={{ color: '#1A1A1A' }}>Anonymous Faculty Evaluation System</p>
        </div>
        <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: '#EDEBE8' }}>
          <div className="flex items-center gap-2 mb-6"><Shield size={20} style={{ color: '#B87333' }} /><h2 className="text-lg font-semibold" style={{ color: '#002366' }}>Secure Login</h2></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} placeholder="Enter username" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border outline-none" style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }} placeholder="Enter password" required />
            </div>
            {error && <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}><AlertCircle size={16} /><span className="text-sm">{error}</span></div>}
            <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-lg font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: '#002366' }}>
              {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} />Sign In</>}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t" style={{ borderColor: '#D5D8DC' }}>
            <p className="text-xs font-medium mb-2" style={{ color: '#B87333' }}>Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-1 text-xs"><span>Admin: admin / admin</span><span>Faculty: faculty / faculty</span><span>Student: C24-001 / pass123</span><span>Dean: M001 / dean123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
