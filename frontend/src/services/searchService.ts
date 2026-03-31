import api from './api';

export interface SearchResult {
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

interface SearchParams {
  query: string;
  branch?: string | null;
  year?: number | null;
  top_k?: number;
}

export const searchService = {
  search: async (params: SearchParams): Promise<SearchResult[]> => {
    const response = await api.post('/search', {
      query: params.query,
      branch: params.branch ?? null,
      year: params.year ?? null,
      top_k: params.top_k ?? 10,
    });

    // Map backend field names → frontend field names
    return (response.data.results ?? []).map((item: {
      userId: string;
      name: string;
      email: string;
      branch: string | null;
      year: number | null;
      matchPercent: number;
      explanation: string;
      skills: string[];
    }): SearchResult => ({
      userId: item.userId,
      name: item.name,
      email: item.email,
      branch: item.branch,
      year: item.year,
      matchScore: item.matchPercent,       
      explanation: item.explanation,
      matchedSkills: item.skills ?? [], 
    }));
  },
};
