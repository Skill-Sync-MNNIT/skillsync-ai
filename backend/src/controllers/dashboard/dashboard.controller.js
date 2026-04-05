import JobPosting from '../../models/JobPosting.js';

export const getDashboardData = async (req, res, next) => {
  try {
    const trendingSkillsAggregation = await JobPosting.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    const trendingSkills = trendingSkillsAggregation.map((skill) => ({
      name: skill._id,
      count: skill.count,
    }));

    res.status(200).json({
      message: 'Dashboard data fetched successfully',
      trendingSkills,
    });
  } catch (error) {
    next(error);
  }
};
