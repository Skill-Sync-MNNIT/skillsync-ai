import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import api from '../services/api';

interface SearchResult {
  userId: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  matchScore: number;
  explanation: string;
  matchedSkills: string[];
}

export const Search = () => {
  const [query, setQuery] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await api.post('/search', {
        query,
        filters: {
          branch: branch || undefined,
          year: year ? parseInt(year) : undefined,
        },
        topK: 10
      });
      setResults(response.data.results || []);
    } catch (error) {
       console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Semantic Student Search</h1>
          <p className="mt-1 text-slate-500">Find the right talent based on context, not just keywords.</p>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Search Query</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-slate-300 pl-10 focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 border bg-slate-50"
                  placeholder="e.g. 'Looking for a full-stack developer with React and Node.js...'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch (Optional)</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Layers className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <select
                  className="block w-full rounded-md border-slate-300 pl-9 focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 border bg-slate-50"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                </select>
              </div>
            </div>

            <div className="w-full md:w-32">
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Filter className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </div>
                <select
                  className="block w-full rounded-md border-slate-300 pl-9 focus:border-primary-500 focus:ring-primary-500 sm:text-sm h-10 border bg-slate-50"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                </select>
              </div>
            </div>

            <div className="w-full md:w-auto">
               <Button type="submit" isLoading={isLoading} className="w-full md:w-auto h-10">
                 Find Candidates
               </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results View */}
      <div className="space-y-4">
        {isLoading && (
           <div className="space-y-4 animate-pulse">
             {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl w-full"></div>
             ))}
           </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
             <SearchIcon className="mx-auto h-12 w-12 text-slate-300 mb-4" />
             <h3 className="text-lg font-medium text-slate-900">No candidates found</h3>
             <p className="mt-1 text-slate-500">We couldn't find any students matching your criteria.</p>
          </div>
        )}

        {!isLoading && results.map((result) => (
          <Card 
            key={result.userId} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-slate-200"
            onClick={() => navigate(`/profile/${result.userId}`)}
          >
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-slate-900">{result.name || result.email.split('@')[0]}</h3>
                  <div className="flex items-center gap-2">
                     <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">
                       {result.matchScore.toFixed(0)}% Match
                     </span>
                  </div>
                </div>
                
                <p className="text-sm font-medium text-slate-500 mb-3">{result.branch} • Year {result.year}</p>
                <div className="p-3 bg-slate-50 border-l-4 border-primary-500 rounded-r-md text-slate-700 italic text-sm">
                  "{result.explanation}"
                </div>

                {result.matchedSkills && result.matchedSkills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.matchedSkills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Search;
