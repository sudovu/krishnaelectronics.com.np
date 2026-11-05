'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-navy-900 border border-navy-800 p-8 rounded-2xl shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-navy-800 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
            <Cpu className="w-8 h-8 text-cyan-accent" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Krishna Electronics Admin CMS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Birendranagar-6, Buddhapath, Surkhet, Nepal
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@krishnaelectronics.com.np"
                className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 outline-none"
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 outline-none"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 tracking-wide uppercase"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Admin Panel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-navy-800 text-center text-[11px] text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-cyan-accent">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role-Based Secure Session Verification</span>
          </div>
          <p>
            Default credentials configured in system seed: <code>admin@krishnaelectronics.com.np</code>
          </p>
        </div>
      </div>
    </div>
  );
}
