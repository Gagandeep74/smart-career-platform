'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, RadialLinearScale, Filler, Title, Tooltip, Legend 
} from 'chart.js';
import { Bar, Line, Radar, Doughnut } from 'react-chartjs-2';
import { 
  ArrowLeft, Target, Briefcase, Zap, Cpu, CheckCircle, Activity, Blocks, 
  ChevronUp, ChevronDown, ExternalLink, RefreshCw, User, LogOut, Home, 
  Search, Sparkles, Compass, AlertCircle, Flame, Building2, MapPin, 
  DollarSign, CheckCircle2, XCircle, X, Loader2, BookOpen, Layers, TrendingUp, FilePenLine
} from 'lucide-react';
import { CareerAPI } from '@/lib/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, RadialLinearScale, Filler, Title, Tooltip, Legend
);

interface UserProfile {
  id: number;
  name: string;
  email: string;
  current_role?: string | null;
  target_role?: string | null;
}

interface LiveJob {
  title: string;
  company: string;
  location: string;
  apply_url?: string;
  salary?: string;
  company_logo?: string;
  job_type?: string;
  description?: string;
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  required_skills: string[];
  platform_links?: Record<string, string>;
  roadmap_phases?: {
    skill: string;
    title: string;
    difficulty: string;
    url: string;
    content_type: string;
  }[];
}

interface PivotResultData {
  target_role: string;
  user_skills: string[];
  scraped_jobs_count: number;
  recommended_jobs: LiveJob[];
  suggestions?: string[];
}

export default function V2DashboardPage() {
  const [extractedSkills, setExtractedSkills] = useState(['Python', 'Machine Learning', 'SQL', 'FastAPI']);
  const [predictedRole, setPredictedRole] = useState('Data Scientist');
  const [clusterInfo, setClusterInfo] = useState({ number: 4, similarRoles: ['ML Engineer', 'AI Researcher'] });
  const [recommendedPaths, setRecommendedPaths] = useState<any[]>([]);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [showAllPaths, setShowAllPaths] = useState(false);
  
  const [skillScores, setSkillScores] = useState<Record<string, number>>({});
  const [futureGaps, setFutureGaps] = useState<{role: string, skills: string[]}[]>([
    { role: 'AI & Data Engineering', skills: ['PyTorch', 'TensorFlow'] },
    { role: 'Cloud & Infrastructure', skills: ['Docker', 'AWS'] }
  ]);
  const [personalizedMsg, setPersonalizedMsg] = useState('We are analyzing your tech profile to determine the best bridging strategy for your career.');

  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // --- Career Pivot Search State ---
  const [pivotSearchQuery, setPivotSearchQuery] = useState('');
  const [isPivotSearching, setIsPivotSearching] = useState(false);
  const [pivotResults, setPivotResults] = useState<PivotResultData | null>(null);
  const [pivotError, setPivotError] = useState<string | null>(null);
  const [expandedPivotJob, setExpandedPivotJob] = useState<number | null>(0);
  const [searchedRoleName, setSearchedRoleName] = useState<string>('');

  const handleCareerPivotSearch = async (roleToSearch?: string) => {
    const query = (roleToSearch ?? pivotSearchQuery).trim();
    if (!query) {
      setPivotError('Please enter a valid career title or job role to search.');
      return;
    }
    
    setPivotError(null);
    setSearchedRoleName(query);
    setIsPivotSearching(true);
    setPivotSearchQuery(query);

    // Check Session Cache
    const cacheKey = `pivot_cache_${query.toLowerCase()}`;
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPivotResults(parsed);
          setIsPivotSearching(false);
          return;
        } catch (e) {}
      }
    }

    try {
      const res = await CareerAPI.pivotCareer(query, extractedSkills);
      setPivotResults(res);
      setPivotError(null);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
      }
    } catch (err: any) {
      console.error('Pivot search failed:', err);
      setPivotError(err?.message || 'Failed to search live career opportunities. Please try again.');
      setPivotResults(null);
    } finally {
      setIsPivotSearching(false);
    }
  };

  const clearPivotSearch = () => {
    setPivotSearchQuery('');
    setPivotResults(null);
    setPivotError(null);
    setSearchedRoleName('');
  };

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

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    window.location.href = '/login';
  };

  useEffect(() => {
    let initialSkills = extractedSkills;
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Fetch Real Authenticated User Profile from GET /api/v1/auth/me
      CareerAPI.getProfile()
        .then((profile) => {
          if (profile && profile.name) {
            setUserProfile(profile);
          }
        })
        .catch((err) => {
          console.error('Session expired or unauthorized:', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_name');
          window.location.href = '/login';
        })
        .finally(() => {
          setIsProfileLoading(false);
        });

      const saved = localStorage.getItem('recent_skills');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length > 0) initialSkills = parsed;
        } catch(e) {}
      }

      const savedScores = localStorage.getItem('skill_scores');
      if (savedScores) {
        try {
          const parsedScores = JSON.parse(savedScores);
          if (parsedScores && typeof parsedScores === 'object' && Object.keys(parsedScores).length > 0) {
            setSkillScores(parsedScores);
          }
        } catch (e) {}
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

  // 2. Bar Chart (Dynamic Skill Proficiency & Mastery)
  const sortedSkillEntries = Object.entries(skillScores).sort(([, a], [, b]) => b - a);
  const topSkillEntries = sortedSkillEntries.slice(0, 4);
  const barLabels = topSkillEntries.map(([skill]) => skill.charAt(0).toUpperCase() + skill.slice(1));
  const barValues = topSkillEntries.map(([, score]) => score);
  const hasSkillScores = topSkillEntries.length > 0;

  const barData = {
    labels: barLabels,
    datasets: [{
      label: 'Your Mastery Focus (%)',
      data: barValues,
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderRadius: 6
    }]
  };
  const barOptions = { 
    ...chartOptions, 
    scales: { 
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, 
      y: { 
        grid: { color: 'rgba(255,255,255,0.05)' }, 
        ticks: { color: '#94a3b8' },
        min: 0,
        max: 100
      } 
    } 
  };

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
  const lineOptions = { ...chartOptions, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } } } };

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

          <Link href="/job-recommendations" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all font-bold text-xs text-blue-400 uppercase tracking-widest whitespace-nowrap shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> <span className="hidden md:inline">AI Job Recs</span>
          </Link>
          <Link href="/upload" className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all font-bold text-xs text-indigo-400 uppercase tracking-widest whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Scan</span>
          </Link>
          <Link href="/resume-builder" className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all font-bold text-xs text-emerald-400 uppercase tracking-widest whitespace-nowrap">
            <FilePenLine className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Resume Maker</span>
          </Link>
          
          <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900/50 rounded-full border border-white/10 shadow-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
               <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs sm:text-sm font-bold text-white max-w-[130px] truncate">
                {userProfile?.name || (isProfileLoading ? 'Loading...' : 'User')}
              </span>
              <span className="text-[10px] text-slate-400 font-mono max-w-[130px] truncate">
                {userProfile?.email}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20 mx-1 lg:mx-2 hidden sm:block" />
            <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 transition-colors hidden sm:block cursor-pointer" title="Logout">
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
          
          {/* Authenticated User Profile Summary Card */}
          {userProfile && (
            <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase tracking-widest font-mono text-[10px]">Name:</span>
                  <span className="font-bold text-white text-sm">{userProfile.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase tracking-widest font-mono text-[10px]">Email:</span>
                  <span className="font-medium text-slate-300">{userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase tracking-widest font-mono text-[10px]">Current Role:</span>
                  <span className="font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                    {userProfile.current_role && userProfile.current_role.trim() ? userProfile.current_role : 'Not Set'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase tracking-widest font-mono text-[10px]">Target Role:</span>
                  <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                    {userProfile.target_role && userProfile.target_role.trim() ? userProfile.target_role : 'Not Set'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

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
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" /> Career Role Alignment
            </h3>
            <div className="h-64"><Radar data={radarData} options={radarOptions} /></div>
          </motion.div>

          {/* Graph Section 2: Dynamic Skill Mastery Bar Chart */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-6 bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Skill Proficiency Breakdown
            </h3>
            <div className="h-64">
              {hasSkillScores ? (
                <Bar data={barData} options={barOptions} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-6 text-center">
                  <Activity className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">No Skill Scores Available</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">Upload your resume to generate dynamic skill proficiency scores.</p>
                  <Link href="/upload" className="mt-3 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest transition-colors">
                    Upload Resume
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Career Matches (Career Path Analyzer - Curated 8 Paths) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 w-full">
              <div>
                <h2 className="text-indigo-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4" /> Top Career Matches
                </h2>
                <p className="text-sm text-slate-400">
                  Curated core career pathways your skill sequence aligns with based on our baseline path analyzer.
                </p>
              </div>
              <Link 
                href="/job-recommendations" 
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4" /> Open AI Job Recommendations →
              </Link>
              <Link
                href="/resume-builder"
                className="px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
              >
                <FilePenLine className="w-4 h-4" /> Create Resume
              </Link>
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

          {/* ========================================================================= */}
          {/* SECTION: CAREER PIVOT SEARCH */}
          {/* ========================================================================= */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-12 mt-4 bg-slate-900/50 border border-blue-500/20 sm:rounded-[2.5rem] p-6 lg:p-10 flex flex-col gap-8 relative overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-70" />
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Compass className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    Career Pivot Search
                  </h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">
                    Explore live job opportunities, real-time competency gap analysis, and tailored roadmaps for <span className="text-blue-400 font-bold">ANY</span> target role.
                  </p>
                </div>
              </div>

              {pivotResults && (
                <button
                  onClick={clearPivotSearch}
                  className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Reset Search
                </button>
              )}
            </div>

            {/* Search Input Bar & Quick Suggestions */}
            <div className="flex flex-col gap-4 relative z-10">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleCareerPivotSearch(); }}
                className="flex flex-col sm:flex-row gap-3 w-full"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={pivotSearchQuery}
                    onChange={(e) => { setPivotSearchQuery(e.target.value); if (pivotError) setPivotError(null); }}
                    placeholder="Enter any target role (e.g., AI Engineer, Prompt Engineer, Rust Developer, Product Manager, Quantum Software Engineer)..."
                    className="w-full pl-12 pr-10 py-4 bg-slate-950/80 border border-blue-500/20 focus:border-blue-500 rounded-2xl text-white placeholder-slate-500 text-sm md:text-base outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  />
                  {pivotSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setPivotSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      title="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isPivotSearching}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(59,130,246,0.4)] cursor-pointer whitespace-nowrap"
                >
                  {isPivotSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Pivot Search</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Role Suggestions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mr-1">Trending Roles:</span>
                {[
                  'AI Engineer', 
                  'Data Engineer', 
                  'Prompt Engineer', 
                  'Backend Developer', 
                  'Product Manager', 
                  'Cybersecurity Analyst', 
                  'Full Stack Developer', 
                  'Quantum Software Engineer'
                ].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleCareerPivotSearch(role)}
                    disabled={isPivotSearching}
                    className="px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 text-xs font-semibold hover:border-blue-500/40 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* ERROR STATE */}
            {pivotError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 relative z-10">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{pivotError}</p>
                  <button 
                    onClick={() => handleCareerPivotSearch()} 
                    className="mt-2 text-xs font-bold text-rose-400 hover:text-rose-300 underline uppercase tracking-wider cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* LOADING STATE */}
            {isPivotSearching && (
              <div className="p-12 rounded-3xl bg-slate-950/60 border border-blue-500/20 flex flex-col items-center justify-center text-center relative z-10">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <Compass className="w-7 h-7 text-blue-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-white tracking-tight mb-2">
                  Scanning Live Career Nodes for &quot;{searchedRoleName}&quot;
                </h3>
                <p className="text-xs text-slate-400 font-mono max-w-md uppercase tracking-widest leading-relaxed">
                  Querying live job index • Extracting NLP competencies • Computing skill overlap • Synthesizing roadmap phases...
                </p>
              </div>
            )}

            {/* EMPTY / NO JOBS FOUND STATE */}
            {!isPivotSearching && pivotResults && pivotResults.recommended_jobs.length === 0 && (
              <div className="p-10 rounded-3xl bg-slate-950/50 border border-dashed border-white/10 flex flex-col items-center justify-center text-center relative z-10">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No matching jobs found for &quot;{searchedRoleName}&quot;</h3>
                <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                  We could not find active job listings directly matching this title right now. Try searching one of the related career suggestions below:
                </p>
                {pivotResults.suggestions && pivotResults.suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {pivotResults.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleCareerPivotSearch(suggestion)}
                        className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Pivot to {suggestion} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RESULTS CONTAINER */}
            {!isPivotSearching && pivotResults && pivotResults.recommended_jobs.length > 0 && (() => {
              const jobs = pivotResults.recommended_jobs;
              const avgMatch = Math.round(jobs.reduce((acc, curr) => acc + (curr.match_percentage || 0), 0) / (jobs.length || 1));
              
              // Aggregate all unique missing skills and count frequency
              const missingSkillCounts: Record<string, number> = {};
              const matchedSkillSet = new Set<string>();
              jobs.forEach(job => {
                (job.missing_skills || []).forEach(s => {
                  const k = s.toLowerCase();
                  missingSkillCounts[k] = (missingSkillCounts[k] || 0) + 1;
                });
                (job.matched_skills || []).forEach(s => matchedSkillSet.add(s.toLowerCase()));
              });
              
              const sortedMissing = Object.entries(missingSkillCounts).sort(([, a], [, b]) => b - a);
              const topJob = jobs[0];

              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 w-full">
                  
                  {/* CARD 1: Career Overview */}
                  <div className="col-span-1 md:col-span-6 bg-white/[0.02] border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                          Target Trajectory
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                          {jobs.length} Postings Scraped
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-3">
                        {pivotResults.target_role}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Transitioning into <span className="text-white font-bold">{pivotResults.target_role}</span> leverages{' '}
                        <span className="text-emerald-400 font-bold">{matchedSkillSet.size} of your current skills</span> with an estimated{' '}
                        <span className="text-blue-400 font-bold">{avgMatch}% market alignment</span> across active job nodes.
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Overall Match Score</span>
                        <span className={`font-black text-lg ${
                          avgMatch >= 70 ? 'text-emerald-400' : avgMatch >= 45 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {avgMatch}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            avgMatch >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 
                            avgMatch >= 45 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 
                            'bg-gradient-to-r from-rose-500 to-pink-500'
                          }`}
                          style={{ width: `${avgMatch}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        {avgMatch >= 70 ? '✓ High Direct Compatibility' : avgMatch >= 45 ? '⚡ Accelerated Upskilling Feasible' : '📚 Substantial Skill Bridge Required'}
                      </span>
                    </div>
                  </div>

                  {/* CARD 2: Missing Skills & Priority Chips */}
                  <div className="col-span-1 md:col-span-6 bg-white/[0.02] border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Target className="w-4 h-4" /> Competency Gap Matrix
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                          {sortedMissing.length} Total Gaps
                        </span>
                      </div>
                      
                      <div className="space-y-3 mt-2">
                        {/* High Priority Skills */}
                        <div>
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                            <Flame className="w-3 h-3 text-rose-500" /> High-Priority Missing Skills:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {sortedMissing.slice(0, 5).map(([skill, count]) => (
                              <span 
                                key={skill} 
                                className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm"
                              >
                                {skill}
                                <span className="text-[9px] px-1 py-0.2 bg-rose-500/20 rounded font-mono text-rose-400">
                                  {count}x
                                </span>
                              </span>
                            ))}
                            {sortedMissing.length === 0 && (
                              <span className="text-xs text-emerald-400 font-bold">✓ No Missing Skills Detected!</span>
                            )}
                          </div>
                        </div>

                        {/* Secondary Skills */}
                        {sortedMissing.length > 5 && (
                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                              Secondary Missing Skills:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {sortedMissing.slice(5, 12).map(([skill]) => (
                                <span 
                                  key={skill} 
                                  className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold uppercase tracking-wider rounded-md"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Matched Skills Bar */}
                    <div className="mt-5 pt-4 border-t border-white/5">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Currently Possessed Overlapping Skills:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(matchedSkillSet).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-widest rounded">
                            ✓ {s}
                          </span>
                        ))}
                        {matchedSkillSet.size === 0 && (
                          <span className="text-xs text-slate-500 italic font-mono">None from uploaded profile</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: Personalized Learning Roadmap */}
                  {topJob && topJob.roadmap_phases && topJob.roadmap_phases.length > 0 && (
                    <div className="col-span-1 md:col-span-12 bg-white/[0.02] border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md relative overflow-hidden">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">
                              Personalized Transition Roadmap for {pivotResults.target_role}
                            </h4>
                            <p className="text-xs text-slate-400">
                              Curated step-by-step curriculum to systematically eliminate your competency gaps.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                          {topJob.roadmap_phases.length} Learning Steps
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topJob.roadmap_phases.map((phase, i) => {
                          const isCapstone = phase.skill === 'Capstone';
                          return (
                            <div 
                              key={i} 
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                isCapstone 
                                  ? 'bg-amber-500/10 border-amber-500/30' 
                                  : 'bg-slate-900/60 border-white/5 hover:border-blue-500/30'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    isCapstone ? 'text-amber-400' : 'text-blue-400'
                                  }`}>
                                    {isCapstone ? '🎯 FINAL CAPSTONE VERIFICATION' : `PHASE ${i + 1}: ${phase.skill.toUpperCase()}`}
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                    isCapstone 
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                                      : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                  }`}>
                                    {phase.difficulty}
                                  </span>
                                </div>
                                <h5 className={`text-sm font-bold leading-snug ${isCapstone ? 'text-amber-200' : 'text-white'}`}>
                                  {phase.title}
                                </h5>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                                  Type: {phase.content_type || 'Module'}
                                </span>
                                {phase.url && (
                                  <a 
                                    href={phase.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                                  >
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

                  {/* CARD 4: Live Job Opportunities */}
                  <div className="col-span-1 md:col-span-12 flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <h4 className="text-xl font-bold text-white flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-indigo-400" /> Live Job Opportunities
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Active employment postings analyzed with per-job competency mapping.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                        {jobs.length} Verified Nodes
                      </span>
                    </div>

                    <div className="space-y-4">
                      {jobs.map((job, idx) => (
                        <div 
                          key={idx}
                          className={`bg-white/[0.02] border transition-all rounded-2xl backdrop-blur-md overflow-hidden ${
                            expandedPivotJob === idx ? 'border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> {job.company || 'Tech Enterprise'}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-white/5 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-500" /> {job.location || 'Remote'}
                                  </span>
                                  {job.job_type && (
                                    <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-white/5 px-2.5 py-0.5 rounded-full">
                                      {job.job_type}
                                    </span>
                                  )}
                                  {job.salary && (
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" /> {job.salary}
                                    </span>
                                  )}
                                </div>

                                <h5 className="text-xl font-bold text-white mb-2">{job.title}</h5>

                                {job.description && (
                                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                                    {job.description.replace(/<[^>]*>?/gm, '')}
                                  </p>
                                )}

                                {/* Platform External Links */}
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                  {job.apply_url && job.apply_url !== '#' && (
                                    <a
                                      href={job.apply_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                      Direct Apply <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {job.platform_links && Object.entries(job.platform_links).map(([platform, url]) => (
                                    <a
                                      key={platform}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-blue-500/30 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" /> {platform.replace('_', ' ')}
                                    </a>
                                  ))}
                                </div>
                              </div>

                              {/* Match Score Badge & Details Toggle */}
                              <div className="flex items-center gap-4 self-end md:self-center">
                                <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center min-w-[100px] ${
                                  job.match_percentage >= 70 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                  job.match_percentage >= 45 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                  'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                }`}>
                                  <span className="text-2xl font-black">{Math.round(job.match_percentage)}%</span>
                                  <span className="text-[9px] uppercase font-bold tracking-widest mt-0.5 opacity-80">Match</span>
                                </div>
                                <button
                                  onClick={() => setExpandedPivotJob(expandedPivotJob === idx ? null : idx)}
                                  className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-transparent hover:border-white/10 cursor-pointer text-slate-400 hover:text-white"
                                  title="Toggle Details"
                                >
                                  {expandedPivotJob === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Job Deep Dive */}
                          {expandedPivotJob === idx && (
                            <div className="border-t border-white/10 p-6 bg-slate-950/40 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                                  <h6 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5" /> Matched Skills ({job.matched_skills?.length || 0})
                                  </h6>
                                  <div className="flex flex-wrap gap-1.5">
                                    {job.matched_skills?.length > 0 ? job.matched_skills.map(s => (
                                      <span key={s} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">{s}</span>
                                    )) : <span className="text-xs text-slate-500 italic">None</span>}
                                  </div>
                                </div>

                                <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20">
                                  <h6 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5" /> Missing Skills for This Posting ({job.missing_skills?.length || 0})
                                  </h6>
                                  <div className="flex flex-wrap gap-1.5">
                                    {job.missing_skills?.length > 0 ? job.missing_skills.map(s => (
                                      <span key={s} className="px-2 py-0.5 bg-rose-500/10 text-rose-300 text-[10px] font-bold uppercase tracking-wider rounded border border-rose-500/20">{s}</span>
                                    )) : <span className="text-xs text-emerald-400 font-bold">✓ 100% Skill Overlap</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARD 5: Career Insights */}
                  <div className="col-span-1 md:col-span-12 bg-white/[0.02] border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">
                          Strategic Career Insights for {pivotResults.target_role}
                        </h4>
                        <p className="text-xs text-slate-400">
                          Synthesis of live industry demand patterns and optimization recommendations.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Postings Analyzed</span>
                        <span className="text-2xl font-black text-white">{jobs.length}</span>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Avg Alignment</span>
                        <span className="text-2xl font-black text-blue-400">{avgMatch}%</span>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Top Desired Skill</span>
                        <span className="text-xl font-bold text-rose-400 truncate block">
                          {sortedMissing[0]?.[0] ? sortedMissing[0][0].toUpperCase() : 'None'}
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Total Competencies</span>
                        <span className="text-2xl font-black text-purple-400">
                          {matchedSkillSet.size + sortedMissing.length}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl text-xs text-slate-300 leading-relaxed">
                      💡 <span className="font-bold text-white">Optimization Strategy:</span> To maximize your hiring probability for{' '}
                      <span className="text-blue-400 font-bold">{pivotResults.target_role}</span>, prioritize acquiring{' '}
                      <span className="text-rose-400 font-bold">
                        {sortedMissing.slice(0, 3).map(([s]) => s.toUpperCase()).join(', ')}
                      </span>. Completing the recommended transition curriculum will elevate your market match score above 85%.
                    </div>
                  </div>

                </div>
              );
            })()}

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
                <div className="h-64"><Line data={lineData} options={lineOptions} /></div>
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
