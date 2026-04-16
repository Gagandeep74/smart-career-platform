'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Mail, BrainCircuit, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { CareerAPI } from '@/lib/api';

export default function V2LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Strict validation requirement
    if (!email.trim() || !password.trim()) {
      setError('Please fill in your email and password.');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please provide your full name to register.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email address format.');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // Issue Real Backend Login
        const response = await CareerAPI.login(email, password);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('user_id', String(response.user_id));
        router.push('/dashboard');
      } else {
        // Issue Real Backend Signup first
        await CareerAPI.signup({ name, email, password });
        
        // Auto-login to intercept JWT locally immediately after registration completes
        const loginResponse = await CareerAPI.login(email, password);
        localStorage.setItem('access_token', loginResponse.access_token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('user_id', String(loginResponse.user_id));
        router.push('/upload');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed from API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Absolute Ambient Glows */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <BrainCircuit className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white tracking-tighter">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {isLogin ? 'Sign in to access your dashboard.' : 'Join the future of intelligence mapping.'}
          </p>
        </div>

        {/* 3D Glassmorphic Form Card */}
        <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              {!isLogin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium" placeholder="Data Engineer" />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium" placeholder="user@company.com" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Password</label>
                  {isLogin && <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium" placeholder="•••••••••" />
                </div>
              </div>

              <button disabled={isLoading} type="submit" className="group mt-4 relative w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 overflow-hidden transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>


            </motion.form>
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
              {isLogin ? 'Register Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
