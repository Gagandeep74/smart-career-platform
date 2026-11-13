'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, Sparkles, Briefcase, Building2, MapPin, DollarSign, 
  ExternalLink, Filter, Search, CheckCircle2, Target, Flame, 
  BookOpen, ChevronDown, ChevronUp, RefreshCw, X, AlertCircle, 
  SlidersHorizontal, Check, Zap, Layers, HelpCircle, User, LogOut, Home, Compass
} from 'lucide-react';
import { CareerAPI } from '@/lib/api';

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  location: string;
  remote_status: 'Remote' | 'Hybrid' | 'Onsite';
  employment_type: string;
  salary: string;
  match_percentage: number;
  source: 'Database' | 'Remotive' | 'Adzuna' | string;
  apply_url: string;
  platform_links?: Record<string, string>;
  required_skills: string[];
  matched_skills: string[];
  missing_skills: string[];
  ai_reason: {
    explanation: string;
    confidence: 'High' | 'Medium' | 'Moderate' | string;
    matched_skills: string[];
    missing_skills: string[];
  };
  learning_suggestions: {
    skills_to_learn: string[];
    suggested_courses: Array<{
      skill: string;
      title: string;
      difficulty: string;
      url: string;
      content_type: string;
    }>;
    mini_project: string;
    capstone_project: string;
    estimated_difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  };
  description?: string;
}

interface RecommendationResponse {
  user_extracted_skills: string[];
  total_jobs_analyzed: number;
  highest_match: number;
  average_match: number;
  recommendation_confidence: string;
  recommendations: JobRecommendation[];
  closest_careers: string[];
  resume_improvement_suggestions: string[];
}

export default function JobRecommendationsPage() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  // --- Smart Filters State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');
  const [selectedRemoteStatus, setSelectedRemoteStatus] = useState<string>('All');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedExperience, setSelectedExperience] = useState<string>('All');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // --- Pagination / Lazy Load ---
  const [visibleCount, setVisibleCount] = useState<number>(8);

  const fetchRecommendations = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Check session cache unless forced
      const cacheKey = 'ai_job_recommendations_cache_v1';
      if (!forceRefresh) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setData(parsed);
            setIsLoading(false);
            return;
          } catch {
            sessionStorage.removeItem(cacheKey);
          }
        }
      }

      // 2. Read resume skills from localStorage
      let skills: string[] = [];
      const storedSkills = localStorage.getItem('extracted_skills');
      if (storedSkills) {
        try {
          const parsed = JSON.parse(storedSkills);
          if (Array.isArray(parsed)) skills = parsed;
        } catch {
          // fallback
        }
      }

      // If stored skills are empty, check skill_scores
      if (skills.length === 0) {
        const storedScores = localStorage.getItem('skill_scores');
        if (storedScores) {
          try {
            const parsedScores = JSON.parse(storedScores);
            if (typeof parsedScores === 'object' && parsedScores !== null) {
              skills = Object.keys(parsedScores);
            }
          } catch {
            // fallback
          }
        }
      }

      // 3. Fetch from API
      const res = await CareerAPI.getJobRecommendations(skills);
      setData(res);
      sessionStorage.setItem(cacheKey, JSON.stringify(res));
    } catch (err: unknown) {
      console.error('Job recommendations error:', err);
      const msg = err instanceof Error ? err.message : 'Unable to generate personalized recommendations.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    // Fetch user profile if token exists
    const token = localStorage.getItem('access_token');
    if (token) {
      CareerAPI.getProfile().then(p => {
        if (p) setUserProfile({ name: p.name, email: p.email });
      }).catch(() => {});
    }
  }, []);

  // --- Filter Logic ---
  const filteredJobs = useMemo(() => {
    if (!data || !data.recommendations) return [];
    
    return data.recommendations.filter(job => {
      // Match query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesSkills = job.required_skills.some(s => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesSkills) return false;
      }

      // Location query
      if (locationQuery.trim()) {
        const loc = locationQuery.toLowerCase();
        if (!job.location.toLowerCase().includes(loc)) return false;
      }

      // Company query
      if (companyQuery.trim()) {
        const comp = companyQuery.toLowerCase();
        if (!job.company.toLowerCase().includes(comp)) return false;
      }

      // Remote status
      if (selectedRemoteStatus !== 'All') {
        if (job.remote_status.toLowerCase() !== selectedRemoteStatus.toLowerCase()) return false;
      }

      // Employment type
      if (selectedEmploymentType !== 'All') {
        if (!job.employment_type.toLowerCase().includes(selectedEmploymentType.toLowerCase())) return false;
      }

      // Source
      if (selectedSource !== 'All') {
        if (job.source.toLowerCase() !== selectedSource.toLowerCase()) return false;
      }

      // Experience level filter (heuristic based on title)
      if (selectedExperience !== 'All') {
        const titleLower = job.title.toLowerCase();
        if (selectedExperience === 'Senior' && !titleLower.includes('senior') && !titleLower.includes('lead') && !titleLower.includes('principal') && !titleLower.includes('architect')) return false;
        if (selectedExperience === 'Entry' && (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal'))) return false;
        if (selectedExperience === 'Lead' && !titleLower.includes('lead') && !titleLower.includes('manager') && !titleLower.includes('head') && !titleLower.includes('principal')) return false;
      }

      // Minimum Match Score
      if (job.match_percentage < minMatchScore) return false;

      return true;
    });
  }, [
    data, 
    searchQuery, 
    locationQuery, 
    companyQuery, 
    selectedRemoteStatus, 
    selectedEmploymentType, 
    selectedSource, 
    selectedExperience, 
    minMatchScore
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setCompanyQuery('');
    setSelectedRemoteStatus('All');
    setSelectedEmploymentType('All');
    setSelectedSource('All');
    setSelectedExperience('All');
    setMinMatchScore(0);
  };

  const hasActiveFilters = searchQuery !== '' || 
    locationQuery !== '' || 
    companyQuery !== '' || 
    selectedRemoteStatus !== 'All' || 
    selectedEmploymentType !== 'All' || 
    selectedSource !== 'All' || 
    selectedExperience !== 'All' || 
    minMatchScore > 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 max-w-[1400px] mx-auto mb-8 bg-slate-900/60 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                AI Personalized Job Recommendations
              </h1>
              <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest block">
                TF-IDF Neural Similarity Engine • Multi-Source Pipeline
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => fetchRecommendations(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            title="Re-run TF-IDF Ranking"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Match</span>
          </button>

          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-300 uppercase tracking-wider transition-colors"
          >
            <UploadIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan New Resume</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto relative z-10 space-y-8">
        
        {/* ========================================================================= */}
        {/* SECTION 1: RESUME SUMMARY */}
        {/* ========================================================================= */}
        {data && (
          <motion.section 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 lg:p-8 backdrop-blur-md relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-60" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left: Skills & Source Status */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                    Active Resume Vector
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    {data.user_extracted_skills.length} Extracted Competencies
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {data.user_extracted_skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider"
                    >
                      {skill}
                    </span>
                  ))}
                  {data.user_extracted_skills.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No skills extracted. Scan a resume to personalize.</span>
                  )}
                </div>
              </div>

              {/* Right: Metrics 4-Stat Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 shrink-0">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-center min-w-[120px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Jobs Analyzed</span>
                  <span className="text-2xl font-black text-white">{data.total_jobs_analyzed}</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-center min-w-[120px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Highest Match</span>
                  <span className="text-2xl font-black text-emerald-400">{data.highest_match}%</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-center min-w-[120px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Average Match</span>
                  <span className="text-2xl font-black text-blue-400">{data.average_match}%</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col justify-center min-w-[120px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Confidence</span>
                  <span className={`text-xl font-black uppercase tracking-wider ${
                    data.recommendation_confidence === 'High' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {data.recommendation_confidence}
                  </span>
                </div>
              </div>

            </div>
          </motion.section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: SMART FILTERS & SEARCH */}
        {/* ========================================================================= */}
        <section className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Smart Search & Criteria Filters</h2>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredJobs.length} matches
              </span>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Reset Filters
                </button>
              )}
              <button
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className="sm:hidden px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" /> {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Primary Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, skill (e.g. Python, FastAPI)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 focus:border-blue-500 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Location (e.g. Remote, USA, London)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 focus:border-blue-500 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                placeholder="Company name..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 focus:border-blue-500 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Secondary Filter Pills (collapsible on mobile) */}
          <div className={`space-y-4 pt-2 border-t border-white/5 ${showFiltersMobile ? 'block' : 'hidden sm:block'}`}>
            <div className="flex flex-wrap items-center gap-6">
              
              {/* Remote Status */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Workplace:</span>
                <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                  {['All', 'Remote', 'Hybrid', 'Onsite'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setSelectedRemoteStatus(status)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedRemoteStatus === status 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Source:</span>
                <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                  {['All', 'Database', 'Remotive', 'Adzuna'].map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSelectedSource(src)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedSource === src 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Level:</span>
                <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                  {['All', 'Entry', 'Mid', 'Senior', 'Lead'].map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setSelectedExperience(exp)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedExperience === exp 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Match Score Slider */}
            <div className="flex items-center gap-4 max-w-md pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Min Match Score: <span className="text-white font-mono">{minMatchScore}%</span>
              </span>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: PERSONALIZED RECOMMENDATIONS LIST */}
        {/* ========================================================================= */}
        {isLoading && (
          <div className="p-16 rounded-3xl bg-slate-900/30 border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Vectorizing Resume & Ranking Opportunities</h3>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
              Executing TF-IDF similarity across Database and Live job nodes...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">Recommendation Retrieval Failed</h4>
              <p className="text-xs text-rose-200 leading-relaxed mb-3">{error}</p>
              <button
                onClick={() => fetchRecommendations(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !error && filteredJobs.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="p-10 sm:p-14 rounded-3xl bg-slate-900/40 border border-dashed border-white/10 text-center space-y-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mx-auto text-amber-400">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-bold text-white">No suitable jobs found.</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No active postings matched your exact filter combination. Try adjusting your filters or explore adjacent career paths below.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Closest Careers Fallback */}
            {data && data.closest_careers && data.closest_careers.length > 0 && (
              <div className="pt-6 border-t border-white/5 max-w-xl mx-auto space-y-3">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest block">
                  Recommended Adjacent Career Paths:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {data.closest_careers.map((career) => (
                    <Link
                      key={career}
                      href={`/dashboard`}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      {career} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Improvement Suggestions */}
            {data && data.resume_improvement_suggestions && (
              <div className="pt-6 border-t border-white/5 max-w-lg mx-auto text-left bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Resume Improvement Suggestions:
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {data.resume_improvement_suggestions.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* POPULATED JOBS LIST */}
        {!isLoading && !error && filteredJobs.length > 0 && (
          <div className="space-y-4">
            {filteredJobs.slice(0, visibleCount).map((job) => {
              const isExpanded = expandedJobId === job.id;
              
              // Source color badge
              const sourceBadge = job.source === 'Database' 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : job.source === 'Remotive'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300';

              return (
                <motion.article 
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-slate-900/50 border transition-all rounded-3xl backdrop-blur-md overflow-hidden ${
                    isExpanded 
                      ? 'border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                      : 'border-white/10 hover:border-white/20 shadow-lg'
                  }`}
                >
                  <div className="p-6 lg:p-7">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      
                      {/* Left: Main Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${sourceBadge}`}>
                            {job.source}
                          </span>

                          <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-0.5 rounded-full border border-white/5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" /> {job.company}
                          </span>

                          <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-white/5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" /> {job.location}
                          </span>

                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                            {job.remote_status}
                          </span>

                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {job.salary}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {job.title}
                          </h3>
                        </div>

                        {/* Skills Overview Chips */}
                        <div className="space-y-2 pt-1">
                          {/* Matched Skills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Matched ({job.matched_skills.length}):
                            </span>
                            {job.matched_skills.slice(0, 6).map((skill) => (
                              <span 
                                key={skill} 
                                className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                            {job.matched_skills.length === 0 && (
                              <span className="text-xs text-slate-500 italic font-mono">None from active resume</span>
                            )}
                          </div>

                          {/* Missing Skills */}
                          {job.missing_skills.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                                <Target className="w-3 h-3" /> Skills to Acquire ({job.missing_skills.length}):
                              </span>
                              {job.missing_skills.slice(0, 5).map((skill) => (
                                <span 
                                  key={skill} 
                                  className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold uppercase tracking-wider"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {job.apply_url && job.apply_url !== '#' && (
                            <a
                              href={job.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
                            >
                              Apply Directly <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {job.platform_links && Object.entries(job.platform_links).slice(0, 3).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> {platform.replace('_', ' ')}
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Right: Match Score & Accordion Toggle */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                        <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center min-w-[110px] ${
                          job.match_percentage >= 70 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                            : job.match_percentage >= 45 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                          <span className="text-3xl font-black">{Math.round(job.match_percentage)}%</span>
                          <span className="text-[9px] uppercase font-bold tracking-widest mt-0.5 opacity-80">TF-IDF Match</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <span>{isExpanded ? 'Hide AI Deep Dive' : 'AI Reason & Roadmap'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* EXPANDED DRAWER: AI RECOMMENDATION REASON & LEARNING PATH */}
                  {/* ========================================================================= */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-white/10 bg-slate-950/60 p-6 lg:p-8 space-y-6"
                      >
                        {/* 4. AI Recommendation Reason */}
                        <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                              <Sparkles className="w-4 h-4" /> AI Recommendation Reasoning
                            </h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                              Confidence: {job.ai_reason.confidence}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-200 leading-relaxed font-medium">
                            {job.ai_reason.explanation}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                              <span className="font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                                ✓ Verified Resume Competencies:
                              </span>
                              <span className="text-slate-300">
                                {job.matched_skills.length > 0 ? job.matched_skills.map(s => s.toUpperCase()).join(', ') : 'Fundamental tech baseline'}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                              <span className="font-bold text-rose-400 uppercase tracking-wider block mb-1">
                                • High-Impact Missing Competencies:
                              </span>
                              <span className="text-slate-300">
                                {job.missing_skills.length > 0 ? job.missing_skills.map(s => s.toUpperCase()).join(', ') : 'Zero gaps detected'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 5. Learning Suggestions & Projects */}
                        {job.learning_suggestions && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-400" /> Tailored Learning Roadmap & Portfolio Projects
                              </h4>
                              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                                Difficulty: {job.learning_suggestions.estimated_difficulty}
                              </span>
                            </div>

                            {/* Courses List */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {job.learning_suggestions.suggested_courses.map((course, cIdx) => (
                                <div 
                                  key={cIdx}
                                  className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between gap-3"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                        {course.content_type || 'Module'}
                                      </span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                        {course.difficulty}
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-bold text-white leading-snug">
                                      {course.title}
                                    </h5>
                                  </div>

                                  {course.url && (
                                    <a
                                      href={course.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider pt-2 border-t border-white/5"
                                    >
                                      Launch Tutorial <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Projects Showcase */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">
                                  ⚡ Recommended Mini-Project:
                                </span>
                                <p className="text-xs font-semibold text-white">
                                  {job.learning_suggestions.mini_project}
                                </p>
                              </div>

                              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                                  🎯 Comprehensive Capstone Project:
                                </span>
                                <p className="text-xs font-semibold text-white">
                                  {job.learning_suggestions.capstone_project}
                                </p>
                              </div>
                            </div>

                          </div>
                        )}

                        {/* Job Full Description Preview */}
                        {job.description && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">
                              Posting Description Preview:
                            </span>
                            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                              {job.description.replace(/<[^>]*>?/gm, '')}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.article>
              );
            })}

            {/* Load More Button */}
            {visibleCount < filteredJobs.length && (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 8)}
                  className="px-8 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-white uppercase tracking-widest transition-colors cursor-pointer shadow-lg"
                >
                  Load More Opportunities ({filteredJobs.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={2} 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
