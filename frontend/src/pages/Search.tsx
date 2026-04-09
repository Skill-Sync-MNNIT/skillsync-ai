import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import {
  Sparkles, Brain, GraduationCap,
  Calendar, Eye, ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthModal } from '../components/AuthModal';
import { useAuthStore } from '../store/authStore';
import { useChatStore, type Message } from '../store/chatStore';

import { Sidebar } from '../components/Sidebar';

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
  'System design expert',
  'Mobile app developer',
];

const TypingIndicator = () => (
  <div className="flex flex-col items-center justify-center py-6 animate-fade-in text-center opacity-80">
    <div className="h-20 w-20 flex items-center justify-center shrink-0">
      <Player autoplay loop src="https://assets5.lottiefiles.com/packages/lf20_a2chheio.json" style={{ height: '100%', width: '100%' }} />
    </div>
    <span className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-2">Agent is extracting parameters and scanning clusters...</span>
  </div>
);

// ─── Result Card ────────────────────────────────────────────
const ResultCard = ({ result, index }: { result: any; index: number }) => {

  const sc = getScoreColor(result.matchPercent || 0);
  const initials = (result.name || result.email?.split('@')[0] || "U").split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="group bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-slide-in-bottom mb-4 last:mb-0" style={{ animationDelay: `${200 + index * 50}ms` }}>
      <div className="flex flex-col sm:flex-row">
        <div className={`sm:w-24 shrink-0 ${sc.bg} flex sm:flex-col items-center justify-center gap-2 p-4 border-b sm:border-b-0 sm:border-r ${sc.border}`}>
          <div className={`text-2xl sm:text-3xl font-black ${sc.text} tabular-nums`}>
             {Math.round(result.matchPercent || 0)}
          </div>
          <span className={`text-[9px] font-semibold ${sc.text} uppercase tracking-wider text-center`}>Match</span>
          <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden mt-1 hidden sm:block">
            <div className={`h-full rounded-full ${sc.bar} animate-progress-fill`} style={{ width: `${result.matchPercent || 0}%` }} />
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-primary-700 dark:text-primary-400 font-bold text-sm">
                {initials}
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-primary-700 transition-colors">
                  {result.name || result.email?.split('@')[0]}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1"><GraduationCap size={12} /> {result.branch}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Year {result.year}</span>
                </div>
              </div>
            </div>
            {result.cpi && <span className="inline-flex text-xs font-semibold px-2.5 py-1 text-slate-700 bg-slate-100 rounded-lg">CPI: {result.cpi}</span>}
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl mb-3">
            <Brain size={15} className="text-primary-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.explanation}</p>
          </div>

          {result.skills?.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5">
                {result.skills.slice(0, 10).map((skill: string) => (
                  <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
             <Button size="sm" onClick={() => window.open(`/profile/${result.email?.split('@')[0] || result.userId}`, '_blank')}>
                <Eye size={13} className="mr-1.5" /> View Full Profile
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
export const Search = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  const { activeMessages, isLoading, sendMessage } = useChatStore();
  const [query, setQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && isAuthenticated() && activeMessages.length === 0) {
      setQuery('');
      sendMessage(q);
    }
  }, [searchParams]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isLoading]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    if (!isAuthenticated()) {
      navigate(`/auth/login?q=${encodeURIComponent(query.trim())}`);
      return;
    }
    const q = query.trim();
    setQuery('');
    sendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden border-t border-slate-200 dark:border-slate-800">
      {/* Sidebar - Context / History Manager */}
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0B1120] relative">
        <div className="flex-1 overflow-y-auto w-full relative scroll-smooth px-4 pt-8 pb-32 flex flex-col items-center">
            {activeMessages.length === 0 ? (
                // Landing state
                <div className="m-auto text-center max-w-2xl animate-fade-in-up mt-24">
                  <div className="inline-flex items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-6 ring-8 ring-primary-50/50 dark:ring-primary-900/10">
                    <Sparkles size={32} className="text-primary-500" />
                  </div>
                  <h1 className="text-4xl text-slate-900 dark:text-white font-bold tracking-tight mb-4">
                    Find the right talent, fast
                  </h1>
                  <p className="text-lg text-slate-500 mb-8 max-w-md mx-auto">
                    Describe who you're looking for in plain language. Our AI agent understands filters like CPI, branch, year, and skills automatically.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTION_CHIPS.map(chip => (
                       <button
                         key={chip}
                         onClick={() => { setQuery(chip); if(inputRef.current) inputRef.current.focus(); }}
                         className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition"
                       >
                         {chip}
                       </button>
                    ))}
                  </div>
                </div>
            ) : (
                <div className="w-full max-w-4xl space-y-6 m-auto ml-auto mr-auto px-2 lg:px-10 pb-8">
                    {activeMessages.map((msg: Message) => (
                      <div key={msg.id} className="animate-fade-in w-full">
                        {msg.role === 'user' ? (
                          <div className="flex justify-end my-6">
                            <div className="bg-primary-600 text-white px-6 py-4 rounded-3xl rounded-tr-sm shadow-md text-base leading-relaxed max-w-[85%]">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start my-6 w-full">
                            <div className="w-full space-y-4">
                              {/* Agent Text Summary */}
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shrink-0 mt-1 shadow-sm">
                                  <Brain size={18} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl rounded-tl-sm border border-slate-100 dark:border-slate-700">
                                      <p className="text-slate-700 dark:text-slate-200 text-[15px] font-medium leading-relaxed">{msg.content}</p>
                                    </div>
                                    
                                    {/* Inline parameters display */}
                                    {msg.filters && (
                                       <div className="flex items-center gap-2 mt-3 pl-1">
                                            <span className="text-xs text-slate-400">Agent applied filters:</span>
                                            {msg.filters.limit && <span className="text-[10px] uppercase font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Top {msg.filters.limit}</span>}
                                            {msg.filters.min_cpi !== undefined && msg.filters.min_cpi > 0 && <span className="text-[10px] uppercase font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded">≥ {msg.filters.min_cpi} CPI</span>}
                                       </div>
                                    )}
                                </div>
                              </div>
                              
                              {/* RAG Candidates Listing */}
                              {msg.results && msg.results.length > 0 && (
                                <div className="pl-14 pt-2">
                                  {msg.results.map((r, i) => <ResultCard key={r.userId} result={r} index={i} />)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && <TypingIndicator />}
                    <div ref={chatEndRef} className="h-10" />
                </div>
            )}
        </div>

        {/* Floating Chat Input bar */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0B1120] dark:via-[#0B1120]/90 p-4 pt-10 flex justify-center backdrop-blur-sm pointer-events-none z-10">
            <div className="w-full max-w-3xl pointer-events-auto">
                <form 
                  onSubmit={handleSearchSubmit} 
                  className="relative flex items-end bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none focus-within:ring-4 focus-within:ring-primary-500/20 focus-within:border-primary-400 transition-all"
                >
                    <textarea
                      ref={inputRef}
                      value={query}
                      onChange={(e) => {
                          setQuery(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Discuss tracking criteria with the AI (e.g. 'Show me software engineers with above 8 CPI...') "
                      className="flex-1 max-h-[200px] resize-none overflow-y-auto bg-transparent px-6 py-4 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none"
                      rows={1}
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!query.trim() || isLoading}
                      className="mr-2 mb-2 p-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-all shrink-0"
                    >
                      <ArrowRight size={20} />
                    </button>
                </form>
                <div className="text-center mt-3">
                   <p className="text-[11px] text-slate-400">Context is retained across messages. You can reference previous candidates natively.</p>
                </div>
            </div>
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} pendingQuery={query} />
    </div>
  );
};

export default Search;
