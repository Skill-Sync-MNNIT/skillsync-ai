import { findUserById, findProfileByUserId } from '../../repositories/index.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const searchStudents = async (
  query,
  branch = null,
  year = null,
  top_k = 10,
  history = []
) => {
  let aiResponse;
  try {
    const res = await fetch(`${AI_SERVICE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, branch, year, top_k, history }),
    });

    if (!res.ok) throw new Error(`AI service error: ${res.status}`);

    aiResponse = await res.json();
  } catch (err) {
    throw Object.assign(new Error('AI search service is currently unavailable'), {
      status: 503,
      cause: err,
    });
  }

  // Handle the new nested AI response schema
  const candidatesList = Array.isArray(aiResponse) ? aiResponse : aiResponse.candidates || [];

  const enriched = await Promise.all(
    candidatesList.map(async (candidate) => {
      try {
        const [user, profile] = await Promise.all([
          findUserById(candidate.user_id),
          findProfileByUserId(candidate.user_id),
        ]);

        if (!user || !profile) return null;

        return {
          userId: candidate.user_id,
          name: user.name,
          email: user.email,
          branch: profile.branch || candidate.metadata?.branch || null,
          year: profile.year || candidate.metadata?.year || null,
          skills: profile.skills?.length ? profile.skills : candidate.metadata?.skills || [],
          matchPercent: Math.round(candidate.score * 100 * 10) / 10, // e.g. 87.3
          explanation: candidate.explanation || '',
        };
      } catch {
        return null;
      }
    })
  );

  const finalCandidates = enriched.filter(Boolean).sort((a, b) => b.matchPercent - a.matchPercent);

  return {
    candidates: finalCandidates,
    summary: aiResponse.summary || '',
    filters: aiResponse.filters || null,
  };
};
