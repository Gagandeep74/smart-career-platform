'use client';

import { Home, Briefcase, Map, Settings, Upload } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', icon: Home, path: '/' },
    { label: 'Resume Upload', icon: Upload, path: '/upload' },
    { label: 'Job Hub', icon: Briefcase, path: '/jobs' },
    { label: 'Roadmap', icon: Map, path: '/roadmap' },
  ];

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="h-screen w-64 glass-panel border-r border-[var(--color-career-border)] flex flex-col p-6 fixed z-10"
    >
      <div className="mb-12">
        <h1 className="font-[font-family:var(--font-syncopate)] text-2xl font-bold tracking-widest text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          AURA
        </h1>
        <p className="font-[font-family:var(--font-outfit)] text-xs text-gray-400 mt-2 tracking-widest uppercase">Career Intelligence</p>
      </div>

      <nav className="flex-1 space-y-4">
        {navItems.map((item) => (
          <Link key={item.label} href={item.path}>
            <div className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-blue-600/20 transition-all duration-300 cursor-pointer group relative">
              <item.icon className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <span className="font-[font-family:var(--font-outfit)] text-sm">{item.label}</span>
              <div className="absolute inset-0 border border-blue-500/0 rounded-lg group-hover:border-blue-500/50 transition-colors shadow-[0_0_0_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
            </div>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg text-gray-400 hover:text-white cursor-pointer">
          <Settings className="w-5 h-5" />
          <span className="font-[font-family:var(--font-outfit)] text-sm">Settings</span>
        </div>
      </div>
    </motion.div>
  );
}
