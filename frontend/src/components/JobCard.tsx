'use client';

import { motion } from 'framer-motion';
import { ExternalLink, CheckCircle } from 'lucide-react';

interface JobCardProps {
  title: string;
  company: string;
  matchScore: number;
  salary: string;
  location: string;
  delay?: number;
}

export default function JobCard({ title, company, matchScore, salary, location, delay = 0 }: JobCardProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ 
        y: -10, 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(59,130,246,0.3)" 
      }}
      className="glass-panel p-6 rounded-2xl relative overflow-hidden group cursor-pointer border border-white/5 hover:border-blue-500/50 transition-colors"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Decorative Blur Orb */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/0 via-blue-500/10 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl z-0" />
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h2 className="font-[font-family:var(--font-syncopate)] text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{title}</h2>
          <p className="font-[font-family:var(--font-outfit)] text-sm text-gray-400 flex items-center gap-2">
            <span>{company}</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>{location}</span>
          </p>
        </div>
        
        {/* Match Score Badge (3D pop out effect) */}
        <div 
          className="flex flex-col items-center px-3 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10"
          style={{ transform: 'translateZ(20px)' }}
        >
          <span className="text-xs text-blue-500 font-[font-family:var(--font-outfit)] uppercase tracking-wider mb-1">Match</span>
          <span className="text-xl font-bold font-[font-family:var(--font-syncopate)] text-white">{matchScore}%</span>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex justify-between items-end">
        <div className="font-[font-family:var(--font-outfit)]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Est. Salary</p>
          <p className="text-md text-gray-200 font-medium">{salary}</p>
        </div>
        
        <button className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-4 py-2 bg-blue-600/20 hover:bg-blue-600/60 transition-colors rounded-full border border-blue-500/30">
          Apply <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
