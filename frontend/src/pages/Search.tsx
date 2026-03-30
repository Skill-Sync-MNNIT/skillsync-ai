import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon, Sparkles, Brain, Zap, GraduationCap,
  Calendar, ChevronDown, ChevronUp, Download, Eye, ArrowRight, RotateCcw,
  User as UserIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/AuthModal';
import { useAuthStore } from '../store/authStore';
import { profileService } from '../services/profileService';

// ─── Types ──────────────────────────────────────────────────
interface SearchResult {
  userId: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  matchScore: number;
  explanation: string;
  matchedSkills: string[];
  detailedReasoning?: string;
}

// ─── Score color map (consistent with Dashboard) ────────────
const getScoreColor = (score: number) => {
  if (score >= 85) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500', label: 'Excellent Match' };
  if (score >= 65) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: 'bg-blue-500', label: 'Good Match' };
  if (score >= 45) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500', label: 'Partial Match' };
  return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', bar: 'bg-slate-400', label: 'Low Match' };
};

// ─── Mock data ──────────────────────────────────────────────
const MOCK_RESULTS: SearchResult[] = [
  {
    userId: 'mock-1', name: 'Priya Sharma', email: 'priya@mnnit.ac.in', branch: 'CSE', year: 3, matchScore: 96,
    explanation: 'Exceptional match — strong React, Node.js, and TypeScript proficiency with enterprise internship experience at a top-tier firm.',
    matchedSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker'],
    detailedReasoning: 'This candidate\'s resume shows 2 full-stack projects using the exact tech stack requested. Their internship at TechCorp involved building a React dashboard with Node.js microservices. Resume embedding similarity: 0.96.',
  },
  {
    userId: 'mock-2', name: 'Arjun Patel', email: 'arjun@mnnit.ac.in', branch: 'IT', year: 4, matchScore: 84,
    explanation: 'Strong frontend expertise with React and emerging full-stack capabilities. Open-source contributor with solid problem-solving skills.',
    matchedSkills: ['React', 'JavaScript', 'Tailwind CSS', 'Git'],
    detailedReasoning: 'Candidate has 3 open-source React projects with significant GitHub activity. While backend experience is limited to academic projects, their frontend depth and rapid learning trajectory make them a strong fit. Resume embedding similarity: 0.84.',
  },
  {
    userId: 'mock-3', name: 'Neha Gupta', email: 'neha@mnnit.ac.in', branch: 'ECE', year: 3, matchScore: 71,
    explanation: 'Cross-disciplinary candidate with Python ML background transitioning into web development. Shows strong analytical skills.',
    matchedSkills: ['Python', 'Machine Learning', 'JavaScript'],
    detailedReasoning: 'While primarily focused on ML/AI, this candidate has recently completed a full-stack web course and built a Flask + React prototype. Their ML expertise could add unique value to data-intensive applications. Resume embedding similarity: 0.71.',
  },
  {
    userId: 'mock-4', name: 'Rahul Verma', email: 'rahul@mnnit.ac.in', branch: 'CSE', year: 2, matchScore: 52,
    explanation: 'Early-career student with foundational web knowledge. Shows enthusiasm through hackathon participation.',
    matchedSkills: ['HTML/CSS', 'JavaScript'],
  },
];

const SUGGESTION_CHIPS = [
  'React developer with Node.js',
  'ML researcher with Python',
  'Full-stack with Docker experience',
  'System design expert',
  'Data science intern',
  'Mobile app developer',
];

// ─── Typing Indicator ───────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-3 p-5 animate-fade-in">
    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
      <Brain size={16} className="text-primary-600" />
    </div>
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary-400 animate-typing-dot"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <span className="text-sm text-slate-400 ml-2">Analyzing profiles…</span>
    </div>
  </div>
);

// ─── Skeleton Loader ────────────────────────────────────────
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

const ResultSkeleton = () => (
  <div className="space-y-4 mt-4">
    {[0, 1, 2].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4" style={{ animationDelay: `${i * 150}ms` }}>
        <SkeletonBlock className="h-14 w-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-7 w-20 rounded-full" />
          </div>
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-20 rounded-full" />
            <SkeletonBlock className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Result Card ────────────────────────────────────────────
const ResultCard = ({ result, index }: { result: SearchResult; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const sc = getScoreColor(result.matchScore);
  const initials = (result.name || result.email.split('@')[0])
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const handleDownloadResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = await profileService.getResumeUrl(result.userId);
      window.open(url, '_blank');
    } catch {
      console.error('Failed to get resume URL');
    }
  };

  return (
    <div
      className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-slide-in-bottom"
      style={{ animationDelay: `${200 + index * 100}ms` }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Score Sidebar */}
        <div className={`sm:w-24 shrink-0 ${sc.bg} flex sm:flex-col items-center justify-center gap-2 p-4 sm:p-5 border-b sm:border-b-0 sm:border-r ${sc.border}`}>
          <div className={`text-3xl sm:text-4xl font-black ${sc.text} tabular-nums`}>
            {result.matchScore}
          </div>
          <span className={`text-[10px] font-semibold ${sc.text} uppercase tracking-wider`}>Match</span>
          <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden mt-1 hidden sm:block">
            <div className={`h-full rounded-full ${sc.bar} animate-progress-fill`} style={{ width: `${result.matchScore}%` }} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 text-primary-700 font-bold text-sm">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                  {result.name || result.email.split('@')[0]}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1"><GraduationCap size={12} /> {result.branch}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Year {result.year}</span>
                </div>
              </div>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>
              <Zap size={11} /> {sc.label}
            </span>
          </div>

          {/* AI Explanation */}
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-3">
            <Brain size={15} className="text-primary-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">{result.explanation}</p>
          </div>

          {/* Skills */}
          {result.matchedSkills?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Matched Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedSkills.map((skill) => (
                  <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expandable reasoning */}
          {result.detailedReasoning && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors mb-3"
            >
              <Sparkles size={12} />
              {expanded ? 'Hide reasoning' : 'Why this match?'}
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          {expanded && result.detailedReasoning && (
            <div className="mb-3 p-3 bg-primary-50/50 border border-primary-100 rounded-xl text-sm text-slate-600 leading-relaxed animate-fade-in-up">
              {result.detailedReasoning}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" onClick={() => navigate(`/profile/${result.userId}`)}>
              <Eye size={14} className="mr-1.5" /> View Profile
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadResume}>
              <Download size={14} className="mr-1.5" /> Resume
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Search Component ──────────────────────────────────
export const Search = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-fill query from URL param (redirect after auth)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && isAuthenticated()) {
      setQuery(q);
      // Auto-trigger search
      setTimeout(() => {
        performSearch(q);
      }, 300);
    }
  }, [searchParams]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setHasSearched(true);
    setSubmittedQuery(searchQuery);
    try {
      // Mock — swap with real API when /search endpoint is ready
      await new Promise((resolve) => setTimeout(resolve, 1800));
      setResults([...MOCK_RESULTS]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    // Auth gate: if not authenticated, show modal
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }

    performSearch(query.trim());
  };

  const handleReset = () => {
    setQuery('');
    setSubmittedQuery('');
    setResults([]);
    setHasSearched(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleChipClick = (chip: string) => {
    setQuery(chip);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // ─── IDLE STATE ─────────────────────────────────────────────
  if (!hasSearched && !isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 pb-24">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-xs font-semibold text-primary-600 mb-6">
            <Sparkles size={13} />
            AI-Powered Talent Discovery
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Discover Talent{' '}
            <span className="gradient-text">with AI</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Search for students using natural language. Our AI matches by skills, experience, and semantic relevance — not just keywords.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full max-w-2xl mx-auto mt-10 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <form onSubmit={handleSearch}>
            <div className="relative group">
              <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary-500/20 via-violet-500/20 to-primary-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 animate-gradient-shift" />
              <div className="relative flex items-end bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 focus-within:border-primary-300 focus-within:shadow-primary-100/50 transition-all duration-300">
                <textarea
                  ref={inputRef}
                  className="flex-1 resize-none bg-transparent px-5 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none min-h-[56px] max-h-[120px]"
                  placeholder="Describe the ideal candidate, e.g. 'React developer with backend experience in Node.js'..."
                  value={query}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="m-2 p-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0 animate-pulse-glow"
                  style={{ animationPlayState: query.trim() ? 'running' : 'paused' }}
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </form>

          {/* Suggestion Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <span className="text-xs text-slate-400 mr-1">Try:</span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 hover:bg-primary-100 hover:border-primary-200 transition-all duration-200"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Subtle footer info */}
        <p className="mt-12 text-xs text-slate-400 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          Powered by semantic embeddings • MNNIT Talent Pool
        </p>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          pendingQuery={query}
        />
      </div>
    );
  }

  // ─── RESULTS / LOADING STATE ────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
      {/* User query bubble */}
      <div className="flex justify-end mb-6 animate-fade-in-up">
        <div className="flex items-start gap-3 max-w-[85%]">
          <div className="bg-primary-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm">
            <p className="text-sm leading-relaxed">{submittedQuery}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
            <UserIcon size={14} className="text-primary-700" />
          </div>
        </div>
      </div>

      {/* AI response area */}
      <div className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <Brain size={14} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Loading state */}
          {isLoading && (
            <>
              <TypingIndicator />
              <ResultSkeleton />
            </>
          )}

          {/* Results */}
          {!isLoading && hasSearched && results.length > 0 && (
            <div className="animate-fade-in">
              {/* Response header */}
              <div className="flex items-center justify-between mb-5 px-1">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Found {results.length} candidate{results.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ranked by semantic similarity to your query</p>
                </div>
                <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 uppercase tracking-wider">
                  AI Ranked
                </span>
              </div>

              {/* Result cards */}
              <div className="space-y-4">
                {results.map((result, i) => (
                  <ResultCard key={result.userId} result={result} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center animate-fade-in">
              <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No candidates found</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                I couldn't find students matching your criteria. Try broadening your search or using different keywords.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Search Button */}
      {!isLoading && hasSearched && (
        <div className="flex justify-center mt-10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Button variant="outline" size="md" onClick={handleReset}>
            <RotateCcw size={16} className="mr-2" />
            New Search
          </Button>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        pendingQuery={query}
      />
    </div>
  );
};

export default Search;
