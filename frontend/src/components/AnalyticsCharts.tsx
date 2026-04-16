'use client';

import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, Tooltip
} from 'recharts';
import { motion } from 'framer-motion';

const skillGapData = [
  { name: 'Matched', value: 85 },
  { name: 'Gap', value: 15 },
];
const COLORS = ['#3b82f6', '#1f2937'];

const demandData = [
  { year: '2026', python: 120, ai: 180, web: 90 },
  { year: '2027', python: 135, ai: 240, web: 95 },
  { year: '2028', python: 150, ai: 310, web: 100 },
];

export function SkillMatchPie() {
  return (
    <div className="glass-panel p-6 rounded-2xl relative h-64 overflow-hidden flex flex-col justify-center items-center">
      <h3 className="absolute top-4 left-6 font-[font-family:var(--font-syncopate)] text-xs tracking-widest text-gray-300">
        Skill Gap Match
      </h3>
      
      {/* 3D glow under the chart */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
      
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={skillGapData}
            cx="50%" cy="50%"
            innerRadius={60} outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {skillGapData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                style={{ 
                  filter: index === 0 ? "drop-shadow(0px 0px 10px rgba(59,130,246,0.6))" : "none"
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center mt-2">
        <span className="font-[font-family:var(--font-syncopate)] font-bold text-3xl text-white">85%</span>
      </div>
    </div>
  );
}

export function FutureDemandBar() {
  return (
    <div className="glass-panel p-6 rounded-2xl h-64 flex flex-col">
      <h3 className="font-[font-family:var(--font-syncopate)] text-xs tracking-widest text-gray-300 mb-4 z-10">
        3-Year Demand Forecast
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={demandData} barSize={12}>
          <XAxis 
            dataKey="year" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'var(--font-outfit)' }} 
            dy={10}
          />
          <Tooltip 
             contentStyle={{ 
               backgroundColor: 'rgba(17, 24, 39, 0.8)', 
               backdropFilter: 'blur(10px)',
               border: '1px solid rgba(255,255,255,0.1)',
               borderRadius: '8px' 
             }} 
          />
          <Bar 
            dataKey="ai" 
            stackId="a" 
            fill="url(#colorAI)" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="python" 
            stackId="a" 
            fill="rgba(59,130,246,0.3)" 
          />
          
          <defs>
            {/* SVG Gradient to create a 3D volumetric cylinder effect */}
            <linearGradient id="colorAI" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
