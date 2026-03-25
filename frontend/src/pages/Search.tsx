import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search as SearchIcon, Filter, Layers, Sparkles, User, GraduationCap,
  Calendar, ChevronDown, ChevronUp, Download, Eye, ArrowUpRight, Brain, Zap
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

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

// ─── Color map matching Dashboard/Profile pattern ───────────
const getScoreColor = (score: number) => {
  if (score >= 85) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500', bar: 'bg-emerald-500', label: 'Excellent Match' };
  if (score >= 65) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500', bar: 'bg-blue-500', label: 'Good Match' };
  if (score >= 45) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-500', bar: 'bg-amber-500', label: 'Partial Match' };
  return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', ring: 'ring-slate-400', bar: 'bg-slate-400', label: 'Low Match' };
};

// ─── Skeleton loader (same pattern as Dashboard) ────────────
const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton-shimmer ${className}`} />
);

const ResultSkeleton = () => (
  <div className="space-y-5">
    {[0, 1, 2].map((i) => (
      <Card key={i} className="p-6">
        <div className="flex gap-6">
          <SkeletonBlock className="h-16 w-16 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex justify-between">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-8 w-24 rounded-full" />
            </div>
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-12 w-full rounded-lg" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
              <SkeletonBlock className="h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

// ─── Mock data (structured for easy API swap) ───────────────
const MOCK_RESULTS: SearchResult[] = [
  {
    userId: 'mock-1',
    name: 'Priya Sharma',
    email: 'priya@mnnit.ac.in',
    branch: 'CSE',
    year: 3,
    matchScore: 96,
    explanation: 'Exceptional match — strong React, Node.js, and TypeScript proficiency with enterprise internship experience at a top-tier firm.',
    matchedSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker'],
    detailedReasoning: 'This candidate\'s resume shows 2 full-stack projects using the exact tech stack requested. Their internship at TechCorp involved building a React dashboard with Node.js microservices, directly relevant to the search query. Resume embedding similarity: 0.96.',
  },
  {
    userId: 'mock-2',
    name: 'Arjun Patel',
    email: 'arjun@mnnit.ac.in',
    branch: 'IT',
    year: 4,
    matchScore: 84,
    explanation: 'Strong frontend expertise with React and emerging full-stack capabilities. Open-source contributor with solid problem-solving skills.',
    matchedSkills: ['React', 'JavaScript', 'Tailwind CSS', 'Git'],
    detailedReasoning: 'Candidate has 3 open-source React projects with significant GitHub activity. While backend experience is limited to academic projects, their frontend depth and rapid learning trajectory make them a strong cultural fit. Resume embedding similarity: 0.84.',
  },
  {
    userId: 'mock-3',
    name: 'Neha Gupta',
    email: 'neha@mnnit.ac.in',
    branch: 'ECE',
    year: 3,
    matchScore: 71,
    explanation: 'Cross-disciplinary candidate with Python ML background transitioning into web development. Shows strong analytical skills.',
    matchedSkills: ['Python', 'Machine Learning', 'JavaScript'],
    detailedReasoning: 'While primarily focused on ML/AI, this candidate has recently completed a full-stack web course and built a Flask + React prototype. Their ML expertise could add unique value to data-intensive applications. Resume embedding similarity: 0.71.',
  },
  {
    userId: 'mock-4',
    name: 'Rahul Verma',
    email: 'rahul@mnnit.ac.in',
    branch: 'CSE',
    year: 2,
    matchScore: 52,
    explanation: 'Early-career student with foundational web knowledge. Shows enthusiasm through hackathon participation.',
    matchedSkills: ['HTML/CSS', 'JavaScript'],
  },
];

// ─── Result Card Sub-component ──────────────────────────────
const ResultCard = ({ result, index }: { result: SearchResult; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const sc = getScoreColor(result.matchScore);
  const initials = (result.name || result.email.split('@')[0]).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card
      className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-fade-in-up`}
      style={{ animationDelay: `${200 + index * 100}ms` }}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Score Sidebar */}
          <div className={`sm:w-28 shrink-0 ${sc.bg} flex sm:flex-col items-center justify-center gap-2 p-4 sm:p-6 border-b sm:border-b-0 sm:border-r ${sc.border}`}>
            <div className={`text-3xl sm:text-4xl font-black ${sc.text} tabular-nums`}>
              {result.matchScore}
            </div>
            <span className={`text-xs font-semibold ${sc.text} uppercase tracking-wider`}>Match</span>
            {/* Mini progress ring */}
            <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden mt-1 hidden sm:block">
              <div className={`h-full rounded-full ${sc.bar} animate-progress-fill`} style={{ width: `${result.matchScore}%` }} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-5 sm:p-6">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="h-11 w-11 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 text-primary-700 font-bold text-sm">
                  {initials}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">
                    {result.name || result.email.split('@')[0]}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1"><GraduationCap size={12} /> {result.branch}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> Year {result.year}</span>
                  </div>
                </div>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} border ${sc.border}`}>
                <Zap size={12} /> {sc.label}
              </span>
            </div>

            {/* AI Explanation */}
            <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl mb-4">
              <Brain size={16} className="text-primary-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 leading-relaxed">
                {result.explanation}
              </p>
            </div>

            {/* Matched Skills */}
            {result.matchedSkills && result.matchedSkills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Matched Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 transition-colors hover:bg-violet-100"
                    >
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
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors mb-4"
              >
                <Sparkles size={13} />
                {expanded ? 'Hide reasoning' : 'Why this match?'}
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {expanded && result.detailedReasoning && (
              <div className="mb-4 p-3.5 bg-primary-50/50 border border-primary-100 rounded-xl text-sm text-slate-600 leading-relaxed animate-fade-in-up">
                {result.detailedReasoning}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <Button size="sm" onClick={() => navigate(`/profile/${result.userId}`)}>
                <Eye size={14} className="mr-1.5" /> View Profile
              </Button>
              <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <Download size={14} className="mr-1.5" /> Resume
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Main Search Component ──────────────────────────────────
export const Search = () => {
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      // Mock — swap with real API when /search endpoint is ready
      await new Promise((resolve) => setTimeout(resolve, 1200));

      let filtered = [...MOCK_RESULTS];
      if (branch) filtered = filtered.filter((r) => r.branch === branch);
      if (year) filtered = filtered.filter((r) => r.year === parseInt(year));

      setResults(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* ── Hero Header (Dashboard pattern) ────────────────── */}
      <div className="animate-fade-in-up">
        <p className="text-sm font-medium text-primary-600 mb-1 flex items-center gap-1.5">
          <Brain size={14} /> AI-Powered Search
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
          Semantic <span className="text-primary-600">Student Search</span>
        </h1>
        <p className="mt-2 text-slate-500 max-w-2xl">
          Find the right talent using natural language. Our AI understands context, not just keywords — matching candidates by skills, experience depth, and semantic relevance.
        </p>
      </div>

      {/* ── Search Bar Card ────────────────────────────────── */}
      <Card className="overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center">
              <SearchIcon size={18} className="text-primary-600" />
            </div>
            <div>
              <CardTitle className="text-base">Search Query</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Describe the ideal candidate in natural language</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Main search input */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Sparkles className="h-5 w-5 text-primary-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-slate-300"
                placeholder="Search for students using skills, roles, or experience (e.g., React developer with Node.js)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:w-48">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Branch Filter</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Layers className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-slate-300"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="IT">IT</option>
                    <option value="EEE">EEE</option>
                  </select>
                </div>
              </div>

              <div className="w-full sm:w-36">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Year</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Filter className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all hover:border-slate-300"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    <option value="">Any Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="w-full sm:w-auto sm:ml-auto">
                <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                  <SearchIcon size={16} className="mr-2" /> Find Candidates
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles size={11} /> Filters narrow results but ranking is based purely on semantic AI similarity.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* ── Results Section ────────────────────────────────── */}

      {/* Loading skeletons */}
      {isLoading && <ResultSkeleton />}

      {/* Empty state */}
      {!isLoading && hasSearched && results.length === 0 && (
        <Card className="animate-fade-in-up">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <SearchIcon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No candidates found</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              We couldn't find any students matching your criteria. Try broadening your search query or removing filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results header */}
      {!isLoading && hasSearched && results.length > 0 && (
        <div className="flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {results.length} candidate{results.length !== 1 ? 's' : ''} found
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ranked by semantic similarity to your query</p>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            AI Ranked
          </span>
        </div>
      )}

      {/* Result cards */}
      {!isLoading && (
        <div className="space-y-5">
          {results.map((result, i) => (
            <ResultCard key={result.userId} result={result} index={i} />
          ))}
        </div>
      )}

      {/* Initial state — before any search */}
      {!hasSearched && !isLoading && (
        <Card className="animate-fade-in-up border-dashed" style={{ animationDelay: '200ms' }}>
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Brain className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Start by describing your ideal candidate</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Use natural language to describe the skills, experience, or role you're looking for. Our AI will find the best semantic matches from the MNNIT talent pool.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {['React developer', 'ML researcher with Python', 'Full-stack with Docker', 'System design expert'].map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 hover:bg-primary-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Search;
