'use client';

import { motion } from 'framer-motion';

export default function RoadmapTimeline({ roadmapData = [] }: { roadmapData?: any[] }) {
  
  // Fallback defaults if the array is empty to keep UI populated visually
  const steps = roadmapData.length > 0 ? roadmapData : [
    { title: 'Foundation Missing', skill: 'Python / Syntax', type: 'Course', status: 'in-progress' },
    { title: 'Core Implementation', skill: 'Pandas & NumPy', type: 'Practice', status: 'locked' },
    { title: 'Advanced Intelligence', skill: 'Scikit-Learn ML', type: 'Project', status: 'locked' },
  ];

  return (
    <div className="relative pl-12">
      {/* The glowing central timeline pipe */}
      <div className="absolute top-0 bottom-0 left-[23px] w-[2px] bg-gradient-to-b from-blue-500 via-purple-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>

      {steps.map((step, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.2 }}
          className="mb-12 relative group"
        >
          {/* Node Dot */}
          <div className="absolute -left-[41px] w-[30px] h-[30px] rounded-full bg-black border-2 border-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,1)] z-10 transition-transform group-hover:scale-110">
            {step.status === 'completed' && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
            {step.status === 'in-progress' && <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>}
            {step.status === 'locked' && <div className="w-2 h-2 border-2 border-gray-600 rounded-full"></div>}
          </div>

          {/* Frosted Glass Content Panel */}
          <div className="glass-panel p-6 rounded-2xl w-full border border-white/5 hover:border-blue-500/30 transition-all cursor-crosshair">
            <div className="flex justify-between items-start w-full">
              <h2 className="font-[font-family:var(--font-playfair)] text-2xl text-blue-300 italic mb-2 tracking-wide drop-shadow-md">
                {step.title || (step.course_title ? step.course_title : `Phase ${idx + 1}`)}
              </h2>
              {step.type && (
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-[font-family:var(--font-outfit)] text-gray-400">
                  {step.type}
                </span>
              )}
            </div>
            
            <div className="font-[font-family:var(--font-outfit)] mt-2">
              <span className="text-sm uppercase tracking-widest text-gray-500">Skill Target: </span>
              <span className="text-white font-medium">{step.skill || step.skill_target || "Machine Learning"}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
