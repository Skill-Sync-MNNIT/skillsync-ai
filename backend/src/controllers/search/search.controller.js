import { searchStudents } from '../../services/search/search.service.js';

export const searchController = async (req, res, next) => {
  try {
    const { query, branch, year, top_k } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await searchStudents(
      query.trim(),
      branch || null,
      year ? Number(year) : null,
      top_k ? Number(top_k) : 10
    );

    res.json({
      query: query.trim(),
      total: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};
