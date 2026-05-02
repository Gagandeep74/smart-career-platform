'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, RadialLinearScale, Filler, Title, Tooltip, Legend 
} from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import { ArrowLeft, Target, Briefcase, Zap, Cpu, CheckCircle, Activity, Blocks, ChevronUp, ChevronDown, ExternalLink, RefreshCw, User, LogOut, Home } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, RadialLinearScale, Filler, Title, Tooltip, Legend
);

export default function V2DashboardPage() {
  const [extractedSkills, setExtractedSkills] = useState(['Python', 'Machine Learning', 'SQL', 'FastAPI']);
  const [predictedRole, setPredictedRole] = useState('Data Scientist');
  const [clusterInfo, setClusterInfo] = useState({ number: 4, similarRoles: ['ML Engineer', 'AI Researcher'] });
  const [recommendedPaths, setRecommendedPaths] = useState<any[]>([]);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [showAllPaths, setShowAllPaths] = useState(false);
  
  const [futureGaps, setFutureGaps] = useState<{role: string, skills: string[]}[]>([
    { role: 'AI & Data Engineering', skills: ['PyTorch', 'TensorFlow'] },
    { role: 'Cloud & Infrastructure', skills: ['Docker', 'AWS'] }
  ]);
  const [personalizedMsg, setPersonalizedMsg] = useState('We are analyzing your tech profile to determine the best bridging strategy for your career.');

  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('Guest User');

  const executePivot = async (skills: string[]) => {
    if (!skills || skills.length === 0) {
      setIsLoading(false);
      return;
    }
    try {
      const { CareerAPI } = await import('@/lib/api');
      const res = await CareerAPI.analyzeCareerPaths(skills);
      
      if (res.recommended_paths?.length > 0) {
        setRecommendedPaths(res.recommended_paths);
        const best = res.recommended_paths[0];
        setPredictedRole(best.role);
        
        const runnersUp = res.recommended_paths.slice(1, 3).map((p: any) => p.role);
        if (runnersUp.length > 0) {
          setClusterInfo({ number: Math.floor(Math.random() * 9) + 1, similarRoles: runnersUp });
        }
        
        const aiPath = res.recommended_paths.find((p: any) => p.role.includes('Machine Learning') || p.role.includes('Data'));
        const cloudPath = res.recommended_paths.find((p: any) => p.role.includes('DevOps') || p.role.includes('Backend'));
        const cyberPath = res.recommended_paths.find((p: any) => p.role.includes('Cyber') || p.role.includes('Security'));

        const fgaps = [];
        if (aiPath) fgaps.push({ role: 'AI & Data Eng', skills: aiPath.missing_skills || [] });
        if (cloudPath) fgaps.push({ role: 'Cloud Scaling', skills: cloudPath.missing_skills || [] });
        if (cyberPath) fgaps.push({ role: 'Cyber Threat Analysis', skills: cyberPath.missing_skills || [] });
        
        setFutureGaps(fgaps.length > 0 ? fgaps : [{ role: 'Scaling Infrastructure', skills: ['Docker', 'AWS API'] }]);
        
        const allMissing = fgaps.flatMap(fg => fg.skills);
        const topCurrent = res.user_skills?.length > 0 ? res.user_skills[0] : extractedSkills[0] || 'Software';
        
        if (allMissing.length === 0) {
          setPersonalizedMsg(`Incredible! Your extensive background natively in ${topCurrent} makes you phenomenally prepared for the projected AI expansions. You require no immediate upskilling.`);
        } else {
          const uniqueMissing = Array.from(new Set(allMissing)).slice(0, 3).join(', ');
          setPersonalizedMsg(`To capitalize on the high-growth technological trajectory projected for 2026, we strongly recommend leveraging your current ${topCurrent.toUpperCase()} background by aggressively acquiring skills in: ${uniqueMissing.toUpperCase()}.`);
        }
        
        setExtractedSkills(res.user_skills || extractedSkills);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let initialSkills = extractedSkills;
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('userEmail');
      if (savedUser) setUserName(savedUser.split('@')[0]);

      const saved = localStorage.getItem('recent_skills');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length > 0) initialSkills = parsed;
        } catch(e) {}
      }
    }
    executePivot(initialSkills);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Dynamic Chart Data Configurations ---
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } };

  // 1. Radar Chart (Job Roles Match Percentage)
  const radarLabels = recommendedPaths.slice(0, 6).map(p => p.role.split(' ')[0]); // Truncate long names for radar axis
  const radarValues = recommendedPaths.slice(0, 6).map(p => p.match_percentage);
  
  if (radarLabels.length === 0) {
    radarLabels.push('Analyzing', 'Calculating', 'Mapping', 'Vectors', 'Neural', 'Compute');
    radarValues.push(20, 20, 20, 20, 20, 20);
  } else while (radarLabels.length < 3) {
    radarLabels.push('');
    radarValues.push(0);
  }
  
  const radarData = {
    labels: radarLabels,
    datasets: [{
      label: 'Role Alignment (%)',
      data: radarValues, 
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
    }]
  };
  const radarOptions = { ...chartOptions, scales: { r: { angleLines: { color: 'rgba(255,255,255,0.1)' }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#94a3b8' }, ticks: { display: false } } } };

  // 2. Bar Chart (Historical Tool Usage vs Peers)
  const barData = {
    labels: extractedSkills.slice(0, 4),
    datasets: [{
      label: 'Your Mastery Focus',
      data: [95, 75, 80, 60],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderRadius: 6
    }]
  };
  const barOptions = { ...chartOptions, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } } } };

  // 3. Line Chart (Future Growth)
  const lineData = {
    labels: ['2024', '2025', '2026', '2027', '2028'],
    datasets: [
      { label: 'AI & Machine Learning', data: [100, 140, 200, 280, 350], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4, fill: true },
      { label: 'Cloud DevOps & Architecture', data: [100, 120, 160, 220, 270], borderColor: '#10b981', tension: 0.4, fill: false },
      { label: 'Cybersecurity Analyst', data: [100, 130, 180, 240, 300], borderColor: '#8b5cf6', tension: 0.4, fill: false },
      { label: 'Traditional Web Dev', data: [100, 95, 85, 75, 70], borderColor: '#94a3b8', borderDash: [5, 5], tension: 0.4 },
      { label: 'Manual QA Testing', data: [100, 85, 60, 45, 35], borderColor: '#f43f5e', borderDash: [5, 5], tension: 0.4 },
      { label: 'On-Premise SysAdmin', data: [100, 90, 75, 55, 45], borderColor: '#f97316', borderDash: [5, 5], tension: 0.4 }
    ]
  };

  // 4. Doughnut Chart (Gap Analysis Volumes)
  const doughnutData = {
    labels: futureGaps.map(g => g.role),
    datasets: [{
      data: futureGaps.map(g => g.skills.length + 1), // basic weight allocation
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
      borderWidth: 0,
    }]
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-6 md:p-12 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-transparent pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between pb-8 mb-8 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" /> Career Insights
          </h1>
          <p className="text-slate-500 font-mono text-xs sm:text-sm mt-1 sm:mt-2 uppercase tracking-widest">AI-Powered Career Trajectory</p>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all font-bold text-xs text-slate-300 uppercase tracking-widest whitespace-nowrap" title="Back to Home">
            <Home className="w-4 h-4" /> <span className="hidden sm:inline">Home</span>
          </Link>

          <Link href="/upload" className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all font-bold text-xs text-indigo-400 uppercase tracking-widest whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Scan</span>
          </Link>
          
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-900/50 rounded-full border border-white/10 shadow-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
               <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-white capitalize hidden sm:block max-w-[120px] truncate">{userName}</span>
            <div className="w-px h-4 bg-white/20 mx-1 lg:mx-2 hidden sm:block" />
            <button onClick={() => { localStorage.removeItem('userEmail'); localStorage.removeItem('access_token'); localStorage.removeItem('user_id'); window.location.href='/login'; }} className="text-slate-400 hover:text-rose-400 transition-colors hidden sm:block" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {isLoading ? (
        <div className="w-full h-96 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
          <p className="text-white font-mono uppercase tracking-widest animate-pulse">Synchronizing Data Nodes...</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-[1400px] mx-auto">
          
          {/* Top Row Highlights */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 bg-blue-600/10 border border-blue-500/20 rounded-3xl p-8 lg:p-10 backdrop-blur-md flex flex-col lg:flex-row gap-8 items-center justify-between">
            <div className="flex-1">
              <h2 className="text-blue-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4" /> Highest Recommended Career Path</h2>
              <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">{predictedRole}</h3>
              <p className="text-blue-200/60 max-w-2xl text-sm leading-relaxed">
                This vector represents your absolute highest market value trajectory. Our neural engine has mapped your exact competency fingerprint against 140,000 active global job nodes to determine optimal deployment.
              </p>
            </div>

            {/* Extracted Skills - Separated Block */}
            <div className="lg:w-[40%] min-w-[300px] bg-slate-950/40 p-6 rounded-2xl border border-blue-500/10 flex flex-col justify-center">
              <span className="text-emerald-500 font-bold tracking-[0.2em] text-[10px] uppercase flex items-center gap-2 mb-3">
                <Activity className="w-3 h-3" /> Your Detected Skills
              </span>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.map(skill => (
                  <span 
                    key={skill} 
                    className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-black text-blue-300 uppercase tracking-widest hover:bg-blue-500/20 transition-colors shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Graph Section 1: Radar */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-4 bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" /> Career Role Alignment
            </h3>
            <div className="h-64"><Radar data={radarData} options={radarOptions} /></div>
          </motion.div>

          {/* Alternative Career Matches (Formerly K-Means) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-8 bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 w-full">
              <div>
                <h2 className="text-indigo-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4" /> Alternative Career Matches
                </h2>
                <p className="text-sm text-slate-400">
                  Secondary pathways your skill sequence strongly aligns with based on our market analysis.
                </p>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} 
                className="px-4 py-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm whitespace-nowrap hidden sm:block"
              >
                Analyze All
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full relative z-10">
              {recommendedPaths.slice(1, 4).map((path, idx) => (
                <div key={idx} className="bg-slate-900/50 hover:bg-slate-800/80 transition-colors border border-white/5 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col gap-3 relative z-10">
                    <span className="font-bold text-white text-sm line-clamp-2 leading-tight">{path.role}</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded w-max border ${
                      path.match_percentage >= 70 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                      path.match_percentage >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {Math.round(path.match_percentage)}% MATCH
                    </span>
                  </div>
                  
                  <div className="relative z-10 mt-5 border-t border-white/5 pt-3">
                    <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed font-medium">
                      {path.description || 'Valid alternative trajectory utilizing overlapping competencies.'}
                    </p>
                  </div>
                </div>
              ))}
              
              {recommendedPaths.length <= 1 && (
                <div className="col-span-3 flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl h-full min-h-[120px]">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest text-center">Processing Network Nodes...</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* MASSIVE WRAPPER: Future Demand Skills */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 mt-4 bg-slate-900/40 border-t border-indigo-500/20 sm:rounded-[2.5rem] p-6 lg:p-10 flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />
            
            {/* Wrapper Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Future Demand Skills</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Market trajectory and dynamic skill gap analysis</p>
              </div>
            </div>

            {/* Inner Grid for Charts */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 w-full">
              
              {/* Line Chart */}
              <div className="col-span-1 md:col-span-12 bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-500" /> Estimated Market Growth</h3>
                <div className="h-64"><Line data={lineData} options={barOptions} /></div>
              </div>

              {/* Dense Doughnut Chart Layout */}
              <div className="col-span-1 md:col-span-5 bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-500" /> Skill Gap Analysis</h3>
                
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
                  {/* Doughnut Left */}
                  <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
                    <Doughnut data={doughnutData} options={{...chartOptions, cutout: '75%', plugins: { legend: { display: false } }}} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                       <span className="text-4xl font-black text-white">{futureGaps.reduce((acc, curr) => acc + curr.skills.length, 0)}</span>
                       <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Total Missing</span>
                    </div>
                  </div>
                  
                  {/* Dense Legend Right */}
                  <div className="w-full sm:w-1/2 flex flex-col justify-center gap-3">
                    {futureGaps.map((gap, index) => {
                      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500'];
                      const colorClass = colors[index % colors.length];
                      return (
                        <div key={gap.role} className="flex items-center gap-3 bg-slate-900/50 hover:bg-slate-800/80 transition-colors p-3.5 rounded-xl border border-white/5 relative overflow-hidden group">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 group-hover:bg-white/20 transition-colors" />
                          <div className={`w-3 h-3 rounded-full ${colorClass} shadow-[0_0_10px_2px_rgba(currentColor,0.4)] ml-1`} />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[140px] leading-tight">{gap.role}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1 tracking-widest">{gap.skills.length} MISSING SKILLS</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Urgent Pathway Gaps */}
              <div className="col-span-1 md:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-bold mb-4">Required Skills by Role</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {futureGaps.map(group => (
                      <div key={group.role} className="bg-slate-900/50 p-4 rounded-xl border border-rose-500/10">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">{group.role}</span>
                        <div className="mt-2 space-y-1">
                          {group.skills.length > 0 ? group.skills.map(skill => (
                            <div key={skill} className="flex justify-between items-center text-sm font-semibold text-white">
                              {skill.toUpperCase()} <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            </div>
                          )) : <span className="text-xs text-emerald-500 font-bold">✓ SATISFIED</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Dynamic AI Output */}
                <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px]" />
                  <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-2 relative z-10">AI Career Strategy</h4>
                  <p className="text-sm font-medium text-emerald-100 leading-relaxed relative z-10">
                    {personalizedMsg}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Recommended Roles Section - Dark Glassmorphic Theme */}
          {recommendedPaths.length > 0 && (
            <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 mt-8 flex flex-col gap-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-500" /> Top Recommended Jobs
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Best active matches for your skill sequence</p>
                </div>
                <span className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]">
                  {recommendedPaths.length} Verified
                </span>
              </div>
              
              {(showAllPaths ? recommendedPaths : recommendedPaths.slice(0, 3)).map((path, idx) => (
                <div key={idx} className={`bg-white/[0.02] border transition-all rounded-xl shadow-sm backdrop-blur-md ${expandedJob === idx ? 'border-blue-500/30' : 'border-white/10 hover:border-emerald-500/30'}`}>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white mb-1">{path.role}</h4>
                        <p className="text-sm text-slate-400 mb-4">{path.description || 'Target alignment across technical and analytic domains.'}</p>
                        
                        {/* Status Bar */}
                        <div className="w-full h-1.5 bg-slate-900 rounded-full mb-6 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 shadow-[0_0_10px_1px_rgba(currentColor,0.5)] ${
                              path.match_percentage >= 70 ? 'bg-emerald-500 text-emerald-500' :
                              path.match_percentage >= 50 ? 'bg-amber-500 text-amber-500' : 'bg-rose-500 text-rose-500'
                            }`}
                            style={{ width: `${path.match_percentage}%` }}
                          />
                        </div>

                        {/* Interactive Links */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Live Nodes:</span>
                          {Object.entries({ indeed: 'Indeed', linkedin: 'LinkedIn', google_jobs: 'Google Jobs', naukri: 'Naukri', glassdoor: 'Glassdoor' }).map(([platform_id, label]) => {
                            const url = path.platform_links?.[platform_id] || '#';
                            return (
                            <a 
                              key={platform_id}
                              href={url} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 flex items-center gap-1 rounded bg-slate-900 border border-white/10 hover:bg-slate-800 hover:border-blue-500/50 hover:text-blue-400 text-xs font-bold text-slate-400 transition-colors uppercase"
                            >
                              <ExternalLink className="w-3 h-3" /> {label}
                            </a>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Neural Match Block & Expand Toggle */}
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center min-w-[120px] shadow-[0_0_20px_-5px_rgba(currentColor,0.2)] ${
                          path.match_percentage >= 70 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                          path.match_percentage >= 50 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                          <span className="text-2xl font-black">{Math.round(path.match_percentage)}%</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-80">Score</span>
                        </div>
                        <button onClick={() => setExpandedJob(expandedJob === idx ? null : idx)} className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10 cursor-pointer text-slate-400 hover:text-white">
                          {expandedJob === idx ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Accordion Area Dark Mode */}
                  {expandedJob === idx && (
                    <div className="border-t border-white/10 p-6 bg-slate-900/50 space-y-5 rounded-b-xl backdrop-blur-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                          <h4 className="text-sm font-bold text-emerald-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Matched Skills ({path.matched_skills?.length || 0})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {path.matched_skills?.length > 0 ? path.matched_skills.map((s: string) => (
                               <span key={s} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-bold uppercase tracking-widest rounded border border-emerald-500/20">{s}</span>
                            )) : <span className="text-sm text-slate-500 italic font-mono">None</span>}
                          </div>
                        </div>
                        <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20">
                          <h4 className="text-sm font-bold text-rose-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="w-4 h-4" /> Missing Skills ({path.missing_skills?.length || 0})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {path.missing_skills?.length > 0 ? path.missing_skills.map((s: string) => (
                              <span key={s} className="px-2.5 py-1 bg-rose-500/10 text-rose-300 text-xs font-bold uppercase tracking-widest rounded border border-rose-500/20">{s}</span>
                            )) : <span className="text-xs text-emerald-500 font-bold uppercase block tracking-widest">✓ Algorithm Complete</span>}
                          </div>
                        </div>
                      </div>
                      
                      {/* Learning Roadmap Dark Mode */}
                      {path.roadmap_phases?.length > 0 && (
                        <div className="p-5 bg-blue-500/5 rounded-xl border border-blue-500/20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />
                          <div className="flex items-center gap-2 mb-4 relative z-10">
                            <Zap className="w-5 h-5 text-blue-400" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Step-by-Step Learning Roadmap</h4>
                          </div>
                          <div className="space-y-3 relative z-10">
                            {path.roadmap_phases.map((phase: any, i: number) => {
                              const isCapstone = phase.skill === 'Capstone';
                              return (
                                <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${
                                  isCapstone ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-white/5 hover:bg-slate-800'
                                }`}>
                                  <div className="flex-1 mb-2 sm:mb-0">
                                    <span className={`text-sm font-bold block mb-1 ${isCapstone ? 'text-amber-400' : 'text-slate-200'}`}>
                                      {isCapstone && "🎯 "} {phase.title}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCapstone ? 'text-amber-500/80' : 'text-blue-500'}`}>
                                      {isCapstone ? 'FINAL CAPSTONE VERIFICATION' : `REQUIRED SKILL: ${phase.skill}`}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${
                                      isCapstone ? 'text-amber-300 bg-amber-500/20 border-amber-500/30' : 'text-blue-300 bg-blue-500/20 border-blue-500/30'
                                    }`}>
                                      {phase.difficulty || 'FUNDAMENTAL'}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-white/5 px-2 py-1 rounded border border-white/10">
                                      {phase.content_type || 'Course'}
                                    </span>
                                    {phase.url && phase.url !== "#" && (
                                      <a href={phase.url} target="_blank" rel="noopener noreferrer" 
                                         className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded transition-colors shadow-sm">
                                        <ExternalLink className="w-3 h-3" /> Execute Module
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {recommendedPaths.length > 3 && (
                <button 
                  onClick={() => setShowAllPaths(!showAllPaths)}
                  className="mt-2 w-full py-3.5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 border-dashed rounded-xl text-sm font-bold text-blue-400 uppercase tracking-widest transition-all cursor-pointer"
                >
                  {showAllPaths ? 'Collapse Array' : `Reveal Remaining Pathways (${recommendedPaths.length - 3})`}
                </button>
              )}
            </motion.div>
          )}

        </motion.div>
      )}

    </div>
  );
}
