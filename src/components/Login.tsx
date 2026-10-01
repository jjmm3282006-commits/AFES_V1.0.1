import React, { useState } from 'react';
import { useAuth } from '../auth';
import { store } from '../store';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('Invalid credentials');
    }
  };

  const handleQuickLogin = (value: string) => {
    if (value) {
      const [user, pass] = value.split('|');
      setUsername(user);
      setPassword(pass);
    }
  };

  const allAccounts = [
    { label: 'Admin', value: 'admin|admin' },
    { label: 'Test Admin', value: 'test_admin|test123' },
    { label: 'Faculty - Dr. Sarah Chen', value: 'faculty|faculty' },
    { label: 'Faculty - Dr. Jennifer Lee', value: 'faculty2|faculty2' },
    { label: 'Faculty - Dr. Thomas Wright', value: 'faculty3|faculty3' },
    { label: 'Faculty - Dr. Amanda Clark', value: 'faculty4|faculty4' },
    { label: 'Test Faculty', value: 'test_faculty|test123' },
    { label: 'Dean - CS', value: 'M001|dean123' },
    { label: 'Dean - Math', value: 'M002|dean123' },
    { label: 'Dean - Physics', value: 'M003|dean123' },
    { label: 'Test Dean', value: 'test_dean|test123' },
    ...store.getStudents().map(s => ({ label: `Student - ${s.name}`, value: `${s.id}|pass123` })),
    { label: 'Test Student', value: 'test_student|test123' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#D5D8DC' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #002366, #003399)', border: '3px solid #B87333' }}>
            <span className="text-4xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#B87333' }}>W</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#002366' }}>AFES</h1>
          <p className="text-sm" style={{ color: '#4B5563' }}>Anonymous Faculty Evaluation System</p>
        </div>

        <div className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: '#EDEBE8' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#002366' }}>Login</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>Quick Login</label>
            <select 
              onChange={(e) => handleQuickLogin(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
              value=""
            >
              <option value="">Select an account...</option>
              <optgroup label="Admin">
                {allAccounts.filter(a => a.label.includes('Admin')).map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </optgroup>
              <optgroup label="Faculty">
                {allAccounts.filter(a => a.label.includes('Faculty')).map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </optgroup>
              <optgroup label="Dean">
                {allAccounts.filter(a => a.label.includes('Dean')).map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </optgroup>
              <optgroup label="Student">
                {allAccounts.filter(a => a.label.includes('Student')).map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#1A1A1A' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{ backgroundColor: '#F8F6F1', borderColor: '#D5D8DC' }}
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: '#FEE2E2', color: '#C41E3A' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#002366' }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
