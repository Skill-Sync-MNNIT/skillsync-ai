import { searchStudents } from '../../services/search/search.service.js';
import Conversation from '../../models/Conversation.js';

const enforceConversationLimit = async (userId) => {
  const convs = await Conversation.find({ userId }).sort({ updatedAt: -1 });
  if (convs.length > 5) {
    const idsToDelete = convs.slice(5).map((c) => c._id);
    await Conversation.deleteMany({ _id: { $in: idsToDelete } });
  }
};

export const searchController = async (req, res, next) => {
  try {
    const { query, branch, year, top_k, conversationId } = req.body;
    const userId = req.user.id;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let conversation = null;
    let history = [];

    // 1. Get or Create Conversation Context
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      // Prepare history payload for AI (only send role and content)
      history = conversation.messages.map((m) => ({ role: m.role, content: m.content }));
    } else {
      // Create new conversation
      conversation = new Conversation({
        userId,
        title: query.trim().substring(0, 40) + '...',
        messages: [],
      });
      await conversation.save();
      await enforceConversationLimit(userId);
    }

    // 2. Append Current Prompt
    conversation.messages.push({ role: 'user', content: query.trim() });

    // 3. Forward to Pipeline
    const results = await searchStudents(
      query.trim(),
      branch || null,
      year ? Number(year) : null,
      top_k ? Number(top_k) : 10,
      history
    );

    // 4. Append AI Output
    const aiResponseText =
      results.summary || `Found ${results.candidates.length} candidates matching your criteria.`;
    conversation.messages.push({
      role: 'assistant',
      content: aiResponseText,
      results: results.candidates,
      filters: results.filters,
    });

    // Save state
    await conversation.save();

    res.json({
      conversationId: conversation._id,
      query: query.trim(),
      total: results.candidates.length,
      results: results.candidates,
      summary: results.summary,
      filters: results.filters,
    });
  } catch (error) {
    next(error);
  }
};
