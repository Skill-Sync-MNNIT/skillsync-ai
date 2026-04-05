import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import {
  Search as SearchIcon, Sparkles, Brain, Zap, GraduationCap,
  Calendar, ChevronDown, ChevronUp, Eye, ArrowRight, RotateCcw,
  User as UserIcon
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/AuthModal';
import { useAuthStore } from '../store/authStore';
import { searchService } from '../services/searchService';
import { useToast } from '../context/ToastContext';

// ─── Types ──────────────────────────────────────────────────
interface SearchResult {
  userId: string;
  name: string;
  email: string;
  branch: string | null;
  year: number | null;
  matchScore: number;
  explanation: string;
  matchedSkills: string[];
  detailedReasoning?: string;
}

// ─── Score color map ────────────────────────────────────────
const getScoreColor = (score: number) => {
  if (score >= 85) return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/50', bar: 'bg-emerald-500', label: 'Excellent Match' };
  if (score >= 65) return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/50', bar: 'bg-blue-500', label: 'Good Match' };
  if (score >= 45) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50', bar: 'bg-amber-500', label: 'Partial Match' };
  return { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', bar: 'bg-slate-400', label: 'Low Match' };
};

const SUGGESTION_CHIPS = [
  'React developer with Node.js',
  'ML researcher with Python',
  'Full-stack with Docker experience',
  'System design expert',
  'Data science intern',
  'Mobile app developer',
];

// ─── Special UI Components ──────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-3 p-5 animate-fade-in bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4">
    <div className="h-16 w-16 -ml-4 -my-4 flex items-center justify-center shrink-0">
      <Player
        autoplay
        loop
        src="https://assets5.lottiefiles.com/packages/lf20_a2chheio.json"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
    <span className="text-sm font-medium text-primary-700 dark:text-primary-400">AI is hunting for the perfect match...</span>
  </div>
);

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
  const sc = getScoreColor(result.matchScore);
  const initials = (result.name || result.email.split('@')[0])
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-slide-in-bottom"
      style={{ animationDelay: `${200 + index * 100}ms` }}
    >
      <div className="flex flex-col sm:flex-row">
        <div className={`sm:w-24 shrink-0 ${sc.bg} flex sm:flex-col items-center justify-center gap-2 p-4 sm:p-5 border-b sm:border-b-0 sm:border-r ${sc.border}`}>
          <div className={`text-3xl sm:text-4xl font-black ${sc.text} tabular-nums`}>
            {result.matchScore}
          </div>
          <span className={`text-[10px] font-semibold ${sc.text} uppercase tracking-wider text-center`}>Match</span>
          <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden mt-1 hidden sm:block">
            <div className={`h-full rounded-full ${sc.bar} animate-progress-fill`} style={{ width: `${result.matchScore}%` }} />
          </div>
        </div>

        <div className="flex-1 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-primary-700 dark:text-primary-400 font-bold text-sm">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary-700 transition-colors">
                  {result.name || result.email.split('@')[0]}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1"><GraduationCap size={12} /> {result.branch}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Year {result.year}</span>
                </div>
              </div>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>
              <Zap size={11} /> {sc.label}
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl mb-3">
            <Brain size={15} className="text-primary-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.explanation}</p>
          </div>

          {result.matchedSkills?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Matched Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedSkills.map((skill) => (
                  <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-900/50 dark:hover:bg-violet-900/40 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

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
            <div className="mb-3 p-3 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed animate-fade-in-up">
              {result.detailedReasoning}
            </div>
          )}

          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" onClick={() => {
              const slug = result.email.split('@')[0];
              window.open(`/profile/${slug}`, '_blank');
            }}>
              <Eye size={14} className="mr-1.5" /> View Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Search Component ──────────────────────────────────
export const Search = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && isAuthenticated()) {
      setQuery(q);
      setTimeout(() => {
        performSearch(q);
      }, 300);
    }
  }, [searchParams]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setHasSearched(true);
    setSubmittedQuery(searchQuery);
    try {
      const data = await searchService.search({ query: searchQuery });
      setResults(data);
    } catch (error: any) {
      console.error('Search failed:', error);
      toast(error.response?.data?.message || 'AI Search encountered an error. Please try again.', 'error');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    if (!isAuthenticated()) {
      navigate(`/auth/login?q=${encodeURIComponent(query.trim())}`);
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

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 120);
    el.style.height = nextHeight + 'px';
    el.style.overflowY = el.scrollHeight > 120 ? 'auto' : 'hidden';
  };

  if (!hasSearched && !isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 pb-24">
        <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-xs font-semibold text-primary-600 dark:text-primary-400 mb-6">
            <Sparkles size={13} />
            AI-Powered Talent Discovery
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Discover Talent{' '}
            <span className="gradient-text">with AI</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Search for students using natural language. Our AI matches by skills, experience, and semantic relevance — not just keywords.
          </p>
        </div>

        <div className="w-full max-w-2xl mx-auto mt-10 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <form onSubmit={handleSearch}>
            <div className="relative group">
              <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary-500/20 via-violet-500/20 to-primary-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 animate-gradient-shift" />
              <div className="relative flex items-end bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none focus-within:border-primary-300 dark:focus-within:border-primary-500 transition-all duration-300">
                <textarea
                  ref={inputRef}
                  className="flex-1 resize-none overflow-hidden bg-transparent px-5 py-4 text-base text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-h-[56px] max-h-[120px]"
                  placeholder="Describe your ideal candidate (e.g. 'React developer')..."
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

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Try:</span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-full border border-primary-100 dark:border-primary-900/50 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all duration-200"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-12 text-xs text-slate-400 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          Powered by semantic embeddings • MNNIT Talent Pool
        </p>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          pendingQuery={query}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
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

      <div className="flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <Brain size={14} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          {isLoading && (
            <>
              <TypingIndicator />
              <ResultSkeleton />
            </>
          )}

          {!isLoading && hasSearched && results.length > 0 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-5 px-1">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    Found {results.length} candidate{results.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ranked by semantic similarity to your query</p>
                </div>
                <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 uppercase tracking-wider">
                  AI Ranked
                </span>
              </div>

              <div className="space-y-4">
                {results.map((result, i) => (
                  <ResultCard key={result.userId} result={result} index={i} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center animate-fade-in">
              <div className="h-14 w-14 bg-slate-100 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="h-7 w-7 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No candidates found</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                I couldn't find students matching your criteria. Try broadening your search or using different keywords.
              </p>
            </div>
          )}
        </div>
      </div>

      {!isLoading && hasSearched && (
        <div className="flex justify-center mt-10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <Button variant="outline" size="md" onClick={handleReset}>
            <RotateCcw size={16} className="mr-2" />
            New Search
          </Button>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        pendingQuery={query}
      />
    </div>
  );
};

export default Search;
